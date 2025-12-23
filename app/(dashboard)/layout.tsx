'use client';

import { ReactNode, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only redirect if we're done loading and there's no user
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Show loading while checking auth
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--theme-background)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-primary)' }} />
      </div>
    );
  }

  // Don't render anything while redirecting
  if (!user) {
    return null;
  }

  return (
    <div className="flex h-screen min-h-screen" style={{ margin: 0, padding: 0 }}>
      <Sidebar />
      
      {/* Main content */}
      <main 
        className="flex-1 overflow-auto"
        style={{ background: 'transparent' }}
      >
        <div className="p-8 min-h-full">
          {children}
        </div>
      </main>
    </div>
  );
}
