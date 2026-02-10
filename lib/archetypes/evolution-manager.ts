// ============================================================
// ITE Archetype Evolution & Versioning System
// Memorial Healthcare System
// ============================================================

import { createClient } from '@/lib/supabase';
import { 
  MemorialArchetypeClassifier,
  type ClassificationResult 
} from './memorial-classifier';
import type { 
  MethodologyVersion, 
  ArchetypeDefinitionV,
  EvolutionTrigger,
  PatternCluster
} from '@/lib/types/archetypes';

// ============================================================
// TYPES & RELATION HELPERS (Supabase joins can be object or array)
// ============================================================

interface ResidentWithProfile {
  user_profiles?: { full_name?: string } | null;
}
interface ResidentWithClass {
  classes?: { graduation_year?: number } | null;
}
interface ClassificationWithArchetype {
  current_archetype_id?: string | null;
}

function getResidentFullName(residents: unknown): string {
  const r = residents as ResidentWithProfile | ResidentWithProfile[] | null | undefined;
  if (!r) return 'Unknown';
  const single = Array.isArray(r) ? r[0] : r;
  const name = single?.user_profiles?.full_name;
  return typeof name === 'string' ? name : 'Unknown';
}

function getGraduationYear(residents: unknown): number | undefined {
  const r = residents as ResidentWithClass | ResidentWithClass[] | null | undefined;
  if (!r) return undefined;
  const single = Array.isArray(r) ? r[0] : r;
  return single?.classes?.graduation_year;
}

function getClassificationArchetypeId(rc: unknown): string | undefined {
  const r = rc as ClassificationWithArchetype | ClassificationWithArchetype[] | null | undefined;
  if (!r) return undefined;
  const single = Array.isArray(r) ? r[0] : r;
  const id = single?.current_archetype_id;
  return typeof id === 'string' ? id : undefined;
}

/** Row shape from resident_classifications select for pattern detection */
interface VariableCaseRow {
  resident_id: string;
  pgy1_percentile: number | null;
  pgy2_percentile: number | null;
  pgy3_percentile: number | null;
  delta_12?: number | null;
  delta_23?: number | null;
}

/** Row shape from archetype_methodology_versions */
interface MethodologyVersionRow {
  id: string;
  version: string;
  name: string;
  effective_date: string;
  retired_date: string | null;
  is_current: boolean;
  changelog: string[] | null;
  based_on_residents: number;
  based_on_classes: number[] | null;
  accuracy_rate?: number | null;
  inter_rater_agreement?: number | null;
  created_at?: string | null;
  archetypes?: ArchetypeDefinitionV[] | null;
}

// ============================================================
// TYPES (exported)
// ============================================================

export interface VersionComparisonResult {
  residentId: string;
  comparisons: Array<{
    version: string;
    archetypeId: string;
    archetypeName: string;
    confidence: number;
  }>;
}

export interface DriftAnalysis {
  totalResidents: number;
  withDrift: number;
  driftPercentage: number;
  driftDetails: Array<{
    residentId: string;
    residentName: string;
    originalArchetype: string;
    currentArchetype: string;
    driftReason: string;
  }>;
}

export interface ThresholdAdjustment {
  archetypeId: string;
  archetypeName: string;
  metric: string;
  currentValue: number;
  suggestedValue: number;
  reason: string;
}

// ============================================================
// EVOLUTION MANAGER CLASS
// ============================================================

export class ArchetypeEvolutionManager {
  private supabase: ReturnType<typeof createClient>;
  private classifier: MemorialArchetypeClassifier;
  
  constructor(supabaseClient?: ReturnType<typeof createClient>) {
    this.supabase = supabaseClient || createClient();
    this.classifier = new MemorialArchetypeClassifier();
  }

  // ============================================================
  // VERSION MANAGEMENT
  // ============================================================

  async getCurrentVersion(): Promise<MethodologyVersion | null> {
    const { data, error } = await this.supabase
      .from('archetype_methodology_versions')
      .select('*')
      .eq('is_current', true)
      .single();

    if (error || !data) {
      console.error('[EvolutionManager] Error fetching current version:', error);
      return null;
    }

    return this.mapVersionFromDb(data);
  }

  async getVersion(versionString: string): Promise<MethodologyVersion | null> {
    const { data, error } = await this.supabase
      .from('archetype_methodology_versions')
      .select('*')
      .eq('version', versionString)
      .single();

    if (error || !data) {
      return null;
    }

    return this.mapVersionFromDb(data);
  }

  async getAllVersions(): Promise<MethodologyVersion[]> {
    const { data, error } = await this.supabase
      .from('archetype_methodology_versions')
      .select('*')
      .order('effective_date', { ascending: false });

    if (error || !data) {
      console.error('[EvolutionManager] Error fetching versions:', error);
      return [];
    }

    return data.map(v => this.mapVersionFromDb(v));
  }

  // ============================================================
  // RETROSPECTIVE ANALYSIS
  // ============================================================

  /**
   * Re-classify a resident under a different methodology version
   * Used for "what-if" analysis and drift detection
   */
  async reclassifyUnderVersion(
    scores: { pgy1: number | null; pgy2: number | null; pgy3: number | null },
    targetVersion: string
  ): Promise<ClassificationResult | null> {
    const version = await this.getVersion(targetVersion);
    if (!version) return null;

    // Use the classifier with the current definitions
    // In a full implementation, we'd use the version's specific definitions
    return this.classifier.classify(scores);
  }

  /**
   * Compare how a resident would be classified across all versions
   */
  async compareAcrossVersions(
    scores: { pgy1: number | null; pgy2: number | null; pgy3: number | null }
  ): Promise<VersionComparisonResult['comparisons']> {
    const versions = await this.getAllVersions();
    
    return versions.map(v => {
      const result = this.classifier.classify(scores);
      return {
        version: v.version,
        archetypeId: result.archetypeId,
        archetypeName: result.archetypeName,
        confidence: result.confidence,
      };
    });
  }

  /**
   * Detect residents whose classification has drifted across versions
   */
  async detectVersionDrift(): Promise<DriftAnalysis> {
    const { data, error } = await this.supabase
      .from('resident_classifications')
      .select(`
        resident_id,
        original_archetype_name,
        current_archetype_name,
        has_version_drift,
        drift_reason,
        residents(
          user_profiles(full_name)
        )
      `)
      .eq('has_version_drift', true);

    if (error) {
      console.error('[EvolutionManager] Error detecting drift:', error);
      return {
        totalResidents: 0,
        withDrift: 0,
        driftPercentage: 0,
        driftDetails: []
      };
    }

    // Get total count
    const { count } = await this.supabase
      .from('resident_classifications')
      .select('*', { count: 'exact', head: true });

    const total = count || 0;
    const drifted = data?.length || 0;

    return {
      totalResidents: total,
      withDrift: drifted,
      driftPercentage: total > 0 ? (drifted / total) * 100 : 0,
      driftDetails: (data || []).map(d => ({
        residentId: d.resident_id,
        residentName: getResidentFullName(d.residents),
        originalArchetype: d.original_archetype_name,
        currentArchetype: d.current_archetype_name,
        driftReason: d.drift_reason || 'unknown'
      }))
    };
  }

  // ============================================================
  // EVOLUTION TRIGGERS
  // ============================================================

  /**
   * Check for conditions that suggest methodology review
   */
  async checkEvolutionTriggers(currentYear: number): Promise<EvolutionTrigger[]> {
    const triggers: EvolutionTrigger[] = [];

    // Get all classifications
    const { data: classifications } = await this.supabase
      .from('resident_classifications')
      .select(`
        *,
        residents(
          classes(graduation_year)
        )
      `);

    if (!classifications || classifications.length === 0) {
      return triggers;
    }

    // Trigger 1: Annual review after each class graduates
    const graduationYears = classifications
      .map(c => getGraduationYear(c.residents))
      .filter((y): y is number => y != null);
    
    const latestGradClass = Math.max(...graduationYears);
    if (latestGradClass >= currentYear) {
      triggers.push({
        id: crypto.randomUUID(),
        type: 'annual_review',
        triggeredAt: new Date().toISOString(),
        details: `Class of ${latestGradClass} has completed PGY3`,
        recommendation: 'Review archetype accuracy against board outcomes',
        status: 'pending',
      });
    }

    // Trigger 2: High Variable rate (>15% of classifications)
    const variableCount = classifications.filter(c => 
      c.current_archetype_id === 'variable'
    ).length;
    const variableRate = variableCount / classifications.length;
    
    if (variableRate > 0.15) {
      triggers.push({
        id: crypto.randomUUID(),
        type: 'threshold_breach',
        triggeredAt: new Date().toISOString(),
        details: `Variable classification rate is ${(variableRate * 100).toFixed(1)}% (threshold: 15%)`,
        recommendation: 'Analyze Variable cases for potential new archetype patterns',
        status: 'pending',
      });
    }

    // Trigger 3: Pattern clustering in unclassified cases
    const variableCases = classifications.filter(c => 
      c.current_archetype_id === 'variable' &&
      c.pgy3_percentile !== null
    );
    
    if (variableCases.length >= 3) {
      const patterns = this.detectPatternClusters(variableCases);
      if (patterns.length > 0) {
        triggers.push({
          id: crypto.randomUUID(),
          type: 'pattern_discovery',
          triggeredAt: new Date().toISOString(),
          details: `${patterns.length} potential new pattern(s) detected in Variable cases`,
          recommendation: `Consider adding archetype(s): ${patterns.map(p => p.suggestedName).join(', ')}`,
          status: 'pending',
        });
      }
    }

    return triggers;
  }

  /**
   * Get pending evolution triggers from the database
   */
  async getPendingTriggers(): Promise<EvolutionTrigger[]> {
    const { data, error } = await this.supabase
      .from('evolution_triggers')
      .select('*')
      .in('status', ['pending', 'under_review'])
      .order('triggered_at', { ascending: true });

    if (error) {
      console.error('[EvolutionManager] Error fetching triggers:', error);
      return [];
    }

    return (data || []).map(t => ({
      id: t.id,
      type: t.trigger_type,
      triggeredAt: t.triggered_at,
      details: t.details,
      recommendation: t.recommendation,
      affectedResidents: t.affected_residents,
      supportingMetrics: t.supporting_metrics,
      status: t.status,
      resolutionNotes: t.resolution_notes,
      resolvedBy: t.resolved_by,
      resolvedAt: t.resolved_at,
      resultingVersion: t.resulting_version
    }));
  }

  /**
   * Save an evolution trigger to the database
   */
  async saveTrigger(trigger: Omit<EvolutionTrigger, 'id'>): Promise<string | null> {
    const { data, error } = await this.supabase
      .from('evolution_triggers')
      .insert({
        trigger_type: trigger.type,
        triggered_at: trigger.triggeredAt,
        details: trigger.details,
        recommendation: trigger.recommendation,
        affected_residents: trigger.affectedResidents,
        supporting_metrics: trigger.supportingMetrics,
        status: trigger.status
      })
      .select('id')
      .single();

    if (error) {
      console.error('[EvolutionManager] Error saving trigger:', error);
      return null;
    }

    return data.id;
  }

  // ============================================================
  // PATTERN DETECTION
  // ============================================================

  /**
   * Detect clusters in Variable cases that might warrant new archetypes
   */
  private detectPatternClusters(variableCases: VariableCaseRow[]): PatternCluster[] {
    const clusters: PatternCluster[] = [];

    // Group by delta12 and delta23 buckets (±10 points)
    const buckets: Record<string, VariableCaseRow[]> = {};
    
    for (const c of variableCases) {
      if (c.pgy1_percentile === null || c.pgy2_percentile === null || c.pgy3_percentile === null) continue;
      
      const d12 = c.delta_12 ?? (c.pgy2_percentile - c.pgy1_percentile);
      const d23 = c.delta_23 ?? (c.pgy3_percentile - c.pgy2_percentile);
      const bucketKey = `${Math.round(d12 / 10) * 10}_${Math.round(d23 / 10) * 10}`;
      
      if (!buckets[bucketKey]) buckets[bucketKey] = [];
      buckets[bucketKey].push(c);
    }

    // Find buckets with 3+ residents
    for (const [key, cases] of Object.entries(buckets)) {
      if (cases.length >= 3) {
        const [d12Bucket, d23Bucket] = key.split('_').map(Number);
        
        // Generate suggested name based on pattern
        let suggestedName = 'New Pattern';
        if (d12Bucket > 0 && d23Bucket < 0) suggestedName = 'Moderate Peak & Decline';
        else if (d12Bucket < 0 && d23Bucket > 0) suggestedName = 'Partial Recovery';
        else if (d12Bucket > 0 && d23Bucket > 0) suggestedName = 'Accelerating';
        else if (d12Bucket < 0 && d23Bucket < 0) suggestedName = 'Gradual Decline';
        else if (Math.abs(d12Bucket) <= 10 && d23Bucket < -10) suggestedName = 'Late Fade';

        // Calculate centroid (cases in this bucket have non-null percentiles by construction)
        const avgPgy1 = cases.reduce((sum, c) => sum + (c.pgy1_percentile ?? 0), 0) / cases.length;
        const avgPgy2 = cases.reduce((sum, c) => sum + (c.pgy2_percentile ?? 0), 0) / cases.length;
        const avgPgy3 = cases.reduce((sum, c) => sum + (c.pgy3_percentile ?? 0), 0) / cases.length;

        clusters.push({
          id: crypto.randomUUID(),
          delta12Bucket: d12Bucket,
          delta23Bucket: d23Bucket,
          suggestedName,
          residents: cases.map(c => c.resident_id),
          memberCount: cases.length,
          centroid: {
            avgPgy1,
            avgPgy2,
            avgPgy3,
            avgDelta12: d12Bucket,
            avgDelta23: d23Bucket,
          },
          status: 'detected',
        });
      }
    }

    return clusters;
  }

  // ============================================================
  // THRESHOLD OPTIMIZATION
  // ============================================================

  /**
   * Suggest threshold adjustments based on outcome data
   */
  async suggestThresholdAdjustments(): Promise<ThresholdAdjustment[]> {
    const suggestions: ThresholdAdjustment[] = [];

    // Get classifications with outcomes
    const { data } = await this.supabase
      .from('classification_outcomes')
      .select(`
        *,
        resident_classifications(current_archetype_id, current_archetype_name)
      `);

    if (!data || data.length < 5) {
      return suggestions; // Need minimum sample
    }

    // Group by archetype
    const byArchetype: Record<string, { passed: number; failed: number }> = {};
    
    for (const outcome of data) {
      const archId = getClassificationArchetypeId(outcome.resident_classifications);
      if (!archId) continue;
      
      if (!byArchetype[archId]) {
        byArchetype[archId] = { passed: 0, failed: 0 };
      }
      
      if (outcome.passed_boards) {
        byArchetype[archId].passed++;
      } else {
        byArchetype[archId].failed++;
      }
    }

    // Check for risk level mismatches
    for (const [archId, outcomes] of Object.entries(byArchetype)) {
      const total = outcomes.passed + outcomes.failed;
      if (total < 3) continue;
      
      const passRate = outcomes.passed / total;
      
      // Check against expected rates based on risk level
      // Low risk should have >80% pass, High risk might have <50%
      if (archId.includes('elite') && passRate < 0.8) {
        suggestions.push({
          archetypeId: archId,
          archetypeName: 'Elite Performer',
          metric: 'riskLevel',
          currentValue: 0, // Low
          suggestedValue: 1, // Moderate
          reason: `Pass rate is ${(passRate * 100).toFixed(0)}%, below expected for Low risk`,
        });
      }
    }

    return suggestions;
  }

  // ============================================================
  // NEW VERSION CREATION
  // ============================================================

  /**
   * Create a new methodology version with specified changes
   */
  async proposeNewVersion(
    changes: {
      newArchetypes?: ArchetypeDefinitionV[];
      removedArchetypes?: string[];
      modifiedArchetypes?: Array<{ id: string; changes: Partial<ArchetypeDefinitionV> }>;
      thresholdChanges?: Array<{ archetypeId: string; criteria: Record<string, { min?: number; max?: number }> }>;
    },
    changelog: string[],
    basedOnClasses: number[]
  ): Promise<MethodologyVersion | null> {
    const current = await this.getCurrentVersion();
    if (!current) return null;

    let currentArchetypes = [...current.archetypes];
    
    // Apply removals
    if (changes.removedArchetypes) {
      currentArchetypes = currentArchetypes.filter(a => 
        !changes.removedArchetypes!.includes(a.id)
      );
    }

    // Apply modifications
    if (changes.modifiedArchetypes) {
      currentArchetypes = currentArchetypes.map(a => {
        const mod = changes.modifiedArchetypes!.find(m => m.id === a.id);
        if (mod) {
          return { ...a, ...mod.changes };
        }
        return a;
      });
    }

    // Apply threshold changes
    if (changes.thresholdChanges) {
      currentArchetypes = currentArchetypes.map(a => {
        const thresholdChange = changes.thresholdChanges!.find(t => t.archetypeId === a.id);
        if (thresholdChange) {
          return { ...a, criteria: { ...a.criteria, ...thresholdChange.criteria } };
        }
        return a;
      });
    }

    // Add new archetypes
    if (changes.newArchetypes) {
      currentArchetypes = [...currentArchetypes, ...changes.newArchetypes];
    }

    // Determine version number
    const [major, minor, patch] = current.version.split('.').map(Number);
    let newVersion: string;
    
    if (changes.newArchetypes?.length || changes.removedArchetypes?.length) {
      newVersion = `${major + 1}.0.0`; // Major: archetypes added/removed
    } else if (changes.modifiedArchetypes?.length || changes.thresholdChanges?.length) {
      newVersion = `${major}.${minor + 1}.0`; // Minor: thresholds changed
    } else {
      newVersion = `${major}.${minor}.${patch + 1}`; // Patch: other
    }

    return {
      id: crypto.randomUUID(),
      version: newVersion,
      name: `Memorial v${newVersion}`,
      effectiveDate: new Date().toISOString().split('T')[0],
      retiredDate: null,
      isCurrent: false, // Not current until approved
      changelog,
      archetypes: currentArchetypes,
      basedOnResidents: current.basedOnResidents + 10, // Estimate
      basedOnClasses,
      createdAt: new Date().toISOString()
    };
  }

  /**
   * Apply a new methodology version (requires approval)
   */
  async applyVersion(version: MethodologyVersion, approvedBy: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('archetype_methodology_versions')
      .insert({
        version: version.version,
        name: version.name,
        effective_date: version.effectiveDate,
        is_current: true,
        changelog: version.changelog,
        based_on_residents: version.basedOnResidents,
        based_on_classes: version.basedOnClasses,
        archetypes: version.archetypes,
        approved_by: approvedBy,
        approved_at: new Date().toISOString()
      });

    if (error) {
      console.error('[EvolutionManager] Error applying version:', error);
      return false;
    }

    // Reclassify all residents under new version
    await this.reclassifyAllResidents(version.version);

    return true;
  }

  /**
   * Reclassify all residents under a specific version
   */
  private async reclassifyAllResidents(versionString: string): Promise<void> {
    // Get all classifications with their scores
    const { data: classifications } = await this.supabase
      .from('resident_classifications')
      .select('*');

    if (!classifications) return;

    for (const c of classifications) {
      const result = this.classifier.classify({
        pgy1: c.pgy1_percentile,
        pgy2: c.pgy2_percentile,
        pgy3: c.pgy3_percentile
      });

      // Update current classification
      await this.supabase
        .from('resident_classifications')
        .update({
          current_archetype_id: result.archetypeId,
          current_archetype_name: result.archetypeName,
          current_confidence: result.confidence,
          current_risk_level: result.riskLevel,
          current_is_provisional: result.isProvisional,
          current_methodology_version: versionString,
          current_last_updated: new Date().toISOString(),
          current_note: result.note,
          recommendations: result.recommendations,
          alternatives: result.alternatives
        })
        .eq('id', c.id);
    }
  }

  // ============================================================
  // HELPER METHODS
  // ============================================================

  private mapVersionFromDb(data: MethodologyVersionRow): MethodologyVersion {
    return {
      id: data.id,
      version: data.version,
      name: data.name,
      effectiveDate: data.effective_date,
      retiredDate: data.retired_date,
      isCurrent: data.is_current,
      changelog: data.changelog ?? [],
      archetypes: data.archetypes ?? [],
      basedOnResidents: data.based_on_residents,
      basedOnClasses: data.based_on_classes ?? [],
      accuracyRate: data.accuracy_rate ?? undefined,
      interRaterAgreement: data.inter_rater_agreement ?? undefined,
      createdAt: data.created_at ?? new Date().toISOString()
    };
  }
}

// ============================================================
// SINGLETON EXPORT
// ============================================================

export const evolutionManager = new ArchetypeEvolutionManager();

// Factory function
export function createEvolutionManager(supabaseClient?: ReturnType<typeof createClient>): ArchetypeEvolutionManager {
  return new ArchetypeEvolutionManager(supabaseClient);
}




