/**
 * Export helpers.
 *
 * CSV export: simple manual encoding, no dependency. Universal compatibility
 * with Excel, Google Sheets, Numbers.
 *
 * XLSX export: uses `exceljs` to produce a native .xlsx workbook with one
 * sheet, formatted headers, and column widths sized to content.
 *
 * DOCX export: uses the `docx` package to build a Word document server-side.
 *
 * PDF export: not implemented here. The report viewer page is print-friendly
 * (clean CSS, paged layout), so File > Print > Save as PDF works from the
 * browser. A native PDF endpoint can be added later if needed.
 */

import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
} from 'docx';
import ExcelJS from 'exceljs';
import type { ReportRecord } from './types';

// -----------------------------------------------------------------------------
// CSV
// -----------------------------------------------------------------------------

export function rowsToCsv(headers: string[], rows: (string | number | null)[][]): string {
  const escape = (v: string | number | null) => {
    if (v === null || v === undefined) return '';
    const s = String(v);
    if (s.includes(',') || s.includes('"') || s.includes('\n')) {
      return `"${s.replace(/"/g, '""')}"`;
    }
    return s;
  };
  const lines: string[] = [];
  lines.push(headers.map(escape).join(','));
  for (const row of rows) {
    lines.push(row.map(escape).join(','));
  }
  return lines.join('\n');
}

// -----------------------------------------------------------------------------
// XLSX
// -----------------------------------------------------------------------------

export async function rowsToXlsxBuffer(
  sheetName: string,
  headers: string[],
  rows: (string | number | null)[][],
): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Output Systems';
  wb.created = new Date();
  const ws = wb.addWorksheet(sheetName.slice(0, 31), {
    views: [{ state: 'frozen', ySplit: 1 }],
  });
  ws.addRow(headers);
  const headerRow = ws.getRow(1);
  headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
  headerRow.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0A9D8B' },
  };
  headerRow.alignment = { vertical: 'middle', horizontal: 'left' };

  for (const row of rows) {
    ws.addRow(row);
  }

  // Auto-fit column widths based on content (capped at 60).
  ws.columns.forEach((col, idx) => {
    let max = headers[idx]?.length ?? 10;
    for (const row of rows) {
      const v = row[idx];
      if (v === null || v === undefined) continue;
      const len = String(v).length;
      if (len > max) max = len;
    }
    col.width = Math.min(Math.max(max + 2, 12), 60);
  });

  const buffer = await wb.xlsx.writeBuffer();
  return Buffer.from(buffer);
}

// -----------------------------------------------------------------------------
// DOCX
// -----------------------------------------------------------------------------

export async function reportToDocxBuffer(report: ReportRecord): Promise<Buffer> {
  const children: Paragraph[] = [];

  children.push(
    new Paragraph({
      children: [new TextRun({ text: 'Output Systems · Insight Report', bold: true, size: 32 })],
      alignment: AlignmentType.CENTER,
    }),
  );
  children.push(
    new Paragraph({
      children: [
        new TextRun({
          text:
            (report.label ?? formatPeriod(report.range_start, report.range_end)) +
            (report.type ? ` · ${report.type}` : ''),
          italics: true,
          color: '5a5a5a',
        }),
      ],
      alignment: AlignmentType.CENTER,
    }),
  );
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));

  // Counts.
  children.push(heading('At a glance'));
  children.push(bullet(`Conversations: ${report.conversation_count}`));
  children.push(bullet(`Messages: ${report.message_count}`));
  children.push(bullet(`Leads captured: ${report.lead_count}`));
  children.push(bullet(`Bookings: ${report.booking_count}`));
  children.push(bullet(`Unanswered flagged: ${report.unanswered_count}`));
  if (report.avg_messages_per_conversation !== null) {
    children.push(
      bullet(`Average messages per conversation: ${report.avg_messages_per_conversation}`),
    );
  }
  children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));

  // Summary.
  if (report.summary) {
    children.push(heading('Summary'));
    children.push(new Paragraph({ children: [new TextRun({ text: report.summary })] }));
    children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }

  // Top questions.
  if (report.top_questions && report.top_questions.length > 0) {
    children.push(heading('Top customer questions'));
    for (const q of report.top_questions) {
      children.push(bullet(`${q.count}x · ${q.question}`));
    }
    children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }

  // Top unanswered.
  if (report.top_unanswered && report.top_unanswered.length > 0) {
    children.push(heading('Top unanswered questions'));
    for (const q of report.top_unanswered) {
      children.push(bullet(`${q.count}x · ${q.question}`));
    }
    children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }

  // Top pages.
  if (report.top_pages && report.top_pages.length > 0) {
    children.push(heading('Page engagement'));
    for (const p of report.top_pages) {
      children.push(
        bullet(
          `${p.page} · ${p.conversation_count} conversations, ${p.message_count} messages, ${p.unanswered_count} unanswered`,
        ),
      );
    }
    children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
  }

  // Suggested actions.
  if (report.suggested_actions && report.suggested_actions.length > 0) {
    children.push(heading('Suggested actions'));
    for (const a of report.suggested_actions) {
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: `[${a.priority ?? 'medium'}] `, bold: true, color: '07a094' }),
            new TextRun({ text: a.title, bold: true }),
          ],
        }),
      );
      if (a.rationale) {
        children.push(new Paragraph({ children: [new TextRun({ text: a.rationale })] }));
      }
      if (a.source) {
        children.push(
          new Paragraph({
            children: [new TextRun({ text: `Source: ${a.source}`, italics: true, color: '7a7a7a' })],
          }),
        );
      }
      children.push(new Paragraph({ children: [new TextRun({ text: '' })] }));
    }
  }

  // Sentiment.
  if (report.sentiment) {
    children.push(heading('Sentiment'));
    children.push(new Paragraph({ children: [new TextRun({ text: report.sentiment })] }));
  }

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}

function heading(text: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    children: [new TextRun({ text, bold: true, size: 26 })],
  });
}

function bullet(text: string): Paragraph {
  return new Paragraph({ bullet: { level: 0 }, children: [new TextRun({ text })] });
}

function formatPeriod(start: string, end: string): string {
  const s = new Date(start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const e = new Date(end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${s} – ${e}`;
}
