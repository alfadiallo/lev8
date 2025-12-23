'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { usePermissions } from '@/lib/hooks/usePermissions';

export default function AdminLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();
  const { canAccessAdminPortal } = usePermissions();

  useEffect(() => {
    // Only redirect if we're done loading and there's a definitive state
    if (!loading) {
      if (!user) {
        // Not logged in - redirect to login
        router.push('/login?redirect=/admin/dashboard');
      } else if (!canAccessAdminPortal) {
        // Logged in but not admin - redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [loading, user, canAccessAdminPortal, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--theme-background)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-primary)' }} />
      </div>
    );
  }

  // Not logged in or not authorized - show nothing while redirecting
  if (!user || !canAccessAdminPortal) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--theme-background)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-primary)' }} />
      </div>
    );
  }

  return (
    <div className="flex h-screen" style={{ background: 'var(--theme-background)' }}>
      <Sidebar />
      <main className="flex-1 overflow-auto">
        <div className="p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}

