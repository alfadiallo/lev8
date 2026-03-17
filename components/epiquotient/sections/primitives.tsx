'use client';

import { useRef, useEffect } from 'react';

// ─── Dark Theme Constants ────────────────────────────────────────

export const THEME = {
  bg: {
    page: '#0a1620',
    sidebar: '#0e1e2d',
    card: '#162737',
    deep: '#07121d',
    table: '#0e1e2d',
  },
  border: {
    subtle: 'rgba(47,230,222,0.06)',
    light: 'rgba(47,230,222,0.08)',
    medium: 'rgba(47,230,222,0.12)',
    accent: 'rgba(47,230,222,0.25)',
  },
  text: {
    primary: '#c8e0ee',
    secondary: '#7ab5cc',
    muted: '#4a7090',
    dim: '#3a5a72',
  },
  accent: '#2fe6de',
  font: {
    body: "'Sora', system-ui, sans-serif",
    mono: "'Space Mono', monospace",
  },
} as const;

export const PERIOD_ORDER = ['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'PGY 4', 'Graduate'];

export function periodSortIndex(period: string): number {
  const idx = PERIOD_ORDER.indexOf(period);
  return idx === -1 ? 99 : idx;
}

// ─── Score Color Utilities ───────────────────────────────────────

export function scoreToRGB(s: number) {
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

export function scoreBg(s: number, alpha = 0.35): string {
  const { r, g, b } = scoreToRGB(s);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function scoreColor(s: number): string {
  const { r, g, b } = scoreToRGB(s);
  return `rgb(${r},${g},${b})`;
}

export function grade(s: number): { lbl: string; c: string } {
  if (s >= 88) return { lbl: 'Exemplary', c: '#18F2B2' };
  if (s >= 74) return { lbl: 'Strong', c: '#2FE6DE' };
  if (s >= 60) return { lbl: 'Acceptable', c: '#7BC8F8' };
  if (s >= 46) return { lbl: 'Concerning', c: '#f0a060' };
  return { lbl: 'Serious Deficit', c: '#f06060' };
}

// ─── Reusable Components ─────────────────────────────────────────

export function HeatCell({ value }: { value?: number }) {
  if (value === undefined || value === null) {
    return (
      <td style={{
        padding: '6px 10px',
        textAlign: 'center' as const,
        fontFamily: THEME.font.mono,
        fontSize: 11,
        color: THEME.text.dim,
        borderBottom: `0.5px solid ${THEME.border.subtle}`,
      }}>
        —
      </td>
    );
  }

  return (
    <td style={{
      padding: '6px 10px',
      textAlign: 'center' as const,
      fontFamily: THEME.font.mono,
      fontSize: 12,
      fontWeight: 600,
      color: scoreColor(value),
      background: scoreBg(value, 0.12),
      borderBottom: `0.5px solid ${THEME.border.subtle}`,
      borderRadius: 4,
    }}>
      {value}
    </td>
  );
}

export function MiniSparkline({ values, color, width = 80, height = 24 }: {
  values: number[];
  color: string;
  width?: number;
  height?: number;
}) {
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
