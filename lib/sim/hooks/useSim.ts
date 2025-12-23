// Simulation hook (adapted from virtual-sim)

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { createInitialContext, getNode, tick, applyChoice } from '../state/engine';
import { Choice, Scenario, SimContext } from '../state/types';

export function useSim(scenario: Scenario) {
  const [ctx, setCtx] = useState<SimContext>(() => createInitialContext(scenario));
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const raf = useRef<number | null>(null);
  const last = useRef<number | null>(null);

  const node = useMemo(() => getNode(ctx, scenario), [ctx, scenario]);

  useEffect(() => {
    function loop(ts: number) {
      if (last.current == null) last.current = ts;
      const dt = (ts - last.current) / 1000;
      last.current = ts;

      setCtx((c) => tick(c, scenario, dt));

      if (node?.timer != null) {
        setSecondsLeft((s) => {
          const next = (s == null ? node.timer : s) - dt;
          if (next <= 0) {
            const nextId = node.onTimeout?.next ?? node.id;
            setCtx((c) => ({ ...c, currentId: nextId }));
            return null;
          }
          return next;
        });
      } else {
        setSecondsLeft(null);
      }

      raf.current = requestAnimationFrame(loop);
    }
    raf.current = requestAnimationFrame(loop);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
      last.current = null;
    };
  }, [ctx.currentId, node?.timer, scenario]);

  const choose = (choice: Choice) => {
    if (typeof choice.guard === 'function') {
      const ok = choice.guard(ctx);
      if (!ok) return;
    }
    setSecondsLeft(null);
    setCtx((c) => applyChoice(c, scenario, choice));
  };

  const setStateId = (id: string) => setCtx((c) => ({ ...c, currentId: id }));

  return { ctx, node, secondsLeft, choose, setStateId };
}


