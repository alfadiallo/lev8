'use client';

import type { Profile } from '../types';
import SectionCard from './SectionCard';
import { THEME } from './primitives';

const QUADRANT_META: Record<string, { label: string; color: string; icon: string }> = {
  strengths: { label: 'Strengths', color: '#18F2B2', icon: '▲' },
  weaknesses: { label: 'Weaknesses', color: '#f06060', icon: '▼' },
  opportunities: { label: 'Opportunities', color: '#7BC8F8', icon: '◆' },
  threats: { label: 'Threats', color: '#f0a060', icon: '◈' },
};

export default function SwotSection({ profile, expanded: controlledExpanded, onToggleExpanded }: { profile: Profile; expanded?: boolean; onToggleExpanded?: () => void }) {
  if (!profile.swot) return null;

  const { strengths, weaknesses, opportunities, threats, periodLabel } = profile.swot;
  const hasData = strengths.length > 0 || weaknesses.length > 0 || opportunities.length > 0 || threats.length > 0;
  if (!hasData) return null;

  const quadrants = [
    { key: 'strengths', items: strengths },
    { key: 'weaknesses', items: weaknesses },
    { key: 'opportunities', items: opportunities },
    { key: 'threats', items: threats },
  ];

  return (
    <SectionCard
      title="SWOT Analysis"
      subtitle={periodLabel ? `Period: ${periodLabel}` : 'AI-generated insights'}
      accentColor="#7BC8F8"
      defaultExpanded={false}
      expanded={controlledExpanded}
      onToggleExpanded={onToggleExpanded}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 10,
      }}>
        {quadrants.map(({ key, items }) => {
          const meta = QUADRANT_META[key];
          if (items.length === 0) return null;
          return (
            <div key={key} style={{
              background: THEME.bg.page,
              borderRadius: 8,
              padding: '12px 14px',
              border: `0.5px solid ${meta.color}20`,
            }}>
              <div style={{
                fontSize: 10,
                fontWeight: 600,
                color: meta.color,
                fontFamily: THEME.font.mono,
                letterSpacing: '0.08em',
                textTransform: 'uppercase' as const,
                marginBottom: 8,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}>
                <span style={{ fontSize: 8 }}>{meta.icon}</span>
                {meta.label}
              </div>
              <ul style={{ margin: 0, padding: '0 0 0 14px', listStyleType: 'none' }}>
                {items.map((item, i) => (
                  <li key={i} style={{
                    fontSize: 11,
                    color: THEME.text.secondary,
                    lineHeight: 1.5,
                    marginBottom: 4,
                    position: 'relative',
                    paddingLeft: 0,
                  }}>
                    <span style={{
                      position: 'absolute',
                      left: -12,
                      color: meta.color + '60',
                      fontSize: 6,
                      top: 5,
                    }}>●</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
