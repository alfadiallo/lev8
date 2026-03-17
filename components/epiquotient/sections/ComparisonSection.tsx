'use client';

import { useRef, useEffect, useState } from 'react';
import type { Profile } from '../types';
import { PILLAR_COLORS } from '../types';
import { THEME, scoreColor } from './primitives';

export default function ComparisonSection({ profile, expanded: controlledExpanded, onToggleExpanded }: { profile: Profile; expanded?: boolean; onToggleExpanded?: () => void }) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const expanded = controlledExpanded ?? internalExpanded;
  const toggleExpanded = onToggleExpanded ?? (() => setInternalExpanded(e => !e));
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const compData = profile.comparison;
  const faculty = compData?.faculty;
  const self = compData?.self;
  const classAverages = compData?.classAverages;
  const classLabel = compData?.classLabel;
  const facultyCount = compData?.facultyCount;
  const selfCount = compData?.selfCount;

  useEffect(() => {
    if (!expanded || !faculty || !self) return;
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    function draw() {
      const cvs = canvasRef.current;
      const ctr = containerRef.current;
      if (!cvs || !ctr || !faculty || !self) return;

      const ctx = cvs.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      const ctrStyle = getComputedStyle(ctr);
      const padLeft = parseFloat(ctrStyle.paddingLeft) || 0;
      const padRight = parseFloat(ctrStyle.paddingRight) || 0;
      const w = ctr.clientWidth - padLeft - padRight;
      const h = 160;
      cvs.width = w * dpr;
      cvs.height = h * dpr;
      cvs.style.width = `${w}px`;
      cvs.style.height = `${h}px`;
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, w, h);

      const padL = 40, padR = 20, padT = 16, padB = 30;
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

      const pillars: ('eq' | 'pq' | 'iq')[] = ['eq', 'pq', 'iq'];
      const groupWidth = drawW / 3;
      const barWidth = Math.min(36, Math.floor(groupWidth * 0.3));

      pillars.forEach((pillar, gi) => {
        const groupCenter = padL + groupWidth * gi + groupWidth / 2;
        const fVal = faculty[pillar];
        const sVal = self[pillar];
        const barGap = Math.max(3, Math.round(barWidth * 0.12));

        const fH = (fVal / 100) * drawH;
        const fX = groupCenter - barWidth - barGap;
        ctx.fillStyle = PILLAR_COLORS[pillar] + '90';
        ctx.beginPath();
        ctx.roundRect(fX, padT + drawH - fH, barWidth, fH, [3, 3, 0, 0]);
        ctx.fill();

        const sH = (sVal / 100) * drawH;
        const sX = groupCenter + barGap;
        ctx.fillStyle = '#6366f180';
        ctx.beginPath();
        ctx.roundRect(sX, padT + drawH - sH, barWidth, sH, [3, 3, 0, 0]);
        ctx.fill();

        if (classAverages) {
          const cVal = classAverages[pillar];
          const cY = padT + drawH - (cVal / 100) * drawH;
          ctx.beginPath();
          ctx.moveTo(fX - 4, cY);
          ctx.lineTo(sX + barWidth + 4, cY);
          ctx.strokeStyle = '#f0a06080';
          ctx.lineWidth = 1;
          ctx.setLineDash([4, 3]);
          ctx.stroke();
          ctx.setLineDash([]);
        }

        ctx.fillStyle = THEME.text.primary;
        ctx.font = 'bold 10px "Space Mono", monospace';
        ctx.textAlign = 'center';
        ctx.fillText(String(Math.round(fVal)), fX + barWidth / 2, padT + drawH - fH - 6);
        ctx.fillStyle = '#a5b4fc';
        ctx.fillText(String(Math.round(sVal)), sX + barWidth / 2, padT + drawH - sH - 6);

        ctx.fillStyle = THEME.text.muted;
        ctx.font = '10px "Sora", system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(pillar.toUpperCase(), groupCenter, h - 8);
      });
    }

    draw();

    const ro = new ResizeObserver(() => draw());
    ro.observe(container);
    return () => ro.disconnect();
  }, [expanded, compData, faculty, self, classAverages]);

  if (!compData || !faculty || !self) return null;

  return (
    <div style={{
      background: THEME.bg.card,
      border: `0.5px solid ${expanded ? '#6366f140' : THEME.border.medium}`,
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
          <div style={{ width: 4, height: 24, borderRadius: 2, background: '#6366f1', flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: THEME.text.primary, fontWeight: 500 }}>EPI-Q Faculty & Self-Assessment</div>
            <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
              {facultyCount ? `${facultyCount} faculty` : 'Faculty'} · {selfCount ? `${selfCount} self` : 'Self'}
              {classLabel ? ` · ${classLabel}` : ''}
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
          <canvas ref={canvasRef} style={{ display: 'block', width: '100%' }} />
          <div style={{ display: 'flex', gap: 16, marginTop: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: scoreColor(70), opacity: 0.7 }} />
              <span style={{ fontSize: 9, color: THEME.text.muted }}>Faculty</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 10, height: 10, borderRadius: 2, background: '#6366f180' }} />
              <span style={{ fontSize: 9, color: THEME.text.muted }}>Self</span>
            </div>
            {classAverages && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 14, height: 0, borderTop: '1px dashed #f0a06080' }} />
                <span style={{ fontSize: 9, color: THEME.text.muted }}>{classLabel || 'Class Avg'}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
