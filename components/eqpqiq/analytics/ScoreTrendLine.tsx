'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from 'recharts';
import ScoreRangeKey from './ScoreRangeKey';

// ============================================================================
// Types
// ============================================================================

export interface TrendDataPoint {
  period: string;       // e.g., "PGY 1 Fall", "PGY 2 Spring"
  eq?: number;          // faculty EQ (or single-source EQ)
  pq?: number;          // faculty PQ
  iq?: number;          // faculty IQ
  selfEq?: number;      // self-assessment EQ
  selfPq?: number;      // self-assessment PQ
  selfIq?: number;      // self-assessment IQ
  overall?: number;
}

export type TrendView = 'faculty' | 'self' | 'both';

interface ScoreTrendLineProps {
  data: TrendDataPoint[];
  height?: number;
  view?: TrendView;
  showEQ?: boolean;
  showPQ?: boolean;
  showIQ?: boolean;
  showOverall?: boolean;
  showGrid?: boolean;
  showReference?: number;
  compact?: boolean;
  className?: string;
  /** Number of residency years — determines the full X-axis timeline. Default 3. */
  programYears?: number;
}

// ============================================================================
// Colors
// ============================================================================

const LINE_COLORS = {
  eq: '#2563EB',      // blue-600
  pq: '#16A34A',      // green-600
  iq: '#9333EA',      // purple-600
  overall: '#F59E0B', // amber-500
};

const SELF_LINE_COLORS = {
  eq: '#93C5FD',      // blue-300
  pq: '#86EFAC',      // green-300
  iq: '#D8B4FE',      // purple-300
};

// ============================================================================
// Helpers
// ============================================================================

/** Build the full canonical period list for a given program length. */
function buildCanonicalPeriods(years: number): string[] {
  const periods: string[] = ['Orientation'];
  for (let y = 1; y <= years; y++) {
    periods.push(`PGY ${y} Fall`);
    periods.push(`PGY ${y} Spring`);
  }
  return periods;
}

/** Normalize period labels so lookups are consistent (e.g. "PGY-1 Fall" -> "PGY 1 Fall"). */
function normalizePeriod(label: string): string {
  return label.replace(/PGY[\s-]*(\d)/i, 'PGY $1');
}

/**
 * Pad data so every canonical period has an entry (even if all scores are undefined).
 * Preserves existing data for matching periods.
 */
function padTimeline(data: TrendDataPoint[], programYears: number): TrendDataPoint[] {
  const canonical = buildCanonicalPeriods(programYears);
  const dataMap = new Map<string, TrendDataPoint>();
  for (const d of data) {
    dataMap.set(normalizePeriod(d.period), d);
  }
  return canonical.map((period) => dataMap.get(period) || { period });
}

// ============================================================================
// Component
// ============================================================================

/**
 * Time-series line chart showing EQ/PQ/IQ scores over periods.
 * Supports faculty, self-assessment, or both views.
 * Faculty lines are solid; self-assessment lines are dashed.
 */
export default function ScoreTrendLine({
  data,
  height = 300,
  view = 'faculty',
  showEQ = true,
  showPQ = true,
  showIQ = true,
  showOverall = false,
  showGrid = true,
  showReference,
  compact = false,
  className = '',
  programYears = 3,
}: ScoreTrendLineProps) {
  if (!data || data.length === 0) {
    return (
      <div className={`flex items-center justify-center h-40 text-neutral-400 text-sm ${className}`}>
        No trend data available
      </div>
    );
  }

  const showFaculty = view === 'faculty' || view === 'both';
  const showSelf = view === 'self' || view === 'both';

  // Pad data to show the full residency timeline on the X-axis
  const paddedData = padTimeline(data, programYears);

  const chartData = paddedData.map((d) => ({
    ...d,
    overall: d.overall ?? (d.eq && d.pq && d.iq ? ((d.eq + d.pq + d.iq) / 3) : undefined),
  }));

  const chartHeight = compact ? Math.min(height, 200) : height;

  const facultyLabel = view === 'both' ? ' (Faculty)' : '';
  const selfLabel = view === 'both' ? ' (Self)' : '';

  return (
    <div className={className}>
      <ResponsiveContainer width="100%" height={chartHeight}>
        <LineChart data={chartData} margin={{ top: 5, right: 10, left: compact ? -20 : 0, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />}
          <XAxis
            dataKey="period"
            tick={(props: { x: number; y: number; payload: { value: string; index: number }; visibleTicksCount: number }) => {
              const { x, y, payload } = props;
              const isFirst = payload.index === 0;
              const isLast = payload.index === props.visibleTicksCount - 1;
              const anchor = isFirst ? 'start' : isLast ? 'end' : 'middle';
              return (
                <text
                  x={x}
                  y={y + 12}
                  textAnchor={anchor}
                  fill="#6b7280"
                  fontSize={compact ? 10 : 12}
                >
                  {payload.value}
                </text>
              );
            }}
            tickLine={false}
            axisLine={{ stroke: '#e5e7eb' }}
            interval={0}
          />
          <YAxis
            domain={[0, 100]}
            ticks={[0, 25, 50, 75, 100]}
            tick={{ fontSize: compact ? 10 : 12, fill: '#9ca3af' }}
            tickLine={false}
            axisLine={false}
            width={compact ? 25 : 35}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'white',
              border: '1px solid #e5e7eb',
              borderRadius: '8px',
              padding: '8px 12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              fontSize: '13px',
            }}
            formatter={(value: number, name: string) => [Math.round(value), name]}
          />
          {!compact && <Legend iconType="circle" />}

          {showReference !== undefined && (
            <ReferenceLine
              y={showReference}
              stroke="#d1d5db"
              strokeDasharray="4 4"
              label={{ value: `Avg: ${showReference}`, fill: '#9ca3af', fontSize: 11 }}
            />
          )}

          {/* Faculty lines (solid) */}
          {showFaculty && showEQ && (
            <Line
              type="natural"
              dataKey="eq"
              name={`EQ${facultyLabel}`}
              stroke={LINE_COLORS.eq}
              strokeWidth={2.5}
              dot={{ r: compact ? 3 : 4, fill: LINE_COLORS.eq }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          )}
          {showFaculty && showPQ && (
            <Line
              type="natural"
              dataKey="pq"
              name={`PQ${facultyLabel}`}
              stroke={LINE_COLORS.pq}
              strokeWidth={2.5}
              dot={{ r: compact ? 3 : 4, fill: LINE_COLORS.pq }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          )}
          {showFaculty && showIQ && (
            <Line
              type="natural"
              dataKey="iq"
              name={`IQ${facultyLabel}`}
              stroke={LINE_COLORS.iq}
              strokeWidth={2.5}
              dot={{ r: compact ? 3 : 4, fill: LINE_COLORS.iq }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          )}

          {/* Self-assessment lines (dashed) */}
          {showSelf && showEQ && (
            <Line
              type="natural"
              dataKey="selfEq"
              name={`EQ${selfLabel}`}
              stroke={view === 'both' ? SELF_LINE_COLORS.eq : LINE_COLORS.eq}
              strokeWidth={2}
              strokeDasharray={view === 'both' ? '6 3' : undefined}
              dot={{ r: compact ? 3 : 4, fill: view === 'both' ? SELF_LINE_COLORS.eq : LINE_COLORS.eq }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          )}
          {showSelf && showPQ && (
            <Line
              type="natural"
              dataKey="selfPq"
              name={`PQ${selfLabel}`}
              stroke={view === 'both' ? SELF_LINE_COLORS.pq : LINE_COLORS.pq}
              strokeWidth={2}
              strokeDasharray={view === 'both' ? '6 3' : undefined}
              dot={{ r: compact ? 3 : 4, fill: view === 'both' ? SELF_LINE_COLORS.pq : LINE_COLORS.pq }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          )}
          {showSelf && showIQ && (
            <Line
              type="natural"
              dataKey="selfIq"
              name={`IQ${selfLabel}`}
              stroke={view === 'both' ? SELF_LINE_COLORS.iq : LINE_COLORS.iq}
              strokeWidth={2}
              strokeDasharray={view === 'both' ? '6 3' : undefined}
              dot={{ r: compact ? 3 : 4, fill: view === 'both' ? SELF_LINE_COLORS.iq : LINE_COLORS.iq }}
              activeDot={{ r: 6 }}
              connectNulls
            />
          )}

          {showOverall && (
            <Line
              type="natural"
              dataKey="overall"
              name="Overall"
              stroke={LINE_COLORS.overall}
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: LINE_COLORS.overall }}
            />
          )}
        </LineChart>
      </ResponsiveContainer>

      {!compact && <ScoreRangeKey className="mt-1" />}
    </div>
  );
}
