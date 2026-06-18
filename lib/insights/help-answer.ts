/**
 * Help / "how do I" answer generator.
 *
 * Takes the operator's natural-language question, sends it to Sonnet with the
 * dashboard guide as context, returns a short grade 6-7 answer plus optional
 * steps and tips. Used by /api/admin/help/ask, which the Guide page calls
 * when the URL has a `q` param.
 */

import { getAnthropic, REPORT_MODEL, parseClaudeJSON, extractText } from '@/lib/anthropic';

export interface HelpAnswer {
  answer: string;
  steps: string[];
  tips: string[];
  related_section?: string;
}

const GUIDE_CONTEXT = `The Output Systems admin dashboard has these areas:

INSIGHTS (the home page, /admin):
- Tiles at the top show conversations, messages, unanswered, leads, bookings, average messages per conversation.
- Pick a date range with the buttons in the top right: Today, This week, Last week, This month, Last 7 days, Last 30 days. Weeks are Monday to Sunday.
- A line chart shows conversation volume per day.
- A pie chart shows the lead funnel.
- A bar chart shows page engagement.
- Below the charts are two lists: top customer questions and top unanswered questions.
- A page engagement table shows which pages people use the chatbot on most.
- Click a metric tile to jump to a filtered list.

CONVERSATIONS (/admin/conversations):
- Every chat someone has with the bot is listed here.
- Filter by date range, page, unanswered only, or a keyword.
- Click "view" on a row to see the full transcript.
- Click "Download CSV" to export the filtered list as a spreadsheet.

LEADS (/admin/leads):
- People who shared their name, email, and phone in the chat show up here.
- Filter by date range.
- Click "view" to see their conversation.
- Download as CSV.

REPORTS (/admin/reports):
- AI-generated summaries of a date range.
- Click "Generate report" to make a new one. Pick a date range. It takes 30 to 90 seconds.
- Each report has: a summary, top questions, top unanswered questions, page engagement, suggested actions, sentiment.
- From a report, click "Download as DOCX" or "Download as CSV" or "Print to PDF".
- A weekly report is also generated automatically every Monday at 12:00 UTC.

BOOKINGS (/admin/bookings):
- People who booked a discovery call via Cal.com.

ASK (/admin/query):
- Build a custom chart by typing a question in the command bar.
- Supported chart types: pie, bar, line, donut.
- Examples:
  - "pie chart of conversations that asked about pricing this week"
  - "bar chart of top unanswered last 30 days"
  - "line chart of conversation volume last 7 days"
  - "pie chart of the lead funnel this month"
- The page shows the chart plus a breakdown with counts, percentages, and observations.
- "Download summary (PDF)" button at the top prints the chart and breakdown.

GUIDE (/admin/guide):
- This page.
- Static help content.
- If you type "how do I X" in the command bar, you land here and get an AI answer to your specific question.

COMMAND BAR (top of every admin page):
- The big text box at the top of every admin page.
- Type a question or instruction.
- It figures out what you want and either generates a chart, jumps to a filtered list, generates a report, or shows help.
- You can also click the mic icon to speak.

THEME TOGGLE (top right of header):
- Click the sun/moon icon to switch between dark and light themes.
- The theme persists across sessions.`;

const HELP_PROMPT = `You are the help system for the Output Systems internal admin dashboard. The operator (Curtis Grier-Coward) is asking how to do something. Answer at a grade 6 or 7 reading level. Be specific to this dashboard and its features. Use the context below.

${GUIDE_CONTEXT}

Output strict JSON. No prose. No markdown fences. Just the JSON object:

{
  "answer": "Short 2 to 4 sentence direct answer. Plain language. No filler.",
  "steps": [
    "One clear action step. Start with a verb.",
    "Another action step."
  ],
  "tips": [
    "Optional one-sentence tip. Drop the array if no tip applies."
  ],
  "related_section": "Optional name of the most relevant guide section: Insights, Conversations, Leads, Reports, Bookings, Ask, Guide, Command bar, Theme toggle. Drop if none clearly applies."
}

Rules:
- If the question is not about this dashboard, answer briefly and point them at the most relevant section.
- Steps are concrete clicks or keystrokes. 2 to 5 steps. Drop the array if no steps make sense.
- Tips are optional. 0 to 2.
- Grade 6 to 7 reading level: short words, short sentences, common language.
- No markdown. No formatting characters.`;

export async function answerHelpQuestion(question: string): Promise<HelpAnswer> {
  const anthropic = getAnthropic();
  const result = await anthropic.messages.create({
    model: REPORT_MODEL,
    max_tokens: 1200,
    system: [
      {
        type: 'text',
        text: HELP_PROMPT,
        cache_control: { type: 'ephemeral' },
      },
    ],
    messages: [{ role: 'user', content: question }],
  });

  const text = extractText(result);
  try {
    return parseClaudeJSON<HelpAnswer>(text);
  } catch (err) {
    console.error('help answer parse failed', err);
    return {
      answer:
        "I couldn't generate a clean answer for that. Scroll down to read the guide, or try a more specific question.",
      steps: [],
      tips: [],
    };
  }
}
