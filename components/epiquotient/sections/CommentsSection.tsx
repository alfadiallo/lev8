'use client';

import type { Profile } from '../types';
import SectionCard from './SectionCard';
import { THEME } from './primitives';

const TYPE_STYLES: Record<string, { color: string; bg: string; label: string }> = {
  core_faculty: { color: THEME.accent, bg: 'rgba(47,230,222,0.08)', label: 'Core Faculty' },
  teaching_faculty: { color: '#F59E0B', bg: 'rgba(245,158,11,0.08)', label: 'Teaching Faculty' },
  self: { color: '#818CF8', bg: 'rgba(129,140,248,0.08)', label: 'Self' },
};

export default function CommentsSection({ profile, expanded: controlledExpanded, onToggleExpanded }: { profile: Profile; expanded?: boolean; onToggleExpanded?: () => void }) {
  if (!profile.ratings) return null;

  const withComments = profile.ratings.recent.filter(r => r.comment);
  if (withComments.length === 0) return null;

  return (
    <SectionCard
      title="Respondent Comments"
      subtitle={`${withComments.length} comment${withComments.length > 1 ? 's' : ''}`}
      accentColor="#818CF8"
      defaultExpanded={false}
      expanded={controlledExpanded}
      onToggleExpanded={onToggleExpanded}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {withComments.map(rating => {
          const typeStyle = TYPE_STYLES[rating.evaluatorType] || TYPE_STYLES.core_faculty;
          return (
            <div key={rating.id} style={{
              borderLeft: `3px solid ${typeStyle.color}`,
              paddingLeft: 14,
              paddingTop: 2,
              paddingBottom: 2,
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span style={{
                  fontSize: 10,
                  fontWeight: 500,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: typeStyle.bg,
                  color: typeStyle.color,
                }}>
                  {typeStyle.label}
                </span>
                {rating.evaluatorName && (
                  <span style={{ fontSize: 11, color: THEME.text.secondary }}>
                    {rating.evaluatorName}
                  </span>
                )}
                <span style={{
                  fontSize: 10,
                  color: THEME.text.dim,
                  marginLeft: 'auto',
                  fontFamily: THEME.font.mono,
                }}>
                  {new Date(rating.date).toLocaleDateString()}
                </span>
              </div>
              <p style={{
                fontSize: 11,
                color: THEME.text.secondary,
                lineHeight: 1.6,
                margin: 0,
                fontStyle: 'italic',
              }}>
                &ldquo;{rating.comment}&rdquo;
              </p>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}
