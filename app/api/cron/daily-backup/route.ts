import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const CRON_SECRET = process.env.CRON_SECRET;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const BACKUP_EMAIL = process.env.BACKUP_EMAIL || 'findme@alfadiallo.com';
const FROM_EMAIL = process.env.PULSECHECK_FROM_EMAIL || 'EQ·PQ·IQ <noreply@eqpqiq.com>';

interface TableDump {
  name: string;
  csv: string;
  rowCount: number;
}

function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return '';
  const headers = Object.keys(rows[0]);
  const escape = (val: unknown): string => {
    if (val === null || val === undefined) return '';
    const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const lines = [headers.join(',')];
  for (const row of rows) {
    lines.push(headers.map(h => escape(row[h])).join(','));
  }
  return lines.join('\n');
}

/**
 * GET /api/cron/daily-backup
 * Vercel Cron Job: dumps critical database tables to CSV and emails them.
 * Runs daily at 6 AM EST. Secured via CRON_SECRET.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (!CRON_SECRET || authHeader !== `Bearer ${CRON_SECRET}`) {
    console.error('[cron-backup] Unauthorized');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const today = new Date().toISOString().split('T')[0];
  const dumps: TableDump[] = [];
  const errors: string[] = [];

  const tables = [
    { name: 'structured_ratings', select: '*', order: 'evaluation_date' },
    { name: 'surveys', select: '*', order: 'created_at' },
    { name: 'survey_respondents', select: '*', order: 'created_at' },
    { name: 'survey_resident_assignments', select: '*', order: 'created_at' },
    { name: 'residents', select: '*', order: 'created_at' },
    { name: 'user_profiles', select: 'id, email, full_name, role, institutional_email, personal_email, created_at, updated_at', order: 'created_at' },
    { name: 'faculty', select: '*', order: 'created_at' },
    { name: 'period_scores', select: '*', order: 'created_at' },
    { name: 'classes', select: '*', order: 'graduation_year' },
    { name: 'swot_summaries', select: '*', order: 'created_at' },
    { name: 'ite_scores', select: '*', order: 'exam_year' },
    { name: 'imported_comments', select: '*', order: 'created_at' },
    { name: 'eqpqiq_user_roles', select: '*', order: 'created_at' },
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table.name)
        .select(table.select)
        .order(table.order, { ascending: true })
        .limit(50000);

      if (error) {
        errors.push(`${table.name}: ${error.message}`);
        continue;
      }

      const rows = (data || []) as unknown as Record<string, unknown>[];
      dumps.push({
        name: table.name,
        csv: toCsv(rows),
        rowCount: rows.length,
      });
    } catch (err) {
      errors.push(`${table.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }

  const summaryRows = dumps.map(d => `  ${d.name}: ${d.rowCount.toLocaleString()} rows`).join('\n');
  const errorSummary = errors.length > 0
    ? `\n\nErrors:\n${errors.map(e => `  ⚠ ${e}`).join('\n')}`
    : '';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px;">
      <div style="background: linear-gradient(135deg, #2D6A4F 0%, #40916C 100%); color: white; padding: 24px; border-radius: 12px 12px 0 0; text-align: center;">
        <h2 style="margin: 0; font-size: 20px;">Daily Data Backup</h2>
        <p style="margin: 8px 0 0; opacity: 0.9; font-size: 14px;">${today}</p>
      </div>
      <div style="background: #f9fafb; padding: 24px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="color: #333; font-size: 14px; margin: 0 0 16px;">
          ${dumps.length} table${dumps.length !== 1 ? 's' : ''} exported as CSV attachments.
        </p>
        <table style="width: 100%; border-collapse: collapse;">
          <thead>
            <tr style="background: #f3f4f6;">
              <th style="padding: 6px 12px; text-align: left; font-size: 12px; color: #6b7280;">Table</th>
              <th style="padding: 6px 12px; text-align: right; font-size: 12px; color: #6b7280;">Rows</th>
            </tr>
          </thead>
          <tbody>
            ${dumps.map(d => `
              <tr style="border-top: 1px solid #e5e7eb;">
                <td style="padding: 6px 12px; font-size: 13px; color: #333; font-family: monospace;">${d.name}</td>
                <td style="padding: 6px 12px; font-size: 13px; color: #333; text-align: right; font-weight: 600;">${d.rowCount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        ${errors.length > 0 ? `
          <div style="margin-top: 16px; padding: 12px; background: #fef2f2; border-radius: 8px; border: 1px solid #fecaca;">
            <p style="color: #991b1b; font-size: 13px; font-weight: 600; margin: 0 0 4px;">Errors (${errors.length}):</p>
            ${errors.map(e => `<p style="color: #991b1b; font-size: 12px; margin: 2px 0;">${e}</p>`).join('')}
          </div>
        ` : ''}
      </div>
      <div style="text-align: center; padding: 16px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="color: #999; font-size: 12px; margin: 0;">lev8.ai &amp; eqpqiq.com automated backup</p>
      </div>
    </div>
  `;

  const text = `Daily Data Backup — ${today}\n\n${summaryRows}${errorSummary}\n\nCSV files attached.`;

  // Resend supports attachments via base64 content
  const attachments = dumps
    .filter(d => d.csv.length > 0)
    .map(d => ({
      filename: `${d.name}_${today}.csv`,
      content: Buffer.from(d.csv).toString('base64'),
    }));

  if (!RESEND_API_KEY) {
    console.log('[cron-backup] (DEV MODE) Would send backup email with', attachments.length, 'attachments');
    console.log('[cron-backup] Summary:\n' + summaryRows);
    return NextResponse.json({
      success: true,
      mode: 'dev',
      tables: dumps.map(d => ({ name: d.name, rows: d.rowCount })),
      errors,
    });
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: BACKUP_EMAIL,
        subject: `Daily lev8 | EQ·PQ·IQ Supabase Data — ${today}`,
        html,
        text,
        attachments,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[cron-backup] Email send failed:', error);
      return NextResponse.json({ success: false, error: 'Email send failed', details: error }, { status: 500 });
    }

    console.log('[cron-backup] Backup email sent to', BACKUP_EMAIL, '—', dumps.length, 'tables,', dumps.reduce((s, d) => s + d.rowCount, 0), 'total rows');

    return NextResponse.json({
      success: true,
      tables: dumps.map(d => ({ name: d.name, rows: d.rowCount })),
      totalRows: dumps.reduce((s, d) => s + d.rowCount, 0),
      attachments: attachments.length,
      errors,
    });
  } catch (error) {
    console.error('[cron-backup] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
