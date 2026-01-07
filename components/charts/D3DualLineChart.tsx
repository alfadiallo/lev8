'use client';

import React, { useRef, useEffect } from 'react';
import * as d3 from 'd3';

interface RoshDataPoint {
  period: string; // 'F1', 'S1', 'F2', 'S2', 'F3', 'S3'
  completion: number | null; // 0-100
  accuracy: number | null; // 0-100
  label?: string; // e.g., 'Fall 2023'
}

interface D3DualLineChartProps {
  data: RoshDataPoint[];
  currentPeriod?: string; // Highlight current period
  width?: number;
  height?: number;
}

const PERIOD_LABELS: Record<string, string> = {
  'F1': 'Fall Y1',
  'S1': 'Spr Y1',
  'F2': 'Fall Y2',
  'S2': 'Spr Y2',
  'F3': 'Fall Y3',
  'S3': 'Spr Y3',
};

const D3DualLineChart: React.FC<D3DualLineChartProps> = ({
  data,
  currentPeriod,
  width = 500,
  height = 220,
}) => {
  const svgRef = useRef<SVGSVGElement | null>(null);

  useEffect(() => {
    if (!svgRef.current || data.length === 0) return;

    const margin = { top: 30, right: 100, bottom: 45, left: 50 };
    const chartWidth = width - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    // Clear previous
    d3.select(svgRef.current).selectAll('*').remove();

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height);

    const g = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Ensure all 6 periods are represented
    const allPeriods = ['F1', 'S1', 'F2', 'S2', 'F3', 'S3'];
    const fullData = allPeriods.map(period => {
      const existing = data.find(d => d.period === period);
      return existing || { period, completion: null, accuracy: null };
    });

    // Scales
    const xScale = d3.scalePoint<string>()
      .domain(allPeriods)
      .range([0, chartWidth])
      .padding(0.3);

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
      .attr('stroke', '#f3f4f6')
      .attr('stroke-width', 1);

    // X Axis
    const xAxis = d3.axisBottom(xScale)
      .tickFormat(d => PERIOD_LABELS[d] || d);

    g.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(xAxis)
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '10px')
      .attr('transform', 'rotate(-20)')
      .attr('text-anchor', 'end');

    g.selectAll('.domain').attr('stroke', '#e5e7eb');
    g.selectAll('.tick line').attr('stroke', '#e5e7eb');

    // Y Axis
    const yAxis = d3.axisLeft(yScale)
      .ticks(5)
      .tickFormat(d => `${d}%`);

    g.append('g')
      .call(yAxis)
      .selectAll('text')
      .attr('fill', '#6b7280')
      .attr('font-size', '10px');

    // PGY year labels below x-axis
    const pgyLabels = [
      { x: (xScale('F1')! + xScale('S1')!) / 2, label: 'PGY-1' },
      { x: (xScale('F2')! + xScale('S2')!) / 2, label: 'PGY-2' },
      { x: (xScale('F3')! + xScale('S3')!) / 2, label: 'PGY-3' },
    ];

    pgyLabels.forEach(({ x, label }) => {
      g.append('text')
        .attr('x', x)
        .attr('y', chartHeight + 40)
        .attr('text-anchor', 'middle')
        .attr('fill', '#9ca3af')
        .attr('font-size', '10px')
        .attr('font-weight', '500')
        .text(label);
    });

    // Line generators (skip null values)
    const completionLine = d3.line<RoshDataPoint>()
      .defined(d => d.completion !== null)
      .x(d => xScale(d.period) || 0)
      .y(d => yScale(d.completion || 0))
      .curve(d3.curveMonotoneX);

    const accuracyLine = d3.line<RoshDataPoint>()
      .defined(d => d.accuracy !== null)
      .x(d => xScale(d.period) || 0)
      .y(d => yScale(d.accuracy || 0))
      .curve(d3.curveMonotoneX);

    // Completion Line (Coral)
    const completionPath = g.append('path')
      .datum(fullData.filter(d => d.completion !== null))
      .attr('fill', 'none')
      .attr('stroke', '#0EA5E9')
      .attr('stroke-width', 2.5)
      .attr('d', completionLine);

    // Animate completion line
    const compLength = completionPath.node()?.getTotalLength() || 0;
    completionPath
      .attr('stroke-dasharray', `${compLength} ${compLength}`)
      .attr('stroke-dashoffset', compLength)
      .transition()
      .duration(1000)
      .attr('stroke-dashoffset', 0);

    // Completion Points
    g.selectAll('.comp-point')
      .data(fullData.filter(d => d.completion !== null))
      .enter()
      .append('circle')
      .attr('class', 'comp-point')
      .attr('cx', d => xScale(d.period) || 0)
      .attr('cy', d => yScale(d.completion || 0))
      .attr('r', d => d.period === currentPeriod ? 7 : 5)
      .attr('fill', d => d.period === currentPeriod ? '#0EA5E9' : 'white')
      .attr('stroke', '#0EA5E9')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .delay(1000)
      .duration(300)
      .style('opacity', 1);

    // Accuracy Line (Blue)
    const accuracyPath = g.append('path')
      .datum(fullData.filter(d => d.accuracy !== null))
      .attr('fill', 'none')
      .attr('stroke', '#7EC8E3')
      .attr('stroke-width', 2.5)
      .attr('d', accuracyLine);

    // Animate accuracy line
    const accLength = accuracyPath.node()?.getTotalLength() || 0;
    accuracyPath
      .attr('stroke-dasharray', `${accLength} ${accLength}`)
      .attr('stroke-dashoffset', accLength)
      .transition()
      .duration(1000)
      .delay(200)
      .attr('stroke-dashoffset', 0);

    // Accuracy Points
    g.selectAll('.acc-point')
      .data(fullData.filter(d => d.accuracy !== null))
      .enter()
      .append('circle')
      .attr('class', 'acc-point')
      .attr('cx', d => xScale(d.period) || 0)
      .attr('cy', d => yScale(d.accuracy || 0))
      .attr('r', d => d.period === currentPeriod ? 7 : 5)
      .attr('fill', d => d.period === currentPeriod ? '#7EC8E3' : 'white')
      .attr('stroke', '#7EC8E3')
      .attr('stroke-width', 2)
      .style('opacity', 0)
      .transition()
      .delay(1200)
      .duration(300)
      .style('opacity', 1);

    // Value labels on points (for current period or last available)
    const lastCompletion = [...fullData].reverse().find(d => d.completion !== null);
    const lastAccuracy = [...fullData].reverse().find(d => d.accuracy !== null);

    if (lastCompletion) {
      g.append('text')
        .attr('x', (xScale(lastCompletion.period) || 0) + 8)
        .attr('y', yScale(lastCompletion.completion || 0) + 4)
        .attr('fill', '#0EA5E9')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(`${lastCompletion.completion}%`)
        .style('opacity', 0)
        .transition()
        .delay(1300)
        .duration(300)
        .style('opacity', 1);
    }

    if (lastAccuracy) {
      g.append('text')
        .attr('x', (xScale(lastAccuracy.period) || 0) + 8)
        .attr('y', yScale(lastAccuracy.accuracy || 0) + 4)
        .attr('fill', '#7EC8E3')
        .attr('font-size', '11px')
        .attr('font-weight', '600')
        .text(`${lastAccuracy.accuracy}%`)
        .style('opacity', 0)
        .transition()
        .delay(1500)
        .duration(300)
        .style('opacity', 1);
    }

    // Current period highlight
    if (currentPeriod && allPeriods.includes(currentPeriod)) {
      g.append('line')
        .attr('x1', xScale(currentPeriod) || 0)
        .attr('x2', xScale(currentPeriod) || 0)
        .attr('y1', 0)
        .attr('y2', chartHeight)
        .attr('stroke', '#fbbf24')
        .attr('stroke-width', 2)
        .attr('stroke-dasharray', '4,4')
        .attr('opacity', 0.5);
    }

    // Legend
    const legend = svg.append('g')
      .attr('transform', `translate(${width - margin.right + 10}, ${margin.top})`);

    // Completion legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 18)
      .attr('y1', 0)
      .attr('y2', 0)
      .attr('stroke', '#0EA5E9')
      .attr('stroke-width', 2.5);

    legend.append('circle')
      .attr('cx', 9)
      .attr('cy', 0)
      .attr('r', 4)
      .attr('fill', 'white')
      .attr('stroke', '#0EA5E9')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 24)
      .attr('y', 4)
      .attr('fill', '#374151')
      .attr('font-size', '10px')
      .text('Completion');

    // Accuracy legend
    legend.append('line')
      .attr('x1', 0)
      .attr('x2', 18)
      .attr('y1', 22)
      .attr('y2', 22)
      .attr('stroke', '#7EC8E3')
      .attr('stroke-width', 2.5);

    legend.append('circle')
      .attr('cx', 9)
      .attr('cy', 22)
      .attr('r', 4)
      .attr('fill', 'white')
      .attr('stroke', '#7EC8E3')
      .attr('stroke-width', 2);

    legend.append('text')
      .attr('x', 24)
      .attr('y', 26)
      .attr('fill', '#374151')
      .attr('font-size', '10px')
      .text('Accuracy');

  }, [data, currentPeriod, width, height]);

  return <svg ref={svgRef} />;
};

export default D3DualLineChart;








