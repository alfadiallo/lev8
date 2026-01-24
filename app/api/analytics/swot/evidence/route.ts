// GET /api/analytics/swot/evidence - Fetch all supporting comments for a SWOT element

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { filterCommentsByTheme } from '@/lib/analytics/theme-matcher';
import { requireFacultyOrAbove } from '@/lib/auth/checkApiPermission';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

export async function GET(request: NextRequest) {
  // Require faculty or above to view SWOT evidence
  const authResult = await requireFacultyOrAbove(request);
  if (!authResult.authorized) {
    return authResult.response;
  }

  try {
    const searchParams = request.nextUrl.searchParams;
    const classYear = searchParams.get('class_year');
    const periodLabel = searchParams.get('period_label');
    const theme = searchParams.get('theme');

    if (!periodLabel || !theme) {
      return NextResponse.json(
        { error: 'Missing required parameters: period_label and theme' },
        { status: 400 }
      );
    }

    console.log('[Evidence API] Fetching comments for:', { classYear, periodLabel, theme });

    // Build query to fetch comments with resident and faculty information
    // Note: periodLabel might be just "PGY-3" but database has "PGY-3 Fall", "PGY-3 Spring"
    // So we use a LIKE query to match all periods for that PGY year
    let query = supabase
      .from('imported_comments')
      .select(`
        id,
        comment_text,
        date_completed,
        rotation_name,
        resident_id,
        evaluator_name,
        period_label,
        residents!inner (
          id,
          user_profiles!inner (
            full_name
          ),
          classes!inner (
            graduation_year
          )
        )
      `)
      .like('period_label', `${periodLabel}%`)
      .not('comment_text', 'is', null)
      .order('date_completed', { ascending: false });

    // Filter by class year if provided
    if (classYear) {
      query = query.eq('residents.classes.graduation_year', parseInt(classYear));
    }

    const { data: rawComments, error: fetchError } = await query;

    if (fetchError) {
      console.error('[Evidence API] Fetch error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch comments', details: fetchError.message },
        { status: 500 }
      );
    }

    if (!rawComments || rawComments.length === 0) {
      console.log('[Evidence API] No comments found');
      return NextResponse.json({ comments: [], total_count: 0 });
    }

    // Transform and enrich comments
    const enrichedComments = rawComments.map((c: any) => ({
      id: c.id,
      comment_text: c.comment_text,
      resident_name: c.residents?.user_profiles?.full_name || 'Unknown Resident',
      faculty_name: c.evaluator_name || 'Faculty Member',
      date_completed: c.date_completed,
      rotation_type: c.rotation_name,
      pgy_level: periodLabel?.match(/PGY-\d+/)?.[0] || null,
    }));

    // Filter comments by relevance to the theme
    const filteredComments = filterCommentsByTheme(enrichedComments, theme, 0.1);

    console.log('[Evidence API] Found:', {
      total: rawComments.length,
      filtered: filteredComments.length,
      theme_keywords: theme.substring(0, 50),
    });

    return NextResponse.json({
      comments: filteredComments,
      total_count: filteredComments.length,
    });
  } catch (error: unknown) {
    console.error('[Evidence API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

