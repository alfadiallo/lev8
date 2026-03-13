'use client';

import { useEffect, useRef, useState, useCallback } from 'react';

// ─── Types ──────────────────────────────────────────────────────
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
}

interface Particle extends Profile {
  wIdx: number;
  x: number;
  yScatter: number;
  baseRad: number;
}

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

// ─── Component ──────────────────────────────────────────────────
export default function EpiquotientPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

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

  // ─── Data fetch ─────────────────────────────────────────────
  useEffect(() => {
    fetch('/api/epiquotient/profiles')
      .then((r) => r.json())
      .then((data: Profile[]) => {
        setProfiles(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('[EpiquotientPage] Failed to load profiles:', err);
        setLoading(false);
      });
  }, []);

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
          allParticles.push({ ...p, wIdx: wi, x, yScatter, baseRad });
        });
      }
      particlesRef.current = allParticles;
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
        const py = getY(p, time, H, W);
        const isHov = p.id === hovId;
        const isSel = p.id === selId;
        const dimmed = selId !== null && !isSel && !isHov;
        const { r, g, b } = scoreToRGB(p.composite);
        const alpha = dimmed ? 0.18 : isHov ? 1 : 0.75;
        const rad = isHov ? p.baseRad * 3 : p.baseRad;

        if (isHov) {
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
        ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`;
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

  // ─── Computed stats ────────────────────────────────────────
  const globalAvg =
    profiles.length > 0
      ? Math.round(profiles.reduce((s, p) => s + p.composite, 0) / profiles.length)
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
          font-size: 21px;
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
          pointer-events: none;
          z-index: 10;
        }
        .epiq-legend-ttl {
          font-size: 10px;
          color: #4a7090;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          margin-bottom: 7px;
        }
        .epiq-grad-bar {
          width: 130px;
          height: 5px;
          border-radius: 3px;
          background: linear-gradient(to right, #12253a, #1b5060, #1ea090, #2fe6de, #18f2b2);
        }
        .epiq-grad-lbls {
          display: flex;
          justify-content: space-between;
          width: 130px;
          margin-top: 5px;
        }
        .epiq-grad-lbls span {
          font-size: 10px;
          color: #4a7090;
          font-family: 'Space Mono', monospace;
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

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        className={`epiq-canvas${hovering ? ' hovering' : ''}`}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick}
      />

      {/* Loading */}
      {loading && (
        <div className="epiq-loading">
          Loading profiles
          <span className="epiq-loading-dot">.</span>
          <span className="epiq-loading-dot">.</span>
          <span className="epiq-loading-dot">.</span>
        </div>
      )}

      {/* HUD Header */}
      <div className="epiq-hdr">
        <div>
          <div className="epiq-logo">
            EPI<em>&middot;</em>Q
          </div>
          <div className="epiq-logo-sub">Performance Fingerprint</div>
        </div>
        <div className="epiq-stats">
          <div>
            <div className="epiq-stat-val">{profiles.length || '—'}</div>
            <div className="epiq-stat-lbl">Profiles</div>
          </div>
          <div>
            <div className="epiq-stat-val">{globalAvg || '—'}</div>
            <div className="epiq-stat-lbl">Avg. Score</div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="epiq-legend">
        <div className="epiq-legend-ttl">Composite Score</div>
        <div className="epiq-grad-bar" />
        <div className="epiq-grad-lbls">
          <span>25</span>
          <span>100</span>
        </div>
      </div>

      {/* Hint */}
      <div className="epiq-hint">
        <p>Hover a particle to identify</p>
        <p>Click to explore the profile</p>
      </div>

      {/* Tooltip */}
      <div
        className={`epiq-tt${hoveredProfile ? ' on' : ''}`}
        style={{ left: tooltipPos.x, top: tooltipPos.y }}
      >
        <div className="t-name">{hoveredProfile?.name || '—'}</div>
        <div className="t-role">{hoveredProfile?.role || '—'}</div>
        <div className="t-num">{hoveredProfile?.composite ?? '—'}</div>
        <div className="t-lbl">composite score</div>
        <div className="t-cta">Click to view full profile →</div>
      </div>

      {/* Side Panel */}
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
    </>
  );
}
