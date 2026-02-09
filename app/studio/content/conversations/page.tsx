'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  MessageSquare,
  Search,
  Clock,
  Mic,
  ChevronRight,
  Layers,
  Shield,
} from 'lucide-react';
import { supabaseClient } from '@/lib/supabase-client';

interface VignetteListItem {
  id: string;
  title: string;
  description?: string;
  category: string;
  subcategory?: string;
  difficulty: string[];
  estimated_duration_minutes: number;
  is_active: boolean;
  vignette_data: {
    version?: string | number;
    conversation?: { phases?: unknown[] };
    voice_config?: { enabled?: boolean };
  };
  updated_at: string;
}

const categoryLabels: Record<string, string> = {
  'medical-error-disclosure': 'Medical Error Disclosure',
  'serious-diagnosis': 'Serious Diagnosis Delivery',
  'treatment-refusal': 'Treatment Refusal',
  'end-of-life': 'End-of-Life Planning',
  'capacity-assessment': 'Capacity Assessment',
  'colleague-performance': 'Colleague Performance',
  'resource-conflict': 'Resource Conflict',
  'unexpected-outcome': 'Unexpected Outcome',
};

const difficultyColors: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'bg-emerald-100', text: 'text-emerald-700' },
  intermediate: { bg: 'bg-amber-100', text: 'text-amber-700' },
  advanced: { bg: 'bg-red-100', text: 'text-red-700' },
};

export default function ConversationsListPage() {
  const router = useRouter();
  const [vignettes, setVignettes] = useState<VignetteListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    async function fetchVignettes() {
      try {
        const { data: { session } } = await supabaseClient.auth.getSession();
        if (!session) return;

        const res = await fetch('/api/vignettes', {
          headers: { Authorization: `Bearer ${session.access_token}` },
        });
        if (!res.ok) return;
        const data = await res.json();
        setVignettes(data.vignettes || []);
      } catch (err) {
        console.error('[StudioConversations] Failed to load vignettes:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchVignettes();
  }, []);

  const filtered = vignettes.filter((v) =>
    v.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1
            className="text-2xl font-bold flex items-center gap-3"
            style={{ color: 'var(--theme-text)' }}
          >
            <MessageSquare size={28} style={{ color: 'var(--theme-primary)' }} />
            Difficult Conversations
          </h1>
          <p className="mt-1" style={{ color: 'var(--theme-text-muted)' }}>
            View and manage conversation vignettes — phases, objectives, and complexity settings
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2"
            size={18}
            style={{ color: 'var(--theme-text-muted)' }}
          />
          <input
            type="text"
            placeholder="Search vignettes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg focus:outline-none focus:ring-2"
            style={{
              background: 'var(--theme-surface-solid)',
              border: '1px solid var(--theme-border-solid)',
              color: 'var(--theme-text)',
            }}
          />
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2"
            style={{ borderColor: 'var(--theme-primary)' }}
          />
        </div>
      ) : filtered.length === 0 ? (
        <div
          className="text-center py-12 rounded-2xl"
          style={{
            background: 'var(--theme-surface-solid)',
            border: '1px solid var(--theme-border-solid)',
          }}
        >
          <MessageSquare
            className="mx-auto mb-4"
            size={48}
            style={{ color: 'var(--theme-text-muted)' }}
          />
          <h3
            className="text-lg font-medium mb-2"
            style={{ color: 'var(--theme-text)' }}
          >
            {searchQuery ? 'No vignettes found' : 'No Vignettes Yet'}
          </h3>
          <p style={{ color: 'var(--theme-text-muted)' }}>
            {searchQuery
              ? 'Try adjusting your search'
              : 'Import a vignette to get started'}
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {filtered.map((v) => {
            const phaseCount =
              v.vignette_data?.conversation?.phases
                ? (v.vignette_data.conversation.phases as unknown[]).length
                : 0;
            const voiceEnabled = v.vignette_data?.voice_config?.enabled === true;
            const isV2 =
              v.vignette_data?.version === '2.0' ||
              v.vignette_data?.version === 2;

            return (
              <div
                key={v.id}
                className="rounded-xl p-5 transition-all cursor-pointer hover:shadow-md"
                style={{
                  background: 'var(--theme-surface-solid)',
                  border: '1px solid var(--theme-border-solid)',
                }}
                onClick={() =>
                  router.push(`/studio/content/conversations/${v.id}`)
                }
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3
                        className="font-semibold"
                        style={{ color: 'var(--theme-text)' }}
                      >
                        {v.title}
                      </h3>
                      {isV2 && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                          v2
                        </span>
                      )}
                      {voiceEnabled && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-purple-100 text-purple-700 flex items-center gap-1">
                          <Mic size={10} /> Voice
                        </span>
                      )}
                      <span
                        className="text-xs px-2 py-0.5 rounded-full"
                        style={{
                          background: 'var(--theme-primary-soft)',
                          color: 'var(--theme-primary)',
                        }}
                      >
                        {categoryLabels[v.category] || v.category}
                      </span>
                    </div>

                    {v.description && (
                      <p
                        className="text-sm mb-3 line-clamp-2"
                        style={{ color: 'var(--theme-text-muted)' }}
                      >
                        {v.description}
                      </p>
                    )}

                    <div
                      className="flex items-center gap-4 text-xs flex-wrap"
                      style={{ color: 'var(--theme-text-muted)' }}
                    >
                      {/* Difficulty badges */}
                      <div className="flex gap-1">
                        {v.difficulty.map((d) => {
                          const colors = difficultyColors[d] || {
                            bg: 'bg-gray-100',
                            text: 'text-gray-600',
                          };
                          return (
                            <span
                              key={d}
                              className={`px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                            >
                              {d}
                            </span>
                          );
                        })}
                      </div>

                      <span className="flex items-center gap-1">
                        <Layers size={12} />
                        {phaseCount} phases
                      </span>

                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        {v.estimated_duration_minutes} min
                      </span>

                      <span className="flex items-center gap-1">
                        <Shield size={12} />
                        {v.is_active ? 'Active' : 'Inactive'}
                      </span>

                      <span>
                        Updated{' '}
                        {new Date(v.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <ChevronRight
                    size={20}
                    className="mt-1 flex-shrink-0"
                    style={{ color: 'var(--theme-text-muted)' }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
