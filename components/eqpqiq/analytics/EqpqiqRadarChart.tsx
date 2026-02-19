'use client';

import { useState } from 'react';
import {
  Radar,
  RadarChart as RechartsRadar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { ChevronDown, ChevronRight } from 'lucide-react';
import ScoreRangeKey from './ScoreRangeKey';

// ============================================================================
// Types
// ============================================================================

export interface EqpqiqScores {
  [key: string]: number;
}

export interface AttributeDef {
  key: string;
  label: string;
  section: 'EQ' | 'PQ' | 'IQ';
}

export interface DataSeries {
  label: string;
  data: EqpqiqScores | null;
  color: string;
  fillOpacity?: number;
  /** Expandable sub-series shown when the parent row is toggled in the summary table. */
  children?: DataSeries[];
}

interface EqpqiqRadarChartProps {
  series: DataSeries[];
  /** Custom attributes override the default interview attributes. */
  attributes?: AttributeDef[];
  height?: number;
  showLegend?: boolean;
  showSectionColors?: boolean;
  showSummary?: boolean;
  compact?: boolean;
}

// ============================================================================
// Constants
// ============================================================================

const SECTION_COLORS: Record<string, string> = {
  EQ: '#2563EB',   // blue-600
  PQ: '#16A34A',   // green-600
  IQ: '#9333EA',   // purple-600
};

/** Default attribute set (Interview tool style) */
const DEFAULT_ATTRIBUTES: AttributeDef[] = [
  { key: 'eq_empathy', label: 'Empathy', section: 'EQ' },
  { key: 'eq_adaptability', label: 'Adaptability', section: 'EQ' },
  { key: 'eq_stress', label: 'Stress Mgmt', section: 'EQ' },
  { key: 'eq_curiosity', label: 'Curiosity', section: 'EQ' },
  { key: 'eq_communication', label: 'Communication', section: 'EQ' },
  { key: 'pq_work_ethic', label: 'Work Ethic', section: 'PQ' },
  { key: 'pq_integrity', label: 'Integrity', section: 'PQ' },
  { key: 'pq_teachability', label: 'Teachability', section: 'PQ' },
  { key: 'pq_documentation', label: 'Documentation', section: 'PQ' },
  { key: 'pq_leadership', label: 'Leadership', section: 'PQ' },
  { key: 'iq_knowledge', label: 'Knowledge', section: 'IQ' },
  { key: 'iq_analytical', label: 'Analytical', section: 'IQ' },
  { key: 'iq_learning', label: 'Learning', section: 'IQ' },
  { key: 'iq_flexibility', label: 'Flexibility', section: 'IQ' },
  { key: 'iq_performance', label: 'Performance', section: 'IQ' },
];

/** Progress Check / Residency attribute set (structured_ratings table columns) */
export const PROGRESS_CHECK_ATTRIBUTES: AttributeDef[] = [
  { key: 'eq_empathy_positive_interactions', label: 'Empathy', section: 'EQ' },
  { key: 'eq_adaptability_self_awareness', label: 'Adaptability', section: 'EQ' },
  { key: 'eq_stress_management_resilience', label: 'Stress Mgmt', section: 'EQ' },
  { key: 'eq_curiosity_growth_mindset', label: 'Curiosity', section: 'EQ' },
  { key: 'eq_effectiveness_communication', label: 'Communication', section: 'EQ' },
  { key: 'pq_work_ethic_reliability', label: 'Work Ethic', section: 'PQ' },
  { key: 'pq_integrity_accountability', label: 'Integrity', section: 'PQ' },
  { key: 'pq_teachability_receptiveness', label: 'Teachability', section: 'PQ' },
  { key: 'pq_documentation', label: 'Documentation', section: 'PQ' },
  { key: 'pq_leadership_relationships', label: 'Leadership', section: 'PQ' },
  { key: 'iq_knowledge_base', label: 'Knowledge', section: 'IQ' },
  { key: 'iq_analytical_thinking', label: 'Analytical', section: 'IQ' },
  { key: 'iq_commitment_learning', label: 'Learning', section: 'IQ' },
  { key: 'iq_clinical_flexibility', label: 'Flexibility', section: 'IQ' },
  { key: 'iq_performance_for_level', label: 'Performance', section: 'IQ' },
];

function calcAvg(data: EqpqiqScores, keys: string[]): number {
  const sum = keys.reduce((acc, k) => acc + (data[k] || 0), 0);
  return sum / keys.length;
}

// ============================================================================
// Summary Table (with expandable rows)
// ============================================================================

function SummaryTable({ series, attributes }: { series: DataSeries[]; attributes: AttributeDef[] }) {
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const sections = ['EQ', 'PQ', 'IQ'] as const;
  const sectionKeys = Object.fromEntries(
    sections.map(s => [s, attributes.filter(a => a.section === s).map(a => a.key)])
  );

  const toggle = (idx: number) =>
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(idx) ? next.delete(idx) : next.add(idx);
      return next;
    });

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-3 px-4 sm:px-6 w-1/4" />
            {sections.map(section => (
              <th
                key={section}
                className="text-center py-3 px-2 sm:px-4 text-sm sm:text-base font-semibold"
                style={{ color: SECTION_COLORS[section] }}
              >
                {section}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {series.map((s, idx) => {
            const hasChildren = s.children && s.children.length > 0;
            const isExpanded = expanded.has(idx);
            return (
              <SummaryRow
                key={s.label}
                series={s}
                sections={sections}
                sectionKeys={sectionKeys}
                isFirst={idx === 0}
                isExpanded={isExpanded}
                hasChildren={!!hasChildren}
                onToggle={() => toggle(idx)}
              />
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function SummaryRow({
  series: s,
  sections,
  sectionKeys,
  isFirst,
  isExpanded,
  hasChildren,
  onToggle,
}: {
  series: DataSeries;
  sections: readonly ('EQ' | 'PQ' | 'IQ')[];
  sectionKeys: Record<string, string[]>;
  isFirst: boolean;
  isExpanded: boolean;
  hasChildren: boolean;
  onToggle: () => void;
}) {
  return (
    <>
      <tr
        className={`${hasChildren ? 'cursor-pointer hover:bg-gray-50/60 transition-colors' : ''}`}
        style={!isFirst ? { borderTop: '1px solid #e5e7eb' } : undefined}
        onClick={hasChildren ? onToggle : undefined}
      >
        <td className="py-3 px-4 sm:px-6 text-xs sm:text-sm text-neutral-600 font-medium">
          <span className="flex items-center gap-1.5">
            {hasChildren ? (
              isExpanded
                ? <ChevronDown className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
                : <ChevronRight className="w-3.5 h-3.5 text-neutral-400 flex-shrink-0" />
            ) : (
              <span className="w-3.5 h-3.5 flex-shrink-0" />
            )}
            <span className="flex items-center gap-2">
              <span className="inline-block w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
              {s.label}
            </span>
          </span>
        </td>
        {sections.map(section => (
          <td key={section} className="py-3 px-2 sm:px-4 text-center">
            {s.data ? (
              <span className="text-xl sm:text-2xl font-bold" style={{ color: SECTION_COLORS[section] }}>
                {Math.round(calcAvg(s.data, sectionKeys[section]))}
              </span>
            ) : (
              <span className="text-xl sm:text-2xl text-neutral-300">—</span>
            )}
          </td>
        ))}
      </tr>
      {isExpanded && s.children?.map(child => (
        <tr key={child.label} className="bg-gray-50/40" style={{ borderTop: '1px solid #e5e7eb' }}>
          <td className="py-2.5 pr-4 sm:pr-6 text-xs text-neutral-400" style={{ paddingLeft: 54 }}>
            <span className="flex items-center gap-2">
              <span className="inline-block w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: child.color }} />
              {child.label}
            </span>
          </td>
          {sections.map(section => (
            <td key={section} className="py-2.5 px-2 sm:px-4 text-center">
              {child.data ? (
                <span className="text-base sm:text-lg font-semibold" style={{ color: SECTION_COLORS[section] }}>
                  {Math.round(calcAvg(child.data, sectionKeys[section]))}
                </span>
              ) : (
                <span className="text-base sm:text-lg text-neutral-300">—</span>
              )}
            </td>
          ))}
        </tr>
      ))}
    </>
  );
}

/**
 * Catmull-Rom spline through polar points → smooth closed SVG path.
 * Produces an organic "amoeba" shape instead of a sharp polygon.
 */
function smoothRadarPath(points: { x: number; y: number }[], tension = 0.35): string {
  if (points.length < 3) return '';
  const n = points.length;
  // Wrap points so the spline closes smoothly
  const pts = [points[n - 1], ...points, points[0], points[1]];

  let d = `M ${pts[1].x},${pts[1].y}`;
  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];

    const cp1x = p1.x + (p2.x - p0.x) * tension;
    const cp1y = p1.y + (p2.y - p0.y) * tension;
    const cp2x = p2.x - (p3.x - p1.x) * tension;
    const cp2y = p2.y - (p3.y - p1.y) * tension;

    d += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
  }
  d += ' Z';
  return d;
}

/** Custom Radar shape that renders a smooth blob instead of a polygon. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function SmoothRadarShape(props: any) {
  const { points, stroke, fill, fillOpacity, strokeWidth } = props;
  if (!points || points.length < 3) return null;
  const d = smoothRadarPath(points);
  return (
    <path
      d={d}
      stroke={stroke}
      fill={fill}
      fillOpacity={fillOpacity}
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  );
}

// ============================================================================
// Component
// ============================================================================

export default function EqpqiqRadarChart({
  series,
  attributes,
  height = 500,
  showLegend = true,
  showSectionColors = true,
  showSummary = true,
  compact = false,
}: EqpqiqRadarChartProps) {
  const ATTRIBUTES = attributes || DEFAULT_ATTRIBUTES;

  // Build chart data from series
  const chartData = ATTRIBUTES.map((attr) => {
    const point: Record<string, unknown> = {
      attribute: attr.label,
      section: attr.section,
      fullMark: 100,
    };
    for (const s of series) {
      point[s.label] = s.data ? (s.data[attr.key] || 0) : 0;
    }
    return point;
  });

  // Custom tick with section colors
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTick = (props: any) => {
    const { payload, x, y, textAnchor, radius } = props;
    const section = ATTRIBUTES[payload.index]?.section || '';
    const color = showSectionColors ? (SECTION_COLORS[section] || '#6b7280') : '#6b7280';

    return (
      <g className="recharts-layer recharts-polar-angle-axis-tick">
        <text radius={radius} stroke="none" x={x} y={y} textAnchor={textAnchor}>
          <tspan x={x} dy="0.355em" fontSize={compact ? 10 : 12} fontWeight="600" fill={color}>
            {payload.value}
          </tspan>
        </text>
      </g>
    );
  };

  const chartHeight = compact ? Math.min(height, 350) : height;

  return (
    <div className="space-y-4">
      {/* Section color legend */}
      {showSectionColors && !compact && (
        <div className="flex items-center justify-center gap-6 text-sm">
          {Object.entries(SECTION_COLORS).map(([section, color]) => (
            <div key={section} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-neutral-600 font-medium">
                {section} ({section === 'EQ' ? 'Emotional' : section === 'PQ' ? 'Professional' : 'Intellectual'})
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Radar chart */}
      <ResponsiveContainer width="100%" height={chartHeight}>
        <RechartsRadar data={chartData}>
          <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="attribute" tick={CustomTick} />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 100]}
            tick={{ fill: '#9ca3af', fontSize: 11 }}
            tickCount={6}
          />
          {series.map((s) => (
            <Radar
              key={s.label}
              name={s.label}
              dataKey={s.label}
              stroke={s.color}
              fill={s.color}
              fillOpacity={s.fillOpacity ?? 0.3}
              strokeWidth={1}
              dot={false}
              shape={<SmoothRadarShape />}
            />
          ))}
          {showLegend && (
            <Legend wrapperStyle={{ paddingTop: '20px' }} iconType="circle" />
          )}
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '10px 14px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
            formatter={(value: number | string, name: string) => [
              typeof value === 'number' ? Math.round(value) : String(value),
              name,
            ]}
          />
        </RechartsRadar>
      </ResponsiveContainer>

      {/* Score range key */}
      {showLegend && <ScoreRangeKey className="-mt-1" />}

      {/* Summary scores — table layout: row labels on left, EQ/PQ/IQ columns */}
      {showSummary && series.length > 0 && (
        <SummaryTable series={series} attributes={ATTRIBUTES} />
      )}
    </div>
  );
}
