'use client';

import type { Profile } from '../types';
import SectionCard from './SectionCard';
import { THEME, scoreColor } from './primitives';

const TYPE_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  core_faculty: { color: THEME.accent, bg: 'rgba(47,230,222,0.08)', label: 'Core Faculty' },
  teaching_faculty: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', label: 'Teaching Faculty' },
  self: { color: '#818CF8', bg: 'rgba(129,140,248,0.08)', label: 'Self' },
};

export default function RatingsSection({ profile, expanded: controlledExpanded, onToggleExpanded }: { profile: Profile; expanded?: boolean; onToggleExpanded?: () => void }) {
  if (!profile.ratings) return null;

  const { coreFaculty, teachingFaculty, self, total } = profile.ratings;

  return (
    <SectionCard
      title="Rating Summary"
      subtitle={`${total} total evaluations`}
      accentColor={THEME.accent}
      defaultExpanded={false}
      expanded={controlledExpanded}
      onToggleExpanded={onToggleExpanded}
    >
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 10,
      }}>
        {[
          { value: coreFaculty, label: 'Core Faculty', color: THEME.accent },
          { value: teachingFaculty, label: 'Teaching Faculty', color: '#F59E0B' },
          { value: self, label: 'Self Assessments', color: '#818CF8' },
          { value: total, label: 'Total', color: scoreColor(70) },
        ].map(item => (
          <div key={item.label} style={{
            textAlign: 'center',
            padding: '12px 8px',
            background: THEME.bg.page,
            borderRadius: 8,
            border: `0.5px solid ${THEME.border.light}`,
          }}>
            <div style={{
              fontFamily: THEME.font.mono,
              fontSize: 24,
              fontWeight: 700,
              color: item.color,
              lineHeight: 1,
            }}>
              {item.value}
            </div>
            <div style={{
              fontSize: 9,
              color: THEME.text.muted,
              marginTop: 6,
              textTransform: 'uppercase' as const,
              letterSpacing: '0.06em',
            }}>
              {item.label}
            </div>
          </div>
        ))}
      </div>
    </SectionCard>
  );
}

export { TYPE_STYLES };
