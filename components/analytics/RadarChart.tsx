// Radar Chart Component with Recharts - 15-Point Detailed View

'use client';

import { Radar, RadarChart as RechartsRadar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface RadarChartProps {
  facultyData: {
    // EQ attributes
    eq_empathy: number;
    eq_adaptability: number;
    eq_stress: number;
    eq_curiosity: number;
    eq_communication: number;
    // PQ attributes
    pq_work_ethic: number;
    pq_integrity: number;
    pq_teachability: number;
    pq_documentation: number;
    pq_leadership: number;
    // IQ attributes
    iq_knowledge: number;
    iq_analytical: number;
    iq_learning: number;
    iq_flexibility: number;
    iq_performance: number;
  };
  selfData: {
    // EQ attributes
    eq_empathy: number;
    eq_adaptability: number;
    eq_stress: number;
    eq_curiosity: number;
    eq_communication: number;
    // PQ attributes
    pq_work_ethic: number;
    pq_integrity: number;
    pq_teachability: number;
    pq_documentation: number;
    pq_leadership: number;
    // IQ attributes
    iq_knowledge: number;
    iq_analytical: number;
    iq_learning: number;
    iq_flexibility: number;
    iq_performance: number;
  };
}

export default function RadarChart({ facultyData, selfData }: RadarChartProps) {
  // Transform data for recharts - 15 points grouped by section
  const chartData = [
    // EQ Section (5 points)
    { attribute: 'Empathy', Faculty: facultyData.eq_empathy, Self: selfData.eq_empathy, section: 'EQ', fullMark: 5 },
    { attribute: 'Adaptability', Faculty: facultyData.eq_adaptability, Self: selfData.eq_adaptability, section: 'EQ', fullMark: 5 },
    { attribute: 'Stress Mgmt', Faculty: facultyData.eq_stress, Self: selfData.eq_stress, section: 'EQ', fullMark: 5 },
    { attribute: 'Curiosity', Faculty: facultyData.eq_curiosity, Self: selfData.eq_curiosity, section: 'EQ', fullMark: 5 },
    { attribute: 'Communication', Faculty: facultyData.eq_communication, Self: selfData.eq_communication, section: 'EQ', fullMark: 5 },
    
    // PQ Section (5 points)
    { attribute: 'Work Ethic', Faculty: facultyData.pq_work_ethic, Self: selfData.pq_work_ethic, section: 'PQ', fullMark: 5 },
    { attribute: 'Integrity', Faculty: facultyData.pq_integrity, Self: selfData.pq_integrity, section: 'PQ', fullMark: 5 },
    { attribute: 'Teachability', Faculty: facultyData.pq_teachability, Self: selfData.pq_teachability, section: 'PQ', fullMark: 5 },
    { attribute: 'Documentation', Faculty: facultyData.pq_documentation, Self: selfData.pq_documentation, section: 'PQ', fullMark: 5 },
    { attribute: 'Leadership', Faculty: facultyData.pq_leadership, Self: selfData.pq_leadership, section: 'PQ', fullMark: 5 },
    
    // IQ Section (5 points)
    { attribute: 'Knowledge', Faculty: facultyData.iq_knowledge, Self: selfData.iq_knowledge, section: 'IQ', fullMark: 5 },
    { attribute: 'Analytical', Faculty: facultyData.iq_analytical, Self: selfData.iq_analytical, section: 'IQ', fullMark: 5 },
    { attribute: 'Learning', Faculty: facultyData.iq_learning, Self: selfData.iq_learning, section: 'IQ', fullMark: 5 },
    { attribute: 'Flexibility', Faculty: facultyData.iq_flexibility, Self: selfData.iq_flexibility, section: 'IQ', fullMark: 5 },
    { attribute: 'Performance', Faculty: facultyData.iq_performance, Self: selfData.iq_performance, section: 'IQ', fullMark: 5 },
  ];

  // Custom tick component for color-coded labels
  const CustomTick = ({ payload, x, y, textAnchor, radius }: { payload: { index: number; value: string }; x: number; y: number; textAnchor: string; stroke?: string; radius?: number }) => {
    const section = chartData[payload.index]?.section || '';
    const colors: Record<string, string> = {
      'EQ': '#FF6B9D', // Pink for EQ
      'PQ': '#4ECDC4', // Teal for PQ
      'IQ': '#95E1D3', // Light green for IQ
    };
    
    return (
      <g className="recharts-layer recharts-polar-angle-axis-tick">
        <text
          radius={radius}
          stroke="none"
          x={x}
          y={y}
          className="recharts-text recharts-polar-angle-axis-tick-value"
          textAnchor={textAnchor}
        >
          <tspan
            x={x}
            dy="0.355em"
            fontSize="12"
            fontWeight="600"
            fill={colors[section] || '#6b7280'}
          >
            {payload.value}
          </tspan>
        </text>
      </g>
    );
  };

  return (
    <div className="space-y-6">
      {/* Enhanced 15-Point Radar Chart */}
      <div className="bg-white rounded-lg p-6">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Comprehensive EQ + PQ + IQ Analysis</h3>
        <div className="mb-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#FF6B9D' }}></div>
            <span className="text-neutral-600 font-medium">EQ (Emotional)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#4ECDC4' }}></div>
            <span className="text-neutral-600 font-medium">PQ (Professional)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#95E1D3' }}></div>
            <span className="text-neutral-600 font-medium">IQ (Intellectual)</span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={600}>
          <RechartsRadar data={chartData}>
            <PolarGrid stroke="#e5e7eb" strokeDasharray="3 3" />
            <PolarAngleAxis 
              dataKey="attribute" 
              tick={CustomTick}
            />
            <PolarRadiusAxis 
              angle={90} 
              domain={[0, 5]} 
              tick={{ fill: '#9ca3af', fontSize: 11 }}
              tickCount={6}
            />
            <Radar
              name="Faculty"
              dataKey="Faculty"
              stroke="#7EC8E3"
              fill="#7EC8E3"
              fillOpacity={0.4}
              strokeWidth={2.5}
            />
            <Radar
              name="Self"
              dataKey="Self"
              stroke="#FFB5A7"
              fill="#FFB5A7"
              fillOpacity={0.25}
              strokeWidth={2.5}
            />
            <Legend 
              wrapperStyle={{ paddingTop: '20px' }}
              iconType="circle"
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: 'white', 
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                padding: '10px 14px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}
              formatter={(value: unknown, name: string) => [
                typeof value === 'number' ? value.toFixed(1) : value,
                name
              ]}
            />
          </RechartsRadar>
        </ResponsiveContainer>
      </div>

      {/* Summary Statistics */}
      <div className="bg-gradient-to-br from-gray-50 to-white rounded-lg p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-neutral-800 mb-4">Average Scores by Pillar</h3>
        <div className="grid grid-cols-3 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: '#FF6B9D' }}>
              {((facultyData.eq_empathy + facultyData.eq_adaptability + facultyData.eq_stress + facultyData.eq_curiosity + facultyData.eq_communication) / 5).toFixed(1)}
            </div>
            <div className="text-sm text-neutral-600 font-medium">EQ (Faculty)</div>
            <div className="text-2xl font-semibold mt-2" style={{ color: '#FFB5A7' }}>
              {((selfData.eq_empathy + selfData.eq_adaptability + selfData.eq_stress + selfData.eq_curiosity + selfData.eq_communication) / 5).toFixed(1)}
            </div>
            <div className="text-sm text-neutral-500">EQ (Self)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: '#4ECDC4' }}>
              {((facultyData.pq_work_ethic + facultyData.pq_integrity + facultyData.pq_teachability + facultyData.pq_documentation + facultyData.pq_leadership) / 5).toFixed(1)}
            </div>
            <div className="text-sm text-neutral-600 font-medium">PQ (Faculty)</div>
            <div className="text-2xl font-semibold mt-2" style={{ color: '#FFB5A7' }}>
              {((selfData.pq_work_ethic + selfData.pq_integrity + selfData.pq_teachability + selfData.pq_documentation + selfData.pq_leadership) / 5).toFixed(1)}
            </div>
            <div className="text-sm text-neutral-500">PQ (Self)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold mb-1" style={{ color: '#95E1D3' }}>
              {((facultyData.iq_knowledge + facultyData.iq_analytical + facultyData.iq_learning + facultyData.iq_flexibility + facultyData.iq_performance) / 5).toFixed(1)}
            </div>
            <div className="text-sm text-neutral-600 font-medium">IQ (Faculty)</div>
            <div className="text-2xl font-semibold mt-2" style={{ color: '#FFB5A7' }}>
              {((selfData.iq_knowledge + selfData.iq_analytical + selfData.iq_learning + selfData.iq_flexibility + selfData.iq_performance) / 5).toFixed(1)}
            </div>
            <div className="text-sm text-neutral-500">IQ (Self)</div>
          </div>
        </div>
      </div>
    </div>
  );
}


