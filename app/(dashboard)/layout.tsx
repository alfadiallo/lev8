'use client';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { ReactNode } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const { user, loading } = useRequireAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null; // useRequireAuth will redirect to login
  }

  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Elevate</h1>
        </div>

        <nav className="space-y-4">
          <a href="/dashboard" className="block hover:text-blue-400">
            Dashboard
          </a>
          <a href="/modules" className="block hover:text-blue-400">
            Modules
          </a>
          <a href="/settings" className="block hover:text-blue-400">
            Settings
          </a>
        </nav>

        {/* Settings icon at bottom */}
        <div className="absolute bottom-6 left-6">
          <a href="/settings" className="text-slate-400 hover:text-white">
            ⚙️ Settings
          </a>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-slate-50">
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}