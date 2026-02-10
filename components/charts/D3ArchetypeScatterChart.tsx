'use client';

import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import { MEMORIAL_ARCHETYPES, TWO_YEAR_ARCHETYPES, ONE_YEAR_ARCHETYPES } from '@/lib/archetypes/memorial-archetypes';

export interface ScatterDataPoint {
  id: string;
  name: string;
  pgy1: number | null;
  pgy2: number | null;
  pgy3: number | null;
  delta: number | null;  // PGY1->PGY2 or total
  archetype: string;
  archetypeId: string;
  color: string;
  confidence: number;
  riskLevel: string;
  isProvisional: boolean;
}

interface D3ArchetypeScatterChartProps {
  data: ScatterDataPoint[];
  width?: number;
  height?: number;
  onResidentClick?: (residentId: string) => void;
}

// Get all unique archetype colors for legend
function getArchetypeColorMap(): Map<string, { color: string; riskLevel: string }> {
  const colorMap = new Map<string, { color: string; riskLevel: string }>();
  
  // Add from MEMORIAL_ARCHETYPES
  Object.values(MEMORIAL_ARCHETYPES).forEach(a => {
    colorMap.set(a.name, { color: a.color, riskLevel: a.riskLevel });
  });
  
  // Add from TWO_YEAR_ARCHETYPES
  Object.values(TWO_YEAR_ARCHETYPES).forEach(a => {
    if (!colorMap.has(a.name)) {
      colorMap.set(a.name, { color: a.color, riskLevel: a.riskLevel });
    }
  });
  
  // Add from ONE_YEAR_ARCHETYPES
  Object.values(ONE_YEAR_ARCHETYPES).forEach(a => {
    if (!colorMap.has(a.name)) {
      colorMap.set(a.name, { color: a.color, riskLevel: a.riskLevel });
    }
  });
  
  return colorMap;
}

const D3ArchetypeScatterChart: React.FC<D3ArchetypeScatterChartProps> = ({
  data,
  width = 600,
  height = 400,
  onResidentClick,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<ScatterDataPoint | null>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    const margin = { top: 40, right: 180, bottom: 60, left: 60 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Filter data to only include points with valid pgy1 and delta
    const validData = data.filter(d => d.pgy1 !== null && d.delta !== null);

    if (validData.length === 0) {
      // Show empty state
      svg.append('text')
        .attr('x', width / 2)
        .attr('y', height / 2)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', '14px')
        .text('No ITE trajectory data available for this class');
      return;
    }

    // Scales
    const xScale = d3.scaleLinear()
      .domain([0, 100])
      .range([0, chartWidth]);

    // Calculate y domain based on data, centered around 0
    const deltaExtent = d3.extent(validData, d => d.delta!) as [number, number];
    const maxAbsDelta = Math.max(Math.abs(deltaExtent[0] || 0), Math.abs(deltaExtent[1] || 0), 30);
    const yDomain = [-maxAbsDelta - 5, maxAbsDelta + 5];

    const yScale = d3.scaleLinear()
      .domain(yDomain)
      .range([chartHeight, 0]);

    // Background quadrants
    const quadrantLabels = [
      { x: chartWidth * 0.25, y: chartHeight * 0.25, text: 'Low Start, Improving', color: '#9B59B6' },
      { x: chartWidth * 0.75, y: chartHeight * 0.25, text: 'High Start, Improving', color: '#1ABC9C' },
      { x: chartWidth * 0.25, y: chartHeight * 0.75, text: 'Low Start, Declining', color: '#E74C3C' },
      { x: chartWidth * 0.75, y: chartHeight * 0.75, text: 'High Start, Declining', color: '#E67E22' },
    ];

    // Draw quadrant backgrounds (subtle)
    g.append('rect')
      .attr('x', 0)
      .attr('y', 0)
      .attr('width', chartWidth / 2)
      .attr('height', chartHeight / 2)
      .attr('fill', '#9B59B6')
      .attr('opacity', 0.03);

    g.append('rect')
      .attr('x', chartWidth / 2)
      .attr('y', 0)
      .attr('width', chartWidth / 2)
      .attr('height', chartHeight / 2)
      .attr('fill', '#1ABC9C')
      .attr('opacity', 0.03);

    g.append('rect')
      .attr('x', 0)
      .attr('y', chartHeight / 2)
      .attr('width', chartWidth / 2)
      .attr('height', chartHeight / 2)
      .attr('fill', '#E74C3C')
      .attr('opacity', 0.03);

    g.append('rect')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight / 2)
      .attr('width', chartWidth / 2)
      .attr('height', chartHeight / 2)
      .attr('fill', '#E67E22')
      .attr('opacity', 0.03);

    // Draw quadrant labels
    quadrantLabels.forEach(q => {
      g.append('text')
        .attr('x', q.x)
        .attr('y', q.y)
        .attr('text-anchor', 'middle')
        .attr('fill', q.color)
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .attr('opacity', 0.6)
        .text(q.text);
    });

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line.horizontal')
      .data(yScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', '3,3');

    g.append('g')
      .attr('class', 'grid')
      .selectAll('line.vertical')
      .data(xScale.ticks(5))
      .enter()
      .append('line')
      .attr('x1', d => xScale(d))
      .attr('x2', d => xScale(d))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', '3,3');

    // Zero line (horizontal) - more prominent
    g.append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', yScale(0))
      .attr('y2', yScale(0))
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 1.5);

    // 50th percentile line (vertical)
    g.append('line')
      .attr('x1', xScale(50))
      .attr('x2', xScale(50))
      .attr('y1', 0)
      .attr('y2', chartHeight)
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 1.5);

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '11px');

    g.selectAll('.domain').attr('stroke', '#d1d5db');
    g.selectAll('.tick line').attr('stroke', '#d1d5db');

    // X Axis label
    g.append('text')
      .attr('x', chartWidth / 2)
      .attr('y', chartHeight + 45)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .text('PGY-1 Percentile');

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => {
        const n = Number(d);
        return `${n > 0 ? '+' : ''}${n}`;
      });

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '11px');

    // Y Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -45)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#6b7280')
      .attr('font-size', '12px')
      .attr('font-weight', '500')
      .text('Delta (PGY-1 → PGY-2)');

    // Draw points
    const points = g.selectAll('.point')
      .data(validData)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', d => xScale(d.pgy1!))
      .attr('cy', d => yScale(d.delta!))
      .attr('r', d => 5 + (d.confidence * 4)) // Size based on confidence (5-9px)
      .attr('fill', d => d.color)
      .attr('stroke', '#fff')
      .attr('stroke-width', 2)
      .attr('opacity', d => d.isProvisional ? 0.7 : 0.9)
      .style('cursor', 'pointer')
      .on('mouseenter', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', (d.confidence * 4) + 8)
          .attr('stroke-width', 3);
        
        setHoveredPoint(d);
        
        if (tooltipRef.current) {
          const rect = svgRef.current!.getBoundingClientRect();
          tooltipRef.current.style.left = `${event.clientX - rect.left + 15}px`;
          tooltipRef.current.style.top = `${event.clientY - rect.top - 10}px`;
          tooltipRef.current.style.display = 'block';
        }
      })
      .on('mouseleave', function(event, d) {
        d3.select(this)
          .transition()
          .duration(150)
          .attr('r', 5 + (d.confidence * 4))
          .attr('stroke-width', 2);
        
        setHoveredPoint(null);
        
        if (tooltipRef.current) {
          tooltipRef.current.style.display = 'none';
        }
      })
      .on('click', function(event, d) {
        if (onResidentClick) {
          onResidentClick(d.id);
        }
      });

    // Animate points
    points
      .attr('r', 0)
      .transition()
      .delay((d, i) => i * 30)
      .duration(400)
      .attr('r', d => 5 + (d.confidence * 4));

    // Legend
    const archetypesInData = [...new Set(validData.map(d => d.archetype))];
    const archetypeColorMap = getArchetypeColorMap();
    
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);

    legend.append('text')
      .attr('x', 0)
      .attr('y', 0)
      .attr('font-size', '12px')
      .attr('font-weight', '600')
      .attr('fill', '#374151')
      .text('Archetypes');

    archetypesInData.forEach((archetype, idx) => {
      const colorInfo = archetypeColorMap.get(archetype);
      const color = colorInfo?.color || '#7F8C8D';
      const count = validData.filter(d => d.archetype === archetype).length;

      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${20 + idx * 22})`);

      legendItem.append('circle')
        .attr('cx', 6)
        .attr('cy', 0)
        .attr('r', 5)
        .attr('fill', color);

      legendItem.append('text')
        .attr('x', 16)
        .attr('y', 4)
        .attr('font-size', '10px')
        .attr('fill', '#4b5563')
        .text(`${archetype} (${count})`);
    });

  }, [data, width, height, onResidentClick]);

  return (
    <div className="relative">
      <svg ref={svgRef} />
      
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="absolute hidden bg-white shadow-xl rounded-lg p-3 text-sm border border-neutral-200 pointer-events-none z-50 min-w-[200px]"
        style={{ display: 'none' }}
      >
        {hoveredPoint && (
          <div>
            <div className="font-semibold text-neutral-800 mb-2">{hoveredPoint.name}</div>
            <div className="flex items-center gap-2 mb-2">
              <span 
                className="w-3 h-3 rounded-full" 
                style={{ backgroundColor: hoveredPoint.color }}
              />
              <span className="text-neutral-600">{hoveredPoint.archetype}</span>
              {hoveredPoint.isProvisional && (
                <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded">
                  Provisional
                </span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
              <div className="text-neutral-500">PGY-1:</div>
              <div className="font-medium">{hoveredPoint.pgy1 !== null ? `${hoveredPoint.pgy1}%` : '-'}</div>
              <div className="text-neutral-500">PGY-2:</div>
              <div className="font-medium">{hoveredPoint.pgy2 !== null ? `${hoveredPoint.pgy2}%` : '-'}</div>
              {hoveredPoint.pgy3 !== null && (
                <>
                  <div className="text-neutral-500">PGY-3:</div>
                  <div className="font-medium">{hoveredPoint.pgy3}%</div>
                </>
              )}
              <div className="text-neutral-500">Delta:</div>
              <div className={`font-medium ${(hoveredPoint.delta || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {hoveredPoint.delta !== null ? `${hoveredPoint.delta > 0 ? '+' : ''}${hoveredPoint.delta}` : '-'}
              </div>
              <div className="text-neutral-500">Risk:</div>
              <div className={`font-medium ${
                hoveredPoint.riskLevel === 'Low' ? 'text-green-600' :
                hoveredPoint.riskLevel === 'Moderate' ? 'text-amber-600' : 'text-red-600'
              }`}>
                {hoveredPoint.riskLevel}
              </div>
            </div>
            <div className="text-xs text-neutral-400 mt-2 pt-2 border-t border-neutral-100">
              Click to view details
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default D3ArchetypeScatterChart;
