'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import dynamic from 'next/dynamic';
import { 
  AlertCircle, 
  TrendingUp, 
  Users, 
  Activity,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Info,
  GitCompare
} from 'lucide-react';

// Dynamically import TrajectoryChart to avoid SSR issues
const TrajectoryChart = dynamic(() => import('./TrajectoryChart'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-[280px] flex items-center justify-center text-neutral-400 bg-neutral-50 rounded-lg animate-pulse">
      Loading chart...
    </div>
  )
});

interface ITEAnalyticsPaneProps {
  residentId: string;
}

interface ScoresData {
  ite_scores: {
    pgy_level: string | number;
    percentile: number | null;
    raw_score: number | null;
    test_date: string;
  }[];
}

// v3 API Response Types
interface SimilarResidentV3 {
  id: string;
  name: string;
  classYear: number;
  similarityScore: number;
  iteScores: {
    pgy1: number | null;
    pgy2: number | null;
    pgy3: number | null;
  };
  archetype?: string;
}

interface ClassificationV3 {
  archetypeId: string;
  archetypeName: string;
  confidence: number;
  riskLevel: string;
  isProvisional: boolean;
  methodologyVersion: string;
  note?: string;
}

interface ArchetypeDataV3 {
  residentId: string;
  scores: {
    pgy1: number | null;
    pgy2: number | null;
    pgy3: number | null;
  };
  delta12: number | null;
  delta23: number | null;
  deltaTotal: number | null;
  dataYears: number;
  
  originalClassification: ClassificationV3;
  currentClassification: ClassificationV3;
  
  // UI helpers
  archetype: string;
  confidence: number;
  riskLevel: string;
  isProvisional: boolean;
  color: string;
  description: string;
  
  recommendations: string[];
  alternatives: { archetypeId: string; archetypeName: string; confidence: number }[];
  similarResidents: SimilarResidentV3[];
  
  hasVersionDrift: boolean;
  driftReason?: string;
}

export default function ITEAnalyticsPane({ residentId }: ITEAnalyticsPaneProps) {
  const [loading, setLoading] = useState(true);
  const [scores, setScores] = useState<ScoresData['ite_scores']>([]);
  const [archetype, setArchetype] = useState<ArchetypeDataV3 | null>(null);

  useEffect(() => {
    const abortController = new AbortController();
    
    async function fetchData() {
      setLoading(true);
      try {
        // Fetch both in parallel for better performance
        const [scoresRes, archRes] = await Promise.all([
          fetch(`/api/analytics/scores/resident/${residentId}`, { signal: abortController.signal }),
          fetch(`/api/archetypes/resident/${residentId}`, { signal: abortController.signal })
        ]);

        if (abortController.signal.aborted) return;

        const scoresData = await scoresRes.json();
        if (scoresData.ite_scores) {
          setScores(scoresData.ite_scores);
        }

        if (archRes.ok) {
          const archData = await archRes.json();
          setArchetype(archData);
        }
      } catch (err) {
        if ((err as Error).name !== 'AbortError') {
          console.error('[ITEAnalyticsPane] Error fetching ITE analytics:', err);
        }
      } finally {
        if (!abortController.signal.aborted) {
          setLoading(false);
        }
      }
    }

    if (residentId) {
      fetchData();
    }

    return () => {
      abortController.abort();
    };
  }, [residentId]);

  // Memoize Chart Data preparation - MUST be before any early returns
  const currentScores = useMemo(() => {
    return scores
      .filter(s => s.percentile !== null)
      .map(s => {
        const rawPgy = String(s.pgy_level);
        const pgyNum = rawPgy.replace(/\D/g, '');
        return {
          pgy: `PGY-${pgyNum}`, 
          percentile: s.percentile!
        };
      });
  }, [scores]);

  // Memoize Similar Residents for Chart (v3 format)
  const chartSimilar = useMemo(() => {
    if (!archetype?.similarResidents) return undefined;
    return archetype.similarResidents.slice(0, 3).map(res => ({
      id: res.id,
      name: res.name,
      scores: [
        { pgy: 'PGY-1', percentile: res.iteScores?.pgy1 ?? 0 },
        { pgy: 'PGY-2', percentile: res.iteScores?.pgy2 ?? 0 },
        { pgy: 'PGY-3', percentile: res.iteScores?.pgy3 ?? 0 },
      ].filter(s => s.percentile > 0)
    }));
  }, [archetype?.similarResidents]);

  // Memoize risk level colors
  const riskColors = useMemo(() => {
    const risk = archetype?.riskLevel || '';
    switch (risk) {
      case 'Low': return { bg: '#ECFDF5', border: '#A7F3D0', text: '#059669' };
      case 'Moderate': return { bg: '#FFFBEB', border: '#FCD34D', text: '#D97706' };
      case 'High': return { bg: '#FEF2F2', border: '#FECACA', text: '#DC2626' };
      default: return { bg: '#F3F4F6', border: '#D1D5DB', text: '#6B7280' };
    }
  }, [archetype?.riskLevel]);

  // Early return for loading - AFTER all hooks
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0EA5E9]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section: Archetype Badge */}
      <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-neutral-800 flex items-center gap-2">
              <TrendingUp size={20} className="text-[#0EA5E9]" />
              Trajectory Analysis
            </h2>
            <p className="text-sm text-neutral-500 mt-1">
              Based on ITE score progression across residency years
            </p>
            {archetype?.currentClassification && (
              <p className="text-xs text-neutral-400 mt-2">
                Methodology v{archetype.currentClassification.methodologyVersion}
              </p>
            )}
          </div>
          
          {archetype && (
            <div className="flex flex-col items-end gap-2">
              {/* Archetype Badge */}
              <div 
                className="px-4 py-2 rounded-lg border flex flex-col items-end"
                style={{ 
                  backgroundColor: `${archetype.color}15`, 
                  borderColor: `${archetype.color}40`,
                  color: archetype.color 
                }}
              >
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider opacity-80">
                    Archetype
                  </span>
                  {archetype.isProvisional && (
                    <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full font-medium">
                      PROVISIONAL
                    </span>
                  )}
                </div>
                <span className="text-lg font-bold">
                  {archetype.archetype}
                </span>
              </div>
              
              {/* Risk Level Badge */}
              <div 
                className="px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1"
                style={{ 
                  backgroundColor: riskColors.bg, 
                  borderColor: riskColors.border,
                  color: riskColors.text,
                  border: '1px solid'
                }}
              >
                {archetype.riskLevel === 'Low' && <CheckCircle2 size={12} />}
                {archetype.riskLevel === 'Moderate' && <AlertTriangle size={12} />}
                {archetype.riskLevel === 'High' && <AlertCircle size={12} />}
                {archetype.riskLevel} Risk
              </div>
            </div>
          )}
        </div>

        {archetype && (
          <div className="mt-4 space-y-3">
            {/* Pattern & Confidence */}
            <div className="flex gap-4 text-sm">
              <div className="flex-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100">
                <span className="font-semibold text-neutral-700">Pattern: </span>
                <span className="text-neutral-600">{archetype.description}</span>
              </div>
              <div className="flex-1 bg-neutral-50 p-3 rounded-lg border border-neutral-100 flex items-center gap-2">
                <span className="font-semibold text-neutral-700">Confidence: </span>
                <div className="flex-1 h-2 bg-neutral-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-500"
                    style={{ 
                      width: `${archetype.confidence * 100}%`,
                      backgroundColor: archetype.confidence > 0.7 ? '#10B981' : archetype.confidence > 0.4 ? '#F59E0B' : '#EF4444'
                    }}
                  />
                </div>
                <span className="text-xs text-neutral-500 font-mono">
                  {Math.round(archetype.confidence * 100)}%
                </span>
              </div>
            </div>

            {/* Data Years Indicator */}
            <div className="flex items-center gap-2 text-sm text-neutral-500">
              <Clock size={14} />
              <span>
                {archetype.dataYears === 0 && 'Awaiting ITE data'}
                {archetype.dataYears === 1 && 'Based on PGY-1 data only'}
                {archetype.dataYears === 2 && 'Based on PGY-1 and PGY-2 data'}
                {archetype.dataYears === 3 && 'Complete 3-year trajectory'}
              </span>
              {archetype.dataYears < 3 && archetype.dataYears > 0 && (
                <span className="text-amber-600 text-xs">
                  — Classification will refine with more data
                </span>
              )}
            </div>

            {/* Provisional Note */}
            {archetype.isProvisional && archetype.currentClassification?.note && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex gap-2 items-start">
                <Info className="text-amber-600 mt-0.5 flex-shrink-0" size={16} />
                <p className="text-sm text-amber-800">{archetype.currentClassification.note}</p>
              </div>
            )}

            {/* Version Drift Indicator */}
            {archetype.hasVersionDrift && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 items-start">
                <GitCompare className="text-blue-600 mt-0.5 flex-shrink-0" size={16} />
                <div className="text-sm">
                  <span className="text-blue-800 font-medium">Classification Updated: </span>
                  <span className="text-blue-700">
                    Original: &quot;{archetype.originalClassification?.archetypeName}&quot; → 
                    Current: &quot;{archetype.currentClassification?.archetypeName}&quot;
                  </span>
                  {archetype.driftReason && (
                    <span className="text-blue-600 text-xs ml-2">({archetype.driftReason})</span>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Recommendations Section */}
      {archetype?.recommendations && archetype.recommendations.length > 0 && (
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <h3 className="font-medium text-neutral-700 mb-3 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-600" />
            Recommendations
          </h3>
          <ul className="space-y-2">
            {archetype.recommendations.map((rec, idx) => (
              <li 
                key={idx} 
                className={`text-sm p-2 rounded-lg ${
                  rec.includes('URGENT') 
                    ? 'bg-red-50 text-red-800 border border-red-200' 
                    : 'bg-neutral-50 text-neutral-700'
                }`}
              >
                {rec.includes('URGENT') && <AlertCircle className="inline mr-2" size={14} />}
                {rec}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Main Chart Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-neutral-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-neutral-700 flex items-center gap-2">
              <Activity size={18} />
              Performance Trajectory
            </h3>
            <div className="flex gap-3 text-xs">
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 rounded-full bg-[#0EA5E9]" />
                <span>Current Resident</span>
              </div>
              {chartSimilar && chartSimilar.length > 0 && (
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 rounded-full bg-neutral-300" />
                  <span>Similar Residents</span>
                </div>
              )}
            </div>
          </div>
          
          <TrajectoryChart 
            currentScores={currentScores}
            similarResidents={chartSimilar}
          />
        </div>

        {/* Similar Residents Sidebar */}
        <div className="bg-white rounded-xl border border-neutral-200 p-6 shadow-sm flex flex-col">
          <h3 className="font-medium text-neutral-700 flex items-center gap-2 mb-4">
            <Users size={18} />
            Similar Historical Profiles
          </h3>
          
          <div className="flex-1 overflow-y-auto space-y-3 max-h-[400px] pr-1">
            {archetype?.similarResidents && archetype.similarResidents.length > 0 ? (
              archetype.similarResidents.map((res) => (
                <div 
                  key={res.id} 
                  className="p-3 bg-neutral-50 rounded-lg border border-neutral-100 hover:border-neutral-200 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-medium text-sm text-neutral-800">{res.name}</p>
                      <p className="text-xs text-neutral-500">Class of {res.classYear}</p>
                    </div>
                    <div className="text-xs bg-white px-1.5 py-0.5 rounded border border-neutral-200 text-neutral-500">
                      {Math.round(res.similarityScore * 100)}% Match
                    </div>
                  </div>
                  
                  {/* Archetype badge for similar resident */}
                  {res.archetype && (
                    <div className="mt-2">
                      <span className="text-xs bg-neutral-200 text-neutral-700 px-2 py-0.5 rounded-full">
                        {res.archetype}
                      </span>
                    </div>
                  )}
                  
                  {/* Score summary */}
                  <div className="mt-2 flex flex-wrap gap-x-2 text-xs text-neutral-400 font-mono">
                    {res.iteScores?.pgy1 && <span>PGY-1 ITE {res.iteScores.pgy1}%</span>}
                    {res.iteScores?.pgy1 && res.iteScores?.pgy2 && <span>→</span>}
                    {res.iteScores?.pgy2 && <span>PGY-2 ITE {res.iteScores.pgy2}%</span>}
                    {res.iteScores?.pgy2 && res.iteScores?.pgy3 && <span>→</span>}
                    {res.iteScores?.pgy3 && <span>PGY-3 ITE {res.iteScores.pgy3}%</span>}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-neutral-400 text-sm">
                No similar residents found with sufficient data.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alternatives Section (if Variable or low confidence) */}
      {archetype?.alternatives && archetype.alternatives.length > 0 && archetype.confidence < 0.75 && (
        <div className="bg-neutral-50 rounded-xl border border-neutral-200 p-4">
          <h4 className="text-sm font-medium text-neutral-600 mb-2">Alternative Classifications Considered</h4>
          <div className="flex flex-wrap gap-2">
            {archetype.alternatives.map((alt, idx) => (
              <span 
                key={idx}
                className="text-xs bg-white px-3 py-1 rounded-full border border-neutral-200 text-neutral-600"
              >
                {alt.archetypeName} ({Math.round(alt.confidence * 100)}%)
              </span>
            ))}
          </div>
        </div>
      )}
      
      {/* Alert / Review Section if needed */}
      {archetype?.riskLevel === 'High' && !archetype.isProvisional && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex gap-3 items-start">
          <AlertCircle className="text-red-600 mt-0.5 flex-shrink-0" size={18} />
          <div>
            <h4 className="text-sm font-medium text-red-800">High Risk Classification</h4>
            <p className="text-sm text-red-700 mt-1">
              This trajectory pattern is associated with increased risk. 
              A faculty member should review and consider intervention strategies.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
