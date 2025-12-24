'use client';

import React, { useState, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import Recharts to avoid SSR issues
const LineChart = dynamic(
  () => import('recharts').then((mod) => mod.LineChart),
  { ssr: false }
);
const Line = dynamic(
  () => import('recharts').then((mod) => mod.Line),
  { ssr: false }
);
const XAxis = dynamic(
  () => import('recharts').then((mod) => mod.XAxis),
  { ssr: false }
);
const YAxis = dynamic(
  () => import('recharts').then((mod) => mod.YAxis),
  { ssr: false }
);
const CartesianGrid = dynamic(
  () => import('recharts').then((mod) => mod.CartesianGrid),
  { ssr: false }
);
const Tooltip = dynamic(
  () => import('recharts').then((mod) => mod.Tooltip),
  { ssr: false }
);
const ReferenceLine = dynamic(
  () => import('recharts').then((mod) => mod.ReferenceLine),
  { ssr: false }
);
const Legend = dynamic(
  () => import('recharts').then((mod) => mod.Legend),
  { ssr: false }
);
const ResponsiveContainer = dynamic(
  () => import('recharts').then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);

interface TrajectoryChartProps {
  currentScores: { pgy: string; percentile: number }[];
  archetypeData?: {
    name: string;
    color: string;
    trajectory: { pgy: string; percentile: number }[];
  };
  similarResidents?: {
    id: string;
    name: string;
    scores: { pgy: string; percentile: number }[];
  }[];
  classAverage?: { pgy: string; percentile: number }[];
}

export default function TrajectoryChart({
  currentScores,
  archetypeData,
  similarResidents,
  classAverage
}: TrajectoryChartProps) {
  const [hoveredLine, setHoveredLine] = useState<string | null>(null);
  const [isClient, setIsClient] = React.useState(false);

  React.useEffect(() => {
    setIsClient(true);
  }, []);

  // Memoize data transformation
  const data = useMemo(() => {
    return ['PGY-1', 'PGY-2', 'PGY-3'].map(pgy => {
      const item: Record<string, any> = { name: pgy };
      
      // Current Resident
      const current = currentScores.find(s => s.pgy === pgy);
      if (current) item.current = current.percentile;

      // Class Average
      if (classAverage) {
        const avg = classAverage.find(s => s.pgy === pgy);
        if (avg) item.classAvg = avg.percentile;
      }

      // Archetype Average
      if (archetypeData) {
        const arch = archetypeData.trajectory.find(s => s.pgy === pgy);
        if (arch) item.archetype = arch.percentile;
      }

      // Similar Residents (limit to 3 for performance)
      similarResidents?.slice(0, 3).forEach((res, idx) => {
        const s = res.scores.find(x => x.pgy === pgy);
        if (s) item[`similar_${idx}`] = s.percentile;
      });

      return item;
    });
  }, [currentScores, classAverage, archetypeData, similarResidents]);

  // Memoize handlers
  const handleMouseEnter = useCallback((lineKey: string) => {
    setHoveredLine(lineKey);
  }, []);

  const handleMouseLeave = useCallback(() => {
    setHoveredLine(null);
  }, []);

  // Check if we have any data to show
  const hasCurrentData = data.some(d => d.current !== undefined);
  const hasSimilarData = similarResidents && similarResidents.length > 0;

  if (!hasCurrentData && !hasSimilarData) {
    return (
      <div className="w-full h-64 flex items-center justify-center text-neutral-400 bg-neutral-50 rounded-lg">
        No ITE score data available
      </div>
    );
  }

  // Show loading state on server
  if (!isClient) {
    return (
      <div className="w-full h-[280px] flex items-center justify-center text-neutral-400 bg-neutral-50 rounded-lg animate-pulse">
        Loading chart...
      </div>
    );
  }

  // Limit similar residents displayed for performance
  const displayedSimilar = similarResidents?.slice(0, 3) || [];

  return (
    <div className="w-full h-[280px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart 
          data={data} 
          margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
        >
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
          <XAxis 
            dataKey="name" 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            dy={10}
          />
          <YAxis 
            domain={[0, 100]} 
            axisLine={false} 
            tickLine={false} 
            tick={{ fill: '#6B7280', fontSize: 12 }}
            width={45}
            label={{ value: 'Percentile', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle', fill: '#9CA3AF', fontSize: 12 } }}
          />
          <Tooltip 
            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            cursor={{ stroke: '#9CA3AF', strokeWidth: 1, strokeDasharray: '4 4' }}
            formatter={(value, name) => [`${value}%`, name]}
            labelStyle={{ color: '#374151', fontWeight: 600, marginBottom: '0.5rem' }}
          />
          <Legend 
            wrapperStyle={{ paddingTop: '10px' }}
            formatter={(value) => <span className="text-xs text-neutral-600">{value}</span>}
          />

          {/* Reference Lines for Quartiles */}
          <ReferenceLine y={50} stroke="#D1D5DB" strokeDasharray="2 2" />

          {/* Similar Residents (Background) - limit to 3 */}
          {displayedSimilar.map((res, idx) => (
            <Line
              key={res.id}
              type="monotone"
              dataKey={`similar_${idx}`}
              name={res.name}
              stroke="#CBD5E1"
              strokeWidth={1.5}
              strokeDasharray="4 4"
              dot={{ r: 3, fill: '#CBD5E1' }}
              connectNulls
              isAnimationActive={false}
            />
          ))}

          {/* Class Average */}
          {classAverage && classAverage.length > 0 && (
            <Line
              type="monotone"
              dataKey="classAvg"
              name="Class Avg"
              stroke="#9CA3AF"
              strokeWidth={2}
              strokeDasharray="5 5"
              dot={{ r: 3, fill: '#9CA3AF' }}
              connectNulls
              isAnimationActive={false}
            />
          )}

          {/* Current Resident (Foreground) */}
          <Line
            type="monotone"
            dataKey="current"
            name="Current Resident"
            stroke="#0EA5E9"
            strokeWidth={3}
            dot={{ r: 5, fill: '#0EA5E9', strokeWidth: 2, stroke: '#fff' }}
            activeDot={{ r: 7 }}
            connectNulls
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
