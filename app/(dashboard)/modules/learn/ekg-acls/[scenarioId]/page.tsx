// ACLS Scenario Detail Page

'use client';

import { useParams, useRouter } from 'next/navigation';
import ModuleLayout from '@/components/modules/ModuleLayout';
import ModuleGuard from '@/components/modules/ModuleGuard';
import ACLSInterface from '@/components/modules/ekg-acls/ACLSInterface';
import vfvtScenario from '@/lib/sim/scenarios/vfvt-click-advance';
import { Scenario } from '@/lib/sim/state/types';

export default function ACLSScenarioPage() {
  const params = useParams();
  const router = useRouter();
  const scenarioId = params.scenarioId as string;

  // For now, use the hardcoded scenario. Later, fetch from database
  const scenario: Scenario = vfvtScenario;

  return (
    <ModuleGuard availableToRoles={['resident', 'faculty', 'program_director', 'super_admin']}>
      <ModuleLayout
        title={scenario.title}
        description="Interactive ACLS simulation with real-time EKG"
      >
        <ACLSInterface scenario={scenario} />
      </ModuleLayout>
    </ModuleGuard>
  );
}


