'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  CheckCircle2, Clock, Mail, AlertCircle, Bell,
  ChevronDown, ChevronRight, Users, UserCheck, GraduationCap,
  Loader2, Send
} from 'lucide-react';

const COLORS = {
  lightest: '#D8F3DC',
  light: '#B7E4C7',
  medium: '#74C69D',
  dark: '#40916C',
  darker: '#2D6A4F',
  veryDark: '#1B4332',
};

interface RespondentDetail {
  respondent_id: string;
  email: string;
  name: string | null;
  role: string;
  rater_type: string | null;
  status: string;
  started_at: string | null;
  completed_at: string | null;
  reminder_count: number;
  last_reminded_at: string | null;
  guidance_min: number | null;
  total_assigned: number | null;
  completed_assigned: number | null;
  required_assigned: number | null;
  required_completed_assigned: number | null;
}

interface CompletionMatrixProps {
  surveyId: string;
  onRemindAll?: (raterType: string) => Promise<void>;
  onRemindOne?: (respondentId: string) => Promise<void>;
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    completed: { bg: COLORS.lightest, color: COLORS.darker, icon: CheckCircle2, label: 'Completed' },
    started: { bg: '#FEF3C7', color: '#92400E', icon: Clock, label: 'In Progress' },
    pending: { bg: '#F3F4F6', color: '#6B7280', icon: Mail, label: 'Pending' },
  }[status] || { bg: '#F3F4F6', color: '#6B7280', icon: AlertCircle, label: status };

  const Icon = config.icon;

  return (
    <span
      className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium"
      style={{ backgroundColor: config.bg, color: config.color }}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </span>
  );
}

function ProgressBar({ completed, total, label }: { completed: number; total: number; label: string }) {
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-slate-600">{label}</span>
        <span className="text-xs font-medium" style={{ color: COLORS.darker }}>
          {completed}/{total} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: COLORS.lightest }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${pct}%`,
            backgroundColor: pct === 100 ? COLORS.dark : COLORS.medium,
          }}
        />
      </div>
    </div>
  );
}

function RespondentGroup({
  title,
  icon,
  respondents,
  description,
  onRemindAll,
  onRemindOne,
  remindingAll,
}: {
  title: string;
  icon: React.ReactNode;
  respondents: RespondentDetail[];
  description?: string;
  onRemindAll?: () => void;
  onRemindOne?: (id: string) => void;
  remindingAll?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const completed = respondents.filter(r => r.status === 'completed').length;
  const total = respondents.length;
  const pending = respondents.filter(r => r.status !== 'completed');

  if (total === 0) return null;

  return (
    <div className="border rounded-lg" style={{ borderColor: COLORS.light }}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-3 hover:bg-green-50/30"
      >
        <div className="flex items-center gap-2">
          <span style={{ color: COLORS.dark }}>{icon}</span>
          <div className="text-left">
            <p className="text-sm font-medium text-slate-900">{title}</p>
            {description && <p className="text-xs text-slate-500">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium" style={{ color: COLORS.darker }}>
            {completed}/{total}
          </span>
          {completed === total ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <ChevronDown
              className={`w-4 h-4 text-slate-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
            />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t px-3 pb-3" style={{ borderColor: COLORS.lightest }}>
          {/* Remind all pending */}
          {pending.length > 0 && onRemindAll && (
            <div className="pt-2 pb-1">
              <button
                onClick={(e) => { e.stopPropagation(); onRemindAll(); }}
                disabled={remindingAll}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors"
                style={{ borderColor: COLORS.light, color: COLORS.dark }}
              >
                {remindingAll ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <Bell className="w-3 h-3" />
                )}
                Remind All Pending ({pending.length})
              </button>
            </div>
          )}

          <div className="space-y-1 pt-1">
            {respondents.map(r => (
              <div
                key={r.respondent_id}
                className="flex items-center justify-between p-2 rounded-lg hover:bg-slate-50"
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <StatusBadge status={r.status} />
                  <div className="min-w-0">
                    <p className="text-sm text-slate-700 truncate">{r.name || r.email}</p>
                    {r.name && (
                      <p className="text-xs text-slate-400 truncate">{r.email}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 ml-2">
                  {r.total_assigned !== null && r.total_assigned > 0 && (
                    <span className="text-xs text-slate-400">
                      {r.completed_assigned}/{r.total_assigned} rated
                    </span>
                  )}
                  {r.reminder_count > 0 && (
                    <span className="text-xs text-slate-400" title={`Last: ${r.last_reminded_at ? new Date(r.last_reminded_at).toLocaleDateString() : 'never'}`}>
                      {r.reminder_count}x reminded
                    </span>
                  )}
                  {r.status !== 'completed' && onRemindOne && (
                    <button
                      onClick={() => onRemindOne(r.respondent_id)}
                      className="p-1 rounded hover:bg-slate-100"
                      title="Send reminder"
                    >
                      <Send className="w-3 h-3 text-slate-400" />
                    </button>
                  )}
                  {r.completed_at && (
                    <span className="text-xs text-slate-400">
                      {new Date(r.completed_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function CompletionMatrix({ surveyId, onRemindAll, onRemindOne }: CompletionMatrixProps) {
  const [respondents, setRespondents] = useState<RespondentDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [remindingGroup, setRemindingGroup] = useState<string | null>(null);

  const fetchDetail = useCallback(async () => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}`);
      if (!res.ok) return;
      const data = await res.json();
      setRespondents(data.respondent_details || []);
    } catch (err) {
      console.error('[CompletionMatrix] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [surveyId]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  const selfGroup = respondents.filter(r => r.rater_type === 'self');
  const coreGroup = respondents.filter(r => r.rater_type === 'core_faculty');
  const teachingGroup = respondents.filter(r => r.rater_type === 'teaching_faculty');
  const otherGroup = respondents.filter(r => !r.rater_type || !['self', 'core_faculty', 'teaching_faculty'].includes(r.rater_type));

  const totalCompleted = respondents.filter(r => r.status === 'completed').length;
  const totalCount = respondents.length;

  const handleRemindAll = async (raterType: string) => {
    setRemindingGroup(raterType);
    try {
      await onRemindAll?.(raterType);
      await fetchDetail();
    } finally {
      setRemindingGroup(null);
    }
  };

  if (loading) {
    return (
      <div className="py-4 text-center">
        <Loader2 className="w-5 h-5 animate-spin mx-auto" style={{ color: COLORS.dark }} />
        <p className="text-xs text-slate-500 mt-1">Loading completion data...</p>
      </div>
    );
  }

  if (respondents.length === 0) {
    return (
      <div className="py-4 text-center text-sm text-slate-500">
        No respondents yet. Distribute the survey to get started.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Overall progress */}
      <ProgressBar completed={totalCompleted} total={totalCount} label="Overall Campaign Progress" />

      {/* Groups */}
      <RespondentGroup
        title="Residents (Self-Assessment)"
        icon={<GraduationCap className="w-4 h-4" />}
        respondents={selfGroup}
        onRemindAll={() => handleRemindAll('self')}
        onRemindOne={onRemindOne}
        remindingAll={remindingGroup === 'self'}
      />
      <RespondentGroup
        title="Core Faculty"
        icon={<UserCheck className="w-4 h-4" />}
        description="All residents required"
        respondents={coreGroup}
        onRemindAll={() => handleRemindAll('core_faculty')}
        onRemindOne={onRemindOne}
        remindingAll={remindingGroup === 'core_faculty'}
      />
      <RespondentGroup
        title="Teaching Faculty"
        icon={<Users className="w-4 h-4" />}
        description="Choose which residents to evaluate (min 3 recommended)"
        respondents={teachingGroup}
        onRemindAll={() => handleRemindAll('teaching_faculty')}
        onRemindOne={onRemindOne}
        remindingAll={remindingGroup === 'teaching_faculty'}
      />
      {otherGroup.length > 0 && (
        <RespondentGroup
          title="Other"
          icon={<Users className="w-4 h-4" />}
          respondents={otherGroup}
          onRemindAll={() => handleRemindAll('other')}
          onRemindOne={onRemindOne}
          remindingAll={remindingGroup === 'other'}
        />
      )}
    </div>
  );
}
