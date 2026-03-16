'use client';

import { useMemo, useRef, useEffect, useState } from 'react';
import type { LensProps } from './types';

function avg(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

const PERIOD_ORDER = ['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'Graduate'];

function TrajectoryChart({ trajectories, size }: { trajectories: { name: string; points: { period: string; score: number }[] }[]; size: { w: number; h: number } }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [measuredW, setMeasuredW] = useState(size.w);

  useEffect(() => {
    function measure() {
      if (containerRef.current) {
        setMeasuredW(Math.min(size.w, containerRef.current.clientWidth));
      }
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [size.w]);

  const resolvedH = Math.max(180, Math.round(measuredW * (size.h / size.w)));

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = measuredW * dpr;
    canvas.height = resolvedH * dpr;
    canvas.style.width = `${measuredW}px`;
    canvas.style.height = `${resolvedH}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, measuredW, resolvedH);

    const padL = 40, padR = 20, padT = 20, padB = 30;
    const drawW = measuredW - padL - padR;
    const drawH = resolvedH - padT - padB;

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

    ctx.font = `${measuredW < 400 ? 7 : 9}px "Space Mono", monospace`;
    ctx.fillStyle = '#4a7090';
    ctx.textAlign = 'center';
    PERIOD_ORDER.forEach((p, i) => {
      const x = padL + (i / (PERIOD_ORDER.length - 1)) * drawW;
      ctx.fillText(p, x, resolvedH - 6);
    });

    // Average trajectory line
    const periodAvgs: Record<string, number[]> = {};
    for (const t of trajectories) {
      for (const pt of t.points) {
        if (!periodAvgs[pt.period]) periodAvgs[pt.period] = [];
        periodAvgs[pt.period].push(pt.score);
      }
    }

    const avgPts: { x: number; y: number }[] = [];
    PERIOD_ORDER.forEach((period, i) => {
      const vals = periodAvgs[period];
      if (vals && vals.length > 0) {
        avgPts.push({
          x: padL + (i / (PERIOD_ORDER.length - 1)) * drawW,
          y: padT + drawH - (avg(vals) / 100) * drawH,
        });
      }
    });

    // Individual trajectory lines (faint)
    for (const t of trajectories) {
      if (t.points.length < 2) continue;
      ctx.beginPath();
      let started = false;
      for (const pt of t.points) {
        const pi = PERIOD_ORDER.indexOf(pt.period);
        if (pi < 0) continue;
        const x = padL + (pi / (PERIOD_ORDER.length - 1)) * drawW;
        const y = padT + drawH - (pt.score / 100) * drawH;
        if (!started) { ctx.moveTo(x, y); started = true; }
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(47,230,222,0.04)';
      ctx.lineWidth = 0.8;
      ctx.stroke();
    }

    // Average line
    if (avgPts.length > 1) {
      ctx.beginPath();
      ctx.moveTo(avgPts[0].x, avgPts[0].y);
      for (let i = 0; i < avgPts.length - 1; i++) {
        const cpX = (avgPts[i].x + avgPts[i + 1].x) / 2;
        const cpY = (avgPts[i].y + avgPts[i + 1].y) / 2;
        ctx.quadraticCurveTo(avgPts[i].x, avgPts[i].y, cpX, cpY);
      }
      ctx.lineTo(avgPts[avgPts.length - 1].x, avgPts[avgPts.length - 1].y);
      ctx.strokeStyle = '#2fe6de';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      for (const pt of avgPts) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 4, 0, Math.PI * 2);
        ctx.fillStyle = '#2fe6de';
        ctx.fill();
      }
    }
  }, [trajectories, measuredW, resolvedH]);

  return (
    <div ref={containerRef} style={{ width: '100%' }}>
      <canvas ref={ref} style={{ display: 'block', width: '100%' }} />
    </div>
  );
}

function TrendBadge({ label, value, prev }: { label: string; value: number; prev?: number }) {
  const delta = prev != null ? value - prev : 0;
  const arrow = delta > 0 ? '\u2191' : delta < 0 ? '\u2193' : '\u2192';
  const deltaColor = delta > 0 ? '#18F2B2' : delta < 0 ? '#f06060' : '#4a7090';

  return (
    <div style={{
      flex: '1 1 100px',
      minWidth: 0,
      padding: '10px 12px',
      background: 'rgba(22,39,55,0.5)',
      border: '0.5px solid rgba(47,230,222,0.08)',
      borderRadius: 10,
      textAlign: 'center' as const,
    }}>
      <div style={{ fontSize: 10, color: '#4a7090', marginBottom: 6, letterSpacing: '0.06em' }}>{label}</div>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 24,
        fontWeight: 700,
        color: '#2fe6de',
        lineHeight: 1,
      }}>{value}</div>
      {prev != null && (
        <div style={{
          fontSize: 11,
          color: deltaColor,
          marginTop: 4,
          fontFamily: "'Space Mono', monospace",
        }}>
          {arrow} {Math.abs(delta)} from prev
        </div>
      )}
    </div>
  );
}

export default function TrajectoryLens({ profiles }: LensProps) {
  const { trajectories, periodStats } = useMemo(() => {
    const trajs = profiles
      .filter(p => p.history.length > 0)
      .map((p) => ({
        name: p.name,
        points: p.history.map((h) => ({
          period: h.period,
          score: h.composite,
        })),
      }));

    const statsMap: Record<string, number[]> = {};
    for (const p of profiles) {
      for (const h of p.history) {
        if (!statsMap[h.period]) statsMap[h.period] = [];
        statsMap[h.period].push(h.composite);
      }
    }

    const stats = PERIOD_ORDER
      .filter(period => statsMap[period])
      .map(period => ({
        period,
        avg: avg(statsMap[period]),
        count: statsMap[period].length,
      }));

    return { trajectories: trajs, periodStats: stats };
  }, [profiles]);

  return (
    <div style={{
      width: '100%',
      maxWidth: 960,
      display: 'flex',
      flexDirection: 'column',
      gap: 20,
      overflow: 'hidden',
    }}>
      {/* Period averages */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {periodStats.map((ps, i) => (
          <TrendBadge
            key={ps.period}
            label={`${ps.period} (n=${ps.count})`}
            value={ps.avg}
            prev={i > 0 ? periodStats[i - 1].avg : undefined}
          />
        ))}
      </div>

      {/* Trajectory chart */}
      <div style={{
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
        }}>Composite Score Trajectories</div>
        <TrajectoryChart trajectories={trajectories} size={{ w: 880, h: 280 }} />
        <div style={{
          display: 'flex',
          gap: 16,
          marginTop: 12,
          fontSize: 10,
          color: '#4a7090',
        }}>
          <span><span style={{ color: '#2fe6de' }}>{'\u2014'}</span> Program Average</span>
          <span><span style={{ color: 'rgba(47,230,222,0.15)' }}>{'\u2014'}</span> Individual Trajectories ({trajectories.length})</span>
        </div>
      </div>
    </div>
  );
}
