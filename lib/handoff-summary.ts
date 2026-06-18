/**
 * Generates a structured handoff summary from a stored conversation.
 *
 * Used by sendHandoffEmail when a Cal.com booking lands. Reads the full
 * conversation from Supabase, runs Claude over it with a tight schema, and
 * returns the fields the team needs to walk into the call prepared.
 *
 * Uses Sonnet (cheaper, plenty smart enough for summarization) rather than
 * Opus (which the live chatbot uses).
 */

import { getAnthropic } from './anthropic';
import { getSupabaseService } from './supabase';

const SUMMARIZER_MODEL = 'claude-sonnet-4-6';

export interface HandoffSummary {
  /** 3-5 sentence narrative of what was discussed. */
  summary: string;
  /** Verbatim quote of the visitor's stated pain or ask, if one exists. */
  statedContext: string | null;
  /** Specific questions the chatbot couldn't fully answer. */
  flaggedQuestions: string[];
  /** Topics covered in the conversation. */
  topics: string[];
  /** 3 specific talking points for the team to address on the call. */
  talkingPoints: string[];
  /** Pages the visitor visited (from page_context across messages). */
  pagesVisited: string[];
  /** Detected sentiment, one of: positive, neutral, negative, mixed. */
  sentiment: 'positive' | 'neutral' | 'negative' | 'mixed' | null;
}

const SUMMARY_SYSTEM_PROMPT = `You are summarizing a conversation between a website visitor and the Output Systems chatbot for a sales team handoff. The visitor just booked a call. Output Systems designs and builds custom intelligent systems for small businesses.

Produce a structured handoff brief in valid JSON matching this exact shape:

{
  "summary": "3-5 sentence narrative of what was discussed and what the visitor seems to need.",
  "statedContext": "A verbatim quote (under 30 words) of what the visitor said about their situation. Pick the most representative line. If no clear statement of context exists, return null.",
  "flaggedQuestions": ["Specific questions the chatbot acknowledged it couldn't fully answer. Empty array if none."],
  "topics": ["Short tags for what was covered, e.g. 'lead-management', 'pricing', 'integrations'."],
  "talkingPoints": ["3 specific things the team should address on the call. Tactical, not generic."],
  "sentiment": "one of: positive, neutral, negative, mixed"
}

Rules:
- Return ONLY the JSON object. No prose, no markdown fences.
- "statedContext" must be a real quote from the visitor, not paraphrased. If unsure, return null.
- "talkingPoints" must be specific to this conversation — never generic ("ask about their goals"). Tactical actions ("clarify whether their CRM is HubSpot or Salesforce, since they mentioned 'our CRM' but not which").
- Never invent facts not in the transcript.`;

export async function generateHandoffSummary(
  conversationId: string,
): Promise<HandoffSummary | null> {
  const supabase = getSupabaseService();

  const { data: conversation } = await supabase
    .from('conversations')
    .select('id, page_context, metadata')
    .eq('id', conversationId)
    .single();

  if (!conversation) {
    console.warn(`handoff-summary: conversation ${conversationId} not found`);
    return null;
  }

  const { data: messages } = await supabase
    .from('messages')
    .select('role, content, flagged_unanswered, created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: true });

  if (!messages || messages.length === 0) {
    return null;
  }

  // Format the transcript for Claude.
  const transcript = messages
    .map((m) => `${m.role.toUpperCase()}: ${m.content}`)
    .join('\n\n');

  // Pages visited (deduped, in order). Currently only one page per conversation
  // since page_context is stored on the conversation row, but if we later track
  // navigation across the visit, this is where it'd surface.
  const pagesVisited: string[] = conversation.page_context
    ? [conversation.page_context]
    : [];

  // Skip Claude if there's no API key (e.g. local dev without env).
  if (!process.env.ANTHROPIC_API_KEY) {
    return {
      summary:
        'Transcript available; summary skipped (no API key in env). Read the full conversation in the admin dashboard.',
      statedContext: null,
      flaggedQuestions: messages
        .filter((m) => m.flagged_unanswered)
        .map((m) => m.content),
      topics: [],
      talkingPoints: [],
      pagesVisited,
      sentiment: null,
    };
  }

  try {
    const anthropic = getAnthropic();
    const response = await anthropic.messages.create({
      model: SUMMARIZER_MODEL,
      max_tokens: 1024,
      system: SUMMARY_SYSTEM_PROMPT,
      messages: [
        {
          role: 'user',
          content: `Here is the conversation transcript. Produce the handoff brief now.\n\n---\n\n${transcript}`,
        },
      ],
    });

    const responseText = response.content
      .filter((block) => block.type === 'text')
      .map((block) => (block as { type: 'text'; text: string }).text)
      .join('\n')
      .trim();

    // The model sometimes wraps JSON in fences despite instructions. Strip them.
    const jsonText = responseText
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();

    const parsed = JSON.parse(jsonText) as Partial<HandoffSummary>;

    return {
      summary: parsed.summary ?? '',
      statedContext: parsed.statedContext ?? null,
      flaggedQuestions: parsed.flaggedQuestions ?? [],
      topics: parsed.topics ?? [],
      talkingPoints: parsed.talkingPoints ?? [],
      pagesVisited,
      sentiment: parsed.sentiment ?? null,
    };
  } catch (error) {
    console.error('handoff-summary: Claude or JSON parse failed', error);
    return {
      summary:
        'Summary generation failed. Read the full conversation in the admin dashboard.',
      statedContext: null,
      flaggedQuestions: messages
        .filter((m) => m.flagged_unanswered)
        .map((m) => m.content),
      topics: [],
      talkingPoints: [],
      pagesVisited,
      sentiment: null,
    };
  }
}
