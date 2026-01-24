'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Plus,
  Search,
  BookOpen,
  Eye,
  MoreVertical,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';

interface RunningBoardCase {
  id: string;
  title: string;
  description?: string;
  status: 'draft' | 'review' | 'published' | 'archived';
  specialty?: string;
  created_at: string;
  updated_at: string;
  view_count: number;
  use_count: number;
}

const statusColors = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Draft' },
  review: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'In Review' },
  published: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Published' },
  archived: { bg: 'bg-red-100', text: 'text-red-700', label: 'Archived' },
};

export default function RunningBoardContentPage() {
  const router = useRouter();
  const [cases, setCases] = useState<RunningBoardCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  useEffect(() => {
    // TODO: Fetch from API
    setLoading(false);
    setCases([]);
  }, []);

  const filteredCases = cases.filter(c => {
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-3" style={{ color: 'var(--theme-text)' }}>
            <BookOpen size={28} style={{ color: 'var(--theme-primary)' }} />
            Running Board Cases
          </h1>
          <p className="mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            Create and manage multi-patient ED simulation scenarios
          </p>
        </div>
        <Link
          href="/studio/content/running-board/new"
          className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all text-white"
          style={{ background: 'var(--theme-primary)' }}
        >
          <Plus size={18} />
          New Case
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2" size={18} style={{ color: 'var(--theme-text-muted)' }} />
          <input
            type="text"
            placeholder="Search cases..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{ 
              background: 'var(--theme-surface-solid)', 
              border: '1px solid var(--theme-border-solid)',
              color: 'var(--theme-text)'
            }}
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 rounded-lg focus:outline-none focus:ring-2"
          style={{ 
            background: 'var(--theme-surface-solid)', 
            border: '1px solid var(--theme-border-solid)',
            color: 'var(--theme-text)'
          }}
        >
          <option value="all">All Status</option>
          <option value="draft">Drafts</option>
          <option value="review">In Review</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: 'var(--theme-primary)' }}></div>
        </div>
      ) : filteredCases.length === 0 ? (
        <div 
          className="text-center py-12 rounded-2xl"
          style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
        >
          <FileText className="mx-auto mb-4" size={48} style={{ color: 'var(--theme-text-muted)' }} />
          <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--theme-text)' }}>
            {searchQuery || statusFilter !== 'all' ? 'No cases found' : 'No Running Board Cases Yet'}
          </h3>
          <p className="mb-6" style={{ color: 'var(--theme-text-muted)' }}>
            {searchQuery || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Create your first Running Board case to get started'
            }
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <Link
              href="/studio/content/running-board/new"
              className="inline-flex items-center gap-2 px-6 py-2 rounded-lg font-medium text-white"
              style={{ background: 'var(--theme-primary)' }}
            >
              <Plus size={18} />
              Create Your First Case
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-4">
          {filteredCases.map((caseItem) => {
            const status = statusColors[caseItem.status];
            return (
              <div
                key={caseItem.id}
                className="rounded-xl p-5 transition-all cursor-pointer hover:shadow-md"
                style={{ background: 'var(--theme-surface-solid)', border: '1px solid var(--theme-border-solid)' }}
                onClick={() => router.push(`/studio/content/running-board/${caseItem.id}`)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-semibold" style={{ color: 'var(--theme-text)' }}>{caseItem.title}</h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${status.bg} ${status.text}`}>
                        {status.label}
                      </span>
                    </div>
                    {caseItem.description && (
                      <p className="text-sm mb-3 line-clamp-2" style={{ color: 'var(--theme-text-muted)' }}>{caseItem.description}</p>
                    )}
                    <div className="flex items-center gap-4 text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Updated {new Date(caseItem.updated_at).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye size={12} />
                        {caseItem.view_count} views
                      </span>
                      <span className="flex items-center gap-1">
                        <CheckCircle size={12} />
                        {caseItem.use_count} uses
                      </span>
                    </div>
                  </div>
                  <button 
                    className="p-2 rounded-lg hover:bg-gray-100"
                    style={{ color: 'var(--theme-text-muted)' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      // TODO: Open menu
                    }}
                  >
                    <MoreVertical size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
