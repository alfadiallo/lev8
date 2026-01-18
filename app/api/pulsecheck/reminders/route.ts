import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

interface DirectorSummary {
  director_id: string;
  director_name: string;
  director_email: string;
  pending_count: number;
  completed_count: number;
  total_count: number;
  pending_providers: { id: string; name: string }[];
}

/**
 * GET /api/pulsecheck/reminders
 * Get reminder summary for a cycle
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const cycleId = searchParams.get('cycle_id');

    if (!cycleId) {
      return NextResponse.json({ error: 'Cycle ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get cycle info
    const { data: cycle, error: cycleError } = await supabase
      .from('pulsecheck_cycles')
      .select('*')
      .eq('id', cycleId)
      .single();

    if (cycleError) {
      return NextResponse.json({ error: 'Cycle not found' }, { status: 404 });
    }

    // Get all ratings for this cycle grouped by director
    const { data: ratings } = await supabase
      .from('pulsecheck_ratings')
      .select(`
        id,
        status,
        director_id,
        provider_id
      `)
      .eq('cycle_id', cycleId);

    // Get directors info
    const directorIds = [...new Set((ratings || []).map(r => r.director_id))];
    const { data: directors } = await supabase
      .from('pulsecheck_directors')
      .select('id, name, email')
      .in('id', directorIds);

    // Get providers info
    const providerIds = [...new Set((ratings || []).map(r => r.provider_id))];
    const { data: providers } = await supabase
      .from('pulsecheck_providers')
      .select('id, name')
      .in('id', providerIds);

    // Build director summaries
    const directorMap = new Map(directors?.map(d => [d.id, d]) || []);
    const providerMap = new Map(providers?.map(p => [p.id, p]) || []);

    const summaries: DirectorSummary[] = [];
    const ratingsByDirector = new Map<string, typeof ratings>();

    (ratings || []).forEach(r => {
      const existing = ratingsByDirector.get(r.director_id) || [];
      existing.push(r);
      ratingsByDirector.set(r.director_id, existing);
    });

    ratingsByDirector.forEach((dirRatings, directorId) => {
      const director = directorMap.get(directorId);
      if (!director || !dirRatings) return;

      const pending = dirRatings.filter(r => r.status !== 'completed');
      const completed = dirRatings.filter(r => r.status === 'completed');

      summaries.push({
        director_id: directorId,
        director_name: director.name,
        director_email: director.email,
        pending_count: pending.length,
        completed_count: completed.length,
        total_count: dirRatings.length,
        pending_providers: pending.map(r => {
          const provider = providerMap.get(r.provider_id);
          return {
            id: r.provider_id,
            name: provider?.name || 'Unknown',
          };
        }),
      });
    });

    // Get recent reminder history
    const { data: reminderHistory } = await supabase
      .from('pulsecheck_reminders')
      .select('*')
      .eq('cycle_id', cycleId)
      .order('sent_at', { ascending: false })
      .limit(20);

    return NextResponse.json({
      cycle,
      summaries: summaries.sort((a, b) => b.pending_count - a.pending_count),
      reminderHistory: reminderHistory || [],
      stats: {
        totalDirectors: summaries.length,
        directorsWithPending: summaries.filter(s => s.pending_count > 0).length,
        totalPending: summaries.reduce((sum, s) => sum + s.pending_count, 0),
        totalCompleted: summaries.reduce((sum, s) => sum + s.completed_count, 0),
      },
    });
  } catch (error) {
    console.error('[pulsecheck/reminders] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pulsecheck/reminders
 * Send reminder emails to directors with pending reviews
 * Note: This creates reminder records. Actual email sending would require
 * integration with an email service (SendGrid, Resend, etc.)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cycle_id, director_ids } = body;

    if (!cycle_id) {
      return NextResponse.json({ error: 'Cycle ID is required' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get summaries for specified directors (or all if none specified)
    const { data: ratings } = await supabase
      .from('pulsecheck_ratings')
      .select(`
        id,
        status,
        director_id,
        provider_id
      `)
      .eq('cycle_id', cycle_id);

    // Filter by director_ids if provided
    let targetRatings = ratings || [];
    if (director_ids && director_ids.length > 0) {
      targetRatings = targetRatings.filter(r => director_ids.includes(r.director_id));
    }

    // Group by director and count
    const directorCounts = new Map<string, { pending: number; completed: number }>();
    targetRatings.forEach(r => {
      const existing = directorCounts.get(r.director_id) || { pending: 0, completed: 0 };
      if (r.status === 'completed') {
        existing.completed++;
      } else {
        existing.pending++;
      }
      directorCounts.set(r.director_id, existing);
    });

    // Only send to directors with pending reviews
    const reminderRecords = Array.from(directorCounts.entries())
      .filter(([_, counts]) => counts.pending > 0)
      .map(([directorId, counts]) => ({
        cycle_id,
        director_id: directorId,
        pending_count: counts.pending,
        completed_count: counts.completed,
        email_sent: false, // Would be true after actual email integration
        sent_at: new Date().toISOString(),
      }));

    if (reminderRecords.length === 0) {
      return NextResponse.json({
        message: 'No pending reviews to send reminders for',
        sent: 0,
      });
    }

    // Record reminders
    const { data: reminders, error } = await supabase
      .from('pulsecheck_reminders')
      .insert(reminderRecords)
      .select();

    if (error) {
      console.error('[pulsecheck/reminders] Insert error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // TODO: Integrate with email service here
    // For now, just record that we would send emails
    // Example with hypothetical email service:
    // for (const reminder of reminders) {
    //   await sendEmail({
    //     to: directorEmail,
    //     subject: `Pulse Check Reminder: ${counts.pending} reviews pending`,
    //     template: 'pulsecheck-reminder',
    //     data: { pending_count, providers, due_date }
    //   });
    // }

    return NextResponse.json({
      message: `Reminders queued for ${reminders?.length || 0} directors`,
      sent: reminders?.length || 0,
      reminders,
    });
  } catch (error) {
    console.error('[pulsecheck/reminders] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
