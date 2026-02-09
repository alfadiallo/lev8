// Difficult Conversation Detail Page

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ModuleLayout from '@/components/modules/ModuleLayout';
import ModuleGuard from '@/components/modules/ModuleGuard';
import ConversationInterface from '@/components/modules/difficult-conversations/ConversationInterface';
import { Vignette } from '@/lib/types/modules';
import { supabaseClient as supabase } from '@/lib/supabase-client';

export default function DifficultConversationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const vignetteId = params.id as string;

  const [vignette, setVignette] = useState<Vignette | null>(null);
  const [difficulty, setDifficulty] = useState<'beginner' | 'intermediate' | 'advanced'>('beginner');
  const [loading, setLoading] = useState(true);
  const [showConversation, setShowConversation] = useState(false);

  useEffect(() => {
    if (vignetteId) {
      loadVignette();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vignetteId]);

  const loadVignette = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        window.location.href = '/login';
        return;
      }

      const response = await fetch(`/api/vignettes/${vignetteId}`, {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        throw new Error('Failed to load vignette');
      }

      const result = await response.json();
      setVignette(result.vignette);
    } catch (error) {
      console.error('[DifficultConversation] Error loading vignette:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartConversation = () => {
    setShowConversation(true);
  };

  const handleEndConversation = () => {
    setShowConversation(false);
  };

  if (loading) {
    return (
      <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']}>
        <ModuleLayout title="Loading..." description="">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
          </div>
        </ModuleLayout>
      </ModuleGuard>
    );
  }

  if (!vignette) {
    return (
      <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']}>
        <ModuleLayout title="Vignette Not Found" description="">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-md border border-white/30 text-center">
            <p className="text-neutral-600 mb-4">The vignette you&apos;re looking for doesn&apos;t exist.</p>
            <button
              onClick={() => router.push('/modules/learn/difficult-conversations')}
              className="bg-[#0EA5E9] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#0284C7] hover:shadow-lg transition-all duration-300"
            >
              Back to Vignettes
            </button>
          </div>
        </ModuleLayout>
      </ModuleGuard>
    );
  }

  if (showConversation) {
    return (
      <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']}>
        <ModuleLayout
          title={vignette.title}
          description={vignette.description || ''}
        >
          <ConversationInterface
            vignette={vignette}
            difficulty={difficulty}
            onEnd={handleEndConversation}
          />
        </ModuleLayout>
      </ModuleGuard>
    );
  }

  // Handle both v1 and v2 vignettes
  const isV2 = vignette.vignette_data?.version === '2.0' || vignette.vignette_data?.version === 2;
  const vignetteData = vignette.vignette_data || {};
  
  // Get primary avatar based on version
  let primaryAvatar: { name: string; role: string; color: string } | null = null;
  if (isV2 && vignetteData.avatars?.primaryAvatar) {
    const avatarKey = Object.keys(vignetteData.avatars.primaryAvatar)[0];
    const avatar = vignetteData.avatars.primaryAvatar[avatarKey];
    primaryAvatar = {
      name: avatar.identity.name,
      role: avatar.identity.relationship || avatar.identity.occupation || 'Family Member',
      color: '#7EC8E3',
    };
  } else {
    primaryAvatar = vignetteData.primaryAvatar;
  }
  
  const difficulties = Array.isArray(vignette.difficulty) ? vignette.difficulty : [vignette.difficulty];

  return (
    <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']}>
      <ModuleLayout
        title={vignette.title}
        description={vignette.description || ''}
      >
        <div className="space-y-6">
          {/* Vignette Info */}
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-white/30">
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-2xl font-semibold mb-2 text-neutral-800">{vignette.title}</h2>
                <p className="text-neutral-600">{vignette.description}</p>
              </div>
              <div className="flex gap-2">
                {difficulties.map((diff) => (
                  <span
                    key={diff}
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      diff === 'beginner'
                        ? 'bg-[#86C5A8]/20 text-[#86C5A8] border border-[#86C5A8]/30'
                        : diff === 'intermediate'
                        ? 'bg-[#FFD89B]/20 text-[#FFD89B] border border-[#FFD89B]/30'
                        : 'bg-[#F4A5A5]/20 text-[#F4A5A5] border border-[#F4A5A5]/30'
                    }`}
                  >
                    {diff}
                  </span>
                ))}
              </div>
            </div>

            {/* Avatar Info */}
            {primaryAvatar && (
              <div className="bg-white/60 backdrop-blur-sm p-4 rounded-xl border border-white/40 mb-6">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg"
                    style={{ backgroundColor: primaryAvatar.color || '#7EC8E3' }}
                  >
                    {primaryAvatar.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-neutral-800">{primaryAvatar.name}</p>
                    <p className="text-sm text-neutral-600">{primaryAvatar.role}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Difficulty Selection */}
            {difficulties.length > 1 && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-neutral-700 mb-2">
                  Select Difficulty Level:
                </label>
                <div className="flex gap-2">
                  {difficulties.map((diff) => (
                    <button
                      key={diff}
                      onClick={() => setDifficulty(diff as 'beginner' | 'intermediate' | 'advanced')}
                      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                        difficulty === diff
                          ? 'bg-[#0EA5E9] text-white'
                          : 'bg-white/30 border border-white/40 text-neutral-700 hover:bg-white/50'
                      }`}
                    >
                      {diff.charAt(0).toUpperCase() + diff.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={handleStartConversation}
              className="w-full bg-[#0EA5E9] text-white px-6 py-3 rounded-2xl font-medium hover:bg-[#0284C7] hover:shadow-lg transition-all duration-300 hover:scale-105"
            >
              Start Conversation
            </button>
          </div>

          {/* Context Info */}
          {isV2 && vignetteData.clinicalData ? (
            <div className="bg-[#D4F1F4]/80 backdrop-blur-sm border border-[#7EC8E3]/30 p-6 rounded-2xl space-y-4">
              <h3 className="font-semibold mb-2 text-neutral-800">Clinical Scenario</h3>
              <div>
                <p className="text-sm font-medium text-neutral-700 mb-1">Patient Presentation:</p>
                <p className="text-sm text-neutral-600">{vignetteData.clinicalData.patient?.presentation?.chiefComplaint || 'N/A'}</p>
              </div>
              {vignetteData.learningObjectives && vignetteData.learningObjectives.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-neutral-700 mb-1">Learning Objectives:</p>
                  <ul className="text-sm text-neutral-600 space-y-1">
                    {vignetteData.learningObjectives.map((obj: { objective: string }, idx: number) => (
                      <li key={idx}>• {obj.objective}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : vignetteData.context ? (
            <div className="bg-[#D4F1F4]/80 backdrop-blur-sm border border-[#7EC8E3]/30 p-6 rounded-2xl">
              <h3 className="font-semibold mb-2 text-neutral-800">Scenario Context</h3>
              <p className="text-sm text-neutral-700 whitespace-pre-wrap">{vignetteData.context}</p>
            </div>
          ) : null}
        </div>
      </ModuleLayout>
    </ModuleGuard>
  );
}

