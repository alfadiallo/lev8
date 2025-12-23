import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';
import { classifyResident } from '@/lib/archetypes/memorial-classifier';
import { MEMORIAL_ARCHETYPES, TWO_YEAR_ARCHETYPES, ONE_YEAR_ARCHETYPES } from '@/lib/archetypes/memorial-archetypes';

const CURRENT_VERSION = '1.0.0';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: residentId } = await params;
    const supabase = createClient();

    console.log('[Archetypes API v3] Fetching archetype for resident:', residentId);

    // 1. Try to get existing classification from v3 table
    const { data: existing, error } = await supabase
      .from('resident_classifications')
      .select('*')
      .eq('resident_id', residentId)
      .single();

    // If found, return the full classification
    if (existing && !error) {
      console.log('[Archetypes API v3] Returning cached result:', existing.current_archetype_name);
      
      // Get archetype details
      const archetypeDef = getArchetypeDetails(existing.current_archetype_id);
      
      return NextResponse.json({
        residentId: existing.resident_id,
        
        // Scores
        scores: {
          pgy1: existing.pgy1_percentile,
          pgy2: existing.pgy2_percentile,
          pgy3: existing.pgy3_percentile,
        },
        delta12: existing.delta_12,
        delta23: existing.delta_23,
        deltaTotal: existing.delta_total,
        dataYears: existing.data_years,
        
        // Original classification
        originalClassification: {
          archetypeId: existing.original_archetype_id,
          archetypeName: existing.original_archetype_name,
          confidence: existing.original_confidence,
          riskLevel: existing.original_risk_level,
          isProvisional: existing.original_is_provisional,
          methodologyVersion: existing.original_methodology_version,
          classifiedAt: existing.original_classified_at,
          note: existing.original_note,
        },
        
        // Current classification
        currentClassification: {
          archetypeId: existing.current_archetype_id,
          archetypeName: existing.current_archetype_name,
          confidence: existing.current_confidence,
          riskLevel: existing.current_risk_level,
          isProvisional: existing.current_is_provisional,
          methodologyVersion: existing.current_methodology_version,
          lastUpdated: existing.current_last_updated,
          note: existing.current_note,
        },
        
        // UI helpers (from current)
        archetype: existing.current_archetype_name,
        confidence: existing.current_confidence,
        riskLevel: existing.current_risk_level,
        isProvisional: existing.current_is_provisional,
        color: archetypeDef?.color || '#7F8C8D',
        description: archetypeDef?.description || existing.current_note || '',
        
        // Additional data
        recommendations: existing.recommendations || [],
        alternatives: existing.alternatives || [],
        similarResidents: existing.similar_residents || [],
        
        // Drift
        hasVersionDrift: existing.has_version_drift,
        driftReason: existing.drift_reason,
      });
    }

    // 2. If not found in v3 table, run classification
    console.log('[Archetypes API v3] No cached result, running classification...');
    const result = await classifyResident(residentId, supabase);
    
    if (!result) {
      return NextResponse.json({ error: 'Classification failed - no data' }, { status: 404 });
    }

    // 3. Save result to the new v3 table
    const now = new Date().toISOString();
    
    const classificationRecord = {
      resident_id: residentId,
      
      // Scores
      pgy1_percentile: result.metrics.pgy1,
      pgy2_percentile: result.metrics.pgy2,
      pgy3_percentile: result.metrics.pgy3,
      delta_12: result.metrics.delta12,
      delta_23: result.metrics.delta23,
      delta_total: result.metrics.deltaTotal,
      data_years: result.dataYears,
      
      // Original (same as current for first classification)
      original_archetype_id: result.archetypeId,
      original_archetype_name: result.archetypeName,
      original_confidence: result.confidence,
      original_risk_level: result.riskLevel,
      original_is_provisional: result.isProvisional,
      original_methodology_version: CURRENT_VERSION,
      original_classified_at: now,
      original_classified_by: 'system',
      original_note: result.note,
      
      // Current (same for new classification)
      current_archetype_id: result.archetypeId,
      current_archetype_name: result.archetypeName,
      current_confidence: result.confidence,
      current_risk_level: result.riskLevel,
      current_is_provisional: result.isProvisional,
      current_methodology_version: CURRENT_VERSION,
      current_last_updated: now,
      current_note: result.note,
      
      // Additional
      recommendations: result.recommendations,
      alternatives: result.alternatives,
      similar_residents: result.similarResidents,
      
      // No drift for new classification
      has_version_drift: false,
    };

    const { error: insertError } = await supabase
      .from('resident_classifications')
      .upsert(classificationRecord, { onConflict: 'resident_id' });

    if (insertError) {
      console.error('[Archetypes API v3] Error saving classification:', insertError);
      // Still return the result even if save fails
    }

    // Also log to history
    await supabase.from('classification_history').insert({
      classification_id: null, // Will be populated by trigger if needed
      resident_id: residentId,
      archetype_id: result.archetypeId,
      archetype_name: result.archetypeName,
      confidence: result.confidence,
      risk_level: result.riskLevel,
      is_provisional: result.isProvisional,
      methodology_version: CURRENT_VERSION,
      pgy1_percentile: result.metrics.pgy1,
      pgy2_percentile: result.metrics.pgy2,
      pgy3_percentile: result.metrics.pgy3,
      data_years: result.dataYears,
      trigger: 'initial',
      triggered_by: 'system',
    });

    console.log('[Archetypes API v3] Classification complete:', result.archetypeName);

    return NextResponse.json({
      residentId,
      
      // Scores
      scores: {
        pgy1: result.metrics.pgy1,
        pgy2: result.metrics.pgy2,
        pgy3: result.metrics.pgy3,
      },
      delta12: result.metrics.delta12,
      delta23: result.metrics.delta23,
      deltaTotal: result.metrics.deltaTotal,
      dataYears: result.dataYears,
      
      // Original classification
      originalClassification: {
        archetypeId: result.archetypeId,
        archetypeName: result.archetypeName,
        confidence: result.confidence,
        riskLevel: result.riskLevel,
        isProvisional: result.isProvisional,
        methodologyVersion: CURRENT_VERSION,
        classifiedAt: now,
        note: result.note,
      },
      
      // Current classification (same for new)
      currentClassification: {
        archetypeId: result.archetypeId,
        archetypeName: result.archetypeName,
        confidence: result.confidence,
        riskLevel: result.riskLevel,
        isProvisional: result.isProvisional,
        methodologyVersion: CURRENT_VERSION,
        lastUpdated: now,
        note: result.note,
      },
      
      // UI helpers
      archetype: result.archetypeName,
      confidence: result.confidence,
      riskLevel: result.riskLevel,
      isProvisional: result.isProvisional,
      color: result.color,
      description: result.description,
      
      // Additional
      recommendations: result.recommendations,
      alternatives: result.alternatives,
      similarResidents: result.similarResidents,
      
      // No drift
      hasVersionDrift: false,
    });

  } catch (error) {
    console.error('[Archetypes API v3] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Helper to get archetype details from definitions
function getArchetypeDetails(archetypeId: string) {
  // Check main archetypes
  if (MEMORIAL_ARCHETYPES[archetypeId]) {
    return MEMORIAL_ARCHETYPES[archetypeId];
  }
  
  // Check 2-year provisionals
  if (TWO_YEAR_ARCHETYPES[archetypeId]) {
    const p = TWO_YEAR_ARCHETYPES[archetypeId];
    return { color: p.color, description: p.description };
  }
  
  // Check 1-year provisionals
  if (ONE_YEAR_ARCHETYPES[archetypeId]) {
    const p = ONE_YEAR_ARCHETYPES[archetypeId];
    return { color: p.color, description: p.description };
  }
  
  return null;
}
