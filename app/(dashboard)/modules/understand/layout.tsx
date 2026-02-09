'use client';

import { ReactNode } from 'react';
import ModuleGuard from '@/components/modules/ModuleGuard';

// Residents have access only to Learn; Understand is faculty+
const UNDERSTAND_ALLOWED_ROLES = ['faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin'] as const;

export default function UnderstandLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleGuard availableToRoles={[...UNDERSTAND_ALLOWED_ROLES]}>
      {children}
    </ModuleGuard>
  );
}
