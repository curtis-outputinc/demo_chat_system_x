/**
 * Chat-captured lead email.
 *
 * Fires when the chatbot has collected the visitor's name plus at least one
 * contact method (phone preferred, email accepted) inside the chat
 * conversation and emitted the SUBMIT_LEAD marker. Sends a short notification
 * to connect@output.systems so the team can follow up directly.
 *
 * Different from handoff-email.ts: handoff fires only on actual Cal.com
 * bookings. This fires on in-chat lead capture from the smooth statement-led
 * collection flow.
 */

import { Resend } from 'resend';
import { loadVerticalConfig } from './vertical';

let resendClient: Resend | null = null;

function getResend(): Resend {
  if (resendClient) return resendClient;
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error('RESEND_API_KEY is not set.');
  resendClient = new Resend(apiKey);
  return resendClient;
}

export interface ChatLeadPayload {
  name: string;
  email?: string | null;
  phone?: string | null;
  bestTime?: string | null;
  conversationId?: string | null;
}

export async function sendChatLeadEmail(payload: ChatLeadPayload): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    console.warn('chat-lead: RESEND_API_KEY missing, skipping email');
    return;
  }

  const config = await loadVerticalConfig();
  const fromAddress = process.env.RESEND_FROM_EMAIL ?? 'connect@output.systems';
  const toAddress = process.env.HANDOFF_RECIPIENT ?? 'connect@output.systems';
  const adminBaseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? config.siteUrl;

  const subject = `[${config.brandName}] New chat lead, ${payload.name}`;

  const lines: string[] = [];
  lines.push(`Name: ${payload.name}`);
  if (payload.phone && payload.phone.trim().length > 0) {
    lines.push(`Phone: ${payload.phone}`);
  }
  if (payload.email && payload.email.trim().length > 0) {
    lines.push(`Email: ${payload.email}`);
  }
  if (payload.bestTime && payload.bestTime.trim().length > 0) {
    lines.push(`Best time to reach: ${payload.bestTime}`);
  }
  lines.push('');
  lines.push('Captured directly inside the chatbot conversation, no booking yet.');
  if (payload.conversationId) {
    lines.push('');
    lines.push(`Full transcript: ${adminBaseUrl}/admin/conversations/${payload.conversationId}`);
  }

  const resend = getResend();
  const result = await resend.emails.send({
    from: `${config.brandName} Assistant <${fromAddress}>`,
    to: [toAddress],
    subject,
    text: lines.join('\n'),
  });

  if (result.error) {
    console.error('chat-lead send failed', result.error);
    throw new Error(`Resend failed: ${result.error.message}`);
  }
}
