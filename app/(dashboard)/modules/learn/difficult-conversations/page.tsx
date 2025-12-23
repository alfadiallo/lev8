// Difficult Conversations - Main page

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModuleLayout from '@/components/modules/ModuleLayout';
import ModuleGuard from '@/components/modules/ModuleGuard';
import EducatorActions from '@/components/modules/EducatorActions';
import VignetteCard from '@/components/modules/difficult-conversations/VignetteCard';
import { usePermissions } from '@/hooks/usePermissions';
import { Vignette } from '@/lib/types/modules';
import { supabaseClient as supabase } from '@/lib/supabase-client';
import { MessageSquare, Filter } from 'lucide-react';

const CONVERSATION_CATEGORIES = [
  {
    id: 'medical-error-disclosure',
    name: 'Medical Error Disclosure',
    description: 'Learn how to appropriately disclose medical errors to patients and families',
    color: 'from-red-400 to-red-600',
  },
  {
    id: 'serious-diagnosis-delivery',
    name: 'Serious Diagnosis Delivery',
    description: 'Practice delivering serious diagnoses with empathy and clarity',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'treatment-refusal-withdrawal',
    name: 'Treatment Refusal/Withdrawal',
    description: 'Navigate conversations about treatment refusal or withdrawal of care',
    color: 'from-orange-400 to-orange-600',
  },
  {
    id: 'end-of-life-care',
    name: 'End-of-Life Planning',
    description: 'Discuss end-of-life care options and advance directives',
    color: 'from-purple-400 to-purple-600',
  },
  {
    id: 'informed-consent-capacity',
    name: 'Capacity/Competency Assessment',
    description: 'Learn to assess and discuss patient capacity for medical decisions',
    color: 'from-green-400 to-green-600',
  },
  {
    id: 'inter-collegial-issues',
    name: 'Colleague Performance Issue',
    description: 'Address performance issues with colleagues professionally',
    color: 'from-indigo-400 to-indigo-600',
  },
  {
    id: 'quality-of-care-concerns',
    name: 'Resource Allocation & Utilization Conflict',
    description: 'Navigate conflicts over limited medical resources',
    color: 'from-pink-400 to-pink-600',
  },
  {
    id: 'unexpected-outcome-discussion',
    name: 'Unexpected Outcome Discussion',
    description: 'Discuss unexpected medical outcomes with patients and families',
    color: 'from-yellow-400 to-yellow-600',
  },
];

export default function DifficultConversationsPage() {
  const router = useRouter();
  const { canCreateContent } = usePermissions();
  const [vignettes, setVignettes] = useState<Vignette[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    loadVignettes();
  }, []);

  const loadVignettes = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session, just show empty state (for testing)
      if (!session) {
        console.warn('[DifficultConversations] No session found, showing empty state');
        setVignettes([]);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/vignettes', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        console.warn('[DifficultConversations] API call failed, showing empty state');
        setVignettes([]);
        return;
      }

      const result = await response.json();
      setVignettes(result.vignettes || []);
    } catch (error) {
      console.error('[DifficultConversations] Error loading vignettes:', error);
      setVignettes([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredVignettes = selectedCategory === 'all'
    ? vignettes
    : vignettes.filter(v => v.category === selectedCategory);

  const getVignettesByCategory = (categoryId: string) => {
    return vignettes.filter(v => v.category === categoryId);
  };

  return (
    <ModuleGuard
      availableToRoles={['resident', 'faculty', 'program_director', 'super_admin']}
    >
      <ModuleLayout
        title="Difficult Conversations"
        description="Practice essential communication skills for challenging situations"
        backHref="/modules/learn"
      >
        {/* Educator Actions */}
        {canCreateContent && (
          <EducatorActions
            createHref="/modules/learn/difficult-conversations/create"
            createLabel="Create New Vignette"
          />
        )}

        {/* Category Filter */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-3">
            <Filter size={18} className="text-neutral-600" />
            <h3 className="text-lg font-semibold text-neutral-800">Filter by Category:</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                selectedCategory === 'all'
                  ? 'bg-[#0EA5E9] text-white'
                  : 'bg-white/30 border border-white/40 text-neutral-700 hover:bg-white/50'
              }`}
            >
              All Categories
            </button>
            {CONVERSATION_CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-[#0EA5E9] text-white'
                    : 'bg-white/30 border border-white/40 text-neutral-700 hover:bg-white/50'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Conversations Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0EA5E9]"></div>
          </div>
        ) : filteredVignettes.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm p-12 rounded-2xl shadow-md text-center border border-white/30">
            <MessageSquare size={64} className="mx-auto mb-4 text-neutral-400" />
            <p className="text-neutral-500 mb-4">No vignettes available yet.</p>
            {canCreateContent && (
              <EducatorActions
                createHref="/modules/learn/difficult-conversations/create"
                createLabel="Create First Vignette"
              />
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {CONVERSATION_CATEGORIES.map((category) => {
              const categoryVignettes = getVignettesByCategory(category.id);
              if (selectedCategory !== 'all' && selectedCategory !== category.id) return null;
              
              return (
                <div
                  key={category.id}
                  className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md border border-white/30"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                      <MessageSquare className="h-5 w-5 text-white" />
                    </div>
                    <h3 className="text-lg font-semibold text-neutral-800">{category.name}</h3>
                  </div>
                  <p className="text-sm text-neutral-600 mb-4">{category.description}</p>

                  {categoryVignettes.length > 0 ? (
                    <div className="space-y-2">
                      {categoryVignettes.map((vignette) => (
                        <VignetteCard key={vignette.id} vignette={vignette} />
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-4">
                      <p className="text-sm text-neutral-500">No cases available yet</p>
                      <p className="text-xs text-neutral-400 mt-1">Coming soon</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </ModuleLayout>
    </ModuleGuard>
  );
}

