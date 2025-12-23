'use client';

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface DataPoint {
  pgy: number;
  percentile: number;
  score: number;
  rank?: number;
}

interface ClassAverage {
  pgy: number;
  percentile: number;
  score: number;
}

interface D3SlopeChartProps {
  residentData: DataPoint[];
  classAverages: ClassAverage[];
  residentName?: string;
  width?: number;
  height?: number;
}

// Linear regression calculation
function linearRegression(data: { x: number; y: number }[]): { slope: number; intercept: number } {
  const n = data.length;
  if (n < 2) return { slope: 0, intercept: data[0]?.y || 0 };

  const sumX = data.reduce((acc, d) => acc + d.x, 0);
  const sumY = data.reduce((acc, d) => acc + d.y, 0);
  const sumXY = data.reduce((acc, d) => acc + d.x * d.y, 0);
  const sumXX = data.reduce((acc, d) => acc + d.x * d.x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

const D3SlopeChart: React.FC<D3SlopeChartProps> = ({
  residentData,
  classAverages,
  residentName = 'Resident',
  width = 500,
  height = 280,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!svgRef.current) return;

    const margin = { top: 30, right: 120, bottom: 50, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Scales
    const xScale = d3.scalePoint<number>()
      .domain([1, 2, 3])
      .range([0, chartWidth])
      .padding(0.5);

    const yScale = d3.scaleLinear()
      .domain([0, 100])
      .range([chartHeight, 0]);

    // Grid lines
    g.append('g')
      .attr('class', 'grid')
      .selectAll('line')
      .data([25, 50, 75, 100])
      .enter()
      .append('line')
      .attr('x1', 0)
      .attr('x2', chartWidth)
      .attr('y1', d => yScale(d))
      .attr('y2', d => yScale(d))
      .attr('stroke', '#e5e7eb')
      .attr('stroke-dasharray', '3,3');

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => `PGY-${d}`);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '12px')
      .attr('font-weight', '500');

    g.selectAll('.domain').attr('stroke', '#d1d5db');
    g.selectAll('.tick line').attr('stroke', '#d1d5db');

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '11px');

    // Y Axis label
    g.append('text')
      .attr('transform', 'rotate(-90)')
      .attr('y', -40)
      .attr('x', -chartHeight / 2)
      .attr('text-anchor', 'middle')
      .attr('fill', '#9ca3af')
      .attr('font-size', '11px')
      .text('Percentile');

    // Line generators
    const line = d3.line<{ pgy: number; percentile: number }>()
      .x(d => xScale(d.pgy) || 0)
      .y(d => yScale(d.percentile))
      .curve(d3.curveMonotoneX);

    // Class Average Line (gray, dashed)
    if (classAverages.length > 0) {
      const avgPath = g.append('path')
        .datum(classAverages)
        .attr('fill', 'none')
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '6,4')
        .attr('d', line);

      // Animate
      const avgLength = avgPath.node()?.getTotalLength() || 0;
      avgPath
        .attr('stroke-dasharray', `${avgLength} ${avgLength}`)
        .attr('stroke-dashoffset', avgLength)
        .transition()
        .duration(1000)
        .attr('stroke-dashoffset', 0)
        .on('end', function() {
          d3.select(this).attr('stroke-dasharray', '6,4');
        });

      // Class Average Points (hollow)
      g.selectAll('.avg-point')
        .data(classAverages)
        .enter()
        .append('circle')
        .attr('class', 'avg-point')
        .attr('cx', d => xScale(d.pgy) || 0)
        .attr('cy', d => yScale(d.percentile))
        .attr('r', 5)
        .attr('fill', 'white')
        .attr('stroke', '#9ca3af')
        .attr('stroke-width', 2)
        .style('opacity', 0)
        .transition()
        .delay(1000)
        .duration(300)
        .style('opacity', 1);
    }

    // Resident Line (coral, solid)
    if (residentData.length > 0) {
      const resPath = g.append('path')
        .datum(residentData)
        .attr('fill', 'none')
        .attr('stroke', '#0EA5E9')
        .attr('stroke-width', 3)
        .attr('d', line);

      // Animate
      const resLength = resPath.node()?.getTotalLength() || 0;
      resPath
        .attr('stroke-dasharray', `${resLength} ${resLength}`)
        .attr('stroke-dashoffset', resLength)
        .transition()
        .duration(1200)
        .attr('stroke-dashoffset', 0)
        .on('end', function() {
          d3.select(this).attr('stroke-dasharray', null);
        });

      // Resident Points (filled)
      g.selectAll('.res-point')
        .data(residentData)
        .enter()
        .append('circle')
        .attr('class', 'res-point')
        .attr('cx', d => xScale(d.pgy) || 0)
        .attr('cy', d => yScale(d.percentile))
        .attr('r', 6)
        .attr('fill', '#0EA5E9')
        .attr('stroke', 'white')
        .attr('stroke-width', 2)
        .style('cursor', 'pointer')
        .style('opacity', 0)
        .transition()
        .delay(1200)
        .duration(300)
        .style('opacity', 1);

      // Trend Line (if 2+ data points)
      if (residentData.length >= 2) {
        const regressionData = residentData.map(d => ({ x: d.pgy, y: d.percentile }));
        const { slope, intercept } = linearRegression(regressionData);

        // Check if we need to project to PGY-3
        const hasPgy3 = residentData.some(d => d.pgy === 3);
        
        if (!hasPgy3) {
          const lastPgy = Math.max(...residentData.map(d => d.pgy));
          const projectedPgy = 3;
          const projectedPercentile = Math.min(100, Math.max(0, slope * projectedPgy + intercept));

          // Projection line (dashed)
          const projLine = d3.line<{ pgy: number; percentile: number }>()
            .x(d => xScale(d.pgy) || 0)
            .y(d => yScale(d.percentile));

          const lastPoint = residentData.find(d => d.pgy === lastPgy);
          if (lastPoint) {
            g.append('path')
              .datum([
                { pgy: lastPgy, percentile: lastPoint.percentile },
                { pgy: projectedPgy, percentile: projectedPercentile }
              ])
              .attr('fill', 'none')
              .attr('stroke', '#0EA5E9')
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '4,4')
              .attr('opacity', 0.6)
              .attr('d', projLine)
              .style('opacity', 0)
              .transition()
              .delay(1500)
              .duration(500)
              .style('opacity', 0.6);

            // Projected point (hollow)
            g.append('circle')
              .attr('cx', xScale(projectedPgy) || 0)
              .attr('cy', yScale(projectedPercentile))
              .attr('r', 6)
              .attr('fill', 'white')
              .attr('stroke', '#0EA5E9')
              .attr('stroke-width', 2)
              .attr('stroke-dasharray', '3,2')
              .style('opacity', 0)
              .transition()
              .delay(2000)
              .duration(300)
              .style('opacity', 1);

            // Projected label
            g.append('text')
              .attr('x', (xScale(projectedPgy) || 0) + 10)
              .attr('y', yScale(projectedPercentile) + 4)
              .attr('fill', '#0EA5E9')
              .attr('font-size', '10px')
              .attr('font-style', 'italic')
              .text(`~${Math.round(projectedPercentile)}%`)
              .style('opacity', 0)
              .transition()
              .delay(2000)
              .duration(300)
              .style('opacity', 1);
          }
        }
      }
    }

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 15}, ${margin.top})`);

    // Resident legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#0EA5E9')
      .attr('stroke-width', 3);

    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 0)
      .attr('r', 4)
      .attr('fill', '#0EA5E9');

    legend.append('text')
      .attr('x', 25)
      .attr('y', 4)
      .attr('fill', '#374151')
      .attr('font-size', '11px')
      .text(residentName.length > 12 ? residentName.slice(0, 12) + '...' : residentName);

    // Class Average legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 20)
      .attr('y1', 25)
      .attr('y2', 25)
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 2)
      .attr('stroke-dasharray', '4,3');

    legend.append('circle')
      .attr('cx', 10)
      .attr('cy', 25)
      .attr('r', 4)
      .attr('fill', 'white')
      .attr('stroke', '#9ca3af')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 25)
      .attr('y', 29)
      .attr('fill', '#6b7280')
      .attr('font-size', '11px')
      .text('Class Avg');

    // Projected legend (if applicable)
    if (residentData.length >= 2 && !residentData.some(d => d.pgy === 3)) {
      legend.append('line')
        .attr('x1', 0)
        .attr('x2', 20)
        .attr('y1', 50)
        .attr('y2', 50)
        .attr('stroke', '#0EA5E9')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.6);

      legend.append('circle')
        .attr('cx', 10)
        .attr('cy', 50)
        .attr('r', 4)
        .attr('fill', 'white')
        .attr('stroke', '#0EA5E9')
        .attr('stroke-width', 2);

      legend.append('text')
        .attr('x', 25)
        .attr('y', 54)
        .attr('fill', '#9ca3af')
        .attr('font-size', '11px')
        .attr('font-style', 'italic')
        .text('Projected');
    }

  }, [residentData, classAverages, residentName, width, height]);

  return (
    <div className="relative">
      <svg ref={svgRef} />
      <div
        ref={tooltipRef}
        className="absolute hidden bg-white shadow-lg rounded-lg p-2 text-xs border border-neutral-200 pointer-events-none z-50"
      />
    </div>
  );
};

export default D3SlopeChart;






