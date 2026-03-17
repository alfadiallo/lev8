'use client';

import type { Profile } from '../types';
import { RISK_COLORS } from '../types';
import SectionCard from './SectionCard';
import { THEME } from './primitives';

export default function ArchetypeSection({ profile, expanded: controlledExpanded, onToggleExpanded }: { profile: Profile; expanded?: boolean; onToggleExpanded?: () => void }) {
  const arch = profile.archetype;
  if (!arch) return null;

  const rc = RISK_COLORS[arch.risk] || RISK_COLORS.Low;

  return (
    <SectionCard
      title="Archetype"
      subtitle={`${arch.name} · ${arch.risk} Risk · ${arch.action}`}
      accentColor={rc.text}
      expanded={controlledExpanded}
      onToggleExpanded={onToggleExpanded}
    >
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
        <span style={{
          padding: '3px 10px',
          borderRadius: 20,
          background: rc.bg,
          border: `0.5px solid ${rc.border}`,
          fontSize: 11,
          fontWeight: 500,
          color: rc.text,
        }}>
          {arch.name}
        </span>
        <span style={{
          padding: '3px 8px',
          borderRadius: 20,
          background: 'rgba(74,112,144,0.1)',
          border: '0.5px solid rgba(74,112,144,0.2)',
          fontSize: 10,
          color: THEME.text.muted,
          textTransform: 'uppercase' as const,
          letterSpacing: '0.06em',
        }}>
          {arch.action}
        </span>
        <span style={{
          padding: '3px 8px',
          borderRadius: 20,
          background: 'rgba(74,112,144,0.1)',
          border: '0.5px solid rgba(74,112,144,0.2)',
          fontSize: 10,
          color: THEME.text.muted,
          fontFamily: THEME.font.mono,
        }}>
          {Math.round(arch.confidence * 100)}% conf.
        </span>
      </div>
      <p style={{ fontSize: 12, color: THEME.text.secondary, lineHeight: 1.5, margin: 0 }}>
        {arch.description}
      </p>
      {profile.narrative && (
        <div style={{
          marginTop: 12,
          padding: '10px 14px',
          borderRadius: 8,
          border: '0.5px solid rgba(74,112,144,0.15)',
          background: 'rgba(7,18,29,0.4)',
        }}>
          <div style={{ fontSize: 10, color: THEME.text.muted, marginBottom: 4, fontWeight: 500 }}>
            Narrative
          </div>
          <div style={{ fontSize: 11, color: THEME.text.secondary, lineHeight: 1.5, fontStyle: 'italic' }}>
            {profile.narrative}
          </div>
        </div>
      )}
    </SectionCard>
  );
}
