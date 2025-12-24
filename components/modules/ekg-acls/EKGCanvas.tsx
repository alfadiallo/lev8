// EKG Canvas Component - Renders EKG waveforms
// Adapted from virtual-sim

'use client';

import { useEffect, useRef } from 'react';
import { Rhythm } from '@/lib/sim/state/types';

interface EKGCanvasProps {
  rhythm: Rhythm;
  speedMmPerSec?: number;
  paused?: boolean;
}

export default function EKGCanvas({
  rhythm,
  speedMmPerSec = 25,
  paused = false,
}: EKGCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const lastTsRef = useRef<number>(0);
  const timeMsRef = useRef<number>(0);
  const xPosRef = useRef<number>(0);
  const dataRef = useRef<{ x: number; y: number; t: number }[]>([]);
  const pixelsPerMm = 4;
  const smallGrid = pixelsPerMm;
  const largeGrid = pixelsPerMm * 5;

  // Waveform generators
  function nsr(tMs: number): number {
    const HR = 72;
    const beat = 60000 / HR;
    const p = (tMs % beat) / beat;

    if (p < 0.096) {
      const u = p / 0.096;
      return 0.10 * Math.exp(-Math.pow((u - 0.5) * 4, 2));
    } else if (p < 0.192) {
      return 0;
    } else if (p < 0.204) {
      const u = (p - 0.192) / 0.012;
      return -0.08 * Math.sin(Math.PI * u);
    } else if (p < 0.252) {
      const u = (p - 0.204) / 0.048;
      return 1.2 * Math.sin(Math.PI * u);
    } else if (p < 0.300) {
      const u = (p - 0.252) / 0.048;
      return -0.35 * Math.sin(Math.PI * u);
    } else if (p < 0.312) {
      const u = (p - 0.300) / 0.012;
      return -0.35 * (1 - u);
    } else if (p < 0.480) {
      return 0;
    } else if (p < 0.672) {
      const u = (p - 0.480) / 0.192;
      return 0.30 * Math.exp(-Math.pow((u - 0.45) * 3.5, 2));
    }
    return 0;
  }

  function vfib(tMs: number): number {
    const t = tMs / 1000;
    const base = Math.sin(2 * Math.PI * (3 + 2 * Math.sin(t * 0.7)) * t);
    const jitter = Math.sin(2 * Math.PI * 17 * t) * 0.1 + (Math.random() - 0.5) * 0.05;
    const amp = 0.2 + 0.6 * (0.5 + 0.5 * Math.sin(t * 0.9));
    return (base + jitter) * amp;
  }

  function vtach(tMs: number): number {
    const HR = 170;
    const beat = 60000 / HR;
    const p = (tMs % beat) / beat;
    if (p < 0.15) {
      const u = p / 0.15;
      return 1.0 * Math.pow(Math.sin(Math.PI * u), 2);
    } else if (p < 0.30) {
      const u = (p - 0.15) / 0.15;
      return -0.3 * Math.pow(Math.sin(Math.PI * u), 2);
    }
    return 0;
  }

  function pea(tMs: number): number {
    const HR = 50;
    const beat = 60000 / HR;
    const p = (tMs % beat) / beat;
    if (p < 0.20) {
      const u = p / 0.20;
      return 0.06 * Math.sin(Math.PI * u);
    } else if (p < 0.28) {
      const u = (p - 0.20) / 0.08;
      return 0.25 * Math.sin(Math.PI * u);
    } else if (p < 0.40) {
      const u = (p - 0.28) / 0.12;
      return -0.1 * Math.sin(Math.PI * u);
    }
    return 0;
  }

  function sample(r: Rhythm, tMs: number): number {
    switch (r) {
      case 'NSR':
        return nsr(tMs);
      case 'VF':
        return vfib(tMs);
      case 'pVT':
        return vtach(tMs);
      case 'PEA':
        return pea(tMs);
      case 'Asystole':
        return 0;
    }
  }

  function drawGrid(ctx: CanvasRenderingContext2D, w: number, h: number) {
    ctx.strokeStyle = '#ffffff10';
    ctx.lineWidth = 0.5;
    for (let x = 0; x < w; x += smallGrid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += smallGrid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
    ctx.strokeStyle = '#ffffff25';
    ctx.lineWidth = 1;
    for (let x = 0; x < w; x += largeGrid) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y < h; y += largeGrid) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }
  }

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Capture references for closures
    const canvasElement = canvas;
    const context = ctx;
    
    function resize() {
      const { width } = canvasElement.getBoundingClientRect();
      canvasElement.width = Math.max(600, Math.floor(width));
      canvasElement.height = 280;
    }
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvasElement);

    function loop(ts: number) {
      if (!lastTsRef.current) lastTsRef.current = ts;
      const dt = ts - lastTsRef.current;
      lastTsRef.current = ts;

      if (!paused) {
        timeMsRef.current += dt;

        const w = canvasElement.width;
        const h = canvasElement.height;

        context.fillStyle = '#000';
        context.fillRect(0, 0, w, h);

        drawGrid(context, w, h);

        const mv = sample(rhythm, timeMsRef.current);
        const yPx = mv * (10 * pixelsPerMm);
        const centerY = h / 2;

        const point = { x: xPosRef.current, y: centerY - yPx, t: timeMsRef.current };
        const arr = dataRef.current;
        arr.push(point);
        if (arr.length > 3000) arr.shift();

        context.strokeStyle = '#fff';
        context.lineWidth = 1.6;
        context.lineCap = 'round';
        context.lineJoin = 'round';
        context.beginPath();
        for (let i = 0; i < arr.length; i++) {
          const p = arr[i];
          if (i === 0) context.moveTo(p.x, p.y);
          else context.lineTo(p.x, p.y);
        }
        context.stroke();

        if (arr.length) {
          const lp = arr[arr.length - 1];
          context.fillStyle = '#fff';
          context.beginPath();
          context.arc(lp.x, lp.y, 2.5, 0, Math.PI * 2);
          context.fill();
        }

        const pxPerMs = (speedMmPerSec * pixelsPerMm) / 1000;
        xPosRef.current += pxPerMs * dt;
        if (xPosRef.current > w) {
          xPosRef.current = xPosRef.current % w;
          for (const p of arr) p.x -= w;
          while (arr.length && arr[0].x < 0) arr.shift();
        }
      } else {
        lastTsRef.current = ts;
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      ro.disconnect();
    };
  }, [paused, rhythm, speedMmPerSec]);

  return <canvas ref={canvasRef} className="w-full h-[280px] block bg-black rounded-xl" />;
}


