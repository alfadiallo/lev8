// Vertical Timeline Bar Chart for EQ/PQ/IQ Scores Over Time with Trendlines
'use client';

import React, { useMemo, useEffect, useState } from 'react';
import { Info } from 'lucide-react';
import { calculateLinearRegression, periodToIndex, DataPoint } from '@/lib/analytics/linear-regression';

interface PeriodScoreData {
  period_label: string;
  ai_scores_detail: {
    eq: {
      empathy: number;
      adaptability: number;
      stress_mgmt: number;
      curiosity: number;
      communication: number;
      avg: number;
    };
    pq: {
      work_ethic: number;
      integrity: number;
      teachability: number;
      documentation: number;
      leadership: number;
      avg: number;
    };
    iq: {
      knowledge: number;
      analytical: number;
      learning: number;
      flexibility: number;
      performance: number;
      avg: number;
    };
  } | null;
  ai_n_comments: number;
  ai_confidence_avg: number;
}

interface TrendlineDataPoint {
  period: string;
  score: number;
}

interface TrendlineData {
  resident: Record<string, TrendlineDataPoint[]>;
  class: {
    class_year: number;
    data: Record<string, TrendlineDataPoint[]>;
  };
  program: Record<string, TrendlineDataPoint[]>;
}

interface AttributeTimelineChartProps {
  allPeriodScores: PeriodScoreData[];
  residentId?: string;
  classYear?: number;
}

// Attribute definitions with their API keys
const ATTRIBUTES = {
  eq: [
    { key: 'empathy', apiKey: 'eq_empathy', label: 'Empathy & Positive Interactions' },
    { key: 'curiosity', apiKey: 'eq_curiosity', label: 'Curiosity & Growth Mindset' },
    { key: 'stress_mgmt', apiKey: 'eq_stress_mgmt', label: 'Stress Management & Resilience' },
    { key: 'adaptability', apiKey: 'eq_adaptability', label: 'Adaptability & Self-Awareness' },
    { key: 'communication', apiKey: 'eq_communication', label: 'Communication Skills' },
  ],
  pq: [
    { key: 'integrity', apiKey: 'pq_integrity', label: 'Integrity & Accountability' },
    { key: 'leadership', apiKey: 'pq_leadership', label: 'Leadership & Initiative' },
    { key: 'work_ethic', apiKey: 'pq_work_ethic', label: 'Work Ethic & Reliability' },
    { key: 'teachability', apiKey: 'pq_teachability', label: 'Teachability & Receptiveness' },
    { key: 'documentation', apiKey: 'pq_documentation', label: 'Documentation & Organization' },
  ],
  iq: [
    { key: 'learning', apiKey: 'iq_learning', label: 'Learning & Knowledge Application' },
    { key: 'knowledge', apiKey: 'iq_knowledge', label: 'Medical Knowledge & Expertise' },
    { key: 'analytical', apiKey: 'iq_analytical', label: 'Analytical & Problem-Solving' },
    { key: 'flexibility', apiKey: 'iq_flexibility', label: 'Cognitive Flexibility' },
    { key: 'performance', apiKey: 'iq_performance', label: 'Clinical Performance Under Pressure' },
  ],
};

const CATEGORY_COLORS = {
  eq: { bar: '#22c55e', bg: '#dcfce7', text: '#15803d' },
  pq: { bar: '#3b82f6', bg: '#dbeafe', text: '#1d4ed8' },
  iq: { bar: '#a855f7', bg: '#f3e8ff', text: '#7e22ce' },
};

// Trendline colors
const TRENDLINE_COLORS = {
  resident: '#3b82f6',  // Blue - solid
  class: '#f97316',     // Orange - dashed
  program: '#ef4444',   // Red - dotted
};

// Sort periods chronologically
function sortPeriods(periods: string[]): string[] {
  const order: Record<string, number> = {
    'PGY-1 Fall': 1, 'PGY-1 Spring': 2,
    'PGY-2 Fall': 3, 'PGY-2 Spring': 4,
    'PGY-3 Fall': 5, 'PGY-3 Spring': 6,
    'PGY-4 Fall': 7, 'PGY-4 Spring': 8,
  };
  return [...periods].sort((a, b) => (order[a] || 99) - (order[b] || 99));
}

// Format period label for display inside bar (keep full name)
function formatPeriod(period: string): string {
  return period; // Keep full name: "PGY-1 Fall", "PGY-2 Spring", etc.
}

export function AttributeTimelineChart({ allPeriodScores, residentId, classYear: _classYear }: AttributeTimelineChartProps) {
  const [trendlineData, setTrendlineData] = useState<TrendlineData | null>(null);
  const [_loadingTrendlines, setLoadingTrendlines] = useState(false);

  // Fetch trendline data when residentId is available
  useEffect(() => {
    if (!residentId) return;

    const fetchTrendlines = async () => {
      setLoadingTrendlines(true);
      try {
        const response = await fetch(`/api/analytics/trendlines/resident/${residentId}`);
        if (response.ok) {
          const data = await response.json();
          setTrendlineData(data);
        }
      } catch (error) {
        console.error('[AttributeTimelineChart] Error fetching trendlines:', error);
      } finally {
        setLoadingTrendlines(false);
      }
    };

    fetchTrendlines();
  }, [residentId]);

  // Filter to only periods with ai_scores_detail
  const validPeriods = useMemo(() => {
    return allPeriodScores.filter(p => p.ai_scores_detail !== null);
  }, [allPeriodScores]);

  // Get sorted period labels
  const sortedPeriodLabels = useMemo(() => {
    const labels = validPeriods.map(p => p.period_label);
    return sortPeriods(labels);
  }, [validPeriods]);

  // Create period index map for regression calculations
  const periodIndexMap = useMemo(() => {
    return periodToIndex(sortedPeriodLabels);
  }, [sortedPeriodLabels]);

  // Calculate totals for header
  const totalComments = validPeriods.reduce((sum, p) => sum + (p.ai_n_comments || 0), 0);
  const avgConfidence = validPeriods.length > 0
    ? validPeriods.reduce((sum, p) => sum + (p.ai_confidence_avg || 0), 0) / validPeriods.length
    : 0;

  // Get score for a specific attribute and period
  const getScore = (category: 'eq' | 'pq' | 'iq', attrKey: string, periodLabel: string): number => {
    const periodData = validPeriods.find(p => p.period_label === periodLabel);
    if (!periodData?.ai_scores_detail) return 0;
    const categoryData = periodData.ai_scores_detail[category];
    return Number((categoryData as Record<string, number>)[attrKey]) || 0;
  };

  // Calculate trendline for a given data series
  const calculateTrendline = (dataPoints: TrendlineDataPoint[]): { slope: number; intercept: number; getY: (x: number) => number } | null => {
    if (dataPoints.length < 2) return null;

    const points: DataPoint[] = dataPoints
      .filter(dp => periodIndexMap.has(dp.period))
      .map(dp => ({
        x: periodIndexMap.get(dp.period)!,
        y: dp.score
      }));

    if (points.length < 2) return null;

    return calculateLinearRegression(points);
  };

  if (validPeriods.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 text-center">
        <p className="text-gray-500">No AI-generated scores available yet.</p>
      </div>
    );
  }

  const barHeight = 180; // Max height in pixels
  const barWidth = 18; // Width of each bar
  const barGap = 2; // Gap between bars in same attribute group
  const groupGap = 12; // Gap between attribute groups
  const numPeriods = sortedPeriodLabels.length;
  const clusterWidth = numPeriods * barWidth + (numPeriods - 1) * barGap;

  // Helper to render trendline SVG for an attribute
  const renderTrendlines = (category: 'eq' | 'pq' | 'iq', attrApiKey: string) => {
    if (!trendlineData) return null;

    const residentPoints = trendlineData.resident[attrApiKey] || [];
    const classPoints = trendlineData.class.data[attrApiKey] || [];
    const programPoints = trendlineData.program[attrApiKey] || [];

    const residentTrend = calculateTrendline(residentPoints);
    const classTrend = calculateTrendline(classPoints);
    const programTrend = calculateTrendline(programPoints);

    if (!residentTrend && !classTrend && !programTrend) return null;

    const svgWidth = clusterWidth;
    const svgHeight = barHeight;
    const maxX = numPeriods - 1;

    // Convert Y value (score 0-5) to SVG coordinate (inverted)
    const scoreToY = (score: number) => {
      const clampedScore = Math.max(0, Math.min(5, score));
      return svgHeight - (clampedScore / 5) * svgHeight;
    };

    // Convert X index to SVG coordinate (center of bar)
    const indexToX = (index: number) => {
      return index * (barWidth + barGap) + barWidth / 2;
    };

    return (
      <svg
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: svgWidth,
          height: svgHeight,
          pointerEvents: 'none',
          overflow: 'visible'
        }}
      >
        {/* Program trendline (dotted red) */}
        {programTrend && (
          <line
            x1={indexToX(0)}
            y1={scoreToY(programTrend.getY(0))}
            x2={indexToX(maxX)}
            y2={scoreToY(programTrend.getY(maxX))}
            stroke={TRENDLINE_COLORS.program}
            strokeWidth={2}
            strokeDasharray="2,3"
            opacity={0.8}
          />
        )}

        {/* Class trendline (dashed orange) */}
        {classTrend && (
          <line
            x1={indexToX(0)}
            y1={scoreToY(classTrend.getY(0))}
            x2={indexToX(maxX)}
            y2={scoreToY(classTrend.getY(maxX))}
            stroke={TRENDLINE_COLORS.class}
            strokeWidth={2}
            strokeDasharray="6,4"
            opacity={0.8}
          />
        )}

        {/* Resident trendline (solid blue) */}
        {residentTrend && (
          <line
            x1={indexToX(0)}
            y1={scoreToY(residentTrend.getY(0))}
            x2={indexToX(maxX)}
            y2={scoreToY(residentTrend.getY(maxX))}
            stroke={TRENDLINE_COLORS.resident}
            strokeWidth={2.5}
            opacity={0.9}
          />
        )}
      </svg>
    );
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            AI-Generated Attribute Scores Over Time
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Based on {totalComments} comments across {sortedPeriodLabels.length} periods • 
            <span className={`ml-1 font-medium ${avgConfidence >= 0.8 ? 'text-green-600' : avgConfidence >= 0.6 ? 'text-yellow-600' : 'text-red-600'}`}>
              {avgConfidence >= 0.8 ? 'High' : avgConfidence >= 0.6 ? 'Moderate' : 'Low'} Confidence ({(avgConfidence * 100).toFixed(0)}%)
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Info className="h-4 w-4" />
          <span>Hover for attribute names</span>
        </div>
      </div>

      {/* Chart Container - Stacked vertically by category */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {(['eq', 'pq', 'iq'] as const).map((category) => {
          const colors = CATEGORY_COLORS[category];
          const categoryLabel = category === 'eq' ? 'Emotional Quotient (EQ)' : 
                               category === 'pq' ? 'Professional Quotient (PQ)' : 
                               'Intellectual Quotient (IQ)';
          
          return (
            <div key={category}>
              {/* Category Header */}
              <div style={{
                fontSize: '14px',
                fontWeight: 600,
                color: colors.text,
                marginBottom: '12px',
                paddingBottom: '8px',
                borderBottom: `2px solid ${colors.bg}`
              }}>
                {categoryLabel}
              </div>
              
              {/* Attributes Row */}
              <div style={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                gap: `${groupGap}px`
              }}>
                {ATTRIBUTES[category].map((attr) => (
                  <div 
                    key={attr.key}
                    title={attr.label}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      cursor: 'pointer',
                      flex: 1
                    }}
                  >
                    {/* Bars container with trendline overlay */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-end',
                      justifyContent: 'center',
                      gap: `${barGap}px`,
                      height: `${barHeight}px`,
                      position: 'relative'
                    }}>
                      {sortedPeriodLabels.map((periodLabel) => {
                        const score = getScore(category, attr.key, periodLabel);
                        const actualHeight = Math.max((score / 5.0) * barHeight, score > 0 ? 30 : 0);

                        return (
                          <div
                            key={periodLabel}
                            title={`${attr.label}\n${periodLabel}: ${score.toFixed(1)}`}
                            style={{
                              width: `${barWidth}px`,
                              height: `${barHeight}px`,
                              backgroundColor: colors.bg,
                              borderRadius: '4px',
                              position: 'relative',
                              display: 'flex',
                              flexDirection: 'column',
                              justifyContent: 'flex-end'
                            }}
                          >
                            {/* Filled bar */}
                            <div
                              style={{
                                width: '100%',
                                height: `${actualHeight}px`,
                                backgroundColor: colors.bar,
                                borderRadius: '4px',
                                position: 'relative',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'flex-start',
                                paddingTop: '4px',
                                transition: 'height 0.3s ease-out'
                              }}
                            >
                              {/* Score at top */}
                              {score > 0 && (
                                <span style={{
                                  fontSize: '10px',
                                  fontWeight: 600,
                                  color: 'white',
                                  lineHeight: 1
                                }}>
                                  {score.toFixed(1)}
                                </span>
                              )}
                              
                              {/* Period label - vertical, bottom justified */}
                              <span style={{
                                writingMode: 'vertical-rl',
                                textOrientation: 'mixed',
                                transform: 'rotate(180deg)',
                                fontSize: '8px',
                                color: 'rgba(255,255,255,0.9)',
                                position: 'absolute',
                                bottom: '4px',
                                whiteSpace: 'nowrap'
                              }}>
                                {formatPeriod(periodLabel)}
                              </span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Trendline SVG overlay */}
                      {trendlineData && renderTrendlines(category, attr.apiKey)}
                    </div>
                    
                    {/* Attribute label (full name) */}
                    <div style={{
                      marginTop: '8px',
                      fontSize: '11px',
                      color: '#374151',
                      textAlign: 'center',
                      fontWeight: 500,
                      lineHeight: 1.3
                    }}>
                      {attr.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Trendline Legend */}
      {trendlineData && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid #e5e7eb'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="12">
              <line x1="0" y1="6" x2="24" y2="6" stroke={TRENDLINE_COLORS.resident} strokeWidth="2.5" />
            </svg>
            <span style={{ fontSize: '12px', color: '#374151' }}>Resident Trend</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="12">
              <line x1="0" y1="6" x2="24" y2="6" stroke={TRENDLINE_COLORS.class} strokeWidth="2" strokeDasharray="6,4" />
            </svg>
            <span style={{ fontSize: '12px', color: '#374151' }}>Class of {trendlineData.class.class_year} Avg</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <svg width="24" height="12">
              <line x1="0" y1="6" x2="24" y2="6" stroke={TRENDLINE_COLORS.program} strokeWidth="2" strokeDasharray="2,3" />
            </svg>
            <span style={{ fontSize: '12px', color: '#374151' }}>Program Avg</span>
          </div>
        </div>
      )}

      {/* Methodology Note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Methodology:</strong> Scores represent AI interpretation of narrative evaluation comments 
            using the EQ+PQ+IQ framework. Each bar shows the score for one academic period. 
            {trendlineData && ' Trendlines show linear regression (best-fit) for resident, class, and program averages.'}
            {' '}Hover over any bar group to see the full attribute name.
          </p>
        </div>
      </div>
    </div>
  );
}
