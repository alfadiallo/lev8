'use client';

import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import type { Profile } from '../types';
import type { RadarSeries } from '../types';
import { PILLAR_COLORS } from '../types';
import { THEME } from './primitives';

const ATTR_LABELS: Record<string, string> = {
  empathy: 'Empathy',
  adaptability: 'Adaptability',
  stressMgmt: 'Stress Mgmt',
  curiosity: 'Curiosity',
  communication: 'Communication',
  workEthic: 'Work Ethic',
  integrity: 'Integrity',
  teachability: 'Teachability',
  documentation: 'Documentation',
  leadership: 'Leadership',
  knowledgeBase: 'Knowledge',
  analyticalThinking: 'Analytical',
  learningCommit: 'Learning',
  clinicalAdapt: 'Flexibility',
  clinicalPerf: 'Performance',
};

const ATTR_ORDER = [
  'empathy', 'adaptability', 'stressMgmt', 'curiosity', 'communication',
  'workEthic', 'integrity', 'teachability', 'documentation', 'leadership',
  'knowledgeBase', 'analyticalThinking', 'learningCommit', 'clinicalAdapt', 'clinicalPerf',
];

const PILLAR_FOR_ATTR: Record<string, 'eq' | 'pq' | 'iq'> = {
  empathy: 'eq', adaptability: 'eq', stressMgmt: 'eq', curiosity: 'eq', communication: 'eq',
  workEthic: 'pq', integrity: 'pq', teachability: 'pq', documentation: 'pq', leadership: 'pq',
  knowledgeBase: 'iq', analyticalThinking: 'iq', learningCommit: 'iq', clinicalAdapt: 'iq', clinicalPerf: 'iq',
};

const SECTION_COLORS: Record<string, string> = {
  eq: '#2563EB',
  pq: '#16A34A',
  iq: '#9333EA',
};

const LERP_DURATION = 250;
const PLAY_INTERVAL = 1200;

function catmullRomPoints(
  rawPts: { x: number; y: number }[],
  tension = 0.35,
): { cp1: { x: number; y: number }; cp2: { x: number; y: number }; end: { x: number; y: number } }[] {
  const n = rawPts.length;
  if (n < 3) return [];
  const pts = [rawPts[n - 1], ...rawPts, rawPts[0], rawPts[1]];
  const segments: { cp1: { x: number; y: number }; cp2: { x: number; y: number }; end: { x: number; y: number } }[] = [];

  for (let i = 1; i < pts.length - 2; i++) {
    const p0 = pts[i - 1];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2];

    segments.push({
      cp1: { x: p1.x + (p2.x - p0.x) * tension, y: p1.y + (p2.y - p0.y) * tension },
      cp2: { x: p2.x - (p3.x - p1.x) * tension, y: p2.y - (p3.y - p1.y) * tension },
      end: { x: p2.x, y: p2.y },
    });
  }
  return segments;
}

function lerpSeries(
  from: RadarSeries[],
  to: RadarSeries[],
  t: number,
  keys: string[],
): RadarSeries[] {
  return to.map((toS, si) => {
    const fromS = from[si] ?? toS;
    const scores: Record<string, number> = {};
    for (const k of keys) {
      const a = fromS.scores[k] ?? 0;
      const b = toS.scores[k] ?? 0;
      scores[k] = a + (b - a) * t;
    }
    return { ...toS, scores };
  });
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

export default function RadarSection({ profile }: { profile: Profile }) {
  const [expanded, setExpanded] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const radarData = profile.radar;
  const timeline = radarData?.timeline;
  const hasTimeline = timeline && timeline.length >= 2;
  const defaultSeries = radarData?.series ?? [];

  const rawKeys = Object.keys((hasTimeline ? timeline[timeline.length - 1].series[0]?.scores : defaultSeries[0]?.scores) ?? {});
  const rawKeysKey = rawKeys.join(',');
  const allKeys = useMemo(() => {
    const ordered = ATTR_ORDER.filter(k => rawKeys.includes(k));
    if (ordered.length === 0 && rawKeys.length > 0) ordered.push(...rawKeys);
    return ordered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawKeysKey]);

  const [timelineIndex, setTimelineIndex] = useState(() => hasTimeline ? timeline.length - 1 : 0);
  const [playing, setPlaying] = useState(false);

  const animFromRef = useRef<RadarSeries[]>(defaultSeries);
  const animToRef = useRef<RadarSeries[]>(defaultSeries);
  const animStartRef = useRef<number>(0);
  const rafRef = useRef<number>(0);
  const playTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const activeSeries = useMemo(() => {
    if (hasTimeline) return timeline[timelineIndex]?.series ?? defaultSeries;
    return defaultSeries;
  }, [hasTimeline, timeline, timelineIndex, defaultSeries]);

  useEffect(() => {
    if (!hasTimeline) return;
    setTimelineIndex(timeline.length - 1);
    setPlaying(false);
  }, [profile.id, hasTimeline, timeline?.length]);

  const drawRadar = useCallback((series: RadarSeries[]) => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container || allKeys.length === 0 || series.length === 0) return;

    const ctx = canvas.getContext('2d')!;
    const dpr = window.devicePixelRatio || 1;
    const size = Math.min(480, container.clientWidth);
    const cx = size / 2;
    const cy = size / 2;
    const radius = size * 0.34;
    canvas.width = size * dpr;
    canvas.height = size * dpr;
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, size, size);

    const n = allKeys.length;
    const angleStep = (Math.PI * 2) / n;
    const startAngle = -Math.PI / 2;

    [20, 40, 60, 80, 100].forEach(ring => {
      const r = (ring / 100) * radius;
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const angle = startAngle + i * angleStep;
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.strokeStyle = THEME.border.light;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      if (ring === 80) {
        ctx.fillStyle = THEME.text.muted + '80';
        ctx.font = '9px "Space Mono", monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'bottom';
        ctx.fillText(String(ring), cx + 3, cy - r - 2);
      }
    });

    allKeys.forEach((key, i) => {
      const angle = startAngle + i * angleStep;
      const x = cx + Math.cos(angle) * radius;
      const y = cy + Math.sin(angle) * radius;
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.lineTo(x, y);
      ctx.strokeStyle = THEME.border.subtle;
      ctx.lineWidth = 0.5;
      ctx.stroke();

      const labelR = radius + 18;
      const lx = cx + Math.cos(angle) * labelR;
      const ly = cy + Math.sin(angle) * labelR;
      const pillar = PILLAR_FOR_ATTR[key];
      ctx.fillStyle = pillar ? SECTION_COLORS[pillar] : THEME.text.muted;
      ctx.font = '600 10px system-ui, -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(ATTR_LABELS[key] || key, lx, ly);
    });

    for (const s of series) {
      const points = allKeys.map((key, i) => {
        const val = s.scores[key] ?? 0;
        const r = (val / 100) * radius;
        const angle = startAngle + i * angleStep;
        return { x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r };
      });

      const segments = catmullRomPoints(points);
      if (segments.length > 0) {
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for (const seg of segments) {
          ctx.bezierCurveTo(seg.cp1.x, seg.cp1.y, seg.cp2.x, seg.cp2.y, seg.end.x, seg.end.y);
        }
        ctx.closePath();

        ctx.fillStyle = s.color + '20';
        ctx.fill();
        ctx.strokeStyle = s.color;
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      for (const pt of points) {
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, 3, 0, Math.PI * 2);
        ctx.fillStyle = s.color;
        ctx.fill();
        ctx.strokeStyle = THEME.bg.card;
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    }
  }, [allKeys]);

  // Animate transition between frames
  useEffect(() => {
    if (!expanded) return;

    const targetSeries = activeSeries;
    const fromSeries = animToRef.current;

    if (fromSeries === targetSeries) {
      drawRadar(targetSeries);
      return;
    }

    animFromRef.current = fromSeries;
    animToRef.current = targetSeries;
    animStartRef.current = performance.now();

    function tick(now: number) {
      const elapsed = now - animStartRef.current;
      const t = Math.min(1, elapsed / LERP_DURATION);
      const eased = easeInOut(t);
      const interpolated = lerpSeries(animFromRef.current, animToRef.current, eased, allKeys);
      drawRadar(interpolated);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [expanded, activeSeries, allKeys, drawRadar]);

  // Auto-play loop
  useEffect(() => {
    if (!playing || !hasTimeline) return;

    playTimerRef.current = setInterval(() => {
      setTimelineIndex(prev => (prev + 1) % timeline.length);
    }, PLAY_INTERVAL);

    return () => {
      if (playTimerRef.current) clearInterval(playTimerRef.current);
    };
  }, [playing, hasTimeline, timeline?.length]);

  if (!radarData || defaultSeries.length === 0) return null;

  const currentPeriod = hasTimeline ? timeline[timelineIndex]?.period : null;

  return (
    <div style={{
      background: THEME.bg.card,
      border: `0.5px solid ${expanded ? PILLAR_COLORS.eq + '40' : THEME.border.medium}`,
      borderRadius: 10,
      marginBottom: 10,
      overflow: 'hidden',
      transition: 'border-color 0.2s ease',
    }}>
      <button
        onClick={() => setExpanded(!expanded)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 24, borderRadius: 2, background: THEME.accent, flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: THEME.text.primary, fontWeight: 500 }}>EPI-Q Profile</div>
            <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
              {allKeys.length} attributes · {activeSeries.length} series
              {currentPeriod ? ` · ${currentPeriod}` : ''}
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
        <div ref={containerRef} style={{ padding: '0 16px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Pillar color legend */}
          <div style={{ display: 'flex', gap: 16, marginBottom: 12, flexWrap: 'wrap', justifyContent: 'center' }}>
            {[
              { label: 'EQ (Emotional)', color: SECTION_COLORS.eq },
              { label: 'PQ (Professional)', color: SECTION_COLORS.pq },
              { label: 'IQ (Intellectual)', color: SECTION_COLORS.iq },
            ].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: p.color }} />
                <span style={{ fontSize: 10, color: THEME.text.secondary }}>{p.label}</span>
              </div>
            ))}
          </div>

          <canvas ref={canvasRef} style={{ display: 'block' }} />

          {/* Series legend */}
          <div style={{ display: 'flex', gap: 20, marginTop: 14, flexWrap: 'wrap', justifyContent: 'center' }}>
            {activeSeries.map(s => (
              <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 10, height: 10, borderRadius: '50%', background: s.color, opacity: 0.9 }} />
                <span style={{ fontSize: 11, color: THEME.text.primary, fontWeight: 500 }}>{s.label}</span>
              </div>
            ))}
          </div>

          {/* Score range key */}
          <div style={{
            display: 'flex', gap: 12, marginTop: 12, flexWrap: 'wrap', justifyContent: 'center',
            fontSize: 9, color: THEME.text.muted,
          }}>
            {[
              { range: '0–20', label: 'Significant Concern', color: '#ef4444' },
              { range: '21–40', label: 'Below Expectations', color: '#f97316' },
              { range: '41–60', label: 'Meets Expectations', color: '#3b82f6' },
              { range: '61–80', label: 'Exceeds Expectations', color: '#22c55e' },
              { range: '81–100', label: 'Exceptional', color: '#15803d' },
            ].map(r => (
              <span key={r.range} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: r.color, display: 'inline-block' }} />
                {r.range} {r.label}
              </span>
            ))}
          </div>

          {/* Timeline slider + play button */}
          {hasTimeline && (
            <div style={{ width: '100%', maxWidth: 420, marginTop: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {/* Slider track — custom-built for pixel-perfect centering */}
                <div
                  style={{ flex: 1, position: 'relative', height: 18, cursor: 'pointer' }}
                  onPointerDown={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const pct = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
                    const idx = Math.round(pct * (timeline.length - 1));
                    setPlaying(false);
                    setTimelineIndex(idx);

                    const onMove = (ev: PointerEvent) => {
                      const p = Math.max(0, Math.min(1, (ev.clientX - rect.left) / rect.width));
                      setTimelineIndex(Math.round(p * (timeline.length - 1)));
                    };
                    const onUp = () => {
                      window.removeEventListener('pointermove', onMove);
                      window.removeEventListener('pointerup', onUp);
                    };
                    window.addEventListener('pointermove', onMove);
                    window.addEventListener('pointerup', onUp);
                  }}
                >
                  {/* Background track */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    right: 0,
                    height: 4,
                    marginTop: -2,
                    borderRadius: 2,
                    background: THEME.border.medium,
                  }} />
                  {/* Filled portion */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: 0,
                    height: 4,
                    marginTop: -2,
                    width: `${(timelineIndex / Math.max(1, timeline.length - 1)) * 100}%`,
                    borderRadius: 2,
                    background: THEME.accent,
                  }} />
                  {/* Thumb */}
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: `${(timelineIndex / Math.max(1, timeline.length - 1)) * 100}%`,
                    width: 14,
                    height: 14,
                    marginTop: -7,
                    marginLeft: -7,
                    borderRadius: '50%',
                    background: THEME.accent,
                    border: `2px solid ${THEME.bg.card}`,
                    boxShadow: '0 0 6px rgba(47,230,222,0.4)',
                    pointerEvents: 'none',
                  }} />
                </div>

                {/* Play / Pause button */}
                <button
                  onClick={() => setPlaying(p => !p)}
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    border: `1px solid ${THEME.border.medium}`,
                    background: playing ? THEME.accent + '18' : 'transparent',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                    transition: 'all 0.15s ease',
                  }}
                  title={playing ? 'Pause' : 'Play timeline'}
                >
                  {playing ? (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={THEME.accent}>
                      <rect x="5" y="4" width="5" height="16" rx="1" />
                      <rect x="14" y="4" width="5" height="16" rx="1" />
                    </svg>
                  ) : (
                    <svg width="10" height="10" viewBox="0 0 24 24" fill={THEME.accent}>
                      <polygon points="6,4 20,12 6,20" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Period labels as tick marks */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                paddingRight: 34,
                marginTop: 4,
              }}>
                {timeline.map((snap, i) => (
                  <button
                    key={snap.period}
                    onClick={() => { setPlaying(false); setTimelineIndex(i); }}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '2px 0',
                      fontSize: 9,
                      fontFamily: THEME.font.mono,
                      letterSpacing: '0.04em',
                      color: i === timelineIndex ? THEME.accent : THEME.text.dim,
                      fontWeight: i === timelineIndex ? 600 : 400,
                      transition: 'color 0.15s ease',
                      textAlign: 'center',
                      flex: 1,
                    }}
                  >
                    {snap.period}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
