'use client';

import { useEffect, useRef } from 'react';
import * as d3 from 'd3';

interface RadarData {
  subject: string;
  value: number;
  fullMark: number;
}

interface D3RadarChartProps {
  data: RadarData[];
  width?: number;
  height?: number;
  margin?: { top: number; right: number; bottom: number; left: number };
  color?: string;
}

export default function D3RadarChart({
  data,
  width = 300,
  height = 300,
  margin = { top: 20, right: 30, bottom: 20, left: 30 },
  color = '#0EA5E9'
}: D3RadarChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!svgRef.current || !data || data.length === 0) return;

    // Clear previous render
    d3.select(svgRef.current).selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const radius = Math.min(innerWidth, innerHeight) / 2;

    const svg = d3
      .select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Scales
    const rScale = d3.scaleLinear().range([0, radius]).domain([0, 100]); // Assuming percentage 0-100
    const angleScale = d3
      .scaleBand()
      .range([0, 2 * Math.PI])
      .domain(data.map((d) => d.subject));

    // Draw Grid Circles
    const ticks = [20, 40, 60, 80, 100];
    svg
      .selectAll('.grid-circle')
      .data(ticks)
      .enter()
      .append('circle')
      .attr('class', 'grid-circle')
      .attr('r', (d) => rScale(d))
      .style('fill', 'none')
      .style('stroke', '#e5e5e5')
      .style('stroke-dasharray', '3,3');

    // Draw Axes
    const axes = svg
      .selectAll('.axis')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'axis');

    axes
      .append('line')
      .attr('x1', 0)
      .attr('y1', 0)
      .attr('x2', (d) => rScale(100) * Math.cos(angleScale(d.subject)! - Math.PI / 2))
      .attr('y2', (d) => rScale(100) * Math.sin(angleScale(d.subject)! - Math.PI / 2))
      .style('stroke', '#e5e5e5')
      .style('stroke-width', '1px');

    // Draw Labels
    axes
      .append('text')
      .attr('x', (d) => (rScale(100) + 20) * Math.cos(angleScale(d.subject)! - Math.PI / 2))
      .attr('y', (d) => (rScale(100) + 20) * Math.sin(angleScale(d.subject)! - Math.PI / 2))
      .text((d) => d.subject)
      .style('text-anchor', 'middle')
      .style('alignment-baseline', 'middle')
      .style('font-size', '10px')
      .style('fill', '#666')
      .style('font-family', 'sans-serif');

    // Draw Radar Path
    const line = d3
      .lineRadial<RadarData>()
      .angle((d) => angleScale(d.subject)!)
      .radius((d) => rScale(d.value))
      .curve(d3.curveLinearClosed);

    svg
      .append('path')
      .datum(data)
      .attr('d', line)
      .style('fill', color)
      .style('fill-opacity', 0.2)
      .style('stroke', color)
      .style('stroke-width', 2);

    // Draw Points
    svg
      .selectAll('.point')
      .data(data)
      .enter()
      .append('circle')
      .attr('cx', (d) => rScale(d.value) * Math.cos(angleScale(d.subject)! - Math.PI / 2))
      .attr('cy', (d) => rScale(d.value) * Math.sin(angleScale(d.subject)! - Math.PI / 2))
      .attr('r', 4)
      .style('fill', color)
      .style('stroke', '#fff')
      .style('stroke-width', 1);

  }, [data, width, height, margin, color]);

  return <svg ref={svgRef} />;
}






