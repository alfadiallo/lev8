'use client';

import { ReactNode, useState, useEffect } from 'react';

export default function Home() {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  
  const getTimeBasedGreeting = () => {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= 8 && hour < 12) {
      return "Good morning.";
    } else if (hour >= 12 && hour < 17) {
      return "Good afternoon.";
    } else if (hour >= 17 && hour < 24) {
      return "Good evening.";
    } else if (hour >= 0 && hour < 5) {
      return "Aren't you up late?";
    } else if (hour >= 5 && hour < 8) {
      return "The early bird gets the worm.";
    }
    
    return "Welcome to Elevate!";
  };

  const [currentGreeting, setCurrentGreeting] = useState<string>(getTimeBasedGreeting());

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

  // Update greeting on component mount and every minute
  useEffect(() => {
    setCurrentGreeting(getTimeBasedGreeting());
    
    const interval = setInterval(() => {
      setCurrentGreeting(getTimeBasedGreeting());
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, []);

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
          <h1 className="text-3xl font-bold mb-6">{currentGreeting}</h1>
          
          <div className="grid grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Quick Actions</h2>
              <ul className="space-y-2">
                <li>
                  <a href="/modules/grow/voice-journal" className="text-blue-600 hover:underline">
                    Record Voice Journal
                  </a>
                </li>
                <li>
                  <a href="/settings" className="text-blue-600 hover:underline">
                    Manage Profile
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Action Items</h2>
              <ul className="space-y-2">
                <li>
                  <a href="/modules/learn" className="text-blue-600 hover:underline">
                    Learn
                  </a>
                </li>
                <li>
                  <a href="/modules/grow" className="text-blue-600 hover:underline">
                    Grow
                  </a>
                </li>
                <li>
                  <a href="/modules/understand" className="text-blue-600 hover:underline">
                    Understand
                  </a>
                </li>
              </ul>
            </div>

            <div className="bg-white p-6 rounded-lg shadow">
              <h2 className="text-lg font-semibold mb-2">Resources</h2>
              <p className="text-sm text-slate-600">Documentation and guides coming soon</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
