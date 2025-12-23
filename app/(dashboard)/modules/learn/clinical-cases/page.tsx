// Clinical Cases - Main page

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModuleLayout from '@/components/modules/ModuleLayout';
import ModuleGuard from '@/components/modules/ModuleGuard';
import EducatorActions from '@/components/modules/EducatorActions';
import CaseCard from '@/components/modules/clinical-cases/CaseCard';
import { usePermissions } from '@/hooks/usePermissions';
import { ClinicalCase } from '@/lib/types/modules';
import { supabaseClient as supabase } from '@/lib/supabase-client';
import { Clock, Filter } from 'lucide-react';

export default function ClinicalCasesPage() {
  const { canCreateContent } = usePermissions();
  const [cases, setCases] = useState<ClinicalCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('all');

  useEffect(() => {
    loadCases();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadCases = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      // If no session, just show empty state (for testing)
      if (!session) {
        console.warn('[ClinicalCases] No session found, showing empty state');
        setCases([]);
        setLoading(false);
        return;
      }

      const response = await fetch('/api/clinical-cases', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        // If API fails, just show empty state instead of error
        console.warn('[ClinicalCases] API call failed, showing empty state');
        setCases([]);
        return;
      }

      const result = await response.json();
      setCases(result.cases || []);
    } catch (error) {
      console.error('[ClinicalCases] Error loading cases:', error);
      // On error, show empty state
      setCases([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredCases = cases.filter(case_ => {
    if (selectedDifficulty !== 'all' && case_.difficulty !== selectedDifficulty) return false;
    if (selectedSpecialty !== 'all' && case_.specialty !== selectedSpecialty) return false;
    return true;
  });

  const difficulties = ['all', 'beginner', 'intermediate', 'advanced'];
  const specialties = ['all', ...Array.from(new Set(cases.map(c => c.specialty).filter(Boolean)))].filter(Boolean);

  return (
    <ModuleGuard
      availableToRoles={['resident', 'faculty', 'program_director', 'super_admin']}
    >
      <ModuleLayout
        title="Clinical Cases"
        description="Practice with real clinical scenarios and patient cases"
        backHref="/modules/learn"
      >
        {/* Educator Actions */}
        {canCreateContent && (
          <EducatorActions
            createHref="/modules/learn/clinical-cases/create"
            createLabel="Create New Case"
          />
        )}

        {/* Filters */}
        <div className="mb-6 flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-neutral-600" />
            <span className="text-sm font-medium text-neutral-700">Filters:</span>
          </div>
          <select
            value={selectedDifficulty}
            onChange={(e) => setSelectedDifficulty(e.target.value)}
            className="px-4 py-2 rounded-xl border border-white/40 bg-white/30 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
          >
            {difficulties.map(diff => (
              <option key={diff} value={diff}>
                {diff === 'all' ? 'All Difficulties' : diff.charAt(0).toUpperCase() + diff.slice(1)}
              </option>
            ))}
          </select>
          <select
            value={selectedSpecialty}
            onChange={(e) => setSelectedSpecialty(e.target.value)}
            className="px-4 py-2 rounded-xl border border-white/40 bg-white/30 text-neutral-700 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
          >
            {specialties.map(spec => (
              <option key={spec} value={spec}>
                {spec === 'all' ? 'All Specialties' : spec}
              </option>
            ))}
          </select>
        </div>

        {/* Cases Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0EA5E9]"></div>
          </div>
        ) : filteredCases.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm p-12 rounded-2xl shadow-md text-center border border-white/30">
            <p className="text-neutral-500 mb-4">No clinical cases available yet.</p>
            {canCreateContent && (
              <EducatorActions
                createHref="/modules/learn/clinical-cases/create"
                createLabel="Create First Case"
              />
            )}
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCases.map((case_) => (
              <CaseCard key={case_.id} case_={case_} />
            ))}
          </div>
        )}
      </ModuleLayout>
    </ModuleGuard>
  );
}

