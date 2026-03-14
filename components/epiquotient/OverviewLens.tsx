'use client';

import { useMemo } from 'react';
import type { LensProps, Profile } from './types';
import { PILLAR_COLORS, PILLAR_LABELS, RISK_COLORS } from './types';

function avg(arr: number[]): number {
  return arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;
}

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{
      background: 'rgba(22,39,55,0.6)',
      border: '0.5px solid rgba(47,230,222,0.12)',
      borderRadius: 12,
      padding: '20px 22px',
      flex: '1 1 160px',
      minWidth: 140,
    }}>
      <div style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 32,
        fontWeight: 700,
        color: color || '#2fe6de',
        lineHeight: 1,
      }}>{value}</div>
      <div style={{
        fontSize: 11,
        color: '#c8e0ee',
        marginTop: 6,
        fontWeight: 500,
      }}>{label}</div>
      {sub && (
        <div style={{ fontSize: 10, color: '#4a7090', marginTop: 3 }}>{sub}</div>
      )}
    </div>
  );
}

function PillarBar({ pillar, score, maxScore }: { pillar: keyof typeof PILLAR_COLORS; score: number; maxScore: number }) {
  const color = PILLAR_COLORS[pillar];
  const pct = maxScore > 0 ? (score / maxScore) * 100 : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
      <div style={{
        width: 30,
        fontSize: 10,
        fontFamily: "'Space Mono', monospace",
        color,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.08em',
        textAlign: 'right' as const,
      }}>{pillar.toUpperCase()}</div>
      <div style={{
        flex: 1,
        height: 6,
        background: 'rgba(7,18,29,0.6)',
        borderRadius: 3,
        overflow: 'hidden',
        border: '0.5px solid rgba(47,230,222,0.06)',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          borderRadius: 3,
          background: `linear-gradient(to right, ${color}66, ${color})`,
          transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)',
        }} />
      </div>
      <div style={{
        width: 28,
        fontFamily: "'Space Mono', monospace",
        fontSize: 12,
        color,
        textAlign: 'right' as const,
      }}>{score}</div>
    </div>
  );
}

function ArchetypeChip({ name, count, total }: { name: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 14px',
      background: 'rgba(22,39,55,0.4)',
      border: '0.5px solid rgba(47,230,222,0.08)',
      borderRadius: 8,
    }}>
      <span style={{ fontSize: 12, color: '#c8e0ee' }}>{name}</span>
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 11,
        color: '#4a7090',
      }}>{count} ({pct}%)</span>
    </div>
  );
}

function RoleBadge({ role, count, total }: { role: string; count: number; total: number }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  return (
    <div style={{
      padding: '6px 14px',
      background: 'rgba(47,230,222,0.06)',
      border: '0.5px solid rgba(47,230,222,0.15)',
      borderRadius: 20,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    }}>
      <span style={{
        fontFamily: "'Space Mono', monospace",
        fontSize: 10,
        color: '#2fe6de',
        letterSpacing: '0.06em',
      }}>{role}</span>
      <span style={{ fontSize: 10, color: '#4a7090' }}>{count} ({pct}%)</span>
    </div>
  );
}

function RiskSummary({ profiles }: { profiles: Profile[] }) {
  const withArchetype = profiles.filter(p => p.archetype);
  const riskCounts: Record<string, number> = { Low: 0, Moderate: 0, High: 0 };
  for (const p of withArchetype) {
    const r = p.archetype!.risk;
    riskCounts[r] = (riskCounts[r] || 0) + 1;
  }
  const total = withArchetype.length;

  return (
    <div style={{ display: 'flex', gap: 12 }}>
      {['Low', 'Moderate', 'High'].map(risk => {
        const count = riskCounts[risk] || 0;
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        const rc = RISK_COLORS[risk] || RISK_COLORS.Low;
        return (
          <div key={risk} style={{
            flex: 1,
            padding: '12px 14px',
            background: rc.bg,
            border: `0.5px solid ${rc.border}`,
            borderRadius: 10,
            textAlign: 'center' as const,
          }}>
            <div style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 22,
              fontWeight: 700,
              color: rc.text,
              lineHeight: 1,
            }}>{count}</div>
            <div style={{
              fontSize: 10,
              color: rc.text,
              marginTop: 4,
              letterSpacing: '0.06em',
            }}>{risk} Risk</div>
            <div style={{
              fontSize: 9,
              color: '#4a7090',
              marginTop: 2,
            }}>{pct}%</div>
          </div>
        );
      })}
    </div>
  );
}

export default function OverviewLens({ scope, profiles }: LensProps) {
  const stats = useMemo(() => {
    const composites = profiles.map(p => p.composite);
    const eqs = profiles.map(p => p.eqScore);
    const pqs = profiles.map(p => p.pqScore);
    const iqs = profiles.map(p => p.iqScore);

    const roleMap: Record<string, number> = {};
    for (const p of profiles) roleMap[p.role] = (roleMap[p.role] || 0) + 1;

    const archetypeMap: Record<string, number> = {};
    for (const p of profiles) {
      if (p.archetype) archetypeMap[p.archetype.name] = (archetypeMap[p.archetype.name] || 0) + 1;
    }

    return {
      total: profiles.length,
      compositeAvg: avg(composites),
      eqAvg: avg(eqs),
      pqAvg: avg(pqs),
      iqAvg: avg(iqs),
      roles: roleMap,
      archetypes: archetypeMap,
    };
  }, [profiles]);

  const scopeLabel = scope.charAt(0).toUpperCase() + scope.slice(1);

  return (
    <div style={{
      width: '100%',
      maxWidth: 960,
      display: 'flex',
      flexDirection: 'column',
      gap: 28,
    }}>
      {/* Top stats */}
      <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
        <StatCard label="Total Profiles" value={stats.total} sub={`${scopeLabel} scope`} />
        <StatCard label="Composite Avg" value={stats.compositeAvg} sub="Across all pillars" />
        <StatCard label="EQ Average" value={stats.eqAvg} color={PILLAR_COLORS.eq} sub={PILLAR_LABELS.eq} />
        <StatCard label="PQ Average" value={stats.pqAvg} color={PILLAR_COLORS.pq} sub={PILLAR_LABELS.pq} />
        <StatCard label="IQ Average" value={stats.iqAvg} color={PILLAR_COLORS.iq} sub={PILLAR_LABELS.iq} />
      </div>

      {/* Pillar bars + Risk summary row */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{
          flex: '1 1 320px',
          background: 'rgba(22,39,55,0.4)',
          border: '0.5px solid rgba(47,230,222,0.08)',
          borderRadius: 12,
          padding: '18px 22px',
        }}>
          <div style={{
            fontSize: 10,
            color: '#4a7090',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            marginBottom: 14,
          }}>Pillar Averages</div>
          <PillarBar pillar="eq" score={stats.eqAvg} maxScore={100} />
          <PillarBar pillar="pq" score={stats.pqAvg} maxScore={100} />
          <PillarBar pillar="iq" score={stats.iqAvg} maxScore={100} />
        </div>

        <div style={{
          flex: '1 1 320px',
          background: 'rgba(22,39,55,0.4)',
          border: '0.5px solid rgba(47,230,222,0.08)',
          borderRadius: 12,
          padding: '18px 22px',
        }}>
          <div style={{
            fontSize: 10,
            color: '#4a7090',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            marginBottom: 14,
          }}>Risk Distribution</div>
          <RiskSummary profiles={profiles} />
        </div>
      </div>

      {/* Roles + Archetypes */}
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
        <div style={{
          flex: '1 1 300px',
          background: 'rgba(22,39,55,0.4)',
          border: '0.5px solid rgba(47,230,222,0.08)',
          borderRadius: 12,
          padding: '18px 22px',
        }}>
          <div style={{
            fontSize: 10,
            color: '#4a7090',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            marginBottom: 14,
          }}>Role Breakdown</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {['PGY 4', 'PGY 3', 'PGY 2', 'PGY 1', 'MS4', 'MS3']
              .filter(r => stats.roles[r])
              .map(role => (
                <RoleBadge key={role} role={role} count={stats.roles[role]} total={stats.total} />
              ))}
          </div>
        </div>

        <div style={{
          flex: '1 1 300px',
          background: 'rgba(22,39,55,0.4)',
          border: '0.5px solid rgba(47,230,222,0.08)',
          borderRadius: 12,
          padding: '18px 22px',
        }}>
          <div style={{
            fontSize: 10,
            color: '#4a7090',
            textTransform: 'uppercase' as const,
            letterSpacing: '0.1em',
            marginBottom: 14,
          }}>Archetype Distribution</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Object.entries(stats.archetypes)
              .sort(([, a], [, b]) => b - a)
              .map(([name, count]) => (
                <ArchetypeChip key={name} name={name} count={count} total={stats.total} />
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
