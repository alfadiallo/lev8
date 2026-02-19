'use client';

import { CheckCircle, Clock, AlertCircle } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

interface Respondent {
  id: string;
  name: string;
  email: string;
  status: 'pending' | 'started' | 'completed';
  role?: string;
  residents_completed?: number;
  residents_total?: number;
}

interface CompletionTrackerProps {
  respondents: Respondent[];
  title?: string;
  showDetails?: boolean;
  onRemind?: (respondentId: string) => void;
  onRemindAll?: () => void;
  className?: string;
}

// ============================================================================
// Component
// ============================================================================

/**
 * Visual completion tracker for survey campaigns.
 * Shows overall progress + per-respondent status with remind buttons.
 */
export default function CompletionTracker({
  respondents,
  title = 'Completion Status',
  showDetails = true,
  onRemind,
  onRemindAll,
  className = '',
}: CompletionTrackerProps) {
  const total = respondents.length;
  const completed = respondents.filter(r => r.status === 'completed').length;
  const started = respondents.filter(r => r.status === 'started').length;
  const pending = respondents.filter(r => r.status === 'pending').length;
  const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

  return (
    <div className={`bg-white rounded-lg border border-neutral-200 ${className}`}>
      {/* Header with overall stats */}
      <div className="p-4 border-b border-neutral-100">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-semibold text-neutral-900">{title}</h3>
          {onRemindAll && pending + started > 0 && (
            <button
              onClick={onRemindAll}
              className="text-xs font-medium text-blue-600 hover:text-blue-700 px-3 py-1.5 
                         border border-blue-200 rounded-md hover:bg-blue-50 transition-colors"
            >
              Remind All Incomplete
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full h-3 bg-neutral-100 rounded-full overflow-hidden mb-2">
          <div className="h-full flex">
            <div
              className="bg-green-500 transition-all duration-500"
              style={{ width: `${(completed / total) * 100}%` }}
            />
            <div
              className="bg-amber-400 transition-all duration-500"
              style={{ width: `${(started / total) * 100}%` }}
            />
          </div>
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
            <span className="text-neutral-600">{completed} completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-neutral-600">{started} started</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-full bg-neutral-300" />
            <span className="text-neutral-600">{pending} pending</span>
          </div>
          <div className="ml-auto font-bold text-neutral-900">{pct}%</div>
        </div>
      </div>

      {/* Respondent list */}
      {showDetails && (
        <div className="divide-y divide-neutral-50 max-h-80 overflow-y-auto">
          {respondents.map((r) => (
            <div key={r.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-neutral-50">
              {/* Status icon */}
              {r.status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
              ) : r.status === 'started' ? (
                <Clock className="w-4 h-4 text-amber-500 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-neutral-300 shrink-0" />
              )}

              {/* Name and info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-neutral-800 truncate">
                  {r.name || r.email}
                </div>
                {r.residents_total !== undefined && r.status !== 'pending' && (
                  <div className="text-xs text-neutral-500">
                    {r.residents_completed || 0} of {r.residents_total} residents rated
                  </div>
                )}
              </div>

              {/* Role badge */}
              {r.role && (
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-500 shrink-0">
                  {r.role}
                </span>
              )}

              {/* Remind button */}
              {r.status !== 'completed' && onRemind && (
                <button
                  onClick={() => onRemind(r.id)}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium shrink-0"
                >
                  Remind
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
