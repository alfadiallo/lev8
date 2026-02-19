'use client';

import { useCallback, useRef } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import ScoreRangeKey from './ScoreRangeKey';

// ============================================================================
// Types
// ============================================================================

interface ComparisonData {
  attribute: string;
  series1: number;
  series2: number;
  gap: number;
  classAvg?: number;
}

interface ComparisonChartProps {
  series1: { label: string; color: string; eq: number; pq: number; iq: number };
  series2: { label: string; color: string; eq: number; pq: number; iq: number };
  /** Optional class averages rendered as horizontal reference lines on each bar group. */
  classAverages?: { eq: number | null; pq: number | null; iq: number | null } | null;
  /** Label for class averages in tooltip, e.g. "Class of 2027" */
  classLabel?: string;
  height?: number;
  showGap?: boolean;
  compact?: boolean;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Side-by-side bar chart comparing two score sets (e.g., Faculty avg vs Self-assessment).
 * Shows gap analysis between the two.
 */
export default function ComparisonChart({
  series1,
  series2,
  classAverages,
  classLabel = 'Class',
  height = 300,
  showGap = true,
  compact = false,
  className = '',
}: ComparisonChartProps) {
  const data: ComparisonData[] = [
    {
      attribute: 'EQ',
      series1: series1.eq,
      series2: series2.eq,
      gap: series2.eq - series1.eq,
      classAvg: classAverages?.eq ?? undefined,
    },
    {
      attribute: 'PQ',
      series1: series1.pq,
      series2: series2.pq,
      gap: series2.pq - series1.pq,
      classAvg: classAverages?.pq ?? undefined,
    },
    {
      attribute: 'IQ',
      series1: series1.iq,
      series2: series2.iq,
      gap: series2.iq - series1.iq,
      classAvg: classAverages?.iq ?? undefined,
    },
  ];

  const chartHeight = compact ? Math.min(height, 200) : height;
  const barSize = compact ? 24 : 32;

  // Track bar1 positions so the custom shape on bar2 can draw the spanning line
  const bar1Positions = useRef<{ x: number; width: number }[]>([]);

  // Custom tooltip that includes class average
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (!active || !payload) return null;
    const avgEntry = data.find((d) => d.attribute === label);
    return (
      <div
        style={{
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '8px 12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          fontSize: '13px',
        }}
      >
        <p className="font-semibold text-neutral-700 mb-1">{label}</p>
        {payload.map((entry: { name: string; value: number; color: string }, idx: number) => (
          <p key={idx} style={{ color: entry.color }}>
            {entry.name}: {Math.round(entry.value)}
          </p>
        ))}
        {avgEntry?.classAvg != null && (
          <p style={{ color: '#1F2937', fontWeight: 600, borderTop: '1px solid #e5e7eb', marginTop: 4, paddingTop: 4 }}>
            {classLabel} Avg: {Math.round(avgEntry.classAvg)}
          </p>
        )}
      </div>
    );
  }, [classLabel, data]);

  return (
    <div className={`space-y-3 ${className}`}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <BarChart data={data} margin={{ top: 5, right: 10, left: compact ? -20 : 0, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis
            dataKey="attribute"
            tick={{ fontSize: compact ? 11 : 13, fontWeight: 600, fill: '#374151' }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: 11, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={compact ? 25 : 35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            content={() => (
              <div className="flex items-center justify-center gap-5 pt-3 text-sm text-neutral-600">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: series1.color }} />
                  {series1.label}
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-3 rounded-full" style={{ backgroundColor: series2.color }} />
                  {series2.label}
                </span>
                {classAverages && (
                  <span className="flex items-center gap-1.5">
                    <svg width="16" height="6" className="inline-block"><line x1="0" y1="3" x2="16" y2="3" stroke="#1F2937" strokeWidth="1.25" strokeLinecap="round" /></svg>
                    {classLabel} Avg
                  </span>
                )}
              </div>
            )}
          />
          <Bar
            dataKey="series1"
            name={series1.label}
            fill={series1.color}
            radius={[4, 4, 0, 0]}
            barSize={barSize}
            shape={(props: unknown) => {
              const p = props as { x: number; y: number; width: number; height: number; fill: string; index: number; radius: number[] };
              // Record bar1 position for the class avg line to reference
              bar1Positions.current[p.index] = { x: p.x, width: p.width };
              const [rtl, rtr] = p.radius || [0, 0];
              return (
                <rect
                  x={p.x}
                  y={p.y}
                  width={p.width}
                  height={p.height}
                  fill={p.fill}
                  rx={rtl}
                  ry={rtr}
                />
              );
            }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={series1.color} />
            ))}
          </Bar>
          <Bar
            dataKey="series2"
            name={series2.label}
            fill={series2.color}
            radius={[4, 4, 0, 0]}
            barSize={barSize}
            shape={(rawProps: unknown) => {
              const props = rawProps as { x: number; y: number; width: number; height: number; fill: string; index: number; radius: number[];
                background: { x: number; y: number; width: number; height: number } };
              const [rtl, rtr] = props.radius || [0, 0];
              const bar2El = (
                <rect
                  x={props.x}
                  y={props.y}
                  width={props.width}
                  height={props.height}
                  fill={props.fill}
                  rx={rtl}
                  ry={rtr}
                />
              );

              // Draw class avg line spanning from bar1 left edge to bar2 right edge
              const avgVal = data[props.index]?.classAvg;
              if (avgVal == null || !classAverages) return bar2El;

              const bar1 = bar1Positions.current[props.index];
              if (!bar1) return bar2El;

              // Compute Y position: background gives us the full category area
              const bg = props.background;
              const yDomain = 100; // chart domain is 0-100
              const plotHeight = bg.height;
              const plotTop = bg.y;
              const lineY = plotTop + plotHeight * (1 - avgVal / yDomain);
              const groupLeft = bar1.x;
              const groupRight = props.x + props.width;
              const overhang = 6;

              return (
                <g>
                  {bar2El}
                  <line
                    x1={groupLeft - overhang}
                    y1={lineY}
                    x2={groupRight + overhang}
                    y2={lineY}
                    stroke="#1F2937"
                    strokeWidth={1.25}
                    strokeLinecap="round"
                  />
                </g>
              );
            }}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={series2.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      <ScoreRangeKey className="mt-1" />

      {/* Gap analysis */}
      {showGap && (
        <div className="flex gap-3">
          {data.map((d) => {
            const isPositive = d.gap > 0;
            const isNeutral = Math.abs(d.gap) < 3;
            return (
              <div
                key={d.attribute}
                className={`flex-1 text-center py-2 px-3 rounded-lg border ${
                  isNeutral
                    ? 'bg-neutral-50 border-neutral-200'
                    : isPositive
                      ? 'bg-amber-50 border-amber-200'
                      : 'bg-green-50 border-green-200'
                }`}
              >
                <div className="text-xs text-neutral-500 mb-0.5">{d.attribute} Gap</div>
                <div
                  className={`text-sm font-bold ${
                    isNeutral
                      ? 'text-neutral-600'
                      : isPositive
                        ? 'text-amber-600'
                        : 'text-green-600'
                  }`}
                >
                  {isPositive ? '+' : ''}{Math.round(d.gap)}
                </div>
                <div className="text-[10px] text-neutral-400">
                  {isNeutral ? 'Aligned' : isPositive ? 'Self > Faculty' : 'Faculty > Self'}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
