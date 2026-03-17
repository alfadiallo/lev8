'use client';

import { useState, type ReactNode } from 'react';
import { THEME, MiniSparkline } from './primitives';

interface SectionCardProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  defaultExpanded?: boolean;
  expanded?: boolean;
  onToggleExpanded?: () => void;
  /** Score shown on the right of the header bar */
  headerScore?: number;
  /** Sparkline values shown next to score */
  sparklineValues?: number[];
  sparklineColor?: string;
  children: ReactNode;
}

export default function SectionCard({
  title,
  subtitle,
  accentColor = THEME.accent,
  defaultExpanded = false,
  expanded: controlledExpanded,
  onToggleExpanded,
  headerScore,
  sparklineValues,
  sparklineColor,
  children,
}: SectionCardProps) {
  const [internalExpanded, setInternalExpanded] = useState(defaultExpanded);
  const expanded = controlledExpanded ?? internalExpanded;
  const toggleExpanded = onToggleExpanded ?? (() => setInternalExpanded(e => !e));

  return (
    <div style={{
      background: THEME.bg.card,
      border: `0.5px solid ${expanded ? accentColor + '40' : THEME.border.medium}`,
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
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 16px',
          background: 'transparent',
          border: 'none',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{
            width: 4,
            height: 24,
            borderRadius: 2,
            background: accentColor,
            flexShrink: 0,
          }} />
          <div style={{ textAlign: 'left' }}>
            <div style={{ fontSize: 13, color: THEME.text.primary, fontWeight: 500 }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 10, color: THEME.text.muted, marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {sparklineValues && sparklineValues.length >= 2 && (
            <MiniSparkline
              values={sparklineValues}
              color={sparklineColor || accentColor}
              width={60}
              height={20}
            />
          )}
          {headerScore !== undefined && (
            <span style={{
              fontFamily: THEME.font.mono,
              fontSize: 16,
              color: accentColor,
              fontWeight: 700,
            }}>
              {headerScore}
            </span>
          )}
          <span style={{
            fontSize: 10,
            color: THEME.text.muted,
            transition: 'transform 0.2s',
            transform: expanded ? 'rotate(180deg)' : 'rotate(0)',
          }}>
            ▼
          </span>
        </div>
      </button>
      {expanded && (
        <div style={{ padding: '0 16px 16px', flex: 1 }}>
          {children}
        </div>
      )}
    </div>
  );
}
