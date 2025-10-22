'use client';

import { ReactNode, useState } from 'react';

export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const toggleModule = (module: string) => {
    setExpandedModules(prev => {
      const newSet = new Set(prev);
      if (newSet.has(module)) {
        newSet.delete(module);
      } else {
        newSet.add(module);
      }
      return newSet;
    });
  };

  // Temporarily disable auth check for testing
  return (
    <div className="flex h-screen">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 text-white p-6">
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Elevate</h1>
        </div>

        <nav className="space-y-2">
          <a href="/" className="block hover:text-blue-400">
            Dashboard
          </a>
          
          {/* Expandable Modules */}
          <div>
            <button 
              onClick={() => toggleModule('modules')}
              className="flex items-center justify-between w-full text-left hover:text-blue-400"
            >
              <span>Modules</span>
              <span className={`transform transition-transform ${expandedModules.has('modules') ? 'rotate-90' : ''}`}>
                ▶
              </span>
            </button>
            
            {expandedModules.has('modules') && (
              <div className="ml-4 mt-2 space-y-2">
                {/* Learn */}
                <div>
                  <button 
                    onClick={() => toggleModule('learn')}
                    className="flex items-center justify-between w-full text-left text-sm text-slate-300 hover:text-blue-400"
                  >
                    <span>Learn</span>
                    <span className={`transform transition-transform ${expandedModules.has('learn') ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>
                  {expandedModules.has('learn') && (
                    <div className="ml-4 mt-1 space-y-1">
                      <a href="/modules/learn/clinical-cases" className="block text-xs text-slate-400 hover:text-blue-400">Clinical Cases</a>
                      <a href="/modules/learn/difficult-conversations" className="block text-xs text-slate-400 hover:text-blue-400">Difficult Conversations</a>
                      <a href="/modules/learn/ekg-acls" className="block text-xs text-slate-400 hover:text-blue-400">EKG & ACLS</a>
                      <a href="/modules/learn/running-board" className="block text-xs text-slate-400 hover:text-blue-400">Running the Board</a>
                    </div>
                  )}
                </div>

                {/* Grow */}
                <div>
                  <button 
                    onClick={() => toggleModule('grow')}
                    className="flex items-center justify-between w-full text-left text-sm text-slate-300 hover:text-blue-400"
                  >
                    <span>Grow</span>
                    <span className={`transform transition-transform ${expandedModules.has('grow') ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>
                  {expandedModules.has('grow') && (
                    <div className="ml-4 mt-1 space-y-1">
                      <a href="/modules/grow/voice-journal" className="block text-xs text-slate-400 hover:text-blue-400">Voice Journaling</a>
                    </div>
                  )}
                </div>

                {/* Understand */}
                <div>
                  <button 
                    onClick={() => toggleModule('understand')}
                    className="flex items-center justify-between w-full text-left text-sm text-slate-300 hover:text-blue-400"
                  >
                    <span>Understand</span>
                    <span className={`transform transition-transform ${expandedModules.has('understand') ? 'rotate-90' : ''}`}>
                      ▶
                    </span>
                  </button>
                  {expandedModules.has('understand') && (
                    <div className="ml-4 mt-1 space-y-1">
                      <a href="/modules/understand/analytics" className="block text-xs text-slate-400 hover:text-blue-400">Analytics</a>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </nav>

        {/* Settings icon at bottom - fixed positioning */}
        <div className="absolute bottom-6 left-6">
          <a href="/settings" className="flex items-center text-slate-400 hover:text-white">
            <span className="mr-2">⚙️</span>
            <span>Settings</span>
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