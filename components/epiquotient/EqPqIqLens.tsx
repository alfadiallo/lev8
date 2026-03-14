'use client';

import { useMemo, useRef, useEffect } from 'react';
import type { LensProps } from './types';
import { PILLAR_COLORS, PILLAR_LABELS, ATTR_LABELS } from './types';

function avg(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

function RadarCanvas({ data, size }: { data: { label: string; value: number; color: string }[]; size: number }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.38;
    const n = data.length;
    const angleStep = (Math.PI * 2) / n;
    const offset = -Math.PI / 2;

    // Grid rings
    [0.25, 0.5, 0.75, 1.0].forEach(frac => {
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = offset + i * angleStep;
        const x = cx + maxR * frac * Math.cos(angle);
        const y = cy + maxR * frac * Math.sin(angle);
        i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.strokeStyle = 'rgba(47,230,222,0.06)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    });

    // Axis lines
    for (let i = 0; i < n; i++) {
      const angle = offset + i * angleStep;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(cx + maxR * Math.cos(angle), cy + maxR * Math.sin(angle));
      ctx.strokeStyle = 'rgba(47,230,222,0.04)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }

    // Data polygon
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const angle = offset + i * angleStep;
      const r = maxR * (data[i].value / 100);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(47,230,222,0.08)';
    ctx.fill();
    ctx.strokeStyle = '#2fe6de';
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Data dots
    for (let i = 0; i < n; i++) {
      const angle = offset + i * angleStep;
      const r = maxR * (data[i].value / 100);
      const x = cx + r * Math.cos(angle);
      const y = cy + r * Math.sin(angle);
      ctx.beginPath();
      ctx.arc(x, y, 3, 0, Math.PI * 2);
      ctx.fillStyle = data[i].color;
      ctx.fill();
    }

    // Labels
    ctx.font = '500 9px "Space Mono", monospace';
    ctx.textAlign = 'center';
    for (let i = 0; i < n; i++) {
      const angle = offset + i * angleStep;
      const lr = maxR + 18;
      const x = cx + lr * Math.cos(angle);
      const y = cy + lr * Math.sin(angle);
      ctx.fillStyle = data[i].color;
      ctx.fillText(data[i].label, x, y + 3);
    }
  }, [data, size]);

  return <canvas ref={ref} style={{ display: 'block' }} />;
}

function AttrBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
      <div style={{
        width: 80,
        fontSize: 10,
        color: '#c8e0ee',
        textAlign: 'right' as const,
        flexShrink: 0,
      }}>{label}</div>
      <div style={{
        flex: 1,
        height: 5,
        background: 'rgba(7,18,29,0.6)',
        borderRadius: 3,
        overflow: 'hidden',
        border: '0.5px solid rgba(47,230,222,0.06)',
      }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          borderRadius: 3,
          background: `linear-gradient(to right, ${color}66, ${color})`,
          transition: 'width 1s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
      <div style={{
        width: 24,
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        color,
        textAlign: 'right' as const,
      }}>{value}</div>
    </div>
  );
}

export default function EqPqIqLens({ profiles }: LensProps) {
  const { radarData, pillarSections } = useMemo(() => {
    const pillars = ['eq', 'pq', 'iq'] as const;
    const radarPts: { label: string; value: number; color: string }[] = [];
    const sections: { pillar: string; label: string; color: string; score: number; attrs: { key: string; label: string; value: number }[] }[] = [];

    for (const pillar of pillars) {
      const color = PILLAR_COLORS[pillar];
      const attrs = ATTR_LABELS[pillar];
      const pillarScore = avg(profiles.map(p => p[`${pillar}Score` as 'eqScore' | 'pqScore' | 'iqScore']));

      const attrDetails: { key: string; label: string; value: number }[] = [];
      for (const [key, label] of Object.entries(attrs)) {
        const values = profiles.map(p => (p[pillar] as Record<string, number>)[key]).filter(v => v != null);
        const attrAvg = avg(values);
        radarPts.push({ label, value: attrAvg, color });
        attrDetails.push({ key, label, value: attrAvg });
      }

      sections.push({
        pillar,
        label: PILLAR_LABELS[pillar],
        color,
        score: pillarScore,
        attrs: attrDetails,
      });
    }

    return { radarData: radarPts, pillarSections: sections };
  }, [profiles]);

  const CIRC = 2 * Math.PI * 28;

  return (
    <div style={{
      width: '100%',
      maxWidth: 960,
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
    }}>
      {/* Radar + Pillar rings */}
      <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', justifyContent: 'center', alignItems: 'center' }}>
        <RadarCanvas data={radarData} size={320} />

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {pillarSections.map(s => {
            const dash = (s.score / 100) * CIRC;
            return (
              <div key={s.pillar} style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 6,
              }}>
                <svg width="72" height="72" viewBox="0 0 72 72">
                  <circle cx="36" cy="36" r="28" fill="none" stroke={`${s.color}1F`} strokeWidth="5" />
                  <circle
                    cx="36" cy="36" r="28"
                    fill="none"
                    stroke={s.color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${CIRC}`}
                    transform="rotate(-90 36 36)"
                    style={{ transition: 'stroke-dasharray 1s cubic-bezier(.16,1,.3,1)' }}
                  />
                  <text
                    x="36" y="40"
                    textAnchor="middle"
                    fill={s.color}
                    fontFamily="'Space Mono', monospace"
                    fontSize="13"
                    fontWeight="700"
                  >{s.score}</text>
                </svg>
                <div style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 10,
                  color: s.color,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase' as const,
                }}>{s.pillar.toUpperCase()}</div>
                <div style={{ fontSize: 10, color: '#4a7090' }}>{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Attribute breakdown per pillar */}
      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
        {pillarSections.map(s => (
          <div key={s.pillar} style={{
            flex: '1 1 280px',
            background: 'rgba(22,39,55,0.4)',
            border: '0.5px solid rgba(47,230,222,0.08)',
            borderRadius: 12,
            padding: '18px 20px',
          }}>
            <div style={{
              fontSize: 10,
              color: s.color,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.1em',
              marginBottom: 14,
              fontFamily: "'Space Mono', monospace",
            }}>{s.pillar.toUpperCase()} Attributes</div>
            {s.attrs.map(a => (
              <AttrBar key={a.key} label={a.label} value={a.value} color={s.color} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
