'use client';

import { useRef, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { PILLAR_COLORS } from '../types';
import { THEME } from './primitives';

export default function TrajectorySection({ profile }: { profile: Profile }) {
  const [expanded, setExpanded] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!expanded) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const w = Math.min(600, container.clientWidth);
    const h = 140;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padL = 36, padR = 16, padT = 16, padB = 26;
    const drawW = w - padL - padR;
    const drawH = h - padT - padB;

    [0, 25, 50, 75, 100].forEach(score => {
      const y = padT + drawH - (score / 100) * drawH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.strokeStyle = THEME.border.subtle;
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(74,112,144,0.4)';
      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(score), padL - 6, y + 3);
    });

    const history = profile.history;
    if (history.length === 0) return;

    ctx.textAlign = 'center';
    ctx.font = '9px "Sora", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(74,112,144,0.6)';
    history.forEach((pt, i) => {
      const x = padL + (history.length === 1 ? drawW / 2 : (i / (history.length - 1)) * drawW);
      ctx.fillText(pt.period, x, h - 4);
    });

    const series = [
      { key: 'composite', color: THEME.accent, width: 2.5 },
      { key: 'eq', color: PILLAR_COLORS.eq + '80', width: 1 },
      { key: 'pq', color: PILLAR_COLORS.pq + '80', width: 1 },
      { key: 'iq', color: PILLAR_COLORS.iq + '80', width: 1 },
    ];

    for (const s of series) {
      const pts = history
        .map((pt, i) => {
          const val = s.key === 'composite' ? pt.composite : pt[s.key as 'eq' | 'pq' | 'iq'];
          if (val === undefined) return null;
          return {
            x: padL + (history.length === 1 ? drawW / 2 : (i / (history.length - 1)) * drawW),
            y: padT + drawH - (val / 100) * drawH,
          };
        })
        .filter((p): p is { x: number; y: number } => p !== null);

      if (pts.length < 2) continue;

      ctx.beginPath();
      ctx.moveTo(pts[0].x, pts[0].y);
      for (let i = 0; i < pts.length - 1; i++) {
        const cpX = (pts[i].x + pts[i + 1].x) / 2;
        const cpY = (pts[i].y + pts[i + 1].y) / 2;
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, cpX, cpY);
      }
      ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.width;
      ctx.stroke();

      if (s.key === 'composite') {
        pts.forEach((p, idx) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = THEME.accent;
          ctx.fill();
          ctx.fillStyle = THEME.text.primary;
          ctx.font = 'bold 9px "Space Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(history[idx].composite), p.x, p.y - 8);
        });
      }
    }
  }, [expanded, profile]);

  if (profile.history.length < 2) return null;

  return (
    <div style={{
      background: THEME.bg.card,
      border: `0.5px solid ${expanded ? THEME.border.accent : THEME.border.medium}`,
      borderRadius: 10,
      marginBottom: 10,
      overflow: 'hidden',
      transition: 'border-color 0.2s ease',
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 4, height: 24, borderRadius: 2,
            background: THEME.accent, flexShrink: 0,
          }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: THEME.text.primary, fontWeight: 500 }}>Trajectory</div>
            <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
              {profile.history.length} data points · Composite + Pillar trends
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 10, color: THEME.text.muted,
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
        }}>
          ▼
        </span>
      </button>
      {expanded && (
        <div ref={containerRef} style={{ padding: '0 16px 16px' }}>
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap' }}>
            {[
              { label: 'Composite', color: THEME.accent },
              { label: 'EQ', color: PILLAR_COLORS.eq + '80' },
              { label: 'PQ', color: PILLAR_COLORS.pq + '80' },
              { label: 'IQ', color: PILLAR_COLORS.iq + '80' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 2, borderRadius: 1, background: l.color }} />
                <span style={{ fontSize: 9, color: THEME.text.muted }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
