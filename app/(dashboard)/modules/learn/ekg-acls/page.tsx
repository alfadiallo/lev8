// EKG & ACLS - Main page

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ModuleLayout from '@/components/modules/ModuleLayout';
import ModuleGuard from '@/components/modules/ModuleGuard';
import EducatorActions from '@/components/modules/EducatorActions';
import { usePermissions } from '@/hooks/usePermissions';
import { ACLSScenario } from '@/lib/types/modules';
import { Activity } from 'lucide-react';

export default function EKGACLSPage() {
  const router = useRouter();
  const { canCreateContent } = usePermissions();
  const [scenarios, setScenarios] = useState<ACLSScenario[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadScenarios();
  }, []);

  const loadScenarios = async () => {
    try {
      // API routes now read auth from cookies automatically
      const response = await fetch('/api/acls/scenarios');

      if (!response.ok) {
        if (response.status === 401) {
          window.location.href = '/login';
          return;
        }
        console.warn('[EKGACLS] API call failed, showing empty state');
        setScenarios([]);
        return;
      }

      const result = await response.json();
      setScenarios(result.scenarios || []);
    } catch (error) {
      console.error('[EKGACLS] Error loading scenarios:', error);
      setScenarios([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModuleGuard
      availableToRoles={['resident', 'faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin']}
    >
      <ModuleLayout
        title="EKG & ACLS"
        description="Advanced cardiac life support training with interactive EKG simulations"
        backHref="/modules/learn"
      >
        {/* Educator Actions */}
        {canCreateContent && (
          <EducatorActions
            createHref="/modules/learn/ekg-acls/create"
            createLabel="Create New Scenario"
          />
        )}

        {/* Scenarios Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0EA5E9]"></div>
          </div>
        ) : scenarios.length === 0 ? (
          <div className="bg-white/90 backdrop-blur-sm p-12 rounded-2xl shadow-md text-center border border-white/30">
            <Activity size={64} className="mx-auto mb-4 text-neutral-400" />
            <p className="text-neutral-500 mb-4">No ACLS scenarios available yet.</p>
            {canCreateContent && (
              <EducatorActions
                createHref="/modules/learn/ekg-acls/create"
                createLabel="Create First Scenario"
              />
            )}
            {/* Default scenario button */}
            <button
              onClick={() => router.push('/modules/learn/ekg-acls/vfvt-click')}
              className="mt-4 bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-6 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
            >
              Try Demo Scenario
            </button>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenarios.map((scenario) => (
              <div
                key={scenario.id}
                onClick={() => router.push(`/modules/learn/ekg-acls/${scenario.id}`)}
                className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/30 hover:scale-[1.02]"
              >
                <div className="flex items-center gap-3 mb-4">
                  <Activity className="text-[#0EA5E9]" size={24} />
                  <h3 className="text-xl font-semibold text-neutral-800">{scenario.title}</h3>
                </div>
                {scenario.description && (
                  <p className="text-neutral-600 text-sm mb-4">{scenario.description}</p>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    router.push(`/modules/learn/ekg-acls/${scenario.id}`);
                  }}
                  className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
                >
                  Start Scenario
                </button>
              </div>
            ))}
            {/* Default demo scenario */}
            <div
              onClick={() => router.push('/modules/learn/ekg-acls/vfvt-click')}
              className="bg-white/90 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 cursor-pointer border border-white/30 hover:scale-[1.02]"
            >
              <div className="flex items-center gap-3 mb-4">
                <Activity className="text-[#0EA5E9]" size={24} />
                <h3 className="text-xl font-semibold text-neutral-800">VF/pVT Demo</h3>
              </div>
              <p className="text-neutral-600 text-sm mb-4">Try the VF/pVT click-advance scenario</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  router.push('/modules/learn/ekg-acls/vfvt-click');
                }}
                className="w-full bg-[#0EA5E9] hover:bg-[#0284C7] text-white px-4 py-2 rounded-xl font-medium hover:shadow-lg transition-all duration-300"
              >
                Start Demo
              </button>
            </div>
          </div>
        )}
      </ModuleLayout>
    </ModuleGuard>
  );
}

