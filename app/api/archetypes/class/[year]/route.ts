import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { classifyResident } from '@/lib/archetypes/memorial-classifier';
import { 
  MEMORIAL_ARCHETYPES, 
  TWO_YEAR_ARCHETYPES, 
  ONE_YEAR_ARCHETYPES,
  getArchetypeColor,
  getArchetypeRisk
} from '@/lib/archetypes/memorial-archetypes';

interface ClassArchetypeResponse {
  graduationYear: number;
  className: string;
  totalResidents: number;
  residentsWithData: number;
  residents: {
    id: string;
    name: string;
    pgy1: number | null;
    pgy2: number | null;
    pgy3: number | null;
    delta: number | null;
    archetype: string;
    archetypeId: string;
    color: string;
    confidence: number;
    riskLevel: string;
    isProvisional: boolean;
  }[];
  archetypeDistribution: {
    archetype: string;
    count: number;
    percentage: number;
    color: string;
    riskLevel: string;
  }[];
  riskDistribution: {
    low: number;
    moderate: number;
    high: number;
  };
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ year: string }> }
) {
  try {
    const { year } = await params;
    const graduationYear = parseInt(year, 10);
    
    if (isNaN(graduationYear)) {
      return NextResponse.json({ error: 'Invalid year parameter' }, { status: 400 });
    }

    const supabase = createClient();

    console.log('[Archetypes Class API] Fetching archetypes for class:', graduationYear);

    // 1. Get all residents in this class
    const { data: residents, error: residentsError } = await supabase
      .from('residents')
      .select(`
        id,
        user_profiles:user_id (full_name),
        classes:class_id (name, graduation_year)
      `)
      .eq('classes.graduation_year', graduationYear);

    if (residentsError) {
      console.error('[Archetypes Class API] Error fetching residents:', residentsError);
      return NextResponse.json({ error: 'Failed to fetch residents' }, { status: 500 });
    }

    // Filter to only residents in this graduation year (null classes filtered out)
    const classResidents = (residents || []).filter(r => {
      const classInfo = r.classes as unknown as { graduation_year: number } | null;
      return classInfo?.graduation_year === graduationYear;
    });

    if (classResidents.length === 0) {
      return NextResponse.json({
        graduationYear,
        className: `Class of ${graduationYear}`,
        totalResidents: 0,
        residentsWithData: 0,
        residents: [],
        archetypeDistribution: [],
        riskDistribution: { low: 0, moderate: 0, high: 0 },
      });
    }

    // 2. Get existing classifications or classify each resident
    const residentData: ClassArchetypeResponse['residents'] = [];
    
    for (const resident of classResidents) {
      const profile = resident.user_profiles as { full_name: string } | null;
      const name = profile?.full_name || 'Unknown';

      // Try to get existing classification
      const { data: existing } = await supabase
        .from('resident_classifications')
        .select('*')
        .eq('resident_id', resident.id)
        .single();

      if (existing) {
        // Use cached classification
        residentData.push({
          id: resident.id,
          name,
          pgy1: existing.pgy1_percentile,
          pgy2: existing.pgy2_percentile,
          pgy3: existing.pgy3_percentile,
          delta: existing.delta_12, // Use delta from PGY1 to PGY2
          archetype: existing.current_archetype_name,
          archetypeId: existing.current_archetype_id,
          color: getArchetypeColor(existing.current_archetype_name),
          confidence: existing.current_confidence || 0.5,
          riskLevel: existing.current_risk_level || 'Moderate',
          isProvisional: existing.current_is_provisional || false,
        });
      } else {
        // Run classification
        try {
          const result = await classifyResident(resident.id, supabase);
          
          if (result) {
            residentData.push({
              id: resident.id,
              name,
              pgy1: result.metrics.pgy1,
              pgy2: result.metrics.pgy2,
              pgy3: result.metrics.pgy3,
              delta: result.metrics.delta12,
              archetype: result.archetypeName,
              archetypeId: result.archetypeId,
              color: result.color || getArchetypeColor(result.archetypeName),
              confidence: result.confidence,
              riskLevel: result.riskLevel,
              isProvisional: result.isProvisional,
            });
          } else {
            // No ITE data for this resident
            residentData.push({
              id: resident.id,
              name,
              pgy1: null,
              pgy2: null,
              pgy3: null,
              delta: null,
              archetype: 'Awaiting Data',
              archetypeId: 'awaiting_data',
              color: '#9CA3AF',
              confidence: 0,
              riskLevel: 'Moderate',
              isProvisional: true,
            });
          }
        } catch (err) {
          console.error(`[Archetypes Class API] Error classifying resident ${resident.id}:`, err);
          residentData.push({
            id: resident.id,
            name,
            pgy1: null,
            pgy2: null,
            pgy3: null,
            delta: null,
            archetype: 'Awaiting Data',
            archetypeId: 'awaiting_data',
            color: '#9CA3AF',
            confidence: 0,
            riskLevel: 'Moderate',
            isProvisional: true,
          });
        }
      }
    }

    // 3. Calculate archetype distribution
    const archetypeCounts = new Map<string, number>();
    residentData.forEach(r => {
      const count = archetypeCounts.get(r.archetype) || 0;
      archetypeCounts.set(r.archetype, count + 1);
    });

    const archetypeDistribution: ClassArchetypeResponse['archetypeDistribution'] = 
      Array.from(archetypeCounts.entries())
        .map(([archetype, count]) => ({
          archetype,
          count,
          percentage: Math.round((count / residentData.length) * 100),
          color: getArchetypeColor(archetype),
          riskLevel: getArchetypeRisk(archetype),
        }))
        .sort((a, b) => b.count - a.count);

    // 4. Calculate risk distribution
    const riskDistribution = {
      low: residentData.filter(r => r.riskLevel === 'Low').length,
      moderate: residentData.filter(r => r.riskLevel === 'Moderate').length,
      high: residentData.filter(r => r.riskLevel === 'High').length,
    };

    // 5. Get class name
    const classInfo = classResidents[0]?.classes as { name: string } | null;
    const className = classInfo?.name || `Class of ${graduationYear}`;

    // 6. Count residents with actual ITE data
    const residentsWithData = residentData.filter(r => r.pgy1 !== null).length;

    console.log(`[Archetypes Class API] Returning ${residentData.length} residents, ${residentsWithData} with data`);

    return NextResponse.json({
      graduationYear,
      className,
      totalResidents: residentData.length,
      residentsWithData,
      residents: residentData,
      archetypeDistribution,
      riskDistribution,
    });

  } catch (error) {
    console.error('[Archetypes Class API] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
