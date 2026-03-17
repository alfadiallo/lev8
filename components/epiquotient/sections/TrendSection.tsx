'use client';

import { useRef, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { PILLAR_COLORS } from '../types';
import { THEME } from './primitives';

type TrendView = 'faculty' | 'self' | 'both';

export default function TrendSection({ profile, expanded: controlledExpanded, onToggleExpanded }: { profile: Profile; expanded?: boolean; onToggleExpanded?: () => void }) {
  const [internalExpanded, setInternalExpanded] = useState(false);
  const expanded = controlledExpanded ?? internalExpanded;
  const toggleExpanded = onToggleExpanded ?? (() => setInternalExpanded(e => !e));
  const [view, setView] = useState<TrendView>('both');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const trends = profile.trends;

  useEffect(() => {
    if (!expanded || !trends || trends.length < 2) return;
    const trendData = trends;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    function draw() {
      const cvs = canvasRef.current;
      const ctr = containerRef.current;
      if (!cvs || !ctr || !trends || trends.length < 2) return;
      const data = trends;

      const ctx = cvs.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      const ctrStyle = getComputedStyle(ctr);
      const padLeft = parseFloat(ctrStyle.paddingLeft) || 0;
      const padRight = parseFloat(ctrStyle.paddingRight) || 0;
      const w = ctr.clientWidth - padLeft - padRight;
      const h = 180;
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      cvs.style.width = `${w}px`;
      cvs.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const padL = 36, padR = 30, padT = 16, padB = 30;
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
        ctx.fillStyle = THEME.text.dim;
        ctx.font = '9px "Space Mono", monospace';
        ctx.textAlign = 'right';
        ctx.fillText(String(score), padL - 6, y + 3);
      });

      ctx.textAlign = 'center';
      ctx.font = '9px "Sora", system-ui, sans-serif';
      ctx.fillStyle = 'rgba(74,112,144,0.6)';
      data.forEach((pt, i) => {
        const x = padL + (data.length === 1 ? drawW / 2 : (i / (data.length - 1)) * drawW);
        ctx.fillText(pt.period, x, h - 6);
      });

      function drawLine(getVal: (t: typeof data[0]) => number | undefined, color: string, dashed = false) {
        const pts = data.map((t, i) => {
          const val = getVal(t);
          if (val === undefined) return null;
          return {
            x: padL + (data.length === 1 ? drawW / 2 : (i / (data.length - 1)) * drawW),
            y: padT + drawH - (val / 100) * drawH,
          };
        }).filter((p): p is { x: number; y: number } => p !== null);

        if (pts.length < 2) return;
        if (dashed) ctx.setLineDash([6, 4]);
        ctx.beginPath();
        ctx.moveTo(pts[0].x, pts[0].y);
        for (let i = 0; i < pts.length - 1; i++) {
          const cpX = (pts[i].x + pts[i + 1].x) / 2;
          const cpY = (pts[i].y + pts[i + 1].y) / 2;
          ctx.quadraticCurveTo(pts[i].x, pts[i].y, cpX, cpY);
        }
        ctx.lineTo(pts[pts.length - 1].x, pts[pts.length - 1].y);
        ctx.strokeStyle = color;
        ctx.lineWidth = 1.5;
        ctx.stroke();
        ctx.setLineDash([]);

        pts.forEach(p => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 2.5, 0, Math.PI * 2);
          ctx.fillStyle = color;
          ctx.fill();
        });
      }

      if (view === 'faculty' || view === 'both') {
        drawLine(t => t.facultyEq, PILLAR_COLORS.eq);
        drawLine(t => t.facultyPq, PILLAR_COLORS.pq);
        drawLine(t => t.facultyIq, PILLAR_COLORS.iq);
      }
      if (view === 'self' || view === 'both') {
        drawLine(t => t.selfEq, PILLAR_COLORS.eq + '80', true);
        drawLine(t => t.selfPq, PILLAR_COLORS.pq + '80', true);
        drawLine(t => t.selfIq, PILLAR_COLORS.iq + '80', true);
      }
    }

    draw();

    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [expanded, view, trends]);

  if (!trends || trends.length < 2) return null;

  return (
    <div style={{
      background: THEME.bg.card,
      border: `0.5px solid ${expanded ? THEME.border.accent : THEME.border.medium}`,
      borderRadius: 10,
      marginBottom: 10,
      overflow: 'hidden',
      transition: 'border-color 0.2s ease',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <button
        onClick={() => toggleExpanded()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 24, borderRadius: 2, background: THEME.accent, flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: THEME.text.primary, fontWeight: 500 }}>Trends Over Time</div>
            <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
              {trends.length} periods · Faculty & Self trends
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 10, color: THEME.text.muted,
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
        }}>▼</span>
      </button>
      {expanded && (
        <div ref={containerRef} style={{ padding: '0 16px 16px', flex: 1 }}>
          <div style={{ display: 'flex', gap: 0, marginBottom: 12, borderRadius: 6, overflow: 'hidden', border: `0.5px solid ${THEME.border.medium}` }}>
            {(['faculty', 'self', 'both'] as TrendView[]).map(opt => (
              <button
                key={opt}
                onClick={() => setView(opt)}
                style={{
                  flex: 1,
                  padding: '6px 12px',
                  fontSize: 10,
                  fontWeight: view === opt ? 600 : 400,
                  fontFamily: THEME.font.mono,
                  color: view === opt ? THEME.bg.page : THEME.text.muted,
                  background: view === opt ? THEME.accent : 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  textTransform: 'capitalize' as const,
                  transition: 'all 0.15s ease',
                }}
              >
                {opt}
              </button>
            ))}
          </div>
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'EQ', color: PILLAR_COLORS.eq },
              { label: 'PQ', color: PILLAR_COLORS.pq },
              { label: 'IQ', color: PILLAR_COLORS.iq },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 2, borderRadius: 1, background: l.color }} />
                <span style={{ fontSize: 9, color: THEME.text.muted }}>{l.label}</span>
              </div>
            ))}
            {view === 'both' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, borderTop: '1px dashed ' + THEME.text.muted }} />
                <span style={{ fontSize: 9, color: THEME.text.muted }}>Dashed = Self</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
