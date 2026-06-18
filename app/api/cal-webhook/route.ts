import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getSupabaseService, TENANT_SLUG } from '@/lib/supabase';
import { sendHandoffEmail } from '@/lib/handoff-email';

export const runtime = 'nodejs';

/**
 * Cal.com webhook receiver.
 *
 * Configure in Cal.com: Settings → Developer → Webhooks → New Webhook
 *   - URL: https://chat.output.systems/api/cal-webhook
 *   - Events: BOOKING_CREATED, BOOKING_CANCELLED, BOOKING_RESCHEDULED
 *   - Secret: matches CALCOM_WEBHOOK_SECRET in env
 *
 * On BOOKING_CREATED: persists the booking to Supabase, looks up the conversation
 * by attendee email if possible, and fires the handoff email to connect@output.systems.
 *
 * Until CALCOM_WEBHOOK_SECRET is set, signatures aren't verified — useful for
 * local testing but the route refuses live POSTs without a configured secret
 * to prevent any unauthenticated booking insertion.
 */

interface CalWebhookBody {
  triggerEvent: 'BOOKING_CREATED' | 'BOOKING_CANCELLED' | 'BOOKING_RESCHEDULED' | string;
  payload: {
    uid?: string;
    bookingId?: number | string;
    title?: string;
    startTime?: string;
    endTime?: string;
    eventType?: { id?: number; slug?: string; title?: string };
    attendees?: { name?: string; email?: string; timeZone?: string }[];
    organizer?: { email?: string; timeZone?: string };
    metadata?: Record<string, unknown>;
    responses?: Record<string, { value?: string }>;
  };
}

export async function POST(req: NextRequest) {
  const secret = process.env.CALCOM_WEBHOOK_SECRET;

  // Read body as text so we can verify the signature against the raw bytes.
  const rawBody = await req.text();

  if (!secret) {
    console.warn('cal-webhook: CALCOM_WEBHOOK_SECRET not configured, refusing');
    return NextResponse.json(
      { error: 'webhook secret not configured' },
      { status: 503 },
    );
  }

  // Cal.com signs with HMAC-SHA256 of the raw body, hex-encoded.
  const signature = req.headers.get('x-cal-signature-256') ?? '';
  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

  if (
    !signature ||
    signature.length !== expected.length ||
    !crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
  ) {
    console.warn('cal-webhook: signature mismatch');
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let body: CalWebhookBody;
  try {
    body = JSON.parse(rawBody) as CalWebhookBody;
  } catch {
    return NextResponse.json({ error: 'invalid json' }, { status: 400 });
  }

  if (body.triggerEvent !== 'BOOKING_CREATED') {
    // Acknowledge other events (cancel/reschedule) for now; future iteration
    // can update the bookings row state.
    return NextResponse.json({ received: body.triggerEvent });
  }

  try {
    const bookingId = await persistBooking(body);
    if (bookingId) {
      // Fire the handoff email asynchronously. Don't block the webhook ack.
      void fireHandoff(bookingId, body).catch((err) =>
        console.error('handoff fire failed', err),
      );
    }
    return NextResponse.json({ ok: true, bookingId });
  } catch (error) {
    console.error('cal-webhook persist failed', error);
    const message = error instanceof Error ? error.message : 'unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

async function persistBooking(body: CalWebhookBody): Promise<string | null> {
  const supabase = getSupabaseService();

  const { data: tenant } = await supabase
    .from('tenants')
    .select('id')
    .eq('slug', TENANT_SLUG)
    .single();

  if (!tenant) {
    console.error('cal-webhook: tenant not found');
    return null;
  }

  const attendee = body.payload.attendees?.[0];
  const attendeeEmail = attendee?.email ?? null;

  // Try to find the conversation that produced this booking via attendee email.
  // Visitors are anonymous in our store; the link is best-effort by email match
  // on the leads table.
  let conversationId: string | null = null;
  let leadId: string | null = null;

  if (attendeeEmail) {
    const { data: lead } = await supabase
      .from('leads')
      .select('id, conversation_id')
      .eq('tenant_id', tenant.id)
      .eq('email', attendeeEmail)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (lead) {
      leadId = lead.id;
      conversationId = lead.conversation_id;
    } else {
      // No prior lead — create one so future references work.
      const { data: newLead } = await supabase
        .from('leads')
        .insert({
          tenant_id: tenant.id,
          email: attendeeEmail,
          name: attendee?.name ?? null,
          source: 'calcom',
          status: 'qualified',
        })
        .select('id')
        .single();
      leadId = newLead?.id ?? null;
    }
  }

  // Pull company from custom-question responses if Cal.com captured one.
  const company =
    extractResponse(body.payload.responses, 'company') ??
    extractResponse(body.payload.responses, 'business') ??
    null;

  const calBookingId = body.payload.uid ?? String(body.payload.bookingId ?? '');

  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      tenant_id: tenant.id,
      lead_id: leadId,
      conversation_id: conversationId,
      cal_booking_id: calBookingId,
      attendee_email: attendeeEmail,
      attendee_name: attendee?.name ?? null,
      attendee_company: company,
      meeting_time: body.payload.startTime ?? null,
      meeting_duration_minutes: body.payload.startTime && body.payload.endTime
        ? Math.round(
            (new Date(body.payload.endTime).getTime() -
              new Date(body.payload.startTime).getTime()) /
              60000,
          )
        : null,
      meeting_type: body.payload.eventType?.title ?? body.payload.title ?? null,
      status: 'scheduled',
    })
    .select('id')
    .single();

  if (bookingError) {
    console.error('cal-webhook booking insert failed', bookingError);
    return null;
  }

  return booking?.id ?? null;
}

async function fireHandoff(bookingId: string, body: CalWebhookBody): Promise<void> {
  const supabase = getSupabaseService();

  const { data: booking } = await supabase
    .from('bookings')
    .select('*')
    .eq('id', bookingId)
    .single();

  if (!booking) return;

  const attendee = body.payload.attendees?.[0];

  await sendHandoffEmail({
    bookingId,
    conversationId: booking.conversation_id,
    leadId: booking.lead_id,
    attendeeName: booking.attendee_name,
    attendeeEmail: booking.attendee_email,
    attendeeCompany: booking.attendee_company,
    meetingTime: booking.meeting_time,
    meetingTimezone: attendee?.timeZone ?? body.payload.organizer?.timeZone ?? null,
    meetingType: booking.meeting_type,
  });
}

function extractResponse(
  responses: Record<string, { value?: string }> | undefined,
  key: string,
): string | null {
  if (!responses) return null;
  const lowerKey = key.toLowerCase();
  for (const [k, v] of Object.entries(responses)) {
    if (k.toLowerCase().includes(lowerKey) && v.value) {
      return v.value;
    }
  }
  return null;
}
