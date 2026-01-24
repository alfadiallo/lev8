// D3.js Line Chart for EQ/PQ/IQ Attribute Scores Over Time
'use client';

import React, { useMemo, useEffect, useRef, useCallback } from 'react';
import { Info } from 'lucide-react';
import * as d3 from 'd3';

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

interface AttributeTimelineChartD3Props {
  allPeriodScores: PeriodScoreData[];
  residentId?: string;
  classYear?: number;
}

// Attribute definitions
const ATTRIBUTES = {
  eq: [
    { key: 'empathy', label: 'Empathy & Positive Interactions', short: 'Empathy' },
    { key: 'curiosity', label: 'Curiosity & Growth Mindset', short: 'Curiosity' },
    { key: 'stress_mgmt', label: 'Stress Management & Resilience', short: 'Stress Mgmt' },
    { key: 'adaptability', label: 'Adaptability & Self-Awareness', short: 'Adaptability' },
    { key: 'communication', label: 'Communication Skills', short: 'Communication' },
  ],
  pq: [
    { key: 'integrity', label: 'Integrity & Accountability', short: 'Integrity' },
    { key: 'leadership', label: 'Leadership & Initiative', short: 'Leadership' },
    { key: 'work_ethic', label: 'Work Ethic & Reliability', short: 'Work Ethic' },
    { key: 'teachability', label: 'Teachability & Receptiveness', short: 'Teachability' },
    { key: 'documentation', label: 'Documentation & Organization', short: 'Documentation' },
  ],
  iq: [
    { key: 'learning', label: 'Learning & Knowledge Application', short: 'Learning' },
    { key: 'knowledge', label: 'Medical Knowledge & Expertise', short: 'Knowledge' },
    { key: 'analytical', label: 'Analytical & Problem-Solving', short: 'Analytical' },
    { key: 'flexibility', label: 'Cognitive Flexibility', short: 'Flexibility' },
    { key: 'performance', label: 'Clinical Performance Under Pressure', short: 'Performance' },
  ],
};

const CATEGORY_INFO = {
  eq: { text: '#15803d', label: 'Emotional Quotient (EQ)', bg: '#dcfce7' },
  pq: { text: '#1d4ed8', label: 'Professional Quotient (PQ)', bg: '#dbeafe' },
  iq: { text: '#7e22ce', label: 'Intellectual Quotient (IQ)', bg: '#f3e8ff' },
};

// The coral/brownish color from the ITE chart
const LINE_COLOR = '#0EA5E9';
const POINT_COLOR = '#0EA5E9';

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

// Short period label
function shortPeriod(period: string): string {
  return period.replace('PGY-', '').replace(' Fall', 'F').replace(' Spring', 'S');
}

export function AttributeTimelineChartD3({ allPeriodScores, residentId: _residentId, classYear: _classYear }: AttributeTimelineChartD3Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Tooltip handlers
  const showTooltip = useCallback((x: number, y: number, title: string, period: string, score: string) => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'block';
      tooltipRef.current.style.left = `${x}px`;
      tooltipRef.current.style.top = `${y - 8}px`;
      tooltipRef.current.innerHTML = `
        <div style="font-weight: 600; margin-bottom: 4px;">${title}</div>
        <div>${period}: <span style="font-weight: 600;">${score}</span></div>
      `;
    }
  }, []);

  const hideTooltip = useCallback(() => {
    if (tooltipRef.current) {
      tooltipRef.current.style.display = 'none';
    }
  }, []);

  // Filter to only periods with ai_scores_detail
  const validPeriods = useMemo(() => {
    return allPeriodScores.filter(p => p.ai_scores_detail !== null);
  }, [allPeriodScores]);

  // Get sorted period labels
  const sortedPeriodLabels = useMemo(() => {
    const labels = validPeriods.map(p => p.period_label);
    return sortPeriods(labels);
  }, [validPeriods]);

  // Calculate totals for header
  const totalComments = validPeriods.reduce((sum, p) => sum + (p.ai_n_comments || 0), 0);
  const avgConfidence = validPeriods.length > 0
    ? validPeriods.reduce((sum, p) => sum + (p.ai_confidence_avg || 0), 0) / validPeriods.length
    : 0;

  // Get score for a specific attribute and period
  const getScore = useCallback((category: 'eq' | 'pq' | 'iq', attrKey: string, periodLabel: string): number => {
    const periodData = validPeriods.find(p => p.period_label === periodLabel);
    if (!periodData?.ai_scores_detail) return 0;
    const categoryData = periodData.ai_scores_detail[category];
    return Number((categoryData as any)[attrKey]) || 0;
  }, [validPeriods]);

  // Chart dimensions
  const margin = { top: 20, right: 30, bottom: 40, left: 35 };
  const attributeWidth = 180;
  const chartHeight = 160;

  // Render a single attribute line chart
  const renderAttributeChart = useCallback((
    svgElement: SVGSVGElement,
    category: 'eq' | 'pq' | 'iq',
    attr: typeof ATTRIBUTES.eq[0],
    animate: boolean
  ) => {
    const svg = d3.select(svgElement);
    svg.selectAll('*').remove();

    const width = attributeWidth;
    const height = chartHeight;
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create scales
    const xScale = d3.scalePoint<string>()
      .domain(sortedPeriodLabels)
      .range([0, innerWidth])
      .padding(0.3);

    const yScale = d3.scaleLinear()
      .domain([0, 5])
      .range([innerHeight, 0]);

    // Create container group
    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Add subtle grid lines
    g.selectAll('.grid-line')
      .data([1, 2, 3, 4, 5])
      .join('line')
      .attr('class', 'grid-line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e5e7eb')
      .attr('stroke-width', 1);

    // Prepare data points
    const dataPoints = sortedPeriodLabels.map(period => ({
      period,
      score: getScore(category, attr.key, period)
    })).filter(d => d.score > 0);

    if (dataPoints.length === 0) {
      // No data - show message
      g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', '10px')
        .text('No data');
      return;
    }

    // Calculate overall average and draw a single horizontal line
    const allScores = dataPoints.map(d => d.score);
    const overallAvg = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    // Draw single average line across entire chart at 50% opacity
    g.append('line')
      .attr('x1', 0)
      .attr('x2', innerWidth)
      .attr('y1', yScale(overallAvg))
      .attr('y2', yScale(overallAvg))
      .attr('stroke', LINE_COLOR)
      .attr('stroke-width', 2)
      .attr('opacity', 0.5);

    // Line generator with extra smooth curve
    const line = d3.line<{ period: string; score: number }>()
      .x(d => xScale(d.period) || 0)
      .y(d => yScale(d.score))
      .curve(d3.curveCatmullRom.alpha(0.5));

    // Draw the line
    const path = g.append('path')
      .datum(dataPoints)
      .attr('fill', 'none')
      .attr('stroke', LINE_COLOR)
      .attr('stroke-width', 2)
      .attr('stroke-linecap', 'round')
      .attr('stroke-linejoin', 'round')
      .attr('d', line);

    // Animate line drawing
    if (animate) {
      const pathLength = path.node()?.getTotalLength() || 0;
      path
        .attr('stroke-dasharray', `${pathLength} ${pathLength}`)
        .attr('stroke-dashoffset', pathLength)
        .transition()
        .duration(1000)
        .ease(d3.easeQuadOut)
        .attr('stroke-dashoffset', 0);
    }

    // Invisible hover areas for tooltips (larger hit targets)
    g.selectAll('.hover-area')
      .data(dataPoints)
      .join('circle')
      .attr('class', 'hover-area')
      .attr('cx', d => xScale(d.period) || 0)
      .attr('cy', d => yScale(d.score))
      .attr('r', 12)
      .attr('fill', 'transparent')
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        const rect = (event.target as Element).getBoundingClientRect();
        showTooltip(rect.left + rect.width / 2, rect.top, attr.label, d.period, d.score.toFixed(1));
      })
      .on('mouseleave', function() {
        hideTooltip();
      });

    // X-axis
    const xAxis = g.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(xScale).tickFormat(d => shortPeriod(d as string)));

    xAxis.selectAll('text')
      .attr('font-size', '9px')
      .attr('fill', '#6b7280');

    xAxis.select('.domain').attr('stroke', '#e5e7eb');
    xAxis.selectAll('.tick line').attr('stroke', '#e5e7eb');

    // Y-axis labels (0, 1, 2, 3, 4, 5)
    [0, 1, 2, 3, 4, 5].forEach(val => {
      g.append('text')
        .attr('x', -8)
        .attr('y', yScale(val) + 3)
        .attr('text-anchor', 'end')
        .attr('font-size', '9px')
        .attr('fill', '#9ca3af')
        .text(val);
    });

  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sortedPeriodLabels, getScore, showTooltip, hideTooltip]);

  // Single attribute chart component
  const AttributeChart = ({ 
    category, 
    attr
  }: { 
    category: 'eq' | 'pq' | 'iq'; 
    attr: typeof ATTRIBUTES.eq[0];
  }) => {
    const svgRef = useRef<SVGSVGElement>(null);
    const hasRendered = useRef(false);

    useEffect(() => {
      if (!svgRef.current) return;
      
      const shouldAnimate = !hasRendered.current;
      hasRendered.current = true;
      
      renderAttributeChart(svgRef.current, category, attr, shouldAnimate);
    }, [category, attr]);

    return (
      <div className="flex flex-col items-center">
        <svg
          ref={svgRef}
          width={attributeWidth}
          height={chartHeight}
          style={{ overflow: 'visible' }}
        />
        <div className="mt-1 text-xs text-gray-700 font-medium text-center leading-tight max-w-[160px]">
          {attr.short}
        </div>
      </div>
    );
  };

  if (validPeriods.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6 text-center">
        <p className="text-gray-500">No AI-generated scores available yet.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="bg-white rounded-lg border border-gray-200 p-6 mb-6 relative">
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        style={{
          position: 'fixed',
          zIndex: 9999,
          display: 'none',
          padding: '8px 12px',
          backgroundColor: 'rgba(17, 24, 39, 0.95)',
          color: 'white',
          fontSize: '12px',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
          pointerEvents: 'none',
          transform: 'translate(-50%, -100%)',
          maxWidth: '250px',
          textAlign: 'center'
        }}
      />

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
          <span>Hover for details</span>
        </div>
      </div>

      {/* Charts by Category */}
      <div className="space-y-6">
        {(['eq', 'pq', 'iq'] as const).map((category) => {
          const info = CATEGORY_INFO[category];
          
          return (
            <div key={category}>
              {/* Category Header */}
              <div 
                className="text-sm font-semibold mb-3 pb-2"
                style={{ color: info.text, borderBottom: `2px solid ${info.bg}` }}
              >
                {info.label}
              </div>
              
              {/* Attributes Row */}
              <div className="flex justify-between gap-2 overflow-x-auto">
                {ATTRIBUTES[category].map((attr) => (
                  <AttributeChart
                    key={attr.key}
                    category={category}
                    attr={attr}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Methodology Note */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-start gap-2 text-xs text-gray-500">
          <Info className="h-3 w-3 mt-0.5 flex-shrink-0" />
          <p>
            <strong>Methodology:</strong> Scores represent AI interpretation of narrative evaluation comments 
            using the EQ+PQ+IQ framework. Each point shows the score for one academic period.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AttributeTimelineChartD3;
