/**
 * Shared types for the insights dashboard.
 */

export type ReportStatus = 'pending' | 'running' | 'complete' | 'failed';
export type ReportType = 'weekly' | 'monthly' | 'on_demand' | 'ad_hoc_query';

export interface QuestionEntry {
  question: string;
  count: number;
  example_message_id?: string | null;
  example_conversation_id?: string | null;
}

export interface PageEngagementEntry {
  page: string;
  conversation_count: number;
  message_count: number;
  unanswered_count: number;
}

export interface SuggestedAction {
  title: string;
  rationale: string;
  source: string;
  priority?: 'high' | 'medium' | 'low';
}

export interface ReportSections {
  summary: string;
  top_questions: QuestionEntry[];
  top_unanswered: QuestionEntry[];
  top_pages: PageEngagementEntry[];
  suggested_actions: SuggestedAction[];
  sentiment?: string | null;
}

export interface ReportRecord {
  id: string;
  tenant_id: string;
  type: ReportType;
  label: string | null;
  range_start: string;
  range_end: string;
  status: ReportStatus;
  conversation_count: number;
  message_count: number;
  lead_count: number;
  booking_count: number;
  unanswered_count: number;
  avg_messages_per_conversation: number | null;
  summary: string | null;
  top_questions: QuestionEntry[];
  top_unanswered: QuestionEntry[];
  top_pages: PageEngagementEntry[];
  suggested_actions: SuggestedAction[];
  sentiment: string | null;
  raw_response: string | null;
  started_at: string | null;
  finished_at: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

export type CommandIntent =
  | 'summarize_period'
  | 'find_pattern'
  | 'filter_conversations'
  | 'show_top_questions'
  | 'show_top_unanswered'
  | 'show_page_engagement'
  | 'show_lead_funnel'
  | 'show_conversation_volume'
  | 'unclear';

export interface CommandResult {
  intent: CommandIntent;
  range_token?: string;
  summarize?: { range_token: string; focus?: string };
  pattern?: { keyword: string; range_token?: string };
  filter?: {
    range_token?: string;
    unanswered_only?: boolean;
    page_context?: string;
    keyword?: string;
  };
  top?: { range_token?: string; limit?: number; unanswered_only?: boolean };
  clarification?: string;
}
