// Clinical Case Detail Page

'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import ModuleLayout from '@/components/modules/ModuleLayout';
import ModuleGuard from '@/components/modules/ModuleGuard';
import CaseInterface from '@/components/modules/clinical-cases/CaseInterface';
import { ClinicalCase, CaseAttempt } from '@/lib/types/modules';
import { supabaseClient as supabase } from '@/lib/supabase-client';

export default function ClinicalCaseDetailPage() {
  const router = useRouter();
  const params = useParams();
  const caseId = params.id as string;

  const [case_, setCase_] = useState<ClinicalCase | null>(null);
  const [attempt, setAttempt] = useState<CaseAttempt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (caseId) {
      loadCase();
      loadAttempt();
    }
  }, [caseId]);

  const loadCase = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.warn('[ClinicalCase] No session found');
        setLoading(false);
        return;
      }

      const response = await fetch(`/api/clinical-cases/${caseId}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to load case');
      }

      const result = await response.json();
      setCase_(result.case);
    } catch (error) {
      console.error('[ClinicalCase] Error loading case:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempt = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const response = await fetch(`/api/clinical-cases/${caseId}/attempts`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        // Get the most recent attempt
        if (result.attempts && result.attempts.length > 0) {
          setAttempt(result.attempts[0]);
        }
      }
    } catch (error) {
      console.error('[ClinicalCase] Error loading attempt:', error);
    }
  };

  const handleSaveProgress = async (progressData: Record<string, any>, completed: boolean, score?: number) => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return;
      }

      const url = `/api/clinical-cases/${caseId}/attempts`;
      const method = attempt ? 'POST' : 'POST';
      const body = {
        progress_data: progressData,
        completed,
        score,
        attempt_id: attempt?.id,
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        throw new Error('Failed to save progress');
      }

      const result = await response.json();
      setAttempt(result.attempt);
    } catch (error) {
      console.error('[ClinicalCase] Error saving progress:', error);
    }
  };

  if (loading) {
    return (
      <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'super_admin']}>
        <ModuleLayout title="Loading..." description="">
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#7EC8E3]"></div>
          </div>
        </ModuleLayout>
      </ModuleGuard>
    );
  }

  if (!case_) {
    return (
      <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'super_admin']}>
        <ModuleLayout title="Case Not Found" description="">
          <div className="bg-white/90 backdrop-blur-sm p-8 rounded-2xl shadow-md border border-white/30 text-center">
            <p className="text-neutral-600 mb-4">The clinical case you're looking for doesn't exist.</p>
            <button
              onClick={() => router.push('/modules/learn/clinical-cases')}
              className="bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
            >
              Back to Cases
            </button>
          </div>
        </ModuleLayout>
      </ModuleGuard>
    );
  }

  return (
    <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'super_admin']}>
      <ModuleLayout
        title={case_.title}
        description={case_.description || ''}
      >
        <CaseInterface
          case_={case_}
          attempt={attempt}
          onSaveProgress={handleSaveProgress}
        />
      </ModuleLayout>
    </ModuleGuard>
  );
}

