/**
 * API Route: /api/forms/structured-rating
 * 
 * Handles EQ/PQ/IQ structured rating submissions from faculty and self-assessments.
 * 
 * GET - Fetch ratings for a resident (query params: resident_id, period_label, rater_type)
 * POST - Submit a new structured rating
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_KEY!
);

// EQ/PQ/IQ attribute fields for validation
const EQ_ATTRIBUTES = [
  'eq_empathy_positive_interactions',
  'eq_adaptability_self_awareness',
  'eq_stress_management_resilience',
  'eq_curiosity_growth_mindset',
  'eq_effectiveness_communication'
];

const PQ_ATTRIBUTES = [
  'pq_work_ethic_reliability',
  'pq_integrity_accountability',
  'pq_teachability_receptiveness',
  'pq_documentation',
  'pq_leadership_relationships'
];

const IQ_ATTRIBUTES = [
  'iq_knowledge_base',
  'iq_analytical_thinking',
  'iq_commitment_learning',
  'iq_clinical_flexibility',
  'iq_performance_for_level'
];

const ALL_ATTRIBUTES = [...EQ_ATTRIBUTES, ...PQ_ATTRIBUTES, ...IQ_ATTRIBUTES];

// Validate score is in range 1.0 to 5.0 with 0.5 increments
function isValidScore(value: unknown): boolean {
  if (typeof value !== 'number') return false;
  if (value < 1.0 || value > 5.0) return false;
  // Check if it's a multiple of 0.5
  return (value * 2) % 1 === 0;
}

// Calculate PGY level from graduation year
function calculatePGYLevel(graduationYear: number, referenceDate: Date = new Date()): string {
  const month = referenceDate.getMonth() + 1; // 0-indexed
  const academicYear = month >= 7 ? referenceDate.getFullYear() : referenceDate.getFullYear() - 1;
  const yearsToGraduation = graduationYear - academicYear;
  const pgyLevel = 4 - yearsToGraduation; // For 3-year program
  
  if (pgyLevel < 1 || pgyLevel > 4) return '';
  return `PGY-${pgyLevel}`;
}

// Determine period (Fall/Spring) based on date
function determinePeriod(pgyLevel: string, evaluationDate: Date): string {
  const month = evaluationDate.getMonth() + 1; // 0-indexed to 1-indexed
  
  switch (pgyLevel) {
    case 'PGY-1':
      return (month >= 6 && month <= 11) ? 'Fall' : 'Spring';
    case 'PGY-2':
      return (month >= 5 && month <= 10) ? 'Fall' : 'Spring';
    case 'PGY-3':
      return (month >= 4 && month <= 9) ? 'Fall' : 'Spring';
    case 'PGY-4':
      return (month >= 3 && month <= 8) ? 'Fall' : 'Spring';
    default:
      return '';
  }
}

/**
 * GET /api/forms/structured-rating
 * Fetch structured ratings for a resident
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const residentId = searchParams.get('resident_id');
    const periodLabel = searchParams.get('period_label');
    const raterType = searchParams.get('rater_type');

    if (!residentId) {
      return NextResponse.json(
        { error: 'resident_id is required' },
        { status: 400 }
      );
    }

    // Build query
    let query = supabase
      .from('structured_ratings')
      .select(`
        *,
        faculty:faculty_id (
          id,
          user_profiles!inner (
            full_name
          )
        )
      `)
      .eq('resident_id', residentId)
      .order('evaluation_date', { ascending: false });

    if (periodLabel) {
      query = query.eq('period_label', periodLabel);
    }

    if (raterType) {
      query = query.eq('rater_type', raterType);
    }

    const { data: ratings, error } = await query;

    if (error) {
      console.error('[Structured Rating API] Fetch error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch ratings', details: error.message },
        { status: 500 }
      );
    }

    // Transform data for response
    const transformedRatings = ratings?.map((r: any) => ({
      ...r,
      faculty_name: r.faculty?.user_profiles?.full_name || null,
      faculty: undefined // Remove nested object
    }));

    return NextResponse.json({
      ratings: transformedRatings || [],
      count: transformedRatings?.length || 0
    });
  } catch (error) {
    console.error('[Structured Rating API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/forms/structured-rating
 * Submit a new structured rating
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Required fields
    const { resident_id, rater_type, ...scores } = body;

    if (!resident_id) {
      return NextResponse.json(
        { error: 'resident_id is required' },
        { status: 400 }
      );
    }

    if (!rater_type || !['faculty', 'self'].includes(rater_type)) {
      return NextResponse.json(
        { error: 'rater_type must be "faculty" or "self"' },
        { status: 400 }
      );
    }

    // Validate at least one attribute score is provided
    const providedAttributes = ALL_ATTRIBUTES.filter(attr => scores[attr] !== undefined);
    if (providedAttributes.length === 0) {
      return NextResponse.json(
        { error: 'At least one attribute score is required' },
        { status: 400 }
      );
    }

    // Validate all provided scores
    for (const attr of providedAttributes) {
      if (!isValidScore(scores[attr])) {
        return NextResponse.json(
          { error: `Invalid score for ${attr}. Must be 1.0-5.0 in 0.5 increments` },
          { status: 400 }
        );
      }
    }

    // Validate faculty_id for faculty ratings
    if (rater_type === 'faculty' && !body.faculty_id) {
      return NextResponse.json(
        { error: 'faculty_id is required for faculty ratings' },
        { status: 400 }
      );
    }

    // Get resident info to calculate PGY level
    const { data: resident, error: residentError } = await supabase
      .from('residents')
      .select('id, classes(graduation_year)')
      .eq('id', resident_id)
      .single();

    if (residentError || !resident) {
      return NextResponse.json(
        { error: 'Resident not found' },
        { status: 404 }
      );
    }

    // Calculate period info
    const evaluationDate = body.evaluation_date 
      ? new Date(body.evaluation_date) 
      : new Date();
    
    const graduationYear = (resident as any).classes?.graduation_year;
    const pgyLevel = graduationYear ? calculatePGYLevel(graduationYear, evaluationDate) : null;
    const period = pgyLevel ? determinePeriod(pgyLevel, evaluationDate) : null;
    const periodLabel = pgyLevel && period ? `${pgyLevel} ${period}` : null;

    // Build insert data
    const insertData: Record<string, any> = {
      resident_id,
      rater_type,
      evaluation_date: evaluationDate.toISOString().split('T')[0],
      pgy_level: pgyLevel,
      period,
      period_label: periodLabel
    };

    // Add faculty_id if faculty rating
    if (rater_type === 'faculty' && body.faculty_id) {
      insertData.faculty_id = body.faculty_id;
    }

    // Add all valid attribute scores
    for (const attr of ALL_ATTRIBUTES) {
      if (scores[attr] !== undefined) {
        insertData[attr] = scores[attr];
      }
    }

    // Add concerns_goals for self-assessments only
    if (rater_type === 'self' && body.concerns_goals) {
      insertData.concerns_goals = body.concerns_goals;
    }

    // Insert the rating (trigger will calculate averages)
    const { data: rating, error: insertError } = await supabase
      .from('structured_ratings')
      .insert(insertData)
      .select()
      .single();

    if (insertError) {
      console.error('[Structured Rating API] Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to save rating', details: insertError.message },
        { status: 500 }
      );
    }

    console.log('[Structured Rating API] Rating saved:', {
      id: rating.id,
      resident_id,
      rater_type,
      period_label: periodLabel,
      eq_avg: rating.eq_avg,
      pq_avg: rating.pq_avg,
      iq_avg: rating.iq_avg
    });

    return NextResponse.json({
      success: true,
      rating,
      message: 'Rating submitted successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('[Structured Rating API] Unexpected error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}





