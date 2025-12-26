'use client';

import { ReactNode } from 'react';
import { Sidebar } from '@/components/layout/Sidebar';
import { useAuth } from '@/context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useAuth();

  // Trust middleware - if we reach this layout, user is authenticated
  // Only show loading if AuthContext is still initializing (should be rare)
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--theme-background)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-primary)' }} />
      </div>
    );
  }

  // If no user after loading, middleware should have redirected
  // But show loading as fallback (shouldn't happen)
  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center" style={{ background: 'var(--theme-background)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--theme-primary)' }} />
      </div>
    );
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
