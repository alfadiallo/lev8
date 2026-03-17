'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import type { Profile } from './types';
import { PILLAR_COLORS, RISK_COLORS } from './types';
import { THEME, scoreColor, grade } from './sections/primitives';
import { SECTION_REGISTRY, SECTION_GROUPS } from './sections';
import { isResidentActive } from '@/lib/utils/pgy-calculator';

const PGY_ROLES = ['PGY 3', 'PGY 2', 'PGY 1'];
const MS_ROLES = ['MS4', 'MS3'];
const ACTIVE_ROLE_ORDER = [...PGY_ROLES, ...MS_ROLES];

// ─── Sidebar ─────────────────────────────────────────────────────

function SidebarGroup({
  label,
  profiles,
  selectedId,
  onSelect,
  defaultCollapsed = false,
}: {
  label: string;
  profiles: Profile[];
  selectedId: string | null;
  onSelect: (p: Profile) => void;
  defaultCollapsed?: boolean;
}) {
  const [collapsed, setCollapsed] = useState(defaultCollapsed);

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(47,230,222,0.04)',
          border: 'none',
          borderBottom: `0.5px solid ${THEME.border.light}`,
          cursor: 'pointer',
          color: THEME.text.muted,
          fontFamily: THEME.font.mono,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}
      >
        <span>{label}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: THEME.text.dim }}>{profiles.length}</span>
          <span style={{ fontSize: 8, transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span>
        </span>
      </button>
      {!collapsed && (
        <div>
          {profiles.map((p) => {
            const isActive = p.id === selectedId;
            return (
              <button
                key={p.id}
                onClick={() => onSelect(p)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '7px 12px 7px 20px',
                  background: isActive ? 'rgba(47,230,222,0.08)' : 'transparent',
                  border: 'none',
                  borderLeft: isActive ? `2px solid ${THEME.accent}` : '2px solid transparent',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  textAlign: 'left' as const,
                }}
              >
                <div style={{ flex: 1, marginRight: 8, overflow: 'hidden' }}>
                  <span style={{
                    fontSize: 12,
                    color: isActive ? THEME.text.primary : THEME.text.secondary,
                    fontFamily: THEME.font.body,
                    fontWeight: isActive ? 500 : 400,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap' as const,
                    display: 'block',
                  }}>
                    {p.name}
                  </span>
                  {p.graduationClass && (
                    <span style={{
                      fontSize: 9,
                      color: THEME.text.dim,
                      fontFamily: THEME.font.mono,
                      letterSpacing: '0.04em',
                      display: 'block',
                      marginTop: 1,
                    }}>
                      {p.graduationClass}
                    </span>
                  )}
                </div>
                <span style={{
                  fontFamily: THEME.font.mono,
                  fontSize: 11,
                  color: scoreColor(p.composite),
                  flexShrink: 0,
                }}>
                  {p.composite}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Graduate Sidebar Group (single collapsible with class dividers) ───

function GraduateSidebarGroup({
  profiles,
  selectedId,
  onSelect,
}: {
  profiles: Profile[];
  selectedId: string | null;
  onSelect: (p: Profile) => void;
}) {
  const [collapsed, setCollapsed] = useState(true);

  const classBuckets = useMemo(() => {
    const buckets = new Map<number, Profile[]>();
    for (const p of profiles) {
      const year = p.graduationYear ?? 0;
      if (!buckets.has(year)) buckets.set(year, []);
      buckets.get(year)!.push(p);
    }
    return [...buckets.entries()].sort((a, b) => b[0] - a[0]);
  }, [profiles]);

  return (
    <div style={{ marginBottom: 4 }}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          background: 'rgba(47,230,222,0.04)',
          border: 'none',
          borderBottom: `0.5px solid ${THEME.border.light}`,
          cursor: 'pointer',
          color: THEME.text.muted,
          fontFamily: THEME.font.mono,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
        }}
      >
        <span>Graduates</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 9, color: THEME.text.dim }}>{profiles.length}</span>
          <span style={{ fontSize: 8, transition: 'transform 0.2s', transform: collapsed ? 'rotate(-90deg)' : 'rotate(0)' }}>▼</span>
        </span>
      </button>
      {!collapsed && (
        <div>
          {classBuckets.map(([year, classProfiles], idx) => (
            <div key={year}>
              {/* Class divider */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 12px',
                marginTop: idx === 0 ? 2 : 0,
              }}>
                <div style={{
                  flex: 1,
                  height: '0.5px',
                  background: THEME.border.light,
                }} />
                <span style={{
                  fontSize: 9,
                  color: THEME.text.dim,
                  fontFamily: THEME.font.mono,
                  letterSpacing: '0.06em',
                  whiteSpace: 'nowrap',
                }}>
                  Class of {year}
                </span>
                <div style={{
                  flex: 1,
                  height: '0.5px',
                  background: THEME.border.light,
                }} />
              </div>

              {/* Profiles in this class */}
              {classProfiles.map((p) => {
                const isActive = p.id === selectedId;
                return (
                  <button
                    key={p.id}
                    onClick={() => onSelect(p)}
                    style={{
                      width: '100%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '7px 12px 7px 20px',
                      background: isActive ? 'rgba(47,230,222,0.08)' : 'transparent',
                      border: 'none',
                      borderLeft: isActive ? `2px solid ${THEME.accent}` : '2px solid transparent',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      textAlign: 'left' as const,
                    }}
                  >
                    <div style={{ flex: 1, marginRight: 8, overflow: 'hidden' }}>
                      <span style={{
                        fontSize: 12,
                        color: isActive ? THEME.text.primary : THEME.text.secondary,
                        fontFamily: THEME.font.body,
                        fontWeight: isActive ? 500 : 400,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap' as const,
                        display: 'block',
                      }}>
                        {p.name}
                      </span>
                    </div>
                    <span style={{
                      fontFamily: THEME.font.mono,
                      fontSize: 11,
                      color: scoreColor(p.composite),
                      flexShrink: 0,
                    }}>
                      {p.composite}
                    </span>
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Section labels for share modal ─────────────────────────────

const SECTION_LABELS: Record<string, string> = {
  radar: 'EQ·PQ·IQ Radar Profile',
  comparison: 'Faculty vs Self Comparison',
  heatmap: 'Longitudinal Heatmap',
  trends: 'Score Trends',
  'eq-drilldown': 'EQ Drilldown',
  'pq-drilldown': 'PQ Drilldown',
  'iq-drilldown': 'IQ Drilldown',
  trajectory: 'Composite Trajectory',
  swot: 'SWOT Analysis',
  ite: 'ITE Scores',
  archetype: 'Archetype Classification',
  ratings: 'Ratings Summary',
  comments: 'Recent Comments',
};

// ─── SVG Icons ──────────────────────────────────────────────────

function MailIcon({ size = 18, color = THEME.text.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
    </svg>
  );
}

function ShareIcon({ size = 18, color = THEME.text.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

function CloseIcon({ size = 16, color = THEME.text.muted }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

// ─── Share Modal ─────────────────────────────────────────────────

function ShareModal({
  profile,
  onClose,
}: {
  profile: Profile;
  onClose: () => void;
}) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(SECTION_REGISTRY.map(s => s.id))
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const allIds = SECTION_REGISTRY.map(s => s.id);
    if (selected.size === allIds.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(allIds));
    }
  };

  const handleShare = async () => {
    const selectedLabels = SECTION_REGISTRY
      .filter(s => selected.has(s.id))
      .map(s => SECTION_LABELS[s.id] || s.id);

    const text = [
      `EPIQuotient Profile: ${profile.name}`,
      `Role: ${profile.role}${profile.graduationClass ? ` · ${profile.graduationClass}` : ''}`,
      `Composite: ${profile.composite}`,
      `EQ: ${profile.eqScore} | PQ: ${profile.pqScore} | IQ: ${profile.iqScore}`,
      '',
      `Sections included (${selectedLabels.length}):`,
      ...selectedLabels.map(l => `  • ${l}`),
      '',
      `Shared from EPIQuotient`,
    ].join('\n');

    if (navigator.share) {
      try {
        await navigator.share({ title: `${profile.name} — EPIQuotient Profile`, text });
        onClose();
        return;
      } catch {
        // User cancelled or not supported, fall through to clipboard
      }
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard not available
    }
  };

  const allIds = SECTION_REGISTRY.map(s => s.id);
  const allSelected = selected.size === allIds.length;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div style={{
        background: THEME.bg.card,
        border: `1px solid ${THEME.border.medium}`,
        borderRadius: 14,
        width: 420,
        maxWidth: '90vw',
        maxHeight: '80vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
      }}>
        {/* Modal header */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: `0.5px solid ${THEME.border.light}`,
        }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: THEME.text.primary }}>
              Share Profile
            </div>
            <div style={{ fontSize: 11, color: THEME.text.muted, marginTop: 2 }}>
              {profile.name}
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: 4,
              borderRadius: 6,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* Section checklist */}
        <div style={{ padding: '12px 20px', overflowY: 'auto', flex: 1 }}>
          <div style={{ marginBottom: 10 }}>
            <button
              onClick={toggleAll}
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                fontSize: 11,
                color: THEME.accent,
                fontWeight: 500,
                padding: 0,
              }}
            >
              {allSelected ? 'Deselect All' : 'Select All'}
            </button>
          </div>

          {SECTION_GROUPS.map(group => {
            const groupSections = SECTION_REGISTRY.filter(s => s.group === group.id);
            return (
              <div key={group.id} style={{ marginBottom: 14 }}>
                <div style={{
                  fontSize: 9,
                  color: THEME.text.dim,
                  fontFamily: THEME.font.mono,
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase' as const,
                  marginBottom: 6,
                }}>
                  {group.label}
                </div>
                {groupSections.map(section => {
                  const isOn = selected.has(section.id);
                  return (
                    <label
                      key={section.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '6px 8px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        transition: 'background 0.15s',
                        background: isOn ? 'rgba(47,230,222,0.06)' : 'transparent',
                      }}
                    >
                      <div
                        onClick={(e) => { e.preventDefault(); toggle(section.id); }}
                        style={{
                          width: 18,
                          height: 18,
                          borderRadius: 4,
                          border: `1.5px solid ${isOn ? THEME.accent : THEME.border.medium}`,
                          background: isOn ? THEME.accent + '20' : 'transparent',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          transition: 'all 0.15s',
                        }}
                      >
                        {isOn && (
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke={THEME.accent} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </div>
                      <span style={{
                        fontSize: 12,
                        color: isOn ? THEME.text.primary : THEME.text.secondary,
                        fontWeight: isOn ? 500 : 400,
                      }}>
                        {SECTION_LABELS[section.id] || section.id}
                      </span>
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Modal footer */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 20px',
          borderTop: `0.5px solid ${THEME.border.light}`,
        }}>
          <span style={{ fontSize: 11, color: THEME.text.muted }}>
            {selected.size} of {allIds.length} sections
          </span>
          <button
            onClick={handleShare}
            disabled={selected.size === 0}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              border: 'none',
              cursor: selected.size > 0 ? 'pointer' : 'default',
              background: selected.size > 0 ? THEME.accent : THEME.border.medium,
              color: selected.size > 0 ? THEME.bg.deep : THEME.text.dim,
              fontSize: 12,
              fontWeight: 600,
              transition: 'all 0.15s',
              opacity: selected.size > 0 ? 1 : 0.5,
            }}
          >
            {copied ? 'Copied to Clipboard!' : 'Share'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Profile Header ──────────────────────────────────────────────

function ProfileHeader({
  profile,
  onShare,
}: {
  profile: Profile;
  onShare: () => void;
}) {
  const g = grade(profile.composite);
  const arch = profile.archetype;
  const rc = arch ? (RISK_COLORS[arch.risk] || RISK_COLORS.Low) : null;

  const mailtoHref = `mailto:?subject=${encodeURIComponent(`EPIQuotient Profile: ${profile.name}`)}&body=${encodeURIComponent(
    `${profile.name}\nRole: ${profile.role}${profile.graduationClass ? ` · ${profile.graduationClass}` : ''}\nComposite: ${profile.composite}\nEQ: ${profile.eqScore} | PQ: ${profile.pqScore} | IQ: ${profile.iqScore}\n\nShared from EPIQuotient`
  )}`;

  const iconBtnStyle: React.CSSProperties = {
    background: 'transparent',
    border: `1px solid ${THEME.border.medium}`,
    borderRadius: 8,
    padding: 7,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  };

  return (
    <div style={{
      padding: '24px 28px 20px',
      borderBottom: `0.5px solid ${THEME.border.medium}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <h2 style={{
              margin: 0,
              fontSize: 20,
              fontWeight: 500,
              color: THEME.text.primary,
              fontFamily: THEME.font.body,
            }}>
              {profile.name}
            </h2>
            <a
              href={mailtoHref}
              title="Send email about this profile"
              style={iconBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.border.medium; }}
            >
              <MailIcon size={16} />
            </a>
            <button
              onClick={onShare}
              title="Share profile sections"
              style={iconBtnStyle}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = THEME.accent; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = THEME.border.medium; }}
            >
              <ShareIcon size={16} />
            </button>
          </div>
          <div style={{
            fontSize: 11,
            color: THEME.text.muted,
            textTransform: 'uppercase' as const,
            letterSpacing: '0.12em',
            marginTop: 4,
            fontFamily: THEME.font.mono,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {profile.role}
            {profile.graduationClass && (
              <span style={{
                fontSize: 10,
                color: THEME.accent,
                opacity: 0.7,
                fontWeight: 500,
              }}>
                · {profile.graduationClass}
              </span>
            )}
          </div>
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{
            fontFamily: THEME.font.mono,
            fontSize: 36,
            fontWeight: 700,
            color: THEME.accent,
            lineHeight: 1,
          }}>
            {profile.composite}
          </div>
          <div style={{ fontSize: 10, color: g.c, marginTop: 2, letterSpacing: '0.04em' }}>
            {g.lbl}
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
        {(['eq', 'pq', 'iq'] as const).map(pillar => {
          const score = profile[`${pillar}Score` as keyof Profile] as number;
          const color = PILLAR_COLORS[pillar];
          return (
            <div key={pillar} style={{
              flex: 1,
              padding: '10px 12px',
              background: THEME.bg.card,
              borderRadius: 8,
              border: `0.5px solid ${THEME.border.medium}`,
            }}>
              <div style={{
                fontFamily: THEME.font.mono,
                fontSize: 20,
                fontWeight: 700,
                color,
                lineHeight: 1,
              }}>
                {score}
              </div>
              <div style={{
                fontSize: 9,
                color: THEME.text.muted,
                marginTop: 4,
                textTransform: 'uppercase' as const,
                letterSpacing: '0.08em',
              }}>
                {pillar.toUpperCase()}
              </div>
              <div style={{
                height: 3,
                background: THEME.bg.deep,
                borderRadius: 2,
                marginTop: 6,
                overflow: 'hidden',
              }}>
                <div style={{
                  height: '100%',
                  width: `${score}%`,
                  borderRadius: 2,
                  background: `linear-gradient(to right, ${color}66, ${color})`,
                  transition: 'width 0.8s cubic-bezier(0.16,1,0.3,1)',
                }} />
              </div>
            </div>
          );
        })}
      </div>

      {arch && rc && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 12 }}>
          <span style={{
            padding: '3px 10px',
            borderRadius: 20,
            background: rc.bg,
            border: `0.5px solid ${rc.border}`,
            fontSize: 10,
            fontWeight: 500,
            color: rc.text,
          }}>
            {arch.name}
          </span>
          <span style={{
            fontSize: 10,
            color: THEME.text.muted,
            fontFamily: THEME.font.mono,
          }}>
            {Math.round(arch.confidence * 100)}% confidence
          </span>
        </div>
      )}
    </div>
  );
}

// ─── Main Individual View ────────────────────────────────────────

export default function IndividualView({
  profiles,
  initialProfileId,
  programLength: _programLength = 3,
}: {
  profiles: Profile[];
  initialProfileId?: string;
  programLength?: number;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(initialProfileId || (profiles[0]?.id ?? null));
  const [shareOpen, setShareOpen] = useState(false);
  const [pairedExpanded, setPairedExpanded] = useState<Record<string, boolean>>({
    'comparison-heatmap': true,
    'trends-ite': false,
  });

  const { activeGroups, graduateProfiles } = useMemo(() => {
    const now = new Date();
    const grads: Profile[] = [];
    const activeByRole = new Map<string, Profile[]>();

    for (const p of profiles) {
      const gradYear = p.graduationYear;

      // Profiles already marked as Graduate always go to the graduates bucket
      if (p.role === 'Graduate') {
        grads.push(p);
      } else if (gradYear != null && !isResidentActive(gradYear, now)) {
        // Active-role profiles whose graduation year has passed
        grads.push(p);
      } else {
        const role = p.role;
        if (!activeByRole.has(role)) activeByRole.set(role, []);
        activeByRole.get(role)!.push(p);
      }
    }

    const groups: { label: string; profiles: Profile[] }[] = [];
    for (const role of ACTIVE_ROLE_ORDER) {
      const matching = activeByRole.get(role);
      if (matching && matching.length > 0) {
        groups.push({ label: role, profiles: matching });
      }
    }

    for (const [role, roleProfiles] of activeByRole) {
      if (!ACTIVE_ROLE_ORDER.includes(role)) {
        groups.push({ label: role, profiles: roleProfiles });
      }
    }

    return { activeGroups: groups, graduateProfiles: grads };
  }, [profiles]);

  const selectedProfile = useMemo(() => {
    return profiles.find(p => p.id === selectedId) || null;
  }, [profiles, selectedId]);

  return (
    <div style={{
      display: 'flex',
      width: '100%',
      height: '100%',
      background: THEME.bg.page,
      fontFamily: THEME.font.body,
    }}>
      {/* Left Sidebar */}
      <div style={{
        width: 260,
        flexShrink: 0,
        borderRight: `0.5px solid ${THEME.border.medium}`,
        overflowY: 'auto',
        background: THEME.bg.sidebar,
      }}>
        <div style={{
          padding: '16px 12px 8px',
          fontSize: 10,
          color: THEME.text.muted,
          fontFamily: THEME.font.mono,
          letterSpacing: '0.1em',
          textTransform: 'uppercase' as const,
          borderBottom: `0.5px solid ${THEME.border.light}`,
        }}>
          Profiles · {profiles.length}
        </div>
        {graduateProfiles.length > 0 && (
          <GraduateSidebarGroup
            profiles={graduateProfiles}
            selectedId={selectedId}
            onSelect={(p) => setSelectedId(p.id)}
          />
        )}
        {activeGroups.map(group => (
          <SidebarGroup
            key={group.label}
            label={group.label}
            profiles={group.profiles}
            selectedId={selectedId}
            onSelect={(p) => setSelectedId(p.id)}
            defaultCollapsed={MS_ROLES.includes(group.label)}
          />
        ))}
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        overflowY: 'auto',
        background: THEME.bg.page,
      }}>
        {selectedProfile ? (
          <>
            <ProfileHeader profile={selectedProfile} onShare={() => setShareOpen(true)} />

            {SECTION_GROUPS.map(group => {
              const groupSections = SECTION_REGISTRY.filter(s => s.group === group.id);

              const PAIRED_ROWS: [string, string][] = [
                ['comparison', 'heatmap'],
                ['trends', 'ite'],
              ];

              const pairedIdSet = new Set<string>();
              const pairedRows: { left: typeof groupSections[0]; right: typeof groupSections[0] }[] = [];
              for (const [leftId, rightId] of PAIRED_ROWS) {
                const left = groupSections.find(s => s.id === leftId);
                const right = groupSections.find(s => s.id === rightId);
                if (left && right) {
                  pairedRows.push({ left, right });
                  pairedIdSet.add(leftId);
                  pairedIdSet.add(rightId);
                }
              }
              const normalSections = groupSections.filter(s => !pairedIdSet.has(s.id));

              return (
                <div key={group.id} style={{ padding: '20px 28px 0' }}>
                  <div style={{
                    fontSize: 10,
                    color: THEME.text.muted,
                    fontFamily: THEME.font.mono,
                    letterSpacing: '0.1em',
                    textTransform: 'uppercase' as const,
                    marginBottom: 12,
                  }}>
                    {group.label}
                  </div>

                  {pairedRows.map(({ left, right }) => {
                    const LeftComponent = left.component;
                    const RightComponent = right.component;
                    const pairKey = `${left.id}-${right.id}`;
                    const isExpanded = pairedExpanded[pairKey] ?? true;
                    const toggle = () => setPairedExpanded(prev => ({ ...prev, [pairKey]: !isExpanded }));
                    return (
                      <div key={pairKey} style={{ display: 'flex', gap: 10, alignItems: 'stretch' }}>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                          <LeftComponent profile={selectedProfile} pillar={left.pillar} expanded={isExpanded} onToggleExpanded={toggle} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
                          <RightComponent profile={selectedProfile} pillar={right.pillar} expanded={isExpanded} onToggleExpanded={toggle} />
                        </div>
                      </div>
                    );
                  })}

                  {normalSections.map(section => {
                    const Component = section.component;
                    return (
                      <Component
                        key={section.id}
                        profile={selectedProfile}
                        pillar={section.pillar}
                      />
                    );
                  })}
                </div>
              );
            })}

            <div style={{ height: 28 }} />
          </>
        ) : (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            color: THEME.text.muted,
            fontSize: 13,
          }}>
            Select a profile from the sidebar
          </div>
        )}
      </div>

      {/* Share Modal */}
      {shareOpen && selectedProfile && (
        <ShareModal profile={selectedProfile} onClose={() => setShareOpen(false)} />
      )}
    </div>
  );
}
