'use client';

import { ReactNode } from 'react';
import ModuleGuard from '@/components/modules/ModuleGuard';

// All roles that can access Learn (broadest module)
const LEARN_ALLOWED_ROLES = [
  'resident',
  'faculty',
  'program_director',
  'assistant_program_director',
  'clerkship_director',
  'studio_creator',
  'super_admin',
  'admin',
] as const;

export default function LearnLayout({ children }: { children: ReactNode }) {
  return (
    <ModuleGuard availableToRoles={[...LEARN_ALLOWED_ROLES]} moduleSlug="learn">
      {children}
    </ModuleGuard>
  );
}
