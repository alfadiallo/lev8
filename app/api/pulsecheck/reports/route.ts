import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

/**
 * GET /api/pulsecheck/reports
 * Get aggregated reports for Regional Directors
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const siteId = searchParams.get('site_id');
    const departmentId = searchParams.get('department_id');
    const cycleId = searchParams.get('cycle_id');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get all sites with their department counts
    const { data: sites } = await supabase
      .from('pulsecheck_sites')
      .select(`
        id,
        name,
        region,
        is_active
      `)
      .eq('is_active', true)
      .order('name');

    // Get all departments
    let deptQuery = supabase
      .from('pulsecheck_departments')
      .select('id, name, site_id, is_active')
      .eq('is_active', true);
    
    if (siteId) {
      deptQuery = deptQuery.eq('site_id', siteId);
    }
    
    const { data: departments } = await deptQuery;

    // Get all directors
    let dirQuery = supabase
      .from('pulsecheck_directors')
      .select('id, name, email, role, department_id, is_active')
      .eq('is_active', true);
    
    if (departmentId) {
      dirQuery = dirQuery.eq('department_id', departmentId);
    }
    
    const { data: directors } = await dirQuery;

    // Get full provider details including name, email, credential
    const { data: providers } = await supabase
      .from('pulsecheck_providers')
      .select('id, name, email, credential, provider_type, primary_department_id, primary_director_id')
      .eq('is_active', true)
      .order('name');

    // Get all ratings with totals (both completed and pending for status tracking)
    let ratingsQuery = supabase
      .from('pulsecheck_ratings_with_totals')
      .select('*');
    
    if (cycleId) {
      ratingsQuery = ratingsQuery.eq('cycle_id', cycleId);
    }
    
    const { data: allRatings } = await ratingsQuery;
    
    // Filter for completed ratings for score calculations
    const ratings = (allRatings || []).filter(r => r.status === 'completed');

    // Build provider stats with their latest ratings
    const providerStats = (providers || []).map(provider => {
      // Get all ratings for this provider
      const providerRatings = (allRatings || []).filter(r => r.provider_id === provider.id);
      const completedRatings = providerRatings.filter(r => r.status === 'completed');
      const pendingRatings = providerRatings.filter(r => r.status !== 'completed');
      
      // Get the latest completed rating
      const latestRating = completedRatings.length > 0
        ? completedRatings.sort((a, b) => 
            new Date(b.completed_at || 0).getTime() - new Date(a.completed_at || 0).getTime()
          )[0]
        : null;

      return {
        id: provider.id,
        name: provider.name,
        email: provider.email,
        credential: provider.credential,
        provider_type: provider.provider_type,
        primary_department_id: provider.primary_department_id,
        primary_director_id: provider.primary_director_id,
        status: pendingRatings.length > 0 ? 'pending' : (completedRatings.length > 0 ? 'completed' : 'not_rated'),
        completedRatings: completedRatings.length,
        latestRating: latestRating ? {
          eq: latestRating.eq_total,
          pq: latestRating.pq_total,
          iq: latestRating.iq_total,
          overall: latestRating.overall_total,
          completed_at: latestRating.completed_at,
        } : null,
      };
    });

    // Calculate aggregates
    const departmentStats = (departments || []).map(dept => {
      const deptProviders = providerStats.filter(p => p.primary_department_id === dept.id);
      const deptDirectors = (directors || []).filter(d => d.department_id === dept.id);
      const deptRatings = (ratings || []).filter(r => {
        const provider = deptProviders.find(p => p.id === r.provider_id);
        return !!provider;
      });

      const avgScores = deptRatings.length > 0 ? {
        eq: deptRatings.reduce((sum, r) => sum + (r.eq_total || 0), 0) / deptRatings.length,
        pq: deptRatings.reduce((sum, r) => sum + (r.pq_total || 0), 0) / deptRatings.length,
        iq: deptRatings.reduce((sum, r) => sum + (r.iq_total || 0), 0) / deptRatings.length,
        overall: deptRatings.reduce((sum, r) => sum + (r.overall_total || 0), 0) / deptRatings.length,
      } : null;

      return {
        ...dept,
        providerCount: deptProviders.length,
        directorCount: deptDirectors.length,
        completedRatings: deptRatings.length,
        completionRate: deptProviders.length > 0 
          ? Math.round((deptRatings.length / deptProviders.length) * 100)
          : 0,
        averageScores: avgScores,
        providers: deptProviders,
      };
    });

    const siteStats = (sites || []).map(site => {
      const siteDepts = departmentStats.filter(d => d.site_id === site.id);
      const totalProviders = siteDepts.reduce((sum, d) => sum + d.providerCount, 0);
      const totalDirectors = siteDepts.reduce((sum, d) => sum + d.directorCount, 0);
      const totalCompleted = siteDepts.reduce((sum, d) => sum + d.completedRatings, 0);

      const deptAvgs = siteDepts.filter(d => d.averageScores).map(d => d.averageScores!);
      const avgScores = deptAvgs.length > 0 ? {
        eq: deptAvgs.reduce((sum, a) => sum + a.eq, 0) / deptAvgs.length,
        pq: deptAvgs.reduce((sum, a) => sum + a.pq, 0) / deptAvgs.length,
        iq: deptAvgs.reduce((sum, a) => sum + a.iq, 0) / deptAvgs.length,
        overall: deptAvgs.reduce((sum, a) => sum + a.overall, 0) / deptAvgs.length,
      } : null;

      return {
        ...site,
        departmentCount: siteDepts.length,
        providerCount: totalProviders,
        directorCount: totalDirectors,
        completedRatings: totalCompleted,
        completionRate: totalProviders > 0 
          ? Math.round((totalCompleted / totalProviders) * 100)
          : 0,
        averageScores: avgScores,
        departments: siteDepts,
      };
    });

    // Overall statistics
    const overallStats = {
      totalSites: sites?.length || 0,
      totalDepartments: departments?.length || 0,
      totalDirectors: directors?.length || 0,
      totalProviders: providers?.length || 0,
      totalCompletedRatings: ratings.length,
      overallCompletionRate: (providers?.length || 0) > 0
        ? Math.round((ratings.length / (providers?.length || 1)) * 100)
        : 0,
      averageScores: ratings.length > 0 ? {
        eq: ratings.reduce((sum, r) => sum + (r.eq_total || 0), 0) / ratings.length,
        pq: ratings.reduce((sum, r) => sum + (r.pq_total || 0), 0) / ratings.length,
        iq: ratings.reduce((sum, r) => sum + (r.iq_total || 0), 0) / ratings.length,
        overall: ratings.reduce((sum, r) => sum + (r.overall_total || 0), 0) / ratings.length,
      } : null,
    };

    // Get list of directors with their emails for email functionality
    const directorsForEmail = (directors || []).map(d => ({
      id: d.id,
      name: d.name,
      email: d.email,
      role: d.role,
    }));

    return NextResponse.json({
      sites: siteStats,
      departments: departmentStats,
      overall: overallStats,
      directors: directorsForEmail,
    });
  } catch (error) {
    console.error('[pulsecheck/reports] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
