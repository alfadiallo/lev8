'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';

export default function GrowLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm">
        <a href="/" className="text-blue-600 hover:underline">
          Dashboard
        </a>
        <span className="text-slate-400">/</span>
        <a href="/modules" className="text-blue-600 hover:underline">
          Modules
        </a>
        <span className="text-slate-400">/</span>
        <span className="text-slate-700 font-medium">Grow</span>
      </nav>

      {/* Grow Bucket Header */}
      {pathname === '/modules/grow' && (
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-8 rounded-lg border border-green-200">
          <h1 className="text-4xl font-bold mb-3">🌱 Grow</h1>
          <p className="text-lg text-slate-700 mb-6">
            Personal development, reflection, and self-awareness tools to support your growth as a healthcare professional.
          </p>
          
          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <a
              href="/modules/grow/voice-journal"
              className="bg-white p-6 rounded-lg shadow hover:shadow-lg transition-shadow border border-slate-200"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">🎤</span>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Voice Journal</h3>
                  <p className="text-sm text-slate-600">
                    Record private clinical reflections. AI-powered transcription and summarization helps you track your learning journey.
                  </p>
                  <p className="text-xs text-green-600 font-medium mt-2">🔒 100% Private</p>
                </div>
              </div>
            </a>

            {/* Future modules - coming soon */}
            <div className="bg-slate-50 p-6 rounded-lg border border-slate-200 opacity-60">
              <div className="flex items-start gap-4">
                <span className="text-4xl">📝</span>
                <div>
                  <h3 className="text-xl font-semibold mb-2">Difficult Conversations</h3>
                  <p className="text-sm text-slate-600">
                    Practice navigating challenging patient and team interactions.
                  </p>
                  <p className="text-xs text-slate-400 font-medium mt-2">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice for Voice Journal */}
      {pathname?.includes('/voice-journal') && (
        <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
          <p className="text-xs text-green-800 flex items-center gap-2">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <strong>Your Privacy is Guaranteed:</strong> Voice Journal entries are encrypted and visible only to you. No one else can access them.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div>{children}</div>
    </div>
  );
}