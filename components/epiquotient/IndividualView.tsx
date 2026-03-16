'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import type { Profile } from './types';
import { PILLAR_COLORS, PILLAR_LABELS, ATTR_LABELS, RISK_COLORS } from './types';

const WAVE_ORDER = ['Graduate', 'PGY 3', 'PGY 2', 'PGY 1', 'MS4', 'MS3'];
const PERIOD_ORDER = ['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'PGY 4', 'Graduate'];

function scoreToRGB(s: number) {
  const stops = [
    { s: 0, r: 12, g: 25, b: 50 },
    { s: 35, r: 16, g: 60, b: 82 },
    { s: 55, r: 18, g: 110, b: 120 },
    { s: 70, r: 30, g: 165, b: 170 },
    { s: 83, r: 47, g: 220, b: 210 },
    { s: 95, r: 24, g: 242, b: 178 },
    { s: 100, r: 60, g: 255, b: 200 },
  ];
  s = Math.max(0, Math.min(100, s));
  let lo = stops[0], hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (s >= stops[i].s && s <= stops[i + 1].s) { lo = stops[i]; hi = stops[i + 1]; break; }
  }
  const t = hi.s === lo.s ? 0 : (s - lo.s) / (hi.s - lo.s);
  return {
    r: Math.round(lo.r + (hi.r - lo.r) * t),
    g: Math.round(lo.g + (hi.g - lo.g) * t),
    b: Math.round(lo.b + (hi.b - lo.b) * t),
  };
}

function scoreBg(s: number, alpha = 0.35): string {
  const { r, g, b } = scoreToRGB(s);
  return `rgba(${r},${g},${b},${alpha})`;
}

function scoreColor(s: number): string {
  const { r, g, b } = scoreToRGB(s);
  return `rgb(${r},${g},${b})`;
}

function grade(s: number) {
  if (s >= 88) return { lbl: 'Exemplary', c: '#18F2B2' };
  if (s >= 74) return { lbl: 'Strong', c: '#2FE6DE' };
  if (s >= 60) return { lbl: 'Acceptable', c: '#7BC8F8' };
  if (s >= 46) return { lbl: 'Concerning', c: '#f0a060' };
  return { lbl: 'Serious Deficit', c: '#f06060' };
}

// ─── Sidebar ─────────────────────────────────────────────────────

function SidebarGroup({
  label,
  profiles,
  selectedId,
  onSelect,
}: {
  label: string;
  profiles: Profile[];
  selectedId: string | null;
  onSelect: (p: Profile) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(47,230,222,0.04)',
          border: 'none',
          borderBottom: '0.5px solid rgba(47,230,222,0.08)',
          cursor: 'pointer',
          color: '#4a7090',
          fontFamily: "'Space Mono', monospace",
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}
      >
        <span>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: '#3a5a72' }}>{profiles.length}</span>
          <span style={{ fontSize: 8, transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span>
        </span>
      </button>
      {!collapsed && (
        <div>
          {profiles.map((p) => {
            const isActive = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px 7px 20px',
                  background: isActive ? 'rgba(47,230,222,0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? '2px solid #2fe6de' : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left' as const,
                }}
              >
                <span style={{
                  fontSize: 12,
                  color: isActive ? '#c8e0ee' : '#7ab5cc',
                  fontFamily: "'Sora', system-ui, sans-serif",
                  fontWeight: isActive ? 500 : 400,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap' as const,
                  flex: 1,
                  marginRight: 8,
                }}>
                  {p.name}
                </span>
                <span style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: 11,
                  color: scoreColor(p.composite),
                  flexShrink: 0,
                }}>
                  {p.composite}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Heatmap Cell ─────────────────────────────────────────────────

function HeatCell({ value }: { value?: number }) {
  if (value === undefined || value === null) {
    return (
      <td style={{
        padding: '6px 10px',
        textAlign: 'center' as const,
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        color: '#3a5a72',
        borderBottom: '0.5px solid rgba(47,230,222,0.06)',
      }}>
        —
      </td>
    );
  }

  return (
    <td style={{
      padding: '6px 10px',
      textAlign: 'center' as const,
      fontFamily: "'Space Mono', monospace",
      fontSize: 12,
      fontWeight: 600,
      color: scoreColor(value),
      background: scoreBg(value, 0.12),
      borderBottom: '0.5px solid rgba(47,230,222,0.06)',
      borderRadius: 4,
    }}>
      {value}
    </td>
  );
}

// ─── Sparkline Mini ──────────────────────────────────────────────

function MiniSparkline({ values, color, width = 80, height = 24 }: { values: number[]; color: string; width?: number; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || values.length < 2) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, width, height);

    const pad = 3;
    const drawW = width - pad * 2;
    const drawH = height - pad * 2;
    const pts = values.map((v, i) => ({
      x: pad + (i / (values.length - 1)) * drawW,
      y: pad + drawH - (v / 100) * drawH,
    }));

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

    const last = pts[pts.length - 1];
    ctx.beginPath();
    ctx.arc(last.x, last.y, 2.5, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
  }, [values, color, width, height]);

  if (values.length < 2) return null;
  return <canvas ref={canvasRef} style={{ display: 'block', width, height }} />;
}

// ─── Summary Table ───────────────────────────────────────────────

function SummaryTable({ profile }: { profile: Profile }) {
  const periods = useMemo(() => {
    return profile.history
      .map(h => h.period)
      .sort((a, b) => (PERIOD_ORDER.indexOf(a) === -1 ? 99 : PERIOD_ORDER.indexOf(a)) - (PERIOD_ORDER.indexOf(b) === -1 ? 99 : PERIOD_ORDER.indexOf(b)));
  }, [profile]);

  const rows: { label: string; key: string; color: string }[] = [
    { label: 'Composite', key: 'composite', color: '#2fe6de' },
    { label: 'EQ', key: 'eq', color: PILLAR_COLORS.eq },
    { label: 'PQ', key: 'pq', color: PILLAR_COLORS.pq },
    { label: 'IQ', key: 'iq', color: PILLAR_COLORS.iq },
  ];

  if (periods.length === 0) {
    return (
      <div style={{ padding: 20, textAlign: 'center', color: '#4a7090', fontSize: 12 }}>
        No longitudinal data available
      </div>
    );
  }

  return (
    <div style={{ overflowX: 'auto', marginBottom: 0 }}>
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px 2px' }}>
        <thead>
          <tr>
            <th style={{
              padding: '8px 12px',
              textAlign: 'left' as const,
              fontSize: 10,
              color: '#4a7090',
              fontFamily: "'Space Mono', monospace",
              letterSpacing: '0.08em',
              textTransform: 'uppercase' as const,
              fontWeight: 400,
              borderBottom: '0.5px solid rgba(47,230,222,0.12)',
              position: 'sticky' as const,
              left: 0,
              background: '#0e1e2d',
              zIndex: 1,
              minWidth: 90,
            }}>
              Metric
            </th>
            {periods.map(p => (
              <th key={p} style={{
                padding: '8px 10px',
                textAlign: 'center' as const,
                fontSize: 10,
                color: '#4a7090',
                fontFamily: "'Space Mono', monospace",
                letterSpacing: '0.06em',
                fontWeight: 400,
                borderBottom: '0.5px solid rgba(47,230,222,0.12)',
                whiteSpace: 'nowrap' as const,
                minWidth: 60,
              }}>
                {p}
              </th>
            ))}
            <th style={{
              padding: '8px 10px',
              textAlign: 'center' as const,
              fontSize: 10,
              color: '#4a7090',
              fontFamily: "'Space Mono', monospace",
              letterSpacing: '0.06em',
              fontWeight: 400,
              borderBottom: '0.5px solid rgba(47,230,222,0.12)',
              minWidth: 80,
            }}>
              Trend
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map(row => {
            const values = periods.map(p => {
              const h = profile.history.find(hp => hp.period === p);
              if (!h) return undefined;
              if (row.key === 'composite') return h.composite;
              return h[row.key as 'eq' | 'pq' | 'iq'];
            });
            const sparkValues = values.filter((v): v is number => v !== undefined);

            return (
              <tr key={row.key}>
                <td style={{
                  padding: '6px 12px',
                  fontSize: 12,
                  color: row.color,
                  fontWeight: 500,
                  fontFamily: "'Sora', system-ui, sans-serif",
                  borderBottom: '0.5px solid rgba(47,230,222,0.06)',
                  position: 'sticky' as const,
                  left: 0,
                  background: '#0e1e2d',
                  zIndex: 1,
                }}>
                  {row.label}
                </td>
                {values.map((v, i) => <HeatCell key={i} value={v} />)}
                <td style={{
                  padding: '4px 8px',
                  textAlign: 'center' as const,
                  borderBottom: '0.5px solid rgba(47,230,222,0.06)',
                }}>
                  <MiniSparkline values={sparkValues} color={row.color} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─── Attribute Drilldown Card ────────────────────────────────────

function AttributeDrilldown({ profile, pillar }: { profile: Profile; pillar: 'eq' | 'pq' | 'iq' }) {
  const [expanded, setExpanded] = useState(false);
  const color = PILLAR_COLORS[pillar];
  const label = PILLAR_LABELS[pillar];
  const attrs = ATTR_LABELS[pillar];
  const currentScore = profile[`${pillar}Score` as keyof Profile] as number;

  const periods = useMemo(() => {
    return profile.history
      .map(h => h.period)
      .sort((a, b) => (PERIOD_ORDER.indexOf(a) === -1 ? 99 : PERIOD_ORDER.indexOf(a)) - (PERIOD_ORDER.indexOf(b) === -1 ? 99 : PERIOD_ORDER.indexOf(b)));
  }, [profile]);

  const pillarValues = periods.map(p => {
    const h = profile.history.find(hp => hp.period === p);
    return h?.[pillar] as number | undefined;
  }).filter((v): v is number => v !== undefined);

  return (
    <div style={{
      background: '#162737',
      border: `0.5px solid ${expanded ? color + '40' : 'rgba(47,230,222,0.12)'}`,
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
            width: 4,
            height: 24,
            borderRadius: 2,
            background: color,
            flexShrink: 0,
          }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: '#c8e0ee', fontWeight: 500 }}>{label}</div>
            <div style={{ fontSize: 10, color: '#4a7090', marginTop: 2 }}>
              {Object.values(attrs).length} attributes across {periods.length} periods
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <MiniSparkline values={pillarValues} color={color} width={60} height={20} />
          <span style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 16,
            color,
            fontWeight: 700,
          }}>
            {currentScore}
          </span>
          <span style={{
            fontSize: 10,
            color: '#4a7090',
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          }}>
            ▼
          </span>
        </div>
      </button>

      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px 2px' }}>
              <thead>
                <tr>
                  <th style={{
                    padding: '6px 8px',
                    textAlign: 'left' as const,
                    fontSize: 10,
                    color: '#4a7090',
                    fontFamily: "'Space Mono', monospace",
                    fontWeight: 400,
                    borderBottom: `0.5px solid ${color}20`,
                    position: 'sticky' as const,
                    left: 0,
                    background: '#162737',
                    zIndex: 1,
                    minWidth: 100,
                  }}>
                    Attribute
                  </th>
                  <th style={{
                    padding: '6px 8px',
                    textAlign: 'center' as const,
                    fontSize: 10,
                    color: color,
                    fontFamily: "'Space Mono', monospace",
                    fontWeight: 600,
                    borderBottom: `0.5px solid ${color}20`,
                    minWidth: 60,
                  }}>
                    Current
                  </th>
                  <th style={{
                    padding: '6px 8px',
                    textAlign: 'center' as const,
                    fontSize: 10,
                    color: '#4a7090',
                    fontFamily: "'Space Mono', monospace",
                    fontWeight: 400,
                    borderBottom: `0.5px solid ${color}20`,
                    minWidth: 60,
                  }}>
                    Grade
                  </th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(attrs).map(([key, attrLabel]) => {
                  const pillarData = profile[pillar] as Record<string, number>;
                  const s = pillarData[key] ?? 0;
                  const g = grade(s);

                  return (
                    <tr key={key}>
                      <td style={{
                        padding: '6px 8px',
                        fontSize: 11,
                        color: '#c8e0ee',
                        fontFamily: "'Sora', system-ui, sans-serif",
                        borderBottom: '0.5px solid rgba(47,230,222,0.04)',
                        position: 'sticky' as const,
                        left: 0,
                        background: '#162737',
                        zIndex: 1,
                      }}>
                        {attrLabel}
                      </td>
                      <td style={{
                        padding: '6px 8px',
                        textAlign: 'center' as const,
                        fontFamily: "'Space Mono', monospace",
                        fontSize: 12,
                        fontWeight: 600,
                        color,
                        background: scoreBg(s, 0.1),
                        borderBottom: '0.5px solid rgba(47,230,222,0.04)',
                        borderRadius: 4,
                      }}>
                        {s}
                      </td>
                      <td style={{
                        padding: '6px 8px',
                        textAlign: 'center' as const,
                        fontSize: 10,
                        color: g.c,
                        fontWeight: 500,
                        letterSpacing: '0.04em',
                        borderBottom: '0.5px solid rgba(47,230,222,0.04)',
                      }}>
                        {g.lbl}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Attribute bar chart */}
          <div style={{ marginTop: 14 }}>
            {Object.entries(attrs).map(([key, attrLabel]) => {
              const pillarData = profile[pillar] as Record<string, number>;
              const s = pillarData[key] ?? 0;
              return (
                <div key={key} style={{ marginBottom: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontSize: 10, color: '#7ab5cc' }}>{attrLabel}</span>
                    <span style={{ fontSize: 10, color, fontFamily: "'Space Mono', monospace" }}>{s}</span>
                  </div>
                  <div style={{
                    height: 4,
                    background: '#07121d',
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '0.5px solid rgba(47,230,222,0.06)',
                  }}>
                    <div style={{
                      height: '100%',
                      width: `${s}%`,
                      borderRadius: 2,
                      background: `linear-gradient(to right, ${color}66, ${color})`,
                      transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                    }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Trajectory Card ────────────────────────────────────────────

function TrajectoryCard({ profile }: { profile: Profile }) {
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

    // Grid
    [0, 25, 50, 75, 100].forEach(score => {
      const y = padT + drawH - (score / 100) * drawH;
      ctx.beginPath();
      ctx.moveTo(padL, y);
      ctx.lineTo(w - padR, y);
      ctx.strokeStyle = 'rgba(47,230,222,0.06)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(74,112,144,0.4)';
      ctx.font = '9px "Space Mono", monospace';
      ctx.textAlign = 'right';
      ctx.fillText(String(score), padL - 6, y + 3);
    });

    const history = profile.history;
    if (history.length === 0) return;

    // Period labels
    ctx.textAlign = 'center';
    ctx.font = '9px "Sora", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(74,112,144,0.6)';
    history.forEach((pt, i) => {
      const x = padL + (history.length === 1 ? drawW / 2 : (i / (history.length - 1)) * drawW);
      ctx.fillText(pt.period, x, h - 4);
    });

    // Draw lines for composite, eq, pq, iq
    const series = [
      { key: 'composite', color: '#2fe6de', width: 2.5 },
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
        pts.forEach((p, i) => {
          ctx.beginPath();
          ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
          ctx.fillStyle = '#2fe6de';
          ctx.fill();
          ctx.fillStyle = '#c8e0ee';
          ctx.font = 'bold 9px "Space Mono", monospace';
          ctx.textAlign = 'center';
          ctx.fillText(String(history[i].composite), p.x, p.y - 8);
        });
      }
    }
  }, [expanded, profile]);

  return (
    <div style={{
      background: '#162737',
      border: `0.5px solid ${expanded ? 'rgba(47,230,222,0.25)' : 'rgba(47,230,222,0.12)'}`,
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
            width: 4,
            height: 24,
            borderRadius: 2,
            background: '#2fe6de',
            flexShrink: 0,
          }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: '#c8e0ee', fontWeight: 500 }}>Trajectory</div>
            <div style={{ fontSize: 10, color: '#4a7090', marginTop: 2 }}>
              {profile.history.length} data points · Composite + Pillar trends
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 10,
          color: '#4a7090',
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
              { label: 'Composite', color: '#2fe6de' },
              { label: 'EQ', color: PILLAR_COLORS.eq + '80' },
              { label: 'PQ', color: PILLAR_COLORS.pq + '80' },
              { label: 'IQ', color: PILLAR_COLORS.iq + '80' },
            ].map(l => (
              <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <div style={{ width: 12, height: 2, borderRadius: 1, background: l.color }} />
                <span style={{ fontSize: 9, color: '#4a7090' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Archetype Card ──────────────────────────────────────────────

function ArchetypeCard({ profile }: { profile: Profile }) {
  const [expanded, setExpanded] = useState(false);
  const arch = profile.archetype;
  if (!arch) return null;

  const rc = RISK_COLORS[arch.risk] || RISK_COLORS.Low;

  return (
    <div style={{
      background: '#162737',
      border: `0.5px solid ${expanded ? rc.border : 'rgba(47,230,222,0.12)'}`,
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
            width: 4,
            height: 24,
            borderRadius: 2,
            background: rc.text,
            flexShrink: 0,
          }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: '#c8e0ee', fontWeight: 500 }}>Archetype</div>
            <div style={{ fontSize: 10, color: rc.text, marginTop: 2 }}>
              {arch.name} · {arch.risk} Risk · {arch.action}
            </div>
          </div>
        </div>
        <span style={{
          fontSize: 10,
          color: '#4a7090',
          transition: 'transform 0.2s',
          transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
        }}>
          ▼
        </span>
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            <span style={{
              padding: '3px 10px',
              borderRadius: 20,
              background: rc.bg,
              border: `0.5px solid ${rc.border}`,
              fontSize: 11,
              fontWeight: 500,
              color: rc.text,
            }}>
              {arch.name}
            </span>
            <span style={{
              padding: '3px 8px',
              borderRadius: 20,
              background: 'rgba(74,112,144,0.1)',
              border: '0.5px solid rgba(74,112,144,0.2)',
              fontSize: 10,
              color: '#4a7090',
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
            }}>
              {arch.action}
            </span>
            <span style={{
              padding: '3px 8px',
              borderRadius: 20,
              background: 'rgba(74,112,144,0.1)',
              border: '0.5px solid rgba(74,112,144,0.2)',
              fontSize: 10,
              color: '#4a7090',
              fontFamily: "'Space Mono', monospace",
            }}>
              {Math.round(arch.confidence * 100)}% conf.
            </span>
          </div>
          <p style={{ fontSize: 12, color: '#7ab5cc', lineHeight: 1.5, margin: 0 }}>
            {arch.description}
          </p>
          {profile.narrative && (
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              border: '0.5px solid rgba(74,112,144,0.15)',
              background: 'rgba(7,18,29,0.4)',
            }}>
              <div style={{ fontSize: 10, color: '#4a7090', marginBottom: 4, fontWeight: 500 }}>Narrative</div>
              <div style={{ fontSize: 11, color: '#7ab5cc', lineHeight: 1.5, fontStyle: 'italic' }}>
                {profile.narrative}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Profile Header ──────────────────────────────────────────────

function ProfileHeader({ profile }: { profile: Profile }) {
  const g = grade(profile.composite);
  const arch = profile.archetype;
  const rc = arch ? (RISK_COLORS[arch.risk] || RISK_COLORS.Low) : null;

  return (
    <div style={{
      padding: '24px 28px 20px',
      borderBottom: '0.5px solid rgba(47,230,222,0.12)',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <h2 style={{
            margin: 0,
            fontSize: 20,
            fontWeight: 500,
            color: '#c8e0ee',
            fontFamily: "'Sora', system-ui, sans-serif",
          }}>
            {profile.name}
          </h2>
          <div style={{
            fontSize: 11,
            color: '#4a7090',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.12em',
            marginTop: 4,
            fontFamily: "'Space Mono', monospace",
          }}>
            {profile.role}
          </div>
        </div>
        <div style={{
          textAlign: 'right',
          flexShrink: 0,
        }}>
          <div style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: 36,
            fontWeight: 700,
            color: '#2fe6de',
            lineHeight: 1,
          }}>
            {profile.composite}
          </div>
          <div style={{ fontSize: 10, color: g.c, marginTop: 2, letterSpacing: '0.04em' }}>
            {g.lbl}
          </div>
        </div>
      </div>

      {/* Pillar summary row */}
      <div style={{
        display: 'flex',
        gap: 12,
        marginTop: 16,
      }}>
        {(['eq', 'pq', 'iq'] as const).map(pillar => {
          const score = profile[`${pillar}Score` as keyof Profile] as number;
          const color = PILLAR_COLORS[pillar];
          return (
            <div key={pillar} style={{
              flex: 1,
              padding: '10px 12px',
              background: '#162737',
              borderRadius: 8,
              border: '0.5px solid rgba(47,230,222,0.12)',
            }}>
              <div style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: 20,
                fontWeight: 700,
                color,
                lineHeight: 1,
              }}>
                {score}
              </div>
              <div style={{
                fontSize: 9,
                color: '#4a7090',
                marginTop: 4,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
              }}>
                {pillar.toUpperCase()}
              </div>
              <div style={{
                height: 3,
                background: '#07121d',
                borderRadius: 2,
                marginTop: 6,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${score}%`,
                  borderRadius: 2,
                  background: `linear-gradient(to right, ${color}66, ${color})`,
                  transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Archetype badge */}
      {arch && rc && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginTop: 12,
        }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: 20,
            background: rc.bg,
            border: `0.5px solid ${rc.border}`,
            fontSize: 10,
            fontWeight: 500,
            color: rc.text,
          }}>
            {arch.name}
          </span>
          <span style={{
            fontSize: 10,
            color: '#4a7090',
            fontFamily: "'Space Mono', monospace",
          }}>
            {Math.round(arch.confidence * 100)}% confidence
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Individual View ────────────────────────────────────────

export default function IndividualView({
  profiles,
  initialProfileId,
}: {
  profiles: Profile[];
  initialProfileId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialProfileId || (profiles[0]?.id ?? null));

  const groupedProfiles = useMemo(() => {
    const groups: { label: string; profiles: Profile[] }[] = [];
    for (const wave of WAVE_ORDER) {
      const matching = profiles.filter(p => p.role === wave);
      if (matching.length > 0) {
        groups.push({ label: wave, profiles: matching });
      }
    }
    return groups;
  }, [profiles]);

  const selectedProfile = useMemo(() => {
    return profiles.find(p => p.id === selectedId) || null;
  }, [profiles, selectedId]);

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      background: '#0a1620',
      fontFamily: "'Sora', system-ui, sans-serif",
    }}>
      {/* Left Sidebar */}
      <div style={{
        width: 260,
        flexShrink: 0,
        borderRight: '0.5px solid rgba(47,230,222,0.12)',
        overflowY: 'auto',
        background: '#0e1e2d',
      }}>
        <div style={{
          padding: '16px 12px 8px',
          fontSize: 10,
          color: '#4a7090',
          fontFamily: "'Space Mono', monospace",
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          borderBottom: '0.5px solid rgba(47,230,222,0.08)',
        }}>
          Profiles · {profiles.length}
        </div>
        {groupedProfiles.map(group => (
          <SidebarGroup
            key={group.label}
            label={group.label}
            profiles={group.profiles}
            selectedId={selectedId}
            onSelect={(p) => setSelectedId(p.id)}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: '#0a1620',
      }}>
        {selectedProfile ? (
          <>
            <ProfileHeader profile={selectedProfile} />

            {/* Summary Table Section */}
            <div style={{ padding: '20px 28px' }}>
              <div style={{
                fontSize: 10,
                color: '#4a7090',
                fontFamily: "'Space Mono', monospace",
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                marginBottom: 12,
              }}>
                Longitudinal Scores
              </div>
              <div style={{
                background: '#0e1e2d',
                border: '0.5px solid rgba(47,230,222,0.12)',
                borderRadius: 10,
                overflow: 'hidden',
              }}>
                <SummaryTable profile={selectedProfile} />
              </div>
            </div>

            {/* Expandable Drilldowns */}
            <div style={{ padding: '0 28px 28px' }}>
              <div style={{
                fontSize: 10,
                color: '#4a7090',
                fontFamily: "'Space Mono', monospace",
                letterSpacing: '0.1em',
                textTransform: 'uppercase' as const,
                marginBottom: 12,
              }}>
                Deep Dive
              </div>
              <AttributeDrilldown profile={selectedProfile} pillar="eq" />
              <AttributeDrilldown profile={selectedProfile} pillar="pq" />
              <AttributeDrilldown profile={selectedProfile} pillar="iq" />
              <TrajectoryCard profile={selectedProfile} />
              <ArchetypeCard profile={selectedProfile} />
            </div>
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: '#4a7090',
            fontSize: 13,
          }}>
            Select a profile from the sidebar
          </div>
        )}
      </div>
    </div>
  );
}
