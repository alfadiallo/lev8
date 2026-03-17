'use client';

import { useMemo, useState } from 'react';
import type { Profile } from '../types';
import { PILLAR_COLORS } from '../types';
import { THEME, HeatCell, MiniSparkline, periodSortIndex } from './primitives';

export default function HeatmapSection({ profile, expanded: controlledExpanded, onToggleExpanded }: { profile: Profile; expanded?: boolean; onToggleExpanded?: () => void }) {
  const [internalExpanded, setInternalExpanded] = useState(true);
  const expanded = controlledExpanded ?? internalExpanded;
  const toggleExpanded = onToggleExpanded ?? (() => setInternalExpanded(e => !e));

  const periods = useMemo(() => {
    return profile.history
      .map(h => h.period)
      .sort((a, b) => periodSortIndex(a) - periodSortIndex(b));
  }, [profile]);

  if (periods.length === 0) return null;

  const rows: { label: string; key: string; color: string }[] = [
    { label: 'Composite', key: 'composite', color: THEME.accent },
    { label: 'EQ', key: 'eq', color: PILLAR_COLORS.eq },
    { label: 'PQ', key: 'pq', color: PILLAR_COLORS.pq },
    { label: 'IQ', key: 'iq', color: PILLAR_COLORS.iq },
  ];

  return (
    <div style={{
      background: THEME.bg.card,
      border: `0.5px solid ${expanded ? THEME.accent + '40' : THEME.border.medium}`,
      borderRadius: 10,
      marginBottom: 10,
      overflow: 'hidden',
      transition: 'border-color 0.2s ease',
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <button
        onClick={() => toggleExpanded()}
        style={{
          width: '100%', display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', padding: '14px 16px',
          background: 'transparent', border: 'none', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 4, height: 24, borderRadius: 2, background: THEME.accent, flexShrink: 0 }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: THEME.text.primary, fontWeight: 500 }}>Longitudinal Changes</div>
            <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
              {periods.length} periods · Composite + Pillar scores
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
        <div style={{ padding: '0 16px 16px', overflowX: 'auto', flex: 1 }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px 2px' }}>
            <thead>
              <tr>
                <th style={{
                  padding: '8px 12px',
                  textAlign: 'left' as const,
                  fontSize: 10,
                  color: THEME.text.muted,
                  fontFamily: THEME.font.mono,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase' as const,
                  fontWeight: 400,
                  borderBottom: `0.5px solid ${THEME.border.medium}`,
                  position: 'sticky' as const,
                  left: 0,
                  background: THEME.bg.card,
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
                    color: THEME.text.muted,
                    fontFamily: THEME.font.mono,
                    letterSpacing: '0.06em',
                    fontWeight: 400,
                    borderBottom: `0.5px solid ${THEME.border.medium}`,
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
                  color: THEME.text.muted,
                  fontFamily: THEME.font.mono,
                  letterSpacing: '0.06em',
                  fontWeight: 400,
                  borderBottom: `0.5px solid ${THEME.border.medium}`,
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
                      fontFamily: THEME.font.body,
                      borderBottom: `0.5px solid ${THEME.border.subtle}`,
                      position: 'sticky' as const,
                      left: 0,
                      background: THEME.bg.card,
                      zIndex: 1,
                    }}>
                      {row.label}
                    </td>
                    {values.map((v, i) => <HeatCell key={i} value={v} />)}
                    <td style={{
                      padding: '4px 8px',
                      textAlign: 'center' as const,
                      borderBottom: `0.5px solid ${THEME.border.subtle}`,
                    }}>
                      <MiniSparkline values={sparkValues} color={row.color} />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
