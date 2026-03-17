'use client';

import { useMemo } from 'react';
import type { Profile } from '../types';
import { PILLAR_COLORS, PILLAR_LABELS, ATTR_LABELS } from '../types';
import SectionCard from './SectionCard';
import { THEME, scoreBg, grade, MiniSparkline, periodSortIndex } from './primitives';

export default function DrilldownSection({ profile, pillar = 'eq', expanded: controlledExpanded, onToggleExpanded }: {
  profile: Profile;
  pillar?: 'eq' | 'pq' | 'iq';
  expanded?: boolean;
  onToggleExpanded?: () => void;
}) {
  const color = PILLAR_COLORS[pillar];
  const label = PILLAR_LABELS[pillar];
  const attrs = ATTR_LABELS[pillar];
  const currentScore = profile[`${pillar}Score` as keyof Profile] as number;

  const periods = useMemo(() => {
    return profile.history
      .map(h => h.period)
      .sort((a, b) => periodSortIndex(a) - periodSortIndex(b));
  }, [profile]);

  const pillarValues = periods.map(p => {
    const h = profile.history.find(hp => hp.period === p);
    return h?.[pillar] as number | undefined;
  }).filter((v): v is number => v !== undefined);

  return (
    <SectionCard
      title={label}
      subtitle={`${Object.values(attrs).length} attributes across ${periods.length} periods`}
      accentColor={color}
      headerScore={currentScore}
      sparklineValues={pillarValues}
      sparklineColor={color}
      expanded={controlledExpanded}
      onToggleExpanded={onToggleExpanded}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px 2px' }}>
          <thead>
            <tr>
              <th style={{
                padding: '6px 8px',
                textAlign: 'left' as const,
                fontSize: 10,
                color: THEME.text.muted,
                fontFamily: THEME.font.mono,
                fontWeight: 400,
                borderBottom: `0.5px solid ${color}20`,
                position: 'sticky' as const,
                left: 0,
                background: THEME.bg.card,
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
                fontFamily: THEME.font.mono,
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
                color: THEME.text.muted,
                fontFamily: THEME.font.mono,
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
                    color: THEME.text.primary,
                    fontFamily: THEME.font.body,
                    borderBottom: `0.5px solid rgba(47,230,222,0.04)`,
                    position: 'sticky' as const,
                    left: 0,
                    background: THEME.bg.card,
                    zIndex: 1,
                  }}>
                    {attrLabel}
                  </td>
                  <td style={{
                    padding: '6px 8px',
                    textAlign: 'center' as const,
                    fontFamily: THEME.font.mono,
                    fontSize: 12,
                    fontWeight: 600,
                    color,
                    background: scoreBg(s, 0.1),
                    borderBottom: `0.5px solid rgba(47,230,222,0.04)`,
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
                    borderBottom: `0.5px solid rgba(47,230,222,0.04)`,
                  }}>
                    {g.lbl}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: 14 }}>
        {Object.entries(attrs).map(([key, attrLabel]) => {
          const pillarData = profile[pillar] as Record<string, number>;
          const s = pillarData[key] ?? 0;
          return (
            <div key={key} style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                <span style={{ fontSize: 10, color: THEME.text.secondary }}>{attrLabel}</span>
                <span style={{ fontSize: 10, color, fontFamily: THEME.font.mono }}>{s}</span>
              </div>
              <div style={{
                height: 4,
                background: THEME.bg.deep,
                borderRadius: 2,
                overflow: 'hidden',
                border: `0.5px solid ${THEME.border.subtle}`,
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
    </SectionCard>
  );
}
