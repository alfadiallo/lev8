import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/pulsecheck/admin/settings
 * Get frequency settings for healthsystem and sites
 */
export async function GET() {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the first healthsystem (demo has one)
    const { data: healthsystem, error: hsError } = await supabase
      .from('pulsecheck_healthsystems')
      .select('id, name, default_frequency, default_cycle_start_month')
      .limit(1)
      .single();

    if (hsError && hsError.code !== 'PGRST116') {
      console.error('[admin/settings] Healthsystem error:', hsError);
    }

    // Get sites with their frequency overrides
    const { data: sites, error: sitesError } = await supabase
      .from('pulsecheck_sites')
      .select('id, name, region, frequency_override, cycle_start_month_override, healthsystem_id')
      .order('name');

    if (sitesError) {
      console.error('[admin/settings] Sites error:', sitesError);
    }

    return NextResponse.json({
      healthsystem: healthsystem || {
        id: null,
        name: 'No Healthsystem',
        default_frequency: 'quarterly',
        default_cycle_start_month: 1,
      },
      sites: sites || [],
    });
  } catch (error) {
    console.error('[admin/settings] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/pulsecheck/admin/settings
 * Update frequency settings
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { healthsystem, sites } = body;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const results: { healthsystem?: unknown; sites?: unknown[] } = {};

    // Update healthsystem settings
    if (healthsystem?.id) {
      const { data, error } = await supabase
        .from('pulsecheck_healthsystems')
        .update({
          default_frequency: healthsystem.default_frequency,
          default_cycle_start_month: healthsystem.default_cycle_start_month,
        })
        .eq('id', healthsystem.id)
        .select()
        .single();

      if (error) {
        console.error('[admin/settings] Healthsystem update error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
      }
      results.healthsystem = data;
    }

    // Update site overrides
    if (sites && Array.isArray(sites)) {
      const updatedSites = [];
      for (const site of sites) {
        const { data, error } = await supabase
          .from('pulsecheck_sites')
          .update({
            frequency_override: site.frequency_override,
            cycle_start_month_override: site.cycle_start_month_override,
          })
          .eq('id', site.id)
          .select()
          .single();

        if (error) {
          console.error('[admin/settings] Site update error:', error);
        } else {
          updatedSites.push(data);
        }
      }
      results.sites = updatedSites;
    }

    return NextResponse.json(results);
  } catch (error) {
    console.error('[admin/settings] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
