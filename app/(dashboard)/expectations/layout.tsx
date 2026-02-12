'use client';

import { ReactNode } from 'react';
import ModuleGuard from '@/components/modules/ModuleGuard';

// Expectations is leadership-only (Program Director, APD, Clerkship Director, Admin)
const EXPECTATIONS_ALLOWED_ROLES = ['program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin'] as const;

export default function ExpectationsLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleGuard availableToRoles={[...EXPECTATIONS_ALLOWED_ROLES]} moduleSlug="expectations">
      {children}
    </ModuleGuard>
  );
}
