'use client';

import { useMemo } from 'react';
import type { LensProps } from './types';
import { PILLAR_COLORS, ATTR_LABELS } from './types';

interface SwotItem {
  theme: string;
  pillar: string;
  attrKey: string;
  avg: number;
  insight: string;
}

function avg(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

function SwotCard({ title, color, items }: { title: string; color: string; items: SwotItem[] }) {
  return (
    <div style={{
      flex: '1 1 420px',
      background: 'rgba(22,39,55,0.4)',
      border: `0.5px solid ${color}33`,
      borderRadius: 14,
      padding: '22px 24px',
      minHeight: 200,
    }}>
      <div style={{
        fontSize: 13,
        fontWeight: 600,
        color,
        letterSpacing: '0.06em',
        textTransform: 'uppercase' as const,
        marginBottom: 16,
        fontFamily: "'Space Mono', monospace",
      }}>{title}</div>

      {items.length === 0 ? (
        <div style={{ fontSize: 12, color: '#4a7090', fontStyle: 'italic' }}>
          Insufficient data for analysis
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {items.map((item, i) => (
            <div key={i} style={{
              padding: '12px 14px',
              background: `${color}08`,
              border: `0.5px solid ${color}15`,
              borderRadius: 10,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontSize: 12, color: '#c8e0ee', fontWeight: 500 }}>{item.theme}</span>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  color: PILLAR_COLORS[item.pillar as keyof typeof PILLAR_COLORS] || color,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: 'rgba(7,18,29,0.5)',
                }}>{item.pillar.toUpperCase()} {item.avg}</span>
              </div>
              <div style={{ fontSize: 11, color: '#4a7090', lineHeight: 1.4 }}>{item.insight}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function SwotLens({ profiles }: LensProps) {
  const swot = useMemo(() => {
    const pillars = ['eq', 'pq', 'iq'] as const;
    const attrStats: { pillar: string; key: string; label: string; avg: number; stdDev: number }[] = [];

    for (const pillar of pillars) {
      const attrs = ATTR_LABELS[pillar];
      for (const [key, label] of Object.entries(attrs)) {
        const values = profiles.map(p => (p[pillar] as Record<string, number>)[key]).filter(v => v != null);
        if (values.length === 0) continue;
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sum, v) => sum + (v - mean) ** 2, 0) / values.length;
        attrStats.push({ pillar, key, label, avg: Math.round(mean), stdDev: Math.sqrt(variance) });
      }
    }

    const sorted = [...attrStats].sort((a, b) => b.avg - a.avg);

    const strengths: SwotItem[] = sorted.slice(0, 4).map(s => ({
      theme: s.label,
      pillar: s.pillar,
      attrKey: s.key,
      avg: s.avg,
      insight: `Program-wide average of ${s.avg}/100 across ${profiles.length} profiles. Consistently strong area with low variance (SD ${s.stdDev.toFixed(1)}).`,
    }));

    const weaknesses: SwotItem[] = sorted.slice(-4).reverse().map(s => ({
      theme: s.label,
      pillar: s.pillar,
      attrKey: s.key,
      avg: s.avg,
      insight: `Program-wide average of ${s.avg}/100. Represents an area for focused development across the cohort (SD ${s.stdDev.toFixed(1)}).`,
    }));

    const highVariance = [...attrStats].sort((a, b) => b.stdDev - a.stdDev).slice(0, 3);
    const opportunities: SwotItem[] = highVariance.map(s => ({
      theme: `${s.label} Variability`,
      pillar: s.pillar,
      attrKey: s.key,
      avg: s.avg,
      insight: `High score variance (SD ${s.stdDev.toFixed(1)}) suggests peer mentoring opportunities — top performers can coach lower quartile residents.`,
    }));

    const lowPerformers = profiles.filter(p => p.composite < 50);
    const highRisk = profiles.filter(p => p.archetype?.risk === 'High');
    const threats: SwotItem[] = [];
    if (lowPerformers.length > 0) {
      threats.push({
        theme: 'Below-Average Performers',
        pillar: 'composite',
        attrKey: 'composite',
        avg: avg(lowPerformers.map(p => p.composite)),
        insight: `${lowPerformers.length} profile(s) (${Math.round(lowPerformers.length / profiles.length * 100)}%) scored below 50. Early intervention recommended.`,
      });
    }
    if (highRisk.length > 0) {
      threats.push({
        theme: 'High-Risk Archetypes',
        pillar: 'archetype',
        attrKey: 'risk',
        avg: avg(highRisk.map(p => p.composite)),
        insight: `${highRisk.length} profile(s) classified as high-risk trajectories (avg composite ${avg(highRisk.map(p => p.composite))}). Monitor closely.`,
      });
    }

    return { strengths, weaknesses, opportunities, threats };
  }, [profiles]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 960,
      display: 'flex',
      flexWrap: 'wrap',
      gap: 20,
    }}>
      <SwotCard title="Strengths" color="#18F2B2" items={swot.strengths} />
      <SwotCard title="Weaknesses" color="#f06060" items={swot.weaknesses} />
      <SwotCard title="Opportunities" color="#7BC8F8" items={swot.opportunities} />
      <SwotCard title="Threats" color="#f0a060" items={swot.threats} />
    </div>
  );
}
