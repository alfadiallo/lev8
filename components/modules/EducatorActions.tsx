// Action buttons for educators (create, edit, view analytics)

'use client';

import { usePermissions } from '@/hooks/usePermissions';
import { Plus, Edit, BarChart3 } from 'lucide-react';
import Link from 'next/link';

interface EducatorActionsProps {
  onCreateClick?: () => void;
  onEditClick?: () => void;
  onAnalyticsClick?: () => void;
  createHref?: string;
  editHref?: string;
  analyticsHref?: string;
  createLabel?: string;
  editLabel?: string;
  analyticsLabel?: string;
}

export default function EducatorActions({
  onCreateClick,
  onEditClick,
  onAnalyticsClick,
  createHref,
  editHref,
  analyticsHref,
  createLabel = 'Create',
  editLabel = 'Edit',
  analyticsLabel = 'Analytics',
}: EducatorActionsProps) {
  const { canCreateContent, canViewAnalytics } = usePermissions();

  if (!canCreateContent && !canViewAnalytics) {
    return null;
  }

  return (
    <div className="flex gap-3 mb-6">
      {canCreateContent && (
        <>
          {createHref ? (
            <Link
              href={createHref}
              className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-300"
            >
              <Plus size={18} />
              {createLabel}
            </Link>
          ) : (
            <button
              onClick={onCreateClick}
              className="flex items-center gap-2 px-4 py-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white rounded-2xl font-medium hover:shadow-lg transition-all duration-300"
            >
              <Plus size={18} />
              {createLabel}
            </button>
          )}
          {editHref && (
            <Link
              href={editHref}
              className="flex items-center gap-2 px-4 py-2 border border-white/40 text-neutral-700 rounded-2xl hover:bg-white/20 transition-colors"
            >
              <Edit size={18} />
              {editLabel}
            </Link>
          )}
          {onEditClick && (
            <button
              onClick={onEditClick}
              className="flex items-center gap-2 px-4 py-2 border border-white/40 text-neutral-700 rounded-2xl hover:bg-white/20 transition-colors"
            >
              <Edit size={18} />
              {editLabel}
            </button>
          )}
        </>
      )}
      {canViewAnalytics && (
        <>
          {analyticsHref ? (
            <Link
              href={analyticsHref}
              className="flex items-center gap-2 px-4 py-2 border border-white/40 text-neutral-700 rounded-2xl hover:bg-white/20 transition-colors"
            >
              <BarChart3 size={18} />
              {analyticsLabel}
            </Link>
          ) : (
            <button
              onClick={onAnalyticsClick}
              className="flex items-center gap-2 px-4 py-2 border border-white/40 text-neutral-700 rounded-2xl hover:bg-white/20 transition-colors"
            >
              <BarChart3 size={18} />
              {analyticsLabel}
            </button>
          )}
        </>
      )}
    </div>
  );
}


