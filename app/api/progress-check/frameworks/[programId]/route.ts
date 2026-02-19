import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/progress-check/frameworks/[programId]
 * Returns the active evaluation framework for a program,
 * including pillars and attributes in display order.
 * Optional ?version=N to fetch a specific version.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ programId: string }> }
) {
  try {
    const { programId } = await params;
    const { searchParams } = new URL(request.url);
    const version = searchParams.get('version');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch framework
    let frameworkQuery = supabase
      .from('evaluation_frameworks')
      .select('*')
      .eq('program_id', programId);

    if (version) {
      frameworkQuery = frameworkQuery.eq('version', parseInt(version));
    } else {
      frameworkQuery = frameworkQuery.eq('is_active', true);
    }

    const { data: framework, error: frameworkError } = await frameworkQuery.single();

    if (frameworkError || !framework) {
      return NextResponse.json({ error: 'Framework not found' }, { status: 404 });
    }

    // Fetch pillars
    const { data: pillars } = await supabase
      .from('framework_pillars')
      .select('*')
      .eq('framework_id', framework.id)
      .order('display_order');

    // Fetch attributes
    const { data: attributes } = await supabase
      .from('framework_attributes')
      .select('*')
      .eq('framework_id', framework.id)
      .order('display_order');

    // Group attributes under their pillars
    const pillarsWithAttributes = (pillars || []).map(pillar => ({
      ...pillar,
      attributes: (attributes || []).filter(a => a.pillar_id === pillar.id),
    }));

    return NextResponse.json({
      framework: {
        ...framework,
        pillars: pillarsWithAttributes,
      },
    });
  } catch (error) {
    console.error('[frameworks] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
