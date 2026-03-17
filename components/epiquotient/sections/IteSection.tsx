'use client';

import type { Profile, IteAverages } from '../types';
import SectionCard from './SectionCard';
import { THEME, scoreBg, scoreColor } from './primitives';

export default function IteSection({ profile, expanded, onToggleExpanded }: { profile: Profile; expanded?: boolean; onToggleExpanded?: () => void }) {
  if (!profile.ite || profile.ite.scores.length === 0) return null;

  const { scores, individualAvg, classAvg, programAvg } = profile.ite;
  const sorted = [...scores].sort((a, b) => b.examYear - a.examYear);
  const totalExams = sorted.length;

  const thStyle = {
    padding: '6px 10px',
    fontSize: 10,
    color: THEME.text.muted,
    fontFamily: THEME.font.mono,
    fontWeight: 400 as const,
    borderBottom: `0.5px solid ${THEME.border.medium}`,
  };

  const tdBase = {
    padding: '7px 10px',
    fontSize: 12,
    fontFamily: THEME.font.mono,
    borderBottom: `0.5px solid ${THEME.border.subtle}`,
  };

  function AvgRow({ label, data, color }: { label: string; data: IteAverages; color: string }) {
    return (
      <tr>
        <td style={{ ...tdBase, fontSize: 10, fontWeight: 600, color, letterSpacing: '0.02em' }}>
          {label}
        </td>
        <td style={{ ...tdBase, textAlign: 'center', color: THEME.text.secondary }}>
          {data.rawScore ?? '—'}
        </td>
        <td style={{ ...tdBase, textAlign: 'center' }}>
          {data.percentile !== null ? (
            <span style={{
              padding: '2px 8px',
              borderRadius: 12,
              fontSize: 11,
              fontWeight: 600,
              fontFamily: THEME.font.mono,
              color: scoreColor(data.percentile),
              background: scoreBg(data.percentile, 0.15),
            }}>
              {data.percentile}th
            </span>
          ) : (
            <span style={{ color: THEME.text.dim, fontSize: 11 }}>—</span>
          )}
        </td>
        <td style={{ ...tdBase, textAlign: 'center', color: THEME.text.dim }}>—</td>
      </tr>
    );
  }

  return (
    <SectionCard
      title="ITE"
      subtitle={`${scores.length} exam${scores.length > 1 ? 's' : ''} on record`}
      accentColor="#f0a060"
      defaultExpanded={false}
      expanded={expanded}
      onToggleExpanded={onToggleExpanded}
    >
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '3px 2px' }}>
          <thead>
            <tr>
              {['Level', 'Raw Score', 'Percentile', 'Nat. Mean'].map(col => (
                <th key={col} style={{
                  ...thStyle,
                  textAlign: col === 'Level' ? 'left' as const : 'center' as const,
                }}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sorted.map((ite, idx) => {
              const pgyLevel = totalExams - idx;
              return (
                <tr key={idx}>
                  <td style={{ ...tdBase, fontWeight: 500, color: THEME.text.primary }}>
                    PGY {pgyLevel}
                  </td>
                  <td style={{ ...tdBase, textAlign: 'center', color: THEME.text.secondary }}>
                    {ite.rawScore ?? '—'}
                  </td>
                  <td style={{ ...tdBase, textAlign: 'center' }}>
                    {ite.percentile !== null ? (
                      <span style={{
                        padding: '2px 8px',
                        borderRadius: 12,
                        fontSize: 11,
                        fontWeight: 600,
                        fontFamily: THEME.font.mono,
                        color: scoreColor(ite.percentile),
                        background: scoreBg(ite.percentile, 0.15),
                      }}>
                        {ite.percentile}th
                      </span>
                    ) : (
                      <span style={{ color: THEME.text.dim, fontSize: 11 }}>—</span>
                    )}
                  </td>
                  <td style={{ ...tdBase, textAlign: 'center', color: THEME.text.dim }}>
                    {ite.nationalMean ?? '—'}
                  </td>
                </tr>
              );
            })}

            {/* Separator */}
            <tr>
              <td colSpan={4} style={{ padding: '4px 0' }}>
                <div style={{ borderTop: `1px solid ${THEME.border.medium}` }} />
              </td>
            </tr>

            {/* Averages */}
            <AvgRow label="Individual Avg" data={individualAvg} color={THEME.accent} />
            <AvgRow label="Class Avg" data={classAvg} color="#818CF8" />
            <AvgRow label="Program Avg" data={programAvg} color="#f0a060" />
          </tbody>
        </table>
      </div>
    </SectionCard>
  );
}
