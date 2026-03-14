'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { OverviewLens, EqPqIqLens, SwotLens, TrajectoryLens, ArchetypesLens } from '@/components/epiquotient';
import type { ProgramMeta } from '@/components/epiquotient';

type ViewMode = 'landing' | 'program' | 'class' | 'individual';

type ScopeType = 'program' | 'class' | 'individual';

const LENS_SECTIONS = [
  { id: 'overview', label: 'Overview', icon: '◉' },
  { id: 'eq-pq-iq', label: 'EQ / PQ / IQ', icon: '◎' },
  { id: 'swot', label: 'SWOT', icon: '◈' },
  { id: 'trajectory', label: 'ITE / Trajectory', icon: '◇' },
  { id: 'archetypes', label: 'Archetypes', icon: '◆' },
] as const;

// ─── Types ──────────────────────────────────────────────────────
interface HistoryPoint {
  period: string;
  composite: number;
}

interface Archetype {
  id: string;
  name: string;
  risk: string;
  action: string;
  description: string;
  confidence: number;
}

interface Profile {
  id: string;
  name: string;
  role: string;
  eq: Record<string, number>;
  pq: Record<string, number>;
  iq: Record<string, number>;
  eqScore: number;
  pqScore: number;
  iqScore: number;
  composite: number;
  history: HistoryPoint[];
  archetype: Archetype | null;
  narrative: string | null;
}

interface Particle extends Profile {
  wIdx: number;
  x: number;
  targetX: number;
  originX: number;
  yScatter: number;
  baseRad: number;
}

type SortMode = 'default' | 'az' | 'eq' | 'pq' | 'iq' | 'epiq';

// ─── Constants ──────────────────────────────────────────────────
const WAVES = [
  { yF: 0.22, amp: 55, freq: 1.1, spd: 0.22, ph: 0 },
  { yF: 0.34, amp: 70, freq: 0.85, spd: 0.17, ph: 1.2 },
  { yF: 0.46, amp: 65, freq: 1.0, spd: 0.25, ph: 2.5 },
  { yF: 0.57, amp: 50, freq: 0.75, spd: 0.20, ph: 3.8 },
  { yF: 0.68, amp: 45, freq: 1.15, spd: 0.19, ph: 5.1 },
  { yF: 0.79, amp: 42, freq: 0.90, spd: 0.21, ph: 4.3 },
];

const WAVE_COLORS = [
  'rgba(18,80,100,0.28)',
  'rgba(22,130,140,0.26)',
  'rgba(34,180,170,0.24)',
  'rgba(47,220,210,0.22)',
  'rgba(24,242,178,0.20)',
  'rgba(30,200,160,0.22)',
];

const WAVE_LABELS = ['PGY 4', 'PGY 3', 'PGY 2', 'PGY 1', 'MS4', 'MS3'];

const ROLE_TO_WAVE: Record<string, number> = {
  'PGY 4': 0,
  'PGY 3': 1,
  'PGY 2': 2,
  'PGY 1': 3,
  'MS4': 4,
  'MS3': 5,
};

const PILLAR_META: Record<string, { label: string; color: string; attrs: Record<string, string> }> = {
  eq: {
    label: 'Emotional Quotient',
    color: '#2FE6DE',
    attrs: {
      empathy: 'Empathy & Positive Interactions',
      adaptability: 'Adaptability & Self-Awareness',
      stressMgmt: 'Stress Management & Resilience',
      curiosity: 'Curiosity & Growth Mindset',
      communication: 'Communication Effectiveness',
    },
  },
  pq: {
    label: 'Professionalism Quotient',
    color: '#18F2B2',
    attrs: {
      workEthic: 'Work Ethic & Professional Presence',
      teachability: 'Teachability & Receptiveness',
      integrity: 'Integrity & Accountability',
      documentation: 'Clear & Timely Documentation',
      leadership: 'Leadership & Relationship Building',
    },
  },
  iq: {
    label: 'Intelligence Quotient',
    color: '#7BC8F8',
    attrs: {
      knowledgeBase: 'Strong Knowledge Base',
      learningCommit: 'Commitment to Learning',
      analyticalThinking: 'Analytical Thinking & Problem-Solving',
      clinicalAdapt: 'Adaptability in Clinical Reasoning',
      clinicalPerf: 'Clinical Performance for Year of Training',
    },
  },
};

const RING_COLORS: Record<string, string> = {
  eq: '#2FE6DE',
  pq: '#18F2B2',
  iq: '#7BC8F8',
};

function clamp(v: number, lo: number, hi: number) {
  return Math.max(lo, Math.min(hi, v));
}

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
  s = clamp(s, 0, 100);
  let lo = stops[0],
    hi = stops[stops.length - 1];
  for (let i = 0; i < stops.length - 1; i++) {
    if (s >= stops[i].s && s <= stops[i + 1].s) {
      lo = stops[i];
      hi = stops[i + 1];
      break;
    }
  }
  const t = hi.s === lo.s ? 0 : (s - lo.s) / (hi.s - lo.s);
  return {
    r: Math.round(lo.r + (hi.r - lo.r) * t),
    g: Math.round(lo.g + (hi.g - lo.g) * t),
    b: Math.round(lo.b + (hi.b - lo.b) * t),
  };
}

function grade(s: number) {
  if (s >= 88) return { lbl: 'Exemplary', c: '#18F2B2' };
  if (s >= 74) return { lbl: 'Strong', c: '#2FE6DE' };
  if (s >= 60) return { lbl: 'Acceptable', c: '#7BC8F8' };
  if (s >= 46) return { lbl: 'Concerning', c: '#f0a060' };
  return { lbl: 'Serious Deficit', c: '#f06060' };
}

function getY(p: Particle, t: number, H: number, W: number) {
  const w = WAVES[p.wIdx];
  return (
    H * w.yF +
    w.amp * Math.sin(w.freq * (p.x / W) * Math.PI * 4 + w.ph + t * w.spd) +
    p.yScatter
  );
}

// ─── Sparkline Helper ────────────────────────────────────────
function drawSparkline(
  ctx: CanvasRenderingContext2D,
  points: { x: number; y: number }[],
  w: number,
  h: number,
  color: string,
  opts: { dots?: boolean; dotRadius?: number; currentIdx?: number; lineWidth?: number } = {}
) {
  const { dots = true, dotRadius = 2.5, currentIdx, lineWidth = 1.5 } = opts;
  if (points.length < 2) {
    if (points.length === 1 && dots) {
      ctx.beginPath();
      ctx.arc(points[0].x, points[0].y, dotRadius + 1, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    }
    return;
  }

  // Draw smooth curve using quadratic bezier
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 0; i < points.length - 1; i++) {
    const cpX = (points[i].x + points[i + 1].x) / 2;
    const cpY = (points[i].y + points[i + 1].y) / 2;
    ctx.quadraticCurveTo(points[i].x, points[i].y, cpX, cpY);
  }
  const last = points[points.length - 1];
  ctx.lineTo(last.x, last.y);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.stroke();

  if (dots) {
    points.forEach((p, i) => {
      const r = i === currentIdx ? dotRadius + 1.5 : dotRadius;
      ctx.beginPath();
      ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.fill();
    });
  }
}

function historyToPoints(
  history: HistoryPoint[],
  w: number,
  h: number,
  padX: number,
  padY: number
): { x: number; y: number }[] {
  if (history.length === 0) return [];
  const minScore = 0;
  const maxScore = 100;
  const drawW = w - padX * 2;
  const drawH = h - padY * 2;
  return history.map((pt, i) => ({
    x: padX + (history.length === 1 ? drawW / 2 : (i / (history.length - 1)) * drawW),
    y: padY + drawH - ((pt.composite - minScore) / (maxScore - minScore)) * drawH,
  }));
}

function riskColor(risk: string): { bg: string; text: string; border: string } {
  switch (risk) {
    case 'Low':
      return { bg: 'rgba(24,242,178,0.12)', text: '#18F2B2', border: 'rgba(24,242,178,0.3)' };
    case 'Moderate':
      return { bg: 'rgba(240,160,96,0.12)', text: '#f0a060', border: 'rgba(240,160,96,0.3)' };
    case 'High':
      return { bg: 'rgba(240,96,96,0.12)', text: '#f06060', border: 'rgba(240,96,96,0.3)' };
    default:
      return { bg: 'rgba(74,112,144,0.12)', text: '#4a7090', border: 'rgba(74,112,144,0.3)' };
  }
}

// ─── Component ──────────────────────────────────────────────────

function TooltipSparkline({ history }: { history: HistoryPoint[] }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const w = 140;
    const h = 32;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    // Faint baseline
    ctx.beginPath();
    ctx.moveTo(8, h - 4);
    ctx.lineTo(w - 8, h - 4);
    ctx.strokeStyle = 'rgba(47,230,222,0.1)';
    ctx.lineWidth = 0.5;
    ctx.stroke();

    const pts = historyToPoints(history, w, h, 10, 5);
    drawSparkline(ctx, pts, w, h, 'rgba(47,230,222,0.7)', {
      dots: true,
      dotRadius: 2,
      currentIdx: history.length - 1,
      lineWidth: 1.5,
    });
  }, [history]);

  if (history.length === 0) return null;
  return <canvas ref={ref} style={{ display: 'block', marginTop: 6 }} />;
}

function PanelSparkline({ history, archetype }: { history: HistoryPoint[]; archetype: Archetype | null }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || history.length === 0) return;
    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const w = 340;
    const h = 80;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, w, h);

    const padX = 20;
    const padY = 14;
    const drawH = h - padY * 2;

    // Faint gridlines at 25, 50, 75
    [25, 50, 75].forEach((score) => {
      const y = padY + drawH - (score / 100) * drawH;
      ctx.beginPath();
      ctx.moveTo(padX, y);
      ctx.lineTo(w - padX, y);
      ctx.strokeStyle = 'rgba(47,230,222,0.06)';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      ctx.fillStyle = 'rgba(74,112,144,0.3)';
      ctx.font = '8px "Space Mono", monospace';
      ctx.fillText(String(score), 2, y + 3);
    });

    const pts = historyToPoints(history, w, h, padX, padY);
    drawSparkline(ctx, pts, w, h, '#2FE6DE', {
      dots: true,
      dotRadius: 3,
      currentIdx: history.length - 1,
      lineWidth: 2,
    });

    // Score labels above dots
    ctx.font = '500 9px "Space Mono", monospace';
    ctx.textAlign = 'center';
    pts.forEach((p, i) => {
      ctx.fillStyle = 'rgba(200,224,238,0.7)';
      ctx.fillText(String(history[i].composite), p.x, p.y - 8);
    });

    // Period labels below
    ctx.font = '8px "Sora", system-ui, sans-serif';
    ctx.fillStyle = 'rgba(74,112,144,0.6)';
    pts.forEach((p, i) => {
      ctx.fillText(history[i].period, p.x, h - 2);
    });
  }, [history, archetype]);

  if (history.length === 0) return null;
  return <canvas ref={ref} style={{ display: 'block', width: '100%' }} />;
}
export default function EpiquotientPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [activeSection, setActiveSection] = useState(0);
  const [exitingScope, setExitingScope] = useState<ScopeType | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Sort mode for particle arrangement
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const sortModeRef = useRef<SortMode>('default');

  // Program context metadata from API
  const [programMeta, setProgramMeta] = useState<ProgramMeta>({ institution: '', program: '' });

  // Class scope filter
  const [classFilter, setClassFilter] = useState<string | null>(null);

  // Interaction state stored in refs for animation loop access
  const particlesRef = useRef<Particle[]>([]);
  const hovIdRef = useRef<string | null>(null);
  const selIdRef = useRef<string | null>(null);
  const timeRef = useRef(0);
  const dimRef = useRef({ W: 0, H: 0 });
  const animRef = useRef(0);

  // UI state for React-rendered panels
  const [hoveredProfile, setHoveredProfile] = useState<Profile | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const [drillPillar, setDrillPillar] = useState<string | null>(null);
  const [hovering, setHovering] = useState(false);

  // Animated values for rings / bars
  const [ringAnimated, setRingAnimated] = useState(false);
  const [barAnimated, setBarAnimated] = useState(false);
  const [drillAnimated, setDrillAnimated] = useState(false);

  // ─── Filter state ─────────────────────────────────────────
  const ALL_ROLES = ['MS3', 'MS4', 'PGY 1', 'PGY 2', 'PGY 3', 'PGY 4'] as const;
  const ALL_BANDS = [0, 1, 2, 3, 4] as const;
  const BAND_LABELS = ['0–20', '21–40', '41–60', '61–80', '81–100'];

  const [activeRoles, setActiveRoles] = useState<Set<string>>(() => new Set(ALL_ROLES));
  const [activeScoreBands, setActiveScoreBands] = useState<Set<number>>(() => new Set(ALL_BANDS));
  const activeRolesRef = useRef<Set<string>>(new Set(ALL_ROLES));
  const activeScoreBandsRef = useRef<Set<number>>(new Set(ALL_BANDS));

  useEffect(() => { activeRolesRef.current = activeRoles; }, [activeRoles]);
  useEffect(() => { activeScoreBandsRef.current = activeScoreBands; }, [activeScoreBands]);

  function scoreToBand(s: number): number {
    if (s <= 20) return 0;
    if (s <= 40) return 1;
    if (s <= 60) return 2;
    if (s <= 80) return 3;
    return 4;
  }

  const toggleRole = useCallback((role: string) => {
    setActiveRoles(prev => {
      const next = new Set(prev);
      if (next.has(role)) next.delete(role);
      else next.add(role);
      return next;
    });
  }, []);

  const toggleBand = useCallback((band: number) => {
    setActiveScoreBands(prev => {
      const next = new Set(prev);
      if (next.has(band)) next.delete(band);
      else next.add(band);
      return next;
    });
  }, []);

  // ─── Data fetch ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/epiquotient/profiles')
      .then((r) => r.json())
      .then((body: { meta: ProgramMeta; profiles: Profile[] }) => {
        setProfiles(body.profiles);
        setProgramMeta(body.meta);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[EpiquotientPage] Failed to load profiles:', err);
        setLoading(false);
      });
  }, []);

  // ─── Particle sort ─────────────────────────────────────────
  function extractLastName(name: string): string {
    const withoutPrefix = name.replace(/^Dr\.\s*/, '');
    const withoutSuffix = withoutPrefix.replace(/,\s*(MD|DO|PhD).*$/i, '');
    const parts = withoutSuffix.trim().split(/\s+/);
    return (parts[parts.length - 1] || '').toLowerCase();
  }

  function getSortKey(p: Particle, mode: SortMode): number | string {
    switch (mode) {
      case 'az': return extractLastName(p.name);
      case 'eq': return p.eqScore;
      case 'pq': return p.pqScore;
      case 'iq': return p.iqScore;
      case 'epiq': return p.composite;
      default: return 0;
    }
  }

  function applySortOrder(mode: SortMode, W: number) {
    const parts = particlesRef.current;
    if (parts.length === 0) return;

    if (mode === 'default') {
      for (const p of parts) p.targetX = p.originX;
      return;
    }

    const byWave: Map<number, Particle[]> = new Map();
    for (const p of parts) {
      if (!byWave.has(p.wIdx)) byWave.set(p.wIdx, []);
      byWave.get(p.wIdx)!.push(p);
    }

    const pad = 40;
    for (const [, group] of byWave) {
      const sorted = [...group].sort((a, b) => {
        const ka = getSortKey(a, mode);
        const kb = getSortKey(b, mode);
        if (typeof ka === 'string' && typeof kb === 'string') return ka.localeCompare(kb);
        return (ka as number) - (kb as number);
      });

      sorted.forEach((p, i) => {
        p.targetX = pad + ((i + 0.5) / sorted.length) * (W - pad * 2);
      });
    }
  }

  // ─── Initialize particles when profiles or window size changes ──
  const initParticles = useCallback(
    (W: number, _H: number) => {
      const byWave: Profile[][] = [[], [], [], [], [], []];
      for (const p of profiles) {
        const wIdx = ROLE_TO_WAVE[p.role] ?? (profiles.indexOf(p) % WAVES.length);
        byWave[wIdx].push(p);
      }

      const allParticles: Particle[] = [];
      for (let wi = 0; wi < byWave.length; wi++) {
        const group = byWave[wi];
        group.forEach((p, i) => {
          const xBase = ((i + 0.5) / group.length) * W;
          const xJitter = (Math.random() - 0.5) * 60;
          const x = clamp(xBase + xJitter, 0, W);
          const yScatter = (Math.random() - 0.5) * 18;
          const baseRad = 2.8 + p.composite / 110;
          allParticles.push({ ...p, wIdx: wi, x, targetX: x, originX: x, yScatter, baseRad });
        });
      }
      particlesRef.current = allParticles;

      if (sortModeRef.current !== 'default') {
        applySortOrder(sortModeRef.current, W);
      }
    },
    [profiles]
  );

  // ─── Canvas animation ──────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || profiles.length === 0) return;

    const ctx = canvas.getContext('2d')!;
    let W = (canvas.width = window.innerWidth);
    let H = (canvas.height = window.innerHeight);
    dimRef.current = { W, H };

    initParticles(W, H);

    function resize() {
      W = canvas!.width = window.innerWidth;
      H = canvas!.height = window.innerHeight;
      dimRef.current = { W, H };
      initParticles(W, H);
    }
    window.addEventListener('resize', resize);

    function waveY(w: typeof WAVES[0], x: number, t: number) {
      return H * w.yF + w.amp * Math.sin(w.freq * (x / W) * Math.PI * 4 + w.ph + t * w.spd);
    }

    function drawWaveLines(t: number) {
      WAVES.forEach((w, wi) => {
        // Draw the sine trace line
        ctx.beginPath();
        for (let x = 0; x <= W; x += 3) {
          const y = waveY(w, x, t);
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.strokeStyle = WAVE_COLORS[wi];
        ctx.lineWidth = 0.8;
        ctx.setLineDash([]);
        ctx.stroke();

        // Draw subtle labels along the curve
        const label = WAVE_LABELS[wi];
        const LABEL_SPACING = 420;
        const LABEL_OFFSET = (wi * 90) + 140;
        ctx.font = '500 9px "Sora", system-ui, sans-serif';
        ctx.letterSpacing = '1.5px';

        for (let lx = LABEL_OFFSET; lx < W - 60; lx += LABEL_SPACING) {
          const y0 = waveY(w, lx, t);
          const y1 = waveY(w, lx + 2, t);
          const angle = Math.atan2(y1 - y0, 2);

          ctx.save();
          ctx.translate(lx, y0 - 5);
          ctx.rotate(angle);
          ctx.fillStyle = WAVE_COLORS[wi].replace(/[\d.]+\)$/, '0.45)');
          ctx.fillText(label.toUpperCase(), 0, 0);
          ctx.restore();
        }
        ctx.letterSpacing = '0px';
      });
    }

    function render(ts: number) {
      const time = ts / 1000;
      timeRef.current = time;
      ctx.clearRect(0, 0, W, H);
      drawWaveLines(time);

      const parts = particlesRef.current;
      const hovId = hovIdRef.current;
      const selId = selIdRef.current;

      for (const p of parts) {
        const dx = p.targetX - p.x;
        if (Math.abs(dx) > 0.3) {
          p.x += dx * (0.035 + Math.random() * 0.018);
        }
      }

      for (const p of parts) {
        const py = getY(p, time, H, W);
        const isHov = p.id === hovId;
        const isSel = p.id === selId;
        const dimmed = selId !== null && !isSel && !isHov;
        const filtered = !activeScoreBandsRef.current.has(scoreToBand(p.composite)) || !activeRolesRef.current.has(p.role);
        const { r, g, b } = scoreToRGB(p.composite);
        const alpha = filtered ? 0.05 : dimmed ? 0.18 : isHov ? 1 : 0.75;
        const rad = (isHov && !filtered) ? p.baseRad * 3 : isSel ? p.baseRad * 2.2 : p.baseRad;

        if (isSel && !filtered) {
          ctx.beginPath();
          ctx.arc(p.x, py, rad * 2.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(60,243,50,.10)';
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, py, rad * 1.5, 0, Math.PI * 2);
          ctx.fillStyle = 'rgba(60,243,50,.20)';
          ctx.fill();
        }

        if (isHov && !filtered) {
          ctx.beginPath();
          ctx.arc(p.x, py, rad * 2.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},.12)`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(p.x, py, rad * 1.7, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},.22)`;
          ctx.fill();
        }

        ctx.beginPath();
        ctx.arc(p.x, py, rad, 0, Math.PI * 2);
        ctx.fillStyle = isSel && !filtered ? `rgba(60,243,50,${filtered ? 0.05 : 1})` : `rgba(${r},${g},${b},${alpha})`;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(render);
    }

    animRef.current = requestAnimationFrame(render);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [profiles, initParticles]);

  // ─── Mouse interaction ─────────────────────────────────────
  const nearest = useCallback(
    (mx: number, my: number, thresh = 26): Particle | null => {
      let best: Particle | null = null;
      let minD = thresh;
      const { W, H } = dimRef.current;
      const time = timeRef.current;
      for (const p of particlesRef.current) {
        if (!activeScoreBandsRef.current.has(scoreToBand(p.composite)) || !activeRolesRef.current.has(p.role)) continue;
        const py = getY(p, time, H, W);
        const d = Math.hypot(p.x - mx, py - my);
        if (d < minD) {
          minD = d;
          best = p;
        }
      }
      return best;
    },
    []
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const p = nearest(e.clientX, e.clientY);
      if (p) {
        hovIdRef.current = p.id;
        setHovering(true);
        setHoveredProfile(p);
        const { W, H } = dimRef.current;
        let tx = e.clientX + 18;
        let ty = e.clientY - 24;
        if (tx + 200 > W) tx = e.clientX - 218;
        if (ty + 130 > H) ty = H - 140;
        setTooltipPos({ x: tx, y: ty });
      } else {
        hovIdRef.current = null;
        setHovering(false);
        setHoveredProfile(null);
      }
    },
    [nearest]
  );

  const handleMouseLeave = useCallback(() => {
    hovIdRef.current = null;
    setHovering(false);
    setHoveredProfile(null);
  }, []);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      const p = nearest(e.clientX, e.clientY);
      if (p) {
        openPanel(p);
      }
    },
    [nearest]
  );

  // ─── Panel logic ───────────────────────────────────────────
  function openPanel(p: Profile) {
    selIdRef.current = p.id;
    setSelectedProfile(p);
    setPanelOpen(true);
    setDrillPillar(null);
    setDrillAnimated(false);
    setHoveredProfile(null);
    hovIdRef.current = null;

    setRingAnimated(false);
    setBarAnimated(false);
    setTimeout(() => setBarAnimated(true), 60);
    setTimeout(() => setRingAnimated(true), 120);
  }

  function closePanel() {
    setPanelOpen(false);
    selIdRef.current = null;
    setSelectedProfile(null);
    setDrillPillar(null);
    setRingAnimated(false);
    setBarAnimated(false);
    setDrillAnimated(false);
  }

  function openDrill(pillar: string) {
    setDrillPillar(pillar);
    setDrillAnimated(false);
    setTimeout(() => setDrillAnimated(true), 60);
  }

  function closeDrill() {
    setDrillPillar(null);
    setDrillAnimated(false);
  }

  function enterScope(scope: ScopeType) {
    closePanel();
    if (viewMode !== 'landing' && viewMode !== scope) {
      setExitingScope(viewMode as ScopeType);
      setTimeout(() => setExitingScope(null), 700);
    }
    setViewMode(scope);
    setActiveSection(0);
    setTimeout(() => {
      scrollContainerRef.current?.scrollTo({ top: 0 });
    }, 50);
  }

  function exitToLanding() {
    closePanel();
    if (viewMode !== 'landing') {
      setExitingScope(viewMode as ScopeType);
      setTimeout(() => setExitingScope(null), 700);
    }
    setViewMode('landing');
    setActiveSection(0);
  }

  function handlePillClick(scope: ScopeType) {
    if (viewMode === scope) {
      exitToLanding();
    } else {
      enterScope(scope);
    }
  }

  function scrollToSection(idx: number) {
    const container = scrollContainerRef.current;
    if (!container) return;
    const section = container.children[idx] as HTMLElement;
    if (section) section.scrollIntoView({ behavior: 'smooth' });
  }

  useEffect(() => {
    if (viewMode === 'landing') return;
    const container = scrollContainerRef.current;
    if (!container) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && entry.intersectionRatio > 0.5) {
            const idx = Array.from(container.children).indexOf(entry.target as Element);
            if (idx >= 0) setActiveSection(idx);
          }
        }
      },
      { root: container, threshold: 0.5 }
    );

    Array.from(container.children).forEach((child) => observer.observe(child));
    return () => observer.disconnect();
  }, [viewMode]);

  useEffect(() => {
    if (viewMode === 'landing') return;
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') exitToLanding();
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewMode]);

  // ─── Computed stats ────────────────────────────────────────
  const visibleProfiles = profiles.filter(p => activeScoreBands.has(scoreToBand(p.composite)) && activeRoles.has(p.role));
  const visibleCount = visibleProfiles.length;
  const globalAvg =
    visibleProfiles.length > 0
      ? Math.round(visibleProfiles.reduce((s, p) => s + p.composite, 0) / visibleProfiles.length)
      : 0;

  const CIRC = 2 * Math.PI * 24;

  // ─── Render ────────────────────────────────────────────────
  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Sora:wght@300;400;500;600&family=Space+Mono:wght@400;700&display=swap');

        .epiq-canvas {
          position: absolute;
          top: 0;
          left: 0;
          display: block;
          cursor: default;
        }
        .epiq-canvas.hovering {
          cursor: pointer;
        }

        .epiq-hdr {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          padding: 26px 36px;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          pointer-events: none;
          z-index: 10;
        }
        .epiq-logo {
          font-family: 'Space Mono', monospace;
          font-size: 18px;
          font-weight: 700;
          letter-spacing: 0.06em;
          color: #2fe6de;
        }
        .epiq-logo em {
          color: #18f2b2;
          font-style: normal;
        }
        .epiq-logo-sub {
          font-size: 10px;
          color: #4a7090;
          letter-spacing: 0.14em;
          text-transform: uppercase;
          margin-top: 3px;
        }
        .epiq-stats {
          display: flex;
          gap: 28px;
        }
        .epiq-stat-val {
          font-family: 'Space Mono', monospace;
          font-size: 22px;
          color: #2fe6de;
          line-height: 1;
        }
        .epiq-stat-lbl {
          font-size: 10px;
          color: #4a7090;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-top: 3px;
        }

        .epiq-legend {
          position: absolute;
          bottom: 30px;
          left: 36px;
          z-index: 10;
          display: flex;
          align-items: center;
          gap: 10px;
        }
        .epiq-legend-dot {
          flex-shrink: 0;
        }
        .epiq-grad-bar {
          position: relative;
          display: flex;
          width: 200px;
          height: 8px;
          border-radius: 4px;
          overflow: visible;
          background: linear-gradient(to right, #12253a, #1b5060, #1ea090, #2fe6de, #18f2b2);
        }
        .epiq-grad-seg {
          flex: 1;
          position: relative;
          cursor: pointer;
        }
        .epiq-grad-seg:first-child { border-radius: 4px 0 0 4px; }
        .epiq-grad-seg:last-child { border-radius: 0 4px 4px 0; }
        .epiq-grad-seg:hover {
          background: rgba(255,255,255,0.08);
        }
        .epiq-grad-seg.dimmed {
          opacity: 0.2;
        }
        .epiq-grad-seg.sel {
          box-shadow: inset 0 0 0 1.5px rgba(60,243,50,0.7), 0 0 6px rgba(60,243,50,0.25);
          border-radius: 2px;
        }
        .epiq-grad-seg .epiq-seg-tip {
          position: absolute;
          bottom: 100%;
          left: 0;
          margin-bottom: 10px;
          white-space: nowrap;
          background: rgba(8, 18, 28, 0.94);
          border: 0.5px solid rgba(47, 230, 222, 0.2);
          border-radius: 8px;
          padding: 8px 12px;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.15s ease;
          z-index: 30;
        }
        .epiq-grad-seg:hover .epiq-seg-tip { opacity: 1; }
        .epiq-seg-tip-range {
          font-family: 'Space Mono', monospace;
          font-size: 11px;
          font-weight: 700;
          color: #2fe6de;
          margin-bottom: 2px;
        }
        .epiq-seg-tip-title {
          font-size: 11px;
          font-weight: 600;
          color: #c8e0ee;
          margin-bottom: 1px;
        }
        .epiq-seg-tip-desc {
          font-size: 10px;
          color: #4a7090;
        }
        .epiq-hint {
          position: absolute;
          bottom: 30px;
          right: 36px;
          pointer-events: none;
          z-index: 10;
          text-align: right;
        }
        .epiq-hint p {
          font-size: 11px;
          color: #4a7090;
          margin-top: 3px;
        }

        /* ─── Copyright Footer ────────────────────────────────── */
        .epiq-footer {
          position: fixed;
          bottom: 10px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 55;
          display: flex;
          align-items: center;
          gap: 3px;
          font-family: 'Space Mono', monospace;
          font-size: 9px;
          letter-spacing: 0.08em;
          color: #3a5a72;
          text-align: center;
          user-select: none;
          pointer-events: none;
          white-space: nowrap;
        }
        .epiq-copyright {
          width: 9px;
          height: 9px;
          flex-shrink: 0;
        }

        /* ─── Filter Bar ───────────────────────────────────────── */
        .epiq-filter-bar {
          position: absolute;
          bottom: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 20;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          padding: 12px 20px;
        }
        .epiq-filter-pills {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          justify-content: center;
          align-items: center;
        }
        .epiq-pill-dot {
          width: 22px;
          height: 22px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: #4a7090;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          transition: all 0.2s ease;
        }
        .epiq-pill-dot:hover {
          border-color: rgba(47, 230, 222, 0.4);
          color: #2fe6de;
        }
        .epiq-pill {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          padding: 4px 10px;
          border-radius: 20px;
          border: 1px solid rgba(47, 230, 222, 0.18);
          background: transparent;
          color: #4a7090;
          cursor: pointer;
          transition: all 0.2s ease;
          white-space: nowrap;
        }
        .epiq-pill:hover {
          border-color: rgba(47, 230, 222, 0.35);
          color: #7ab5cc;
        }
        .epiq-pill.active {
          background: rgba(47, 230, 222, 0.12);
          border-color: rgba(47, 230, 222, 0.4);
          color: #2fe6de;
        }
        .epiq-pill.sel {
          border-color: rgba(60, 243, 50, 0.7);
          box-shadow: 0 0 6px rgba(60, 243, 50, 0.25);
        }

        /* Tooltip */
        .epiq-tt {
          position: fixed;
          z-index: 50;
          pointer-events: none;
          background: rgba(10, 24, 38, 0.96);
          border: 0.5px solid rgba(47, 230, 222, 0.18);
          border-radius: 10px;
          padding: 12px 16px;
          min-width: 170px;
          opacity: 0;
          transform: translateY(4px);
          transition: opacity 0.15s ease, transform 0.15s ease;
        }
        .epiq-tt.on {
          opacity: 1;
          transform: translateY(0);
        }
        .epiq-tt .t-name {
          font-size: 13px;
          font-weight: 500;
          color: #c8e0ee;
          margin-bottom: 2px;
        }
        .epiq-tt .t-role {
          font-size: 10px;
          color: #4a7090;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 9px;
        }
        .epiq-tt .t-num {
          font-family: 'Space Mono', monospace;
          font-size: 26px;
          color: #2fe6de;
          line-height: 1;
        }
        .epiq-tt .t-lbl {
          font-size: 10px;
          color: #4a7090;
          margin-top: 2px;
        }
        .epiq-tt .t-cta {
          font-size: 10px;
          color: #4a7090;
          margin-top: 8px;
          opacity: 0.7;
          border-top: 0.5px solid rgba(47, 230, 222, 0.18);
          padding-top: 7px;
        }

        /* Side Panel */
        .epiq-panel {
          position: fixed;
          top: 0;
          right: 0;
          bottom: 0;
          width: 390px;
          background: #0e1e2d;
          border-left: 0.5px solid rgba(47, 230, 222, 0.18);
          z-index: 40;
          transform: translateX(100%);
          transition: transform 0.4s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: 'Sora', system-ui, sans-serif;
        }
        .epiq-panel.open {
          transform: translateX(0);
        }
        .epiq-ph {
          padding: 24px 24px 18px;
          border-bottom: 0.5px solid rgba(47, 230, 222, 0.18);
          position: relative;
          flex-shrink: 0;
        }
        .epiq-close-btn {
          position: absolute;
          top: 20px;
          right: 20px;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #162737;
          border: 0.5px solid rgba(47, 230, 222, 0.18);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4a7090;
          font-size: 13px;
          transition: all 0.2s;
          user-select: none;
        }
        .epiq-close-btn:hover {
          color: #c8e0ee;
          border-color: #2fe6de;
        }
        .epiq-p-name {
          font-size: 17px;
          font-weight: 500;
          color: #c8e0ee;
          margin-bottom: 2px;
          padding-right: 36px;
        }
        .epiq-p-role {
          font-size: 10px;
          color: #4a7090;
          text-transform: uppercase;
          letter-spacing: 0.12em;
        }
        .epiq-p-comp {
          display: flex;
          align-items: center;
          gap: 14px;
          margin-top: 14px;
          padding: 13px 16px;
          background: #162737;
          border-radius: 8px;
          border: 0.5px solid rgba(47, 230, 222, 0.18);
        }
        .epiq-p-comp-val {
          font-family: 'Space Mono', monospace;
          font-size: 36px;
          color: #2fe6de;
          line-height: 1;
          flex-shrink: 0;
        }
        .epiq-p-comp-meta {
          flex: 1;
        }
        .epiq-p-comp-lbl {
          font-size: 10px;
          color: #4a7090;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .epiq-p-bar {
          height: 4px;
          background: #07121d;
          border-radius: 2px;
          margin-top: 7px;
          overflow: hidden;
        }
        .epiq-p-bar-fill {
          height: 100%;
          border-radius: 2px;
          background: linear-gradient(to right, #2fe6de, #18f2b2);
          transition: width 0.9s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .epiq-pillars {
          padding: 20px 24px;
          flex: 1;
          overflow-y: auto;
        }
        .epiq-sec-lbl {
          font-size: 10px;
          color: #4a7090;
          text-transform: uppercase;
          letter-spacing: 0.12em;
          margin-bottom: 16px;
        }
        .epiq-pcard {
          background: #162737;
          border: 0.5px solid rgba(47, 230, 222, 0.18);
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 12px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 16px;
          transition: all 0.2s;
        }
        .epiq-pcard:hover {
          border-color: #2fe6de;
          background: rgba(47, 230, 222, 0.04);
          transform: translateX(-2px);
        }
        .epiq-pcard:hover .epiq-pcard-arrow {
          opacity: 1;
          transform: translateX(0);
        }
        .epiq-pcard-arrow {
          font-size: 14px;
          color: #4a7090;
          opacity: 0;
          transform: translateX(-4px);
          transition: all 0.2s;
          flex-shrink: 0;
        }
        .epiq-pcard-info {
          flex: 1;
        }
        .epiq-pcard-name {
          font-size: 11px;
          color: #4a7090;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }
        .epiq-pcard-full {
          font-size: 13px;
          color: #c8e0ee;
          margin-top: 2px;
        }
        .epiq-pcard-hint {
          font-size: 10px;
          color: #4a7090;
          margin-top: 3px;
        }

        /* Ring SVG */
        .epiq-ring-svg text {
          font-family: 'Space Mono', monospace;
        }

        /* Drill Panel */
        .epiq-drill {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: #0e1e2d;
          z-index: 50;
          transform: translateX(105%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          display: flex;
          flex-direction: column;
        }
        .epiq-drill.open {
          transform: translateX(0);
        }
        .epiq-dh {
          padding: 20px 24px 16px;
          border-bottom: 0.5px solid rgba(47, 230, 222, 0.18);
          display: flex;
          align-items: center;
          gap: 12px;
          flex-shrink: 0;
        }
        .epiq-back-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: #162737;
          border: 0.5px solid rgba(47, 230, 222, 0.18);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #4a7090;
          flex-shrink: 0;
          transition: all 0.2s;
          user-select: none;
          font-size: 14px;
        }
        .epiq-back-btn:hover {
          color: #c8e0ee;
          border-color: #2fe6de;
        }
        .epiq-d-title {
          font-size: 14px;
          font-weight: 500;
          flex: 1;
        }
        .epiq-d-score {
          font-family: 'Space Mono', monospace;
          font-size: 20px;
        }
        .epiq-d-content {
          padding: 22px 24px;
          flex: 1;
          overflow-y: auto;
        }
        .epiq-attr {
          margin-bottom: 22px;
        }
        .epiq-attr-row {
          display: flex;
          justify-content: space-between;
          align-items: baseline;
          margin-bottom: 8px;
        }
        .epiq-attr-name {
          font-size: 12px;
          color: #c8e0ee;
          line-height: 1.4;
          padding-right: 8px;
        }
        .epiq-attr-val {
          font-family: 'Space Mono', monospace;
          font-size: 13px;
          flex-shrink: 0;
        }
        .epiq-attr-track {
          height: 5px;
          background: #07121d;
          border-radius: 3px;
          overflow: hidden;
          border: 0.5px solid rgba(47, 230, 222, 0.08);
        }
        .epiq-attr-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 1s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .epiq-attr-grade {
          font-size: 10px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          margin-top: 5px;
        }

        /* Loading */
        .epiq-loading {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          font-family: 'Space Mono', monospace;
          font-size: 14px;
          color: #4a7090;
          letter-spacing: 0.1em;
          z-index: 10;
        }

        /* ─── View Switcher Pill ──────────────────────────────── */
        .epiq-view-switcher {
          position: fixed;
          top: 24px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 60;
          display: flex;
          align-items: center;
          background: rgba(10, 24, 38, 0.85);
          border: 0.5px solid rgba(47, 230, 222, 0.18);
          border-radius: 28px;
          padding: 3px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
        }
        .epiq-view-btn {
          font-family: 'Sora', system-ui, sans-serif;
          font-size: 12px;
          font-weight: 400;
          letter-spacing: 0.04em;
          padding: 7px 22px;
          border-radius: 24px;
          border: none;
          background: transparent;
          color: #4a7090;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          white-space: nowrap;
          position: relative;
          user-select: none;
        }
        .epiq-view-btn:hover:not(.active) {
          color: #7ab5cc;
        }
        .epiq-view-btn.active {
          background: rgba(47, 230, 222, 0.12);
          color: #2fe6de;
          font-weight: 500;
          box-shadow: 0 0 12px rgba(47, 230, 222, 0.08);
        }

        /* ─── Sort Row ───────────────────────────────────────── */
        .epiq-sort-row {
          position: fixed;
          top: 68px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 60;
          display: flex;
          align-items: center;
          gap: 0;
          white-space: nowrap;
        }
        .epiq-sort-btn {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          color: #4a7090;
          background: none;
          border: none;
          cursor: pointer;
          padding: 4px 6px;
          transition: color 0.2s ease;
        }
        .epiq-sort-btn:hover {
          color: #7ab5cc;
        }
        .epiq-sort-btn.active {
          color: #2fe6de;
        }
        .epiq-sort-sep {
          color: rgba(74, 112, 144, 0.3);
          font-size: 10px;
          padding: 0 2px;
          user-select: none;
        }

        /* ─── Landing / Scope Transitions ────────────────────── */
        .epiq-landing {
          position: absolute;
          inset: 0;
          opacity: 1;
          transition: opacity 0.7s linear;
        }
        .epiq-landing.hidden {
          opacity: 0;
          pointer-events: none;
        }

        /* ─── Scroll-Snap Scope Container ────────────────────── */
        .epiq-scope {
          position: absolute;
          inset: 0;
          overflow-y: auto;
          scroll-snap-type: y mandatory;
          -webkit-overflow-scrolling: touch;
          opacity: 0;
          pointer-events: none;
          visibility: hidden;
          transition: opacity 0.7s linear, visibility 0s linear 0.7s;
        }
        .epiq-scope.active {
          opacity: 1;
          pointer-events: auto;
          visibility: visible;
          transition: opacity 0.7s linear, visibility 0s linear 0s;
        }
        .epiq-scope.exiting {
          opacity: 0;
          pointer-events: none;
          visibility: visible;
          transition: opacity 0.7s linear, visibility 0s linear 0.7s;
        }
        .epiq-scope::-webkit-scrollbar {
          width: 0;
        }

        .epiq-scope-section {
          width: 100vw;
          min-height: 100vh;
          scroll-snap-align: start;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          position: relative;
          padding: 100px 60px 60px;
          box-sizing: border-box;
        }

        .epiq-section-header {
          position: absolute;
          top: 80px;
          left: 60px;
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .epiq-section-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: rgba(47, 230, 222, 0.06);
          border: 0.5px solid rgba(47, 230, 222, 0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2fe6de;
          font-size: 16px;
        }
        .epiq-section-title {
          font-family: 'Sora', system-ui, sans-serif;
          font-size: 16px;
          font-weight: 500;
          color: #c8e0ee;
          letter-spacing: 0.02em;
        }
        .epiq-section-scope {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #4a7090;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          margin-left: 8px;
        }
        .epiq-scope-program {
          text-transform: none;
          letter-spacing: 0.04em;
          opacity: 0.7;
        }
        .epiq-scope-class {
          display: inline-flex;
          gap: 4px;
          text-transform: none;
        }
        .epiq-class-pill {
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          letter-spacing: 0.06em;
          color: #4a7090;
          background: none;
          border: 0.5px solid rgba(47, 230, 222, 0.12);
          border-radius: 10px;
          padding: 2px 8px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .epiq-class-pill:hover {
          color: #7ab5cc;
          border-color: rgba(47, 230, 222, 0.25);
        }
        .epiq-class-pill.active {
          color: #2fe6de;
          border-color: rgba(47, 230, 222, 0.4);
          background: rgba(47, 230, 222, 0.08);
        }
        .epiq-class-pill.all {
          opacity: 0.5;
        }
        .epiq-class-pill.all:hover {
          opacity: 1;
        }

        /* ─── Dot Navigation (right edge) ────────────────────── */
        .epiq-dot-nav {
          position: fixed;
          right: 24px;
          top: 50%;
          transform: translateY(-50%);
          z-index: 55;
          display: flex;
          flex-direction: column;
          gap: 14px;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.4s ease 0.3s;
        }
        .epiq-dot-nav.visible {
          opacity: 1;
          pointer-events: auto;
        }
        .epiq-dot {
          position: relative;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #4a7090;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.25s ease;
        }
        .epiq-dot:hover {
          background: #7ab5cc;
          transform: scale(1.3);
        }
        .epiq-dot.active {
          background: #2fe6de;
          box-shadow: 0 0 8px rgba(47, 230, 222, 0.4);
          transform: scale(1.2);
        }
        .epiq-dot-label {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          white-space: nowrap;
          font-family: 'Space Mono', monospace;
          font-size: 10px;
          color: #7ab5cc;
          letter-spacing: 0.04em;
          opacity: 0;
          pointer-events: none;
          transition: opacity 0.15s ease;
        }
        .epiq-dot:hover .epiq-dot-label {
          opacity: 1;
        }
        .epiq-loading-dot {
          animation: epiq-blink 1.2s infinite;
        }
        .epiq-loading-dot:nth-child(2) {
          animation-delay: 0.2s;
        }
        .epiq-loading-dot:nth-child(3) {
          animation-delay: 0.4s;
        }
        @keyframes epiq-blink {
          0%, 80%, 100% { opacity: 0.2; }
          40% { opacity: 1; }
        }
      `}</style>

      {/* View Switcher Pill */}
      <div className="epiq-view-switcher">
        {(['program', 'class', 'individual'] as ScopeType[]).map((scope) => (
          <button
            key={scope}
            className={`epiq-view-btn${viewMode === scope ? ' active' : ''}`}
            onClick={() => handlePillClick(scope)}
          >
            {scope.charAt(0).toUpperCase() + scope.slice(1)}
          </button>
        ))}
      </div>

      {/* Sort Row — beneath pill, only on landing */}
      {viewMode === 'landing' && (
        <div className="epiq-sort-row">
          {([
            { mode: 'az' as SortMode, label: 'A → Z' },
            { mode: 'eq' as SortMode, label: 'EQ' },
            { mode: 'pq' as SortMode, label: 'PQ' },
            { mode: 'iq' as SortMode, label: 'IQ' },
            { mode: 'epiq' as SortMode, label: 'EPIq' },
          ]).map((item, i, arr) => (
            <span key={item.mode}>
              <button
                className={`epiq-sort-btn${sortMode === item.mode ? ' active' : ''}`}
                onClick={() => {
                  const next = sortMode === item.mode ? 'default' : item.mode;
                  setSortMode(next);
                  sortModeRef.current = next;
                  applySortOrder(next, dimRef.current.W);
                }}
              >
                {item.label}
              </button>
              {i < arr.length - 1 && <span className="epiq-sort-sep">|</span>}
            </span>
          ))}
        </div>
      )}

      {/* Dot Navigation (visible in scope views) */}
      <div className={`epiq-dot-nav${viewMode !== 'landing' ? ' visible' : ''}`}>
        {LENS_SECTIONS.map((lens, i) => (
          <button
            key={lens.id}
            className={`epiq-dot${activeSection === i ? ' active' : ''}`}
            onClick={() => scrollToSection(i)}
          >
            <span className="epiq-dot-label">{lens.label}</span>
          </button>
        ))}
      </div>

      {/* ═══ Landing State: Particle Wave Field ═══ */}
      <div className={`epiq-landing${viewMode !== 'landing' ? ' hidden' : ''}`}>
        <canvas
          ref={canvasRef}
          className={`epiq-canvas${hovering ? ' hovering' : ''}`}
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          onClick={handleClick}
        />

        {loading && (
          <div className="epiq-loading">
            Loading profiles
            <span className="epiq-loading-dot">.</span>
            <span className="epiq-loading-dot">.</span>
            <span className="epiq-loading-dot">.</span>
          </div>
        )}

        <div className="epiq-hdr">
          <div>
            <div className="epiq-logo">EPI Quotient</div>
            <div className="epiq-logo-sub">Performance Fingerprint</div>
          </div>
          <div className="epiq-stats">
            <div>
              <div className="epiq-stat-val">{visibleCount < profiles.length ? `${visibleCount}/${profiles.length}` : (profiles.length || '—')}</div>
              <div className="epiq-stat-lbl">Profiles</div>
            </div>
            <div>
              <div className="epiq-stat-val">{globalAvg || '—'}</div>
              <div className="epiq-stat-lbl">Avg. Score</div>
            </div>
          </div>
        </div>

        <div className="epiq-legend">
          <div className="epiq-grad-bar">
            {[
              { range: '0 – 20', title: 'Significant Concern', desc: 'Red flags requiring intervention' },
              { range: '21 – 40', title: 'Below Expectations', desc: 'Noticeable gaps; targeted development needed' },
              { range: '41 – 60', title: 'Meets Expectations', desc: 'Adequate; developmentally appropriate gaps' },
              { range: '61 – 80', title: 'Exceeds Expectations', desc: 'Solid performance with clear competence' },
              { range: '81 – 100', title: 'Exceptional', desc: 'Exceeds expectations with compelling examples' },
            ].map((seg, i) => (
              <div
                key={i}
                className={`epiq-grad-seg${activeScoreBands.has(i) ? '' : ' dimmed'}${selectedProfile && scoreToBand(selectedProfile.composite) === i ? ' sel' : ''}`}
                onClick={() => toggleBand(i)}
              >
                <div className="epiq-seg-tip">
                  <div className="epiq-seg-tip-range">{seg.range}</div>
                  <div className="epiq-seg-tip-title">{seg.title}</div>
                  <div className="epiq-seg-tip-desc">{seg.desc}</div>
                </div>
              </div>
            ))}
          </div>
          <button className="epiq-pill-dot epiq-legend-dot" onClick={() => setActiveScoreBands(new Set(ALL_BANDS))} title="Select all score bands">
            <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>
          </button>
        </div>

        <div className="epiq-hint">
          <p>Hover a particle to identify</p>
          <p>Click to explore the profile</p>
        </div>

        <div className="epiq-filter-bar">
          <div className="epiq-filter-pills">
            <button className="epiq-pill-dot" onClick={() => setActiveRoles(new Set())} title="Deselect all">
              <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            </button>
            {ALL_ROLES.map(role => (
              <button key={role} className={`epiq-pill${activeRoles.has(role) ? ' active' : ''}${selectedProfile?.role === role ? ' sel' : ''}`} onClick={() => toggleRole(role)}>{role}</button>
            ))}
            <button className="epiq-pill-dot" onClick={() => setActiveRoles(new Set(ALL_ROLES))} title="Select all">
              <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>
            </button>
          </div>
          <div className="epiq-filter-pills">
            <button className="epiq-pill-dot" onClick={() => setActiveScoreBands(new Set())} title="Deselect all score bands">
              <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="none" stroke="currentColor" strokeWidth="1.2" /></svg>
            </button>
            {ALL_BANDS.map(band => (
              <button key={band} className={`epiq-pill${activeScoreBands.has(band) ? ' active' : ''}${selectedProfile && scoreToBand(selectedProfile.composite) === band ? ' sel' : ''}`} onClick={() => toggleBand(band)}>{BAND_LABELS[band]}</button>
            ))}
            <button className="epiq-pill-dot" onClick={() => setActiveScoreBands(new Set(ALL_BANDS))} title="Select all score bands">
              <svg width="10" height="10" viewBox="0 0 10 10"><circle cx="5" cy="5" r="4" fill="currentColor" /></svg>
            </button>
          </div>
        </div>

        <div className={`epiq-tt${hoveredProfile ? ' on' : ''}`} style={{ left: tooltipPos.x, top: tooltipPos.y }}>
          <div className="t-name">{hoveredProfile?.name || '—'}</div>
          <div className="t-role">{hoveredProfile?.role || '—'}</div>
          <div className="t-num">{hoveredProfile?.composite ?? '—'}</div>
          <div className="t-lbl">composite score</div>
          {hoveredProfile && hoveredProfile.history.length > 1 && <TooltipSparkline history={hoveredProfile.history} />}
          {hoveredProfile?.archetype && (
            <div className="t-archetype" style={{ marginTop: 6, fontSize: 9, color: riskColor(hoveredProfile.archetype.risk).text, letterSpacing: '0.06em' }}>
              {hoveredProfile.archetype.name}
            </div>
          )}
          <div className="t-cta">Click to view full profile →</div>
        </div>
      </div>

      {/* ═══ Scope Pages (Program / Class / Individual) ═══ */}
      {(['program', 'class', 'individual'] as ScopeType[]).map((scope) => {
        const scopeProfiles = scope === 'class' && classFilter
          ? profiles.filter(p => p.role === classFilter)
          : profiles;

        const distinctRoles = [...new Set(profiles.map(p => p.role))].sort((a, b) => {
          const order: Record<string, number> = { 'MS3': 0, 'MS4': 1, 'PGY 1': 2, 'PGY 2': 3, 'PGY 3': 4, 'PGY 4': 5 };
          return (order[a] ?? 99) - (order[b] ?? 99);
        });

        return (
        <div
          key={scope}
          ref={viewMode === scope ? scrollContainerRef : undefined}
          className={`epiq-scope${viewMode === scope ? ' active' : ''}${exitingScope === scope ? ' exiting' : ''}`}
        >
          {LENS_SECTIONS.map((lens, i) => {
            const lensComponents: Record<string, React.ReactNode> = {
              overview: <OverviewLens scope={scope} profiles={scopeProfiles} />,
              'eq-pq-iq': <EqPqIqLens scope={scope} profiles={scopeProfiles} />,
              swot: <SwotLens scope={scope} profiles={scopeProfiles} />,
              trajectory: <TrajectoryLens scope={scope} profiles={scopeProfiles} />,
              archetypes: <ArchetypesLens scope={scope} profiles={scopeProfiles} />,
            };

            return (
              <div key={lens.id} className="epiq-scope-section" style={{ borderBottom: i < LENS_SECTIONS.length - 1 ? '0.5px solid rgba(47,230,222,0.06)' : 'none' }}>
                <div className="epiq-section-header">
                  <div className="epiq-section-icon">{lens.icon}</div>
                  <div className="epiq-section-title">{lens.label}</div>
                  {scope === 'program' && programMeta.institution && (
                    <span className="epiq-section-scope epiq-scope-program">
                      {programMeta.institution} · {programMeta.program}
                    </span>
                  )}
                  {scope === 'program' && !programMeta.institution && (
                    <span className="epiq-section-scope">program</span>
                  )}
                  {scope === 'class' && (
                    <span className="epiq-section-scope epiq-scope-class">
                      {distinctRoles.map((role) => (
                        <button
                          key={role}
                          className={`epiq-class-pill${classFilter === role ? ' active' : ''}${!classFilter ? ' all' : ''}`}
                          onClick={() => setClassFilter(classFilter === role ? null : role)}
                        >
                          {role}
                        </button>
                      ))}
                    </span>
                  )}
                  {scope === 'individual' && (
                    <span className="epiq-section-scope">individual</span>
                  )}
                </div>
                {lensComponents[lens.id]}
              </div>
            );
          })}
        </div>
        );
      })}

      {/* Copyright footer — always visible, fixed bottom center */}
      <div className="epiq-footer"><svg className="epiq-copyright" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.2"/><path d="M10.2 6.1A3 3 0 0 0 8 5a3 3 0 1 0 0 6 3 3 0 0 0 2.2-1.1" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg> 2026 EPI Quotient</div>

      {/* Side Panel — only on landing (particle field) */}
      {viewMode === 'landing' && (
      <div className={`epiq-panel${panelOpen ? ' open' : ''}`}>
        <div className="epiq-ph">
          <div className="epiq-close-btn" onClick={closePanel}>
            ✕
          </div>
          <div className="epiq-p-name">{selectedProfile?.name || '—'}</div>
          <div className="epiq-p-role">{selectedProfile?.role || '—'}</div>
          <div className="epiq-p-comp">
            <div className="epiq-p-comp-val">{selectedProfile?.composite ?? '—'}</div>
            <div className="epiq-p-comp-meta">
              <div className="epiq-p-comp-lbl">Composite EPI·Q Score</div>
              <div className="epiq-p-bar">
                <div
                  className="epiq-p-bar-fill"
                  style={{ width: barAnimated && selectedProfile ? `${selectedProfile.composite}%` : '0%' }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Trajectory Section */}
        {selectedProfile && (
          <div style={{
            padding: '16px 24px',
            borderBottom: '0.5px solid rgba(47,230,222,0.18)',
            flexShrink: 0,
          }}>
            {/* Archetype Badge */}
            {selectedProfile.archetype && (() => {
              const rc = riskColor(selectedProfile.archetype.risk);
              return (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <div style={{
                    padding: '3px 10px',
                    borderRadius: 20,
                    background: rc.bg,
                    border: `0.5px solid ${rc.border}`,
                    fontSize: 10,
                    fontWeight: 500,
                    color: rc.text,
                    letterSpacing: '0.06em',
                  }}>
                    {selectedProfile.archetype.name}
                  </div>
                  <div style={{
                    padding: '3px 8px',
                    borderRadius: 20,
                    background: 'rgba(74,112,144,0.1)',
                    border: '0.5px solid rgba(74,112,144,0.2)',
                    fontSize: 9,
                    color: '#4a7090',
                    letterSpacing: '0.06em',
                    textTransform: 'uppercase' as const,
                  }}>
                    {selectedProfile.archetype.action}
                  </div>
                  <div style={{
                    fontSize: 9,
                    color: '#4a7090',
                    marginLeft: 'auto',
                    fontFamily: "'Space Mono', monospace",
                  }}>
                    {Math.round(selectedProfile.archetype.confidence * 100)}%
                  </div>
                </div>
              );
            })()}

            {/* Archetype description */}
            {selectedProfile.archetype && (
              <div style={{
                fontSize: 11,
                color: '#4a7090',
                marginBottom: 12,
                lineHeight: 1.4,
              }}>
                {selectedProfile.archetype.description}
              </div>
            )}

            {/* Larger sparkline */}
            {selectedProfile.history.length > 0 && (
              <PanelSparkline history={selectedProfile.history} archetype={selectedProfile.archetype} />
            )}

            {/* Narrative placeholder */}
            <div style={{
              marginTop: 12,
              padding: '10px 14px',
              borderRadius: 8,
              border: '0.5px dashed rgba(74,112,144,0.25)',
              background: 'rgba(7,18,29,0.4)',
            }}>
              <div style={{
                fontSize: 10,
                color: '#4a7090',
                fontStyle: 'italic',
                opacity: 0.6,
              }}>
                {selectedProfile.narrative || 'Narrative analysis will appear here'}
              </div>
            </div>
          </div>
        )}

        <div className="epiq-pillars">
          <div className="epiq-sec-lbl">Domain Breakdown — select to explore attributes</div>

          {['eq', 'pq', 'iq'].map((pillar) => {
            const meta = PILLAR_META[pillar];
            const color = RING_COLORS[pillar];
            const score = selectedProfile
              ? selectedProfile[`${pillar}Score` as keyof Profile] as number
              : 0;
            const dash = ringAnimated ? (score / 100) * CIRC : 0;
            const hintMap: Record<string, string> = {
              eq: 'Empathy · Resilience · Communication',
              pq: 'Integrity · Work Ethic · Leadership',
              iq: 'Knowledge · Reasoning · Adaptability',
            };

            return (
              <div key={pillar} className="epiq-pcard" onClick={() => openDrill(pillar)}>
                <svg
                  className="epiq-ring-svg"
                  width="60"
                  height="60"
                  viewBox="0 0 60 60"
                  style={{ flexShrink: 0 }}
                >
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="none"
                    stroke={`${color}1F`}
                    strokeWidth="5"
                  />
                  <circle
                    cx="30"
                    cy="30"
                    r="24"
                    fill="none"
                    stroke={color}
                    strokeWidth="5"
                    strokeLinecap="round"
                    strokeDasharray={`${dash} ${CIRC}`}
                    transform="rotate(-90 30 30)"
                    style={{ transition: 'stroke-dasharray 1s cubic-bezier(.16,1,.3,1)' }}
                  />
                  <text
                    x="30"
                    y="35"
                    textAnchor="middle"
                    fill={color}
                    fontSize="11"
                    fontWeight="700"
                  >
                    {ringAnimated ? score : '—'}
                  </text>
                </svg>
                <div className="epiq-pcard-info">
                  <div className="epiq-pcard-name">{pillar.toUpperCase()}</div>
                  <div className="epiq-pcard-full">{meta.label}</div>
                  <div className="epiq-pcard-hint">{hintMap[pillar]}</div>
                </div>
                <div className="epiq-pcard-arrow">→</div>
              </div>
            );
          })}
        </div>

        {/* Drill Panel */}
        <div className={`epiq-drill${drillPillar ? ' open' : ''}`}>
          {drillPillar && selectedProfile && (
            <>
              <div className="epiq-dh">
                <div className="epiq-back-btn" onClick={closeDrill}>
                  ←
                </div>
                <div className="epiq-d-title" style={{ color: PILLAR_META[drillPillar].color }}>
                  {PILLAR_META[drillPillar].label}
                </div>
                <div className="epiq-d-score" style={{ color: PILLAR_META[drillPillar].color }}>
                  {selectedProfile[`${drillPillar}Score` as keyof Profile] as number}
                </div>
              </div>
              <div className="epiq-d-content">
                {Object.entries(PILLAR_META[drillPillar].attrs).map(([key, label], i) => {
                  const pillarData = selectedProfile[drillPillar as keyof Profile] as Record<string, number>;
                  const s = pillarData[key] ?? 0;
                  const g = grade(s);
                  const color = PILLAR_META[drillPillar].color;
                  const fillWidth = drillAnimated ? `${s}%` : '0%';

                  return (
                    <div key={key} className="epiq-attr">
                      <div className="epiq-attr-row">
                        <div className="epiq-attr-name">{label}</div>
                        <div className="epiq-attr-val" style={{ color }}>
                          {s}
                        </div>
                      </div>
                      <div className="epiq-attr-track">
                        <div
                          className="epiq-attr-fill"
                          style={{
                            width: fillWidth,
                            background: `linear-gradient(to right, ${color}66, ${color})`,
                            transitionDelay: `${i * 70}ms`,
                          }}
                        />
                      </div>
                      <div className="epiq-attr-grade" style={{ color: g.c }}>
                        {g.lbl}
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
      )}
    </>
  );
}
