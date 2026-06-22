import { NextRequest, NextResponse } from 'next/server';
import type Anthropic from '@anthropic-ai/sdk';
import { getAnthropic, CHATBOT_MODEL } from '@/lib/anthropic';
import { buildSystemPrompt, type ChatMode } from '@/lib/system-prompt';
import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import { loadVerticalConfig } from '@/lib/vertical';
import { preFlightCheck } from '@/lib/filters';
import { postFlightClean } from '@/lib/filters';
import { checkRateLimit, extractIp } from '@/lib/rate-limit';
import { getGreeting } from '@/lib/greetings';
import { sendChatLeadEmail, type ChatLeadPayload } from '@/lib/lead-email';

export const runtime = 'nodejs';

// In-chat lead capture marker. The chatbot emits this as the last line of its
// final confirmation turn when it has collected the visitor's name plus at
// least one contact method (phone preferred, email accepted) and optionally
// a best-time-of-day for callback via the smooth statement-led flow. The
// server strips it from the visible output, parses the JSON between the
// markers, persists the lead, and fires an email to the team via Resend.
const LEAD_MARKER_START = '<<<SUBMIT_LEAD>>>';
const LEAD_MARKER_END = '<<<END_SUBMIT>>>';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  conversationId?: string;
  visitorId?: string;
  pageContext?: string;
  refParam?: string;
  mode?: ChatMode;
}

// The booking URL is per-vertical (from config). The outer catch can't assume
// config has loaded, so it uses a URL-free fallback; the streaming path, which
// always has config, uses the real booking link.
const GENERIC_FALLBACK = "I'm having trouble right now. Please try again in a moment.";

function fallbackWithBooking(bookingUrl: string): string {
  return `I'm having trouble right now. Want to book a call directly? ${bookingUrl}`;
}

// Phrases the assistant uses when it knows it can't fully answer; flagged for handoff brief.
const UNANSWERED_MARKERS = [
  /save (the |this )?question for the team/i,
  /save (it |this )?for the conversation/i,
  /flag (it |this )?for the team/i,
  /the team can (dig|cover|walk through|address|look) (into )?that/i,
  /that.s the kind of detail we.?d cover (live|on (a |the )?call)/i,
  /we'?d cover (that |this )?(live|on (a |the )?call)/i,
];

export async function POST(req: NextRequest) {
  try {
    const config = await loadVerticalConfig();
    const ip = extractIp(req.headers);
    const rate = await checkRateLimit(ip);
    if (!rate.allowed) {
      return NextResponse.json(
        {
          error: 'rate_limited',
          message: `Easy there, that's a lot of questions. Try again in ${
            rate.resetSeconds ? Math.ceil(rate.resetSeconds / 60) : 60
          } minutes, or book a call directly: ${config.bookingUrl}`,
          resetSeconds: rate.resetSeconds,
        },
        { status: 429 },
      );
    }

    const body = (await req.json()) as ChatRequest;
    const { messages, conversationId: existingConvId, visitorId, pageContext, refParam, mode } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages required' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1];
    if (lastUserMessage.role !== 'user') {
      return NextResponse.json({ error: 'last message must be from user' }, { status: 400 });
    }

    const normalizedMode: ChatMode = mode === 'client' || mode === 'professional' ? mode : null;

    // Pre-flight: block prompt injection, oversized input, etc.
    const preFlight = preFlightCheck(lastUserMessage.content);

    return streamChatResponse({
      preFlight,
      lastUserMessage,
      messages,
      existingConvId,
      visitorId,
      pageContext,
      refParam,
      ip,
      mode: normalizedMode,
      bookingUrl: config.bookingUrl,
    });
  } catch (error) {
    console.error('chat route error', error);
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: message, message: GENERIC_FALLBACK }, { status: 500 });
  }
}

interface StreamArgs {
  preFlight: ReturnType<typeof preFlightCheck>;
  lastUserMessage: ChatMessage;
  messages: ChatMessage[];
  existingConvId?: string;
  visitorId?: string;
  pageContext?: string;
  refParam?: string;
  ip: string;
  mode: ChatMode;
  bookingUrl: string;
}

// Streams the assistant response as newline-delimited JSON events.
// Event shapes:
//   {type:"delta",   text:"..."}                — append text to the displayed message
//   {type:"replace", text:"..."}                — replace the entire displayed message
//   {type:"done",    conversationId, fallback?} — end of stream, save conversationId
function streamChatResponse(args: StreamArgs): Response {
  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: object) => {
        controller.enqueue(encoder.encode(JSON.stringify(event) + '\n'));
      };

      const fallbackMessage = fallbackWithBooking(args.bookingUrl);

      // Pre-flight block: send the public message as a single delta, persist, done.
      if (args.preFlight.blocked) {
        const publicMessage = args.preFlight.publicMessage ?? fallbackMessage;
        send({ type: 'delta', text: publicMessage });

        const conversationIdForResponse = await persistTurn({
          existingConversationId: args.existingConvId,
          visitorId: args.visitorId,
          pageContext: args.pageContext,
          refParam: args.refParam,
          ip: args.ip,
          userMessage: args.lastUserMessage,
          assistantMessage: { role: 'assistant', content: publicMessage },
          usage: {
            input_tokens: 0,
            output_tokens: 0,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
          flaggedUnanswered: true,
        }).catch((err) => {
          console.error('persist (preflight-block) failed', err);
          return args.existingConvId ?? null;
        });

        send({
          type: 'done',
          conversationId: conversationIdForResponse,
          blocked: true,
          reason: args.preFlight.reason,
        });
        controller.close();
        return;
      }

      let fullText = '';
      let usage: Anthropic.Usage = {
        input_tokens: 0,
        output_tokens: 0,
        cache_creation_input_tokens: 0,
        cache_read_input_tokens: 0,
      };
      let claudeFailed = false;
      let cleanIssues: string[] = [];
      let leadPayloadFromMarker: ChatLeadPayload | null = null;

      try {
        const systemPrompt = await buildSystemPrompt(args.mode);
        const anthropic = getAnthropic();

        const claudeStream = anthropic.messages.stream({
          model: CHATBOT_MODEL,
          max_tokens: 600,
          system: [
            {
              type: 'text',
              text: systemPrompt,
              cache_control: { type: 'ephemeral' },
            },
          ],
          messages: args.messages.map((m) => ({ role: m.role, content: m.content })),
        });

        // Stream tokens to the visitor, but stop forwarding once we detect the
        // start of the SUBMIT_LEAD marker so the visitor never sees it.
        let lastSentLength = 0;
        let markerHidden = false;

        for await (const event of claudeStream) {
          if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
            fullText += event.delta.text;

            if (markerHidden) continue;

            const markerIdx = fullText.indexOf(LEAD_MARKER_START);
            if (markerIdx === -1) {
              const newText = fullText.substring(lastSentLength);
              if (newText) {
                send({ type: 'delta', text: newText });
                lastSentLength = fullText.length;
              }
            } else {
              // Marker just appeared. Send only the visible portion before it.
              markerHidden = true;
              const visible = fullText.substring(0, markerIdx);
              const newVisibleText = visible.substring(lastSentLength);
              if (newVisibleText) {
                send({ type: 'delta', text: newVisibleText });
              }
              lastSentLength = visible.length;
            }
          }
        }

        const finalMessage = await claudeStream.finalMessage();
        usage = finalMessage.usage;

        // Extract the lead payload if the marker is complete, then strip the
        // marker block from fullText so it does not get persisted or shown.
        leadPayloadFromMarker = extractLeadPayload(fullText);
        const markerStartIdx = fullText.indexOf(LEAD_MARKER_START);
        if (markerStartIdx !== -1) {
          fullText = fullText.substring(0, markerStartIdx).trimEnd();
        }

        // Post-flight clean runs on the full text. The only mutation it makes is
        // stripping em dashes; if anything changed, swap the displayed message.
        const cleaned = postFlightClean(fullText);
        cleanIssues = cleaned.issues;
        if (cleaned.cleaned !== fullText) {
          fullText = cleaned.cleaned;
          send({ type: 'replace', text: cleaned.cleaned });
        }

        if (cleanIssues.length > 0) {
          console.warn('post-flight issues', {
            conversationId: args.existingConvId,
            issues: cleanIssues,
          });
        }
      } catch (error) {
        console.error('claude stream failed, falling back', error);
        claudeFailed = true;
        fullText = fallbackMessage;
        send({ type: 'replace', text: fallbackMessage });
      }

      const flaggedUnanswered =
        claudeFailed || UNANSWERED_MARKERS.some((re) => re.test(fullText));

      const conversationIdForResponse = await persistTurn({
        existingConversationId: args.existingConvId,
        visitorId: args.visitorId,
        pageContext: args.pageContext,
        refParam: args.refParam,
        ip: args.ip,
        userMessage: args.lastUserMessage,
        assistantMessage: { role: 'assistant', content: fullText },
        usage,
        flaggedUnanswered,
      }).catch((err) => {
        console.error('persist failed', err);
        return args.existingConvId ?? null;
      });

      send({
        type: 'done',
        conversationId: conversationIdForResponse,
        ...(claudeFailed ? { fallback: true } : {}),
      });
      controller.close();

      // Fire chat lead capture (Supabase insert + email) async after we close
      // the stream. Do not block the done event on this.
      if (leadPayloadFromMarker && conversationIdForResponse) {
        void persistAndEmailChatLead(leadPayloadFromMarker, conversationIdForResponse).catch(
          (err) => console.error('chat lead persist/email failed', err),
        );
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}

interface PersistArgs {
  existingConversationId?: string;
  visitorId?: string;
  pageContext?: string;
  refParam?: string;
  ip: string;
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  usage: Anthropic.Usage;
  flaggedUnanswered: boolean;
}

function extractLeadPayload(text: string): ChatLeadPayload | null {
  const startIdx = text.indexOf(LEAD_MARKER_START);
  const endIdx = text.indexOf(LEAD_MARKER_END);
  if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) return null;

  const jsonStr = text.substring(startIdx + LEAD_MARKER_START.length, endIdx).trim();
  try {
    const parsed = JSON.parse(jsonStr) as Record<string, unknown>;
    const name = typeof parsed.name === 'string' ? parsed.name.trim() : '';
    const email =
      typeof parsed.email === 'string' && parsed.email.trim().length > 0
        ? parsed.email.trim()
        : null;
    const phone =
      typeof parsed.phone === 'string' && parsed.phone.trim().length > 0
        ? parsed.phone.trim()
        : null;
    const bestTime =
      typeof parsed.bestTime === 'string' && parsed.bestTime.trim().length > 0
        ? parsed.bestTime.trim()
        : null;

    // The smooth flow requires a name plus at least one way to reach them.
    // Phone is preferred but either is sufficient.
    if (!name || (!email && !phone)) return null;
    return { name, email, phone, bestTime };
  } catch (err) {
    console.warn('chat lead marker JSON parse failed', err);
    return null;
  }
}

async function persistAndEmailChatLead(
  payload: ChatLeadPayload,
  conversationId: string,
): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  const supabase = getSupabaseService();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single();

  if (!tenant) {
    console.error('chat lead: tenant not found');
    return;
  }

  // Idempotency: skip if this conversation already produced a chatbot lead.
  const { data: existingLead } = await supabase
    .from('leads')
    .select('id')
    .eq('tenant_id', tenant.id)
    .eq('conversation_id', conversationId)
    .eq('source', 'chatbot')
    .maybeSingle();

  if (existingLead) {
    console.log('chat lead: already captured for this conversation, skipping');
    return;
  }

  const { error: insertError } = await supabase.from('leads').insert({
    tenant_id: tenant.id,
    conversation_id: conversationId,
    name: payload.name,
    email: payload.email ?? null,
    phone: payload.phone ?? null,
    source: 'chatbot',
    status: 'new',
    raw_payload: payload.bestTime ? { bestTime: payload.bestTime } : {},
  });

  if (insertError) {
    console.error('chat lead insert failed', insertError);
    return;
  }

  await sendChatLeadEmail({ ...payload, conversationId });
}

async function persistTurn(args: PersistArgs): Promise<string | null> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const supabase = getSupabaseService();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single();

  if (!tenant) return null;

  let conversationId = args.existingConversationId;

  if (!conversationId) {
    // First turn: resolve the source tag and create the conversation row.
    const greeting = getGreeting({ pagePath: args.pageContext, refParam: args.refParam });

    const { data: conversation } = await supabase
      .from('conversations')
      .insert({
        tenant_id: tenant.id,
        visitor_id: args.visitorId ?? null,
        page_context: args.pageContext ?? null,
        ip_address: args.ip && args.ip !== 'unknown' ? args.ip : null,
        source: greeting.source,
        metadata: args.refParam ? { ref: args.refParam } : {},
      })
      .select('id')
      .single();

    if (!conversation) return null;
    conversationId = conversation.id;
  }

  await supabase.from('messages').insert([
    {
      conversation_id: conversationId,
      role: 'user',
      content: args.userMessage.content,
    },
    {
      conversation_id: conversationId,
      role: 'assistant',
      content: args.assistantMessage.content,
      flagged_unanswered: args.flaggedUnanswered,
      input_tokens: args.usage.input_tokens,
      output_tokens: args.usage.output_tokens,
      model: CHATBOT_MODEL,
    },
  ]);

  return conversationId ?? null;
}
