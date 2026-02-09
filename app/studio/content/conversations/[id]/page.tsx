'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Save,
  History,
  Settings2,
  ChevronDown,
  ChevronRight,
  Mic,
  AlertTriangle,
  CheckCircle,
  Tag,
  GitBranch,
  RotateCcw,
  Gauge,
  Plus,
  Trash2,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase-client';

// ─── Types ───────────────────────────────────────────────────────────────────

interface LearnerTask {
  text: string;
  keywords: string[];
}

/** Per-difficulty override for a phase (maxMessages, keywords). */
interface PhaseDifficultyOverride {
  maxMessages?: number;
  additionalKeywords?: Record<string, string[]>;
  removedKeywords?: Record<string, string[]>;
}

interface Phase {
  id: string;
  name: string;
  duration: string;
  objective: string;
  criticalPhase?: boolean;
  maxMessages?: number;
  difficultyOverrides?: {
    beginner?: PhaseDifficultyOverride;
    intermediate?: PhaseDifficultyOverride;
    advanced?: PhaseDifficultyOverride;
  };
  learnerTasks?: (string | LearnerTask)[];
  avatarState: Record<string, unknown>;
  branchPoints?: Record<string, { next: string; emotionDelta: number; description: string }>;
  assessmentPoints?: string[];
  commonQuestions?: string[];
}

interface VignetteData {
  id?: string;
  version?: string | number;
  conversation?: {
    phases?: Phase[];
    [key: string]: unknown;
  };
  voice_config?: { enabled?: boolean };
  [key: string]: unknown;
}

interface Vignette {
  id: string;
  title: string;
  description?: string;
  category: string;
  difficulty: string[];
  estimated_duration_minutes: number;
  vignette_data: VignetteData;
  updated_at: string;
}

interface VersionEntry {
  id: string;
  version_number: number;
  change_summary: string;
  changed_by_name: string;
  created_at: string;
  vignette_data?: VignetteData;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getTaskText(task: string | LearnerTask): string {
  return typeof task === 'string' ? task : task.text;
}

function getTaskKeywords(task: string | LearnerTask): string[] {
  return typeof task === 'string' ? [] : task.keywords;
}

const DEFAULT_MAX_MESSAGES = 5;

type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

function getEffectiveMaxMessages(
  phase: Phase,
  difficulty: DifficultyLevel
): number {
  const override = phase.difficultyOverrides?.[difficulty];
  return override?.maxMessages ?? phase.maxMessages ?? DEFAULT_MAX_MESSAGES;
}

// ─── Main Component ──────────────────────────────────────────────────────────

export default function VignetteEditorPage() {
  const params = useParams();
  const router = useRouter();
  const vignetteId = params.id as string;

  // State
  const [vignette, setVignette] = useState<Vignette | null>(null);
  const [phases, setPhases] = useState<Phase[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [expandedPhases, setExpandedPhases] = useState<Set<string>>(new Set());
  const [changeSummary, setChangeSummary] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<'editor' | 'history'>('editor');

  // History state
  const [versions, setVersions] = useState<VersionEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [diffVersions, setDiffVersions] = useState<{ a: number; b: number } | null>(null);
  const [diffData, setDiffData] = useState<{ a: VignetteData | null; b: VignetteData | null }>({
    a: null,
    b: null,
  });

  // ─── Auth + Fetch ────────────────────────────────────────────────────────

  const getSession = useCallback(async () => {
    const { data: { session } } = await supabaseClient.auth.getSession();
    return session;
  }, []);

  useEffect(() => {
    async function load() {
      try {
        const session = await getSession();
        if (!session) return;

        // Check role
        const { data: profile } = await supabaseClient
          .from('user_profiles')
          .select('role')
          .eq('id', session.user.id)
          .single();
        setIsSuperAdmin(profile?.role === 'super_admin');

        // Fetch vignette
        const res = await fetch(`/api/vignettes/${vignetteId}`, {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) throw new Error('Failed to load vignette');
        const data = await res.json();
        const v = data.vignette as Vignette;
        setVignette(v);

        const vigPhases = v.vignette_data?.conversation?.phases || [];
        setPhases(JSON.parse(JSON.stringify(vigPhases))); // deep clone for editing
        // Expand first phase by default
        if (vigPhases.length > 0) setExpandedPhases(new Set([vigPhases[0].id]));
      } catch (err) {
        console.error('[VignetteEditor] Load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [vignetteId, getSession]);

  // ─── History Fetch ───────────────────────────────────────────────────────

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const session = await getSession();
      if (!session) return;

      const res = await fetch(`/api/vignettes/${vignetteId}/versions`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      setVersions(data.versions || []);
    } catch (err) {
      console.error('[VignetteEditor] History error:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [vignetteId, getSession]);

  useEffect(() => {
    if (activeTab === 'history') loadHistory();
  }, [activeTab, loadHistory]);

  // ─── Computed ────────────────────────────────────────────────────────────

  const difficultyBudgets = useMemo(() => {
    const calc = (d: DifficultyLevel) => {
      const total = phases.reduce((sum, p) => sum + getEffectiveMaxMessages(p, d), 0);
      const label =
        total >= 28 ? { text: 'Easy', color: 'text-emerald-600' } :
        total >= 20 ? { text: 'Moderate', color: 'text-amber-600' } :
        { text: 'Hard', color: 'text-red-600' };
      return { total, ...label };
    };
    return {
      beginner: calc('beginner'),
      intermediate: calc('intermediate'),
      advanced: calc('advanced'),
    };
  }, [phases]);

  // ─── Phase Editing ───────────────────────────────────────────────────────

  const updatePhaseMaxMessages = (phaseId: string, value: number, difficulty?: DifficultyLevel) => {
    const clamped = Math.max(1, Math.min(15, value));
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== phaseId) return p;
        if (difficulty === 'intermediate' || !difficulty) {
          return { ...p, maxMessages: clamped };
        }
        const overrides = { ...p.difficultyOverrides };
        overrides[difficulty] = { ...overrides[difficulty], maxMessages: clamped };
        return { ...p, difficultyOverrides: overrides };
      })
    );
  };

  const updateTaskKeywords = (phaseId: string, taskIndex: number, keywords: string[]) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== phaseId || !p.learnerTasks) return p;
        const tasks = [...p.learnerTasks];
        const task = tasks[taskIndex];
        const text = getTaskText(task);
        tasks[taskIndex] = { text, keywords };
        return { ...p, learnerTasks: tasks };
      })
    );
  };

  const addLearnerTask = (phaseId: string, text: string) => {
    if (!text.trim()) return;
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== phaseId) return p;
        const tasks = [...(p.learnerTasks || [])];
        tasks.push({ text: text.trim(), keywords: [] });
        return { ...p, learnerTasks: tasks };
      })
    );
  };

  const removeLearnerTask = (phaseId: string, taskIndex: number) => {
    setPhases((prev) =>
      prev.map((p) => {
        if (p.id !== phaseId || !p.learnerTasks) return p;
        const tasks = p.learnerTasks.filter((_, i) => i !== taskIndex);
        return { ...p, learnerTasks: tasks };
      })
    );
  };

  const togglePhase = (phaseId: string) => {
    setExpandedPhases((prev) => {
      const next = new Set(prev);
      if (next.has(phaseId)) next.delete(phaseId);
      else next.add(phaseId);
      return next;
    });
  };

  // ─── Save ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!vignette || !isSuperAdmin) return;
    if (!changeSummary.trim()) {
      setSaveMessage('Please enter a change summary before saving.');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const session = await getSession();
      if (!session) return;

      // Build updated conversation with new phases
      const updatedConversation = {
        ...vignette.vignette_data.conversation,
        phases,
      };

      const res = await fetch(`/api/vignettes/${vignetteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          vignette_data: { conversation: updatedConversation },
          change_summary: changeSummary,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        setSaveMessage(`Error: ${err.error || 'Failed to save'}`);
        return;
      }

      const result = await res.json();
      setSaveMessage(result.message || 'Saved successfully.');
      setChangeSummary('');

      // Refresh vignette data
      setVignette((prev) =>
        prev
          ? {
              ...prev,
              vignette_data: {
                ...prev.vignette_data,
                conversation: updatedConversation,
              },
            }
          : prev
      );
    } catch (err) {
      console.error('[VignetteEditor] Save error:', err);
      setSaveMessage('Unexpected error while saving.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Rollback ────────────────────────────────────────────────────────────

  const handleRollback = async (versionNumber: number) => {
    if (!confirm(`Restore version ${versionNumber}? The current state will be saved as a new version first.`)) return;

    try {
      const session = await getSession();
      if (!session) return;

      const res = await fetch(`/api/vignettes/${vignetteId}/versions/rollback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ version_number: versionNumber }),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(`Rollback failed: ${err.error}`);
        return;
      }

      const result = await res.json();
      alert(result.message);

      // Reload page to get fresh data
      window.location.reload();
    } catch (err) {
      console.error('[VignetteEditor] Rollback error:', err);
    }
  };

  // ─── Diff View ───────────────────────────────────────────────────────────

  const loadDiff = async (versionA: number, versionB: number) => {
    setDiffVersions({ a: versionA, b: versionB });
    setDiffData({ a: null, b: null });

    const session = await getSession();
    if (!session) return;

    const [resA, resB] = await Promise.all([
      fetch(`/api/vignettes/${vignetteId}/versions?version=${versionA}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }),
      fetch(`/api/vignettes/${vignetteId}/versions?version=${versionB}`, {
        headers: { Authorization: `Bearer ${session.access_token}` },
      }),
    ]);

    const dataA = resA.ok ? (await resA.json()).version?.vignette_data : null;
    const dataB = resB.ok ? (await resB.json()).version?.vignette_data : null;
    setDiffData({ a: dataA, b: dataB });
  };

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--theme-primary)' }} />
      </div>
    );
  }

  if (!vignette) {
    return (
      <div className="max-w-4xl mx-auto py-12 text-center">
        <p style={{ color: 'var(--theme-text-muted)' }}>Vignette not found.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Back + Title */}
      <div>
        <button
          onClick={() => router.push('/studio/content/conversations')}
          className="flex items-center gap-1 text-sm mb-3 hover:underline"
          style={{ color: 'var(--theme-text-muted)' }}
        >
          <ArrowLeft size={14} /> Back to Conversations
        </button>

        <h1 className="text-2xl font-bold" style={{ color: 'var(--theme-text)' }}>
          {vignette.title}
        </h1>
        {vignette.description && (
          <p className="mt-1 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
            {vignette.description}
          </p>
        )}

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          {vignette.difficulty.map((d) => (
            <span
              key={d}
              className={`text-xs px-2 py-0.5 rounded-full ${
                d === 'beginner'
                  ? 'bg-emerald-100 text-emerald-700'
                  : d === 'intermediate'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-red-100 text-red-700'
              }`}
            >
              {d}
            </span>
          ))}
          {vignette.vignette_data?.voice_config?.enabled && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
              <Mic size={10} /> Voice Enabled
            </span>
          )}
          <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
            {phases.length} phases &middot; {vignette.estimated_duration_minutes} min
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--theme-surface-solid)' }}>
        <button
          onClick={() => setActiveTab('editor')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'editor' ? 'shadow-sm' : ''
          }`}
          style={{
            background: activeTab === 'editor' ? 'white' : 'transparent',
            color: activeTab === 'editor' ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
          }}
        >
          <Settings2 size={16} /> Editor
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all ${
            activeTab === 'history' ? 'shadow-sm' : ''
          }`}
          style={{
            background: activeTab === 'history' ? 'white' : 'transparent',
            color: activeTab === 'history' ? 'var(--theme-primary)' : 'var(--theme-text-muted)',
          }}
        >
          <History size={16} /> Version History
        </button>
      </div>

      {/* ════════════════ EDITOR TAB ════════════════ */}
      {activeTab === 'editor' && (
        <div className="space-y-6">
          {/* Complexity Control Bar — all three difficulties at a glance */}
          <div
            className="rounded-xl p-4"
            style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
          >
            <div className="flex items-center gap-3 mb-3">
              <Gauge size={20} style={{ color: 'var(--theme-primary)' }} />
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  Complexity Control
                </p>
                <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  Total message budget across all phases by difficulty
                </p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {([
                { key: 'beginner' as const, label: 'Beginner', borderColor: '#6ee7b7', textColor: '#059669' },
                { key: 'intermediate' as const, label: 'Intermediate', borderColor: '#fdba74', textColor: '#ea580c' },
                { key: 'advanced' as const, label: 'Advanced', borderColor: '#fca5a5', textColor: '#dc2626' },
              ]).map(({ key, label, borderColor, textColor }) => (
                <div key={key} className="rounded-lg px-3 py-2 text-center" style={{ border: `1px solid ${borderColor}` }}>
                  <p className="text-xs font-medium" style={{ color: 'var(--theme-text-muted)' }}>
                    {label}
                  </p>
                  <p className="text-base font-bold" style={{ color: textColor }}>{difficultyBudgets[key].total}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Phase Cards */}
          {phases.map((phase, phaseIndex) => {
            const isExpanded = expandedPhases.has(phase.id);
            const tasks = phase.learnerTasks || [];
            const bMax = getEffectiveMaxMessages(phase, 'beginner');
            const iMax = getEffectiveMaxMessages(phase, 'intermediate');
            const aMax = getEffectiveMaxMessages(phase, 'advanced');
            const hasBranches = phase.branchPoints && Object.keys(phase.branchPoints).length > 0;

            return (
              <div
                key={phase.id}
                className="rounded-xl overflow-hidden"
                style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
              >
                {/* Phase Header */}
                <button
                  onClick={() => togglePhase(phase.id)}
                  className="w-full flex items-center justify-between p-4 text-left hover:opacity-80 transition-opacity"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                      style={{ background: phase.criticalPhase ? '#dc2626' : 'var(--theme-primary)' }}
                    >
                      {phaseIndex}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm" style={{ color: 'var(--theme-text)' }}>
                          {phase.name}
                        </span>
                        {phase.criticalPhase && (
                          <AlertTriangle size={14} className="text-red-500" />
                        )}
                        {hasBranches && (
                          <GitBranch size={14} className="text-blue-500" />
                        )}
                      </div>
                      <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        {phase.objective} &middot; {phase.duration}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: '#059669', border: '1.5px solid #6ee7b7' }}>
                      B:{bMax}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: '#ea580c', border: '1.5px solid #fdba74' }}>
                      I:{iMax}
                    </span>
                    <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ color: '#dc2626', border: '1.5px solid #fca5a5' }}>
                      A:{aMax}
                    </span>
                    {isExpanded ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4 border-t" style={{ borderColor: 'var(--theme-border-solid)' }}>
                    {/* B / I / A Message Caps — inline columns */}
                    <div className="pt-4 space-y-2">
                      <label className="text-sm font-medium block" style={{ color: 'var(--theme-text)' }}>
                        Responses Allowed Per Difficulty
                      </label>
                      <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                        Learner messages before this phase auto-advances. Fewer = harder.
                      </p>
                      <div className="grid grid-cols-3 gap-3 mt-2">
                        {([
                          { key: 'beginner' as const, label: 'Beginner', val: bMax, textColor: '#059669', borderColor: '#6ee7b7' },
                          { key: 'intermediate' as const, label: 'Intermediate', val: iMax, textColor: '#ea580c', borderColor: '#fdba74' },
                          { key: 'advanced' as const, label: 'Advanced', val: aMax, textColor: '#dc2626', borderColor: '#fca5a5' },
                        ]).map(({ key, label, val, textColor, borderColor }) => (
                          <div key={key} className="rounded-lg px-3 py-2 text-center" style={{ border: `1px solid ${borderColor}` }}>
                            <p className="text-xs font-semibold mb-1" style={{ color: textColor }}>{label}</p>
                            <input
                              type="number"
                              min={1}
                              max={15}
                              value={val}
                              onChange={(e) =>
                                updatePhaseMaxMessages(phase.id, parseInt(e.target.value) || 1, key)
                              }
                              disabled={!isSuperAdmin}
                              className="w-14 mx-auto text-center py-1 rounded-md text-sm font-bold bg-white"
                              style={{ color: textColor, border: `1px solid ${borderColor}` }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Learner Objectives */}
                    <div>
                      <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                        Learner Objectives
                      </h4>
                      {tasks.length > 0 ? (
                        <div className="space-y-3">
                          {tasks.map((task, taskIdx) => {
                            const text = getTaskText(task);
                            const keywords = getTaskKeywords(task);
                            return (
                              <div key={taskIdx} className="flex items-start gap-2">
                                <CheckCircle size={16} className="mt-0.5 text-emerald-500 flex-shrink-0" />
                                <div className="flex-1">
                                  <p className="text-sm" style={{ color: 'var(--theme-text)' }}>
                                    {text}
                                  </p>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {keywords.map((kw, kwIdx) => (
                                      <span
                                        key={kwIdx}
                                        className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-600"
                                      >
                                        <Tag size={10} />
                                        {kw}
                                        {isSuperAdmin && (
                                          <button
                                            onClick={() => {
                                              const updated = keywords.filter((_, i) => i !== kwIdx);
                                              updateTaskKeywords(phase.id, taskIdx, updated);
                                            }}
                                            className="ml-0.5 hover:text-red-500"
                                          >
                                            &times;
                                          </button>
                                        )}
                                      </span>
                                    ))}
                                    {isSuperAdmin && (
                                      <button
                                        onClick={() => {
                                          const newKw = prompt('Add keyword:');
                                          if (newKw?.trim()) {
                                            updateTaskKeywords(phase.id, taskIdx, [...keywords, newKw.trim().toLowerCase()]);
                                          }
                                        }}
                                        className="text-xs px-2 py-0.5 rounded-full border border-dashed hover:bg-blue-50"
                                        style={{ borderColor: 'var(--theme-border-solid)', color: 'var(--theme-text-muted)' }}
                                      >
                                        + keyword
                                      </button>
                                    )}
                                  </div>
                                </div>
                                {isSuperAdmin && (
                                  <button
                                    onClick={() => {
                                      if (confirm(`Remove objective: "${text}"?`)) {
                                        removeLearnerTask(phase.id, taskIdx);
                                      }
                                    }}
                                    className="mt-0.5 p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors flex-shrink-0"
                                    title="Remove objective"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <p className="text-xs italic" style={{ color: 'var(--theme-text-muted)' }}>
                          No learner objectives defined for this phase.
                        </p>
                      )}
                      {isSuperAdmin && (
                        <button
                          onClick={() => {
                            const text = prompt('New learner objective:');
                            if (text?.trim()) addLearnerTask(phase.id, text);
                          }}
                          className="flex items-center gap-1.5 mt-3 text-xs font-medium px-3 py-1.5 rounded-lg border border-dashed hover:bg-blue-50 transition-colors"
                          style={{ borderColor: 'var(--theme-border-solid)', color: 'var(--theme-text-muted)' }}
                        >
                          <Plus size={12} /> Add Objective
                        </button>
                      )}
                    </div>

                    {/* Branch Points (read-only) */}
                    {hasBranches && (
                      <div>
                        <h4 className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                          Branch Points
                        </h4>
                        <div className="space-y-1">
                          {Object.entries(phase.branchPoints!).map(([condition, bp]) => (
                            <div
                              key={condition}
                              className="flex items-center gap-2 text-xs p-2 rounded-lg"
                              style={{ background: 'var(--theme-primary-soft)' }}
                            >
                              <GitBranch size={12} style={{ color: 'var(--theme-primary)' }} />
                              <span className="font-mono" style={{ color: 'var(--theme-primary)' }}>
                                {condition}
                              </span>
                              <span style={{ color: 'var(--theme-text-muted)' }}>&rarr;</span>
                              <span style={{ color: 'var(--theme-text)' }}>{bp.description}</span>
                              <span className={bp.emotionDelta > 0 ? 'text-red-500' : 'text-emerald-500'}>
                                ({bp.emotionDelta > 0 ? '+' : ''}{bp.emotionDelta})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Avatar emotional state */}
                    <div className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      <span className="font-medium">Avatar state:</span>{' '}
                      {typeof phase.avatarState?.emotional === 'string'
                        ? phase.avatarState.emotional
                        : JSON.stringify(phase.avatarState?.emotional || 'N/A')}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Save Section */}
          {isSuperAdmin && (
            <div
              className="rounded-xl p-4 space-y-3"
              style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
            >
              <div className="flex items-center gap-2">
                <Save size={16} style={{ color: 'var(--theme-primary)' }} />
                <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                  Save Changes
                </span>
              </div>
              <input
                type="text"
                placeholder="Describe what you changed (required)..."
                value={changeSummary}
                onChange={(e) => setChangeSummary(e.target.value)}
                className="w-full px-3 py-2 rounded-lg text-sm"
                style={{
                  background: 'white',
                  border: '1px solid var(--theme-border-solid)',
                  color: 'var(--theme-text)',
                }}
              />
              <div className="flex items-center gap-3">
                <button
                  onClick={handleSave}
                  disabled={saving || !changeSummary.trim()}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all disabled:opacity-50"
                  style={{ background: 'var(--theme-primary)' }}
                >
                  <Save size={14} />
                  {saving ? 'Saving...' : 'Save & Create Version'}
                </button>
                {saveMessage && (
                  <span className="text-sm" style={{ color: saveMessage.startsWith('Error') ? '#dc2626' : '#16a34a' }}>
                    {saveMessage}
                  </span>
                )}
              </div>
            </div>
          )}

          {!isSuperAdmin && (
            <div className="text-center py-4 text-sm" style={{ color: 'var(--theme-text-muted)' }}>
              Read-only view. Super Admin access required to edit.
            </div>
          )}
        </div>
      )}

      {/* ════════════════ HISTORY TAB ════════════════ */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {loadingHistory ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--theme-primary)' }} />
            </div>
          ) : versions.length === 0 ? (
            <div
              className="text-center py-12 rounded-xl"
              style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
            >
              <History className="mx-auto mb-3" size={40} style={{ color: 'var(--theme-text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--theme-text-muted)' }}>
                No version history yet. Save an edit to create the first version.
              </p>
            </div>
          ) : (
            <>
              {/* Diff controls */}
              {versions.length >= 2 && (
                <div
                  className="rounded-xl p-4 flex items-center gap-4 flex-wrap"
                  style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                    Compare:
                  </span>
                  <select
                    className="text-sm px-3 py-1.5 rounded-lg"
                    style={{ background: 'white', border: '1px solid var(--theme-border-solid)', color: 'var(--theme-text)' }}
                    value={diffVersions?.a ?? ''}
                    onChange={(e) => {
                      const a = parseInt(e.target.value);
                      if (diffVersions?.b) loadDiff(a, diffVersions.b);
                      else setDiffVersions({ a, b: 0 });
                    }}
                  >
                    <option value="">Version A</option>
                    {versions.map((v) => (
                      <option key={v.version_number} value={v.version_number}>
                        v{v.version_number} — {v.change_summary || 'No description'}
                      </option>
                    ))}
                  </select>
                  <span style={{ color: 'var(--theme-text-muted)' }}>vs</span>
                  <select
                    className="text-sm px-3 py-1.5 rounded-lg"
                    style={{ background: 'white', border: '1px solid var(--theme-border-solid)', color: 'var(--theme-text)' }}
                    value={diffVersions?.b ?? ''}
                    onChange={(e) => {
                      const b = parseInt(e.target.value);
                      if (diffVersions?.a) loadDiff(diffVersions.a, b);
                      else setDiffVersions({ a: 0, b });
                    }}
                  >
                    <option value="">Version B</option>
                    {versions.map((v) => (
                      <option key={v.version_number} value={v.version_number}>
                        v{v.version_number} — {v.change_summary || 'No description'}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Diff View */}
              {diffVersions?.a && diffVersions?.b && diffData.a && diffData.b && (
                <DiffView dataA={diffData.a} dataB={diffData.b} versionA={diffVersions.a} versionB={diffVersions.b} />
              )}

              {/* Version Timeline */}
              <div className="space-y-3">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="rounded-xl p-4"
                    style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded-full"
                            style={{ background: 'var(--theme-primary-soft)', color: 'var(--theme-primary)' }}
                          >
                            v{v.version_number}
                          </span>
                          <span className="text-sm font-medium" style={{ color: 'var(--theme-text)' }}>
                            {v.change_summary || 'No description'}
                          </span>
                        </div>
                        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                          by {v.changed_by_name} &middot;{' '}
                          {new Date(v.created_at).toLocaleString()}
                        </p>
                      </div>
                      {isSuperAdmin && (
                        <button
                          onClick={() => handleRollback(v.version_number)}
                          className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg hover:bg-amber-50 transition-colors"
                          style={{ color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border-solid)' }}
                        >
                          <RotateCcw size={12} /> Restore
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Diff Component ──────────────────────────────────────────────────────────

function DiffView({
  dataA,
  dataB,
  versionA,
  versionB,
}: {
  dataA: VignetteData;
  dataB: VignetteData;
  versionA: number;
  versionB: number;
}) {
  const phasesA = dataA?.conversation?.phases || [];
  const phasesB = dataB?.conversation?.phases || [];

  // Build maps by phase id
  const mapA = new Map(phasesA.map((p) => [p.id, p]));
  const mapB = new Map(phasesB.map((p) => [p.id, p]));
  const allIds = new Set([...mapA.keys(), ...mapB.keys()]);

  return (
    <div
      className="rounded-xl p-4 space-y-3"
      style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
    >
      <h3 className="text-sm font-semibold" style={{ color: 'var(--theme-text)' }}>
        Diff: v{versionA} &harr; v{versionB}
      </h3>
      {[...allIds].map((id) => {
        const a = mapA.get(id);
        const b = mapB.get(id);

        if (!a && b) {
          return (
            <div key={id} className="text-xs p-2 rounded bg-emerald-50 text-emerald-700">
              + Phase added: <strong>{b.name}</strong>
            </div>
          );
        }
        if (a && !b) {
          return (
            <div key={id} className="text-xs p-2 rounded bg-red-50 text-red-700">
              - Phase removed: <strong>{a.name}</strong>
            </div>
          );
        }
        if (!a || !b) return null;

        // Compare key fields
        const diffs: string[] = [];
        if (a.maxMessages !== b.maxMessages) {
          diffs.push(`maxMessages: ${a.maxMessages ?? DEFAULT_MAX_MESSAGES} → ${b.maxMessages ?? DEFAULT_MAX_MESSAGES}`);
        }
        if (a.objective !== b.objective) {
          diffs.push(`objective changed`);
        }
        if (JSON.stringify(a.learnerTasks) !== JSON.stringify(b.learnerTasks)) {
          diffs.push(`learnerTasks/keywords changed`);
        }
        if (JSON.stringify(a.branchPoints) !== JSON.stringify(b.branchPoints)) {
          diffs.push(`branchPoints changed`);
        }

        if (diffs.length === 0) return null;

        return (
          <div key={id} className="text-xs p-2 rounded bg-amber-50 text-amber-700">
            <strong>{a.name}</strong>: {diffs.join(', ')}
          </div>
        );
      })}
      {[...allIds].every(
        (id) => mapA.has(id) && mapB.has(id) && JSON.stringify(mapA.get(id)) === JSON.stringify(mapB.get(id))
      ) && (
        <p className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>
          No phase-level differences detected between these versions.
        </p>
      )}
    </div>
  );
}
