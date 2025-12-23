// Simulation engine (adapted from virtual-sim)

import { Choice, Scenario, SimContext } from './types';

export function createInitialContext(scn: Scenario): SimContext {
  return {
    currentId: scn.initial,
    shocks: 0,
    minutes: 0,
    epiGivenAtMinutes: [],
    amioGiven: false,
    penalties: {},
    rosProbability: 0.05,
  };
}

export function applyChoice(ctx: SimContext, scn: Scenario, choice: Choice): SimContext {
  const next = { ...ctx };

  if (choice.effects?.inc?.shocks) next.shocks += choice.effects.inc.shocks;
  if (choice.effects?.pushEpiNow) next.epiGivenAtMinutes.push(next.minutes);
  if (choice.effects?.setAmioGiven) next.amioGiven = true;

  if (choice.effects?.penalty) {
    for (const k of Object.keys(choice.effects.penalty)) {
      const key = k as keyof typeof choice.effects.penalty;
      next.penalties[key] = (next.penalties[key] ?? 0) + (choice.effects.penalty[key] ?? 0);
    }
    next.rosProbability = Math.max(0, next.rosProbability - 0.01);
  }

  if (choice.isCorrect === true) {
    next.rosProbability = Math.min(0.5, next.rosProbability + 0.03);
  }

  if (choice.effects?.next) next.currentId = choice.effects.next;
  return next;
}

export function tick(ctx: SimContext, scn: Scenario, dtSec: number): SimContext {
  const next = { ...ctx };
  next.minutes += dtSec / 60;

  const node = scn.nodes[ctx.currentId];
  if (node?.timer) {
    // Timer handling - can be implemented later
  }
  return next;
}

export function isEpiEligible(ctx: SimContext): boolean {
  const last = ctx.epiGivenAtMinutes.at(-1) ?? -999;
  return (ctx.minutes - last) >= 3 - 1e-6;
}

export function getNode(ctx: SimContext, scn: Scenario) {
  return scn.nodes[ctx.currentId];
}


