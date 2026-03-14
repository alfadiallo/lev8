'use client';

import { useMemo, useRef, useEffect } from 'react';
import type { LensProps, Profile } from './types';
import { RISK_COLORS } from './types';

function avg(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

const ARCHETYPE_PALETTE: Record<string, string> = {
  'Elite Performer': '#18F2B2',
  'Steady Climber': '#2FE6DE',
  'Late Bloomer': '#7BC8F8',
  'Breakthrough': '#a78bfa',
  'Slump → Recovery': '#f0a060',
  'Variable': '#d4a574',
  'Peak & Decline': '#f07060',
  'Elite → Late Struggle': '#e05050',
  'Continuous Decline': '#c03030',
};

function ScatterCanvas({ profiles, size }: { profiles: Profile[]; size: { w: number; h: number } }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size.w * dpr;
    canvas.height = size.h * dpr;
    canvas.style.width = `${size.w}px`;
    canvas.style.height = `${size.h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size.w, size.h);

    const padL = 50, padR = 20, padT = 20, padB = 40;
    const drawW = size.w - padL - padR;
    const drawH = size.h - padT - padB;

    // Grid
    [0, 25, 50, 75, 100].forEach(score => {
      const y = padT + drawH - (score / 100) * drawH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(padL + drawW, y);
      ctx.strokeStyle = 'rgba(47,230,222,0.06)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.font = '9px "Space Mono", monospace';
      ctx.fillStyle = '#4a7090';
      ctx.textAlign = 'right';
      ctx.fillText(String(score), padL - 6, y + 3);
    });

    // Axis labels
    ctx.font = '9px "Space Mono", monospace';
    ctx.fillStyle = '#4a7090';
    ctx.textAlign = 'center';
    ctx.fillText('CURRENT COMPOSITE', padL + drawW / 2, size.h - 6);
    ctx.save();
    ctx.translate(10, padT + drawH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText('TRAJECTORY DELTA', 0, 0);
    ctx.restore();

    // Scatter dots
    for (const p of profiles) {
      if (!p.archetype) continue;
      const x = padL + (p.composite / 100) * drawW;
      const delta = p.history.length >= 2
        ? p.history[p.history.length - 1].composite - p.history[0].composite
        : 0;
      const normalizedDelta = Math.max(-50, Math.min(50, delta));
      const y = padT + drawH / 2 - (normalizedDelta / 50) * (drawH / 2);

      const color = ARCHETYPE_PALETTE[p.archetype.name] || '#4a7090';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, Math.PI * 2);
      ctx.fillStyle = color + '99';
      ctx.fill();
    }

    // Zero delta line
    const zeroY = padT + drawH / 2;
    ctx.beginPath();
    ctx.setLineDash([4, 4]);
    ctx.moveTo(padL, zeroY);
    ctx.lineTo(padL + drawW, zeroY);
    ctx.strokeStyle = 'rgba(47,230,222,0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.setLineDash([]);
  }, [profiles, size]);

  return <canvas ref={ref} style={{ display: 'block', width: '100%' }} />;
}

function DistributionBar({ name, count, total, color }: { name: string; count: number; total: number; color: string }) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
      <div style={{
        width: 130,
        fontSize: 11,
        color: '#c8e0ee',
        textAlign: 'right' as const,
        flexShrink: 0,
        whiteSpace: 'nowrap' as const,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
      }}>{name}</div>
      <div style={{
        flex: 1,
        height: 8,
        background: 'rgba(7,18,29,0.6)',
        borderRadius: 4,
        overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 4,
          background: `linear-gradient(to right, ${color}66, ${color})`,
          transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
      <div style={{
        width: 50,
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        color: '#4a7090',
        textAlign: 'right' as const,
      }}>{count} ({Math.round(pct)}%)</div>
    </div>
  );
}

export default function ArchetypesLens({ profiles }: LensProps) {
  const stats = useMemo(() => {
    const distMap: Record<string, { count: number; compositeAvg: number; profiles: Profile[] }> = {};
    for (const p of profiles) {
      if (!p.archetype) continue;
      const name = p.archetype.name;
      if (!distMap[name]) distMap[name] = { count: 0, compositeAvg: 0, profiles: [] };
      distMap[name].count++;
      distMap[name].profiles.push(p);
    }
    for (const key of Object.keys(distMap)) {
      distMap[key].compositeAvg = avg(distMap[key].profiles.map(p => p.composite));
    }

    const riskMap: Record<string, number> = { Low: 0, Moderate: 0, High: 0 };
    const withArchetype = profiles.filter(p => p.archetype);
    for (const p of withArchetype) {
      riskMap[p.archetype!.risk] = (riskMap[p.archetype!.risk] || 0) + 1;
    }

    return { distribution: distMap, riskMap, total: withArchetype.length };
  }, [profiles]);

  const sortedArchetypes = Object.entries(stats.distribution)
    .sort(([, a], [, b]) => b.count - a.count);

  return (
    <div style={{
      width: '100%',
      maxWidth: 960,
      display: 'flex',
      flexDirection: 'column',
      gap: 24,
    }}>
      {/* Risk summary row */}
      <div style={{ display: 'flex', gap: 14 }}>
        {['Low', 'Moderate', 'High'].map(risk => {
          const count = stats.riskMap[risk] || 0;
          const pct = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
          const rc = RISK_COLORS[risk] || RISK_COLORS.Low;
          return (
            <div key={risk} style={{
              flex: 1,
              padding: '16px',
              background: rc.bg,
              border: `0.5px solid ${rc.border}`,
              borderRadius: 12,
              textAlign: 'center' as const,
            }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 28,
                fontWeight: 700,
                color: rc.text,
                lineHeight: 1,
              }}>{count}</div>
              <div style={{ fontSize: 10, color: rc.text, marginTop: 5, letterSpacing: '0.06em' }}>{risk} Risk</div>
              <div style={{ fontSize: 9, color: '#4a7090', marginTop: 2 }}>{pct}% of cohort</div>
            </div>
          );
        })}
      </div>

      {/* Scatter + Distribution */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        <div style={{
          flex: '1 1 500px',
          background: 'rgba(22,39,55,0.4)',
          border: '0.5px solid rgba(47,230,222,0.08)',
          borderRadius: 14,
          padding: '20px 24px',
        }}>
          <div style={{
            fontSize: 10,
            color: '#4a7090',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            marginBottom: 12,
          }}>Archetype Scatter — Composite vs Trajectory Delta</div>
          <ScatterCanvas profiles={profiles} size={{ w: 500, h: 260 }} />
        </div>

        <div style={{
          flex: '1 1 340px',
          background: 'rgba(22,39,55,0.4)',
          border: '0.5px solid rgba(47,230,222,0.08)',
          borderRadius: 14,
          padding: '20px 24px',
        }}>
          <div style={{
            fontSize: 10,
            color: '#4a7090',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            marginBottom: 14,
          }}>Distribution</div>
          {sortedArchetypes.map(([name, data]) => (
            <DistributionBar
              key={name}
              name={name}
              count={data.count}
              total={stats.total}
              color={ARCHETYPE_PALETTE[name] || '#4a7090'}
            />
          ))}
        </div>
      </div>

      {/* Archetype detail cards */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        {sortedArchetypes.map(([name, data]) => {
          const color = ARCHETYPE_PALETTE[name] || '#4a7090';
          const sampleProfile = data.profiles[0];
          const risk = sampleProfile?.archetype?.risk || 'Low';
          const rc = RISK_COLORS[risk] || RISK_COLORS.Low;
          return (
            <div key={name} style={{
              flex: '1 1 200px',
              padding: '14px 16px',
              background: 'rgba(22,39,55,0.4)',
              border: `0.5px solid ${color}33`,
              borderRadius: 10,
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 6,
              }}>
                <span style={{ fontSize: 12, color, fontWeight: 500 }}>{name}</span>
                <span style={{
                  fontSize: 9,
                  padding: '2px 6px',
                  borderRadius: 8,
                  background: rc.bg,
                  color: rc.text,
                  border: `0.5px solid ${rc.border}`,
                }}>{risk}</span>
              </div>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 11,
                color: '#4a7090',
              }}>
                n={data.count} &middot; avg {data.compositeAvg}
              </div>
              {sampleProfile?.archetype?.description && (
                <div style={{ fontSize: 10, color: '#4a7090', marginTop: 4, lineHeight: 1.3, opacity: 0.7 }}>
                  {sampleProfile.archetype.description}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
