'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import ModuleGuard from '@/components/modules/ModuleGuard';

// Residents have access only to Learn; Reflect is faculty+
const REFLECT_ALLOWED_ROLES = ['faculty', 'program_director', 'assistant_program_director', 'clerkship_director', 'super_admin', 'admin'] as const;

export default function ReflectLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <ModuleGuard availableToRoles={[...REFLECT_ALLOWED_ROLES]}>
      <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center gap-2 text-sm">
        <Link href="/" className="text-[#7EC8E3] hover:text-[#5BA8C4] transition-colors">
          Dashboard
        </Link>
        <span className="text-neutral-400">/</span>
        <Link href="/modules" className="text-[#7EC8E3] hover:text-[#5BA8C4] transition-colors">
          Modules
        </Link>
        <span className="text-neutral-400">/</span>
        <span className="text-neutral-700 font-medium">Reflect</span>
      </nav>

      {/* Reflect Bucket Header */}
      {pathname === '/modules/reflect' && (
        <div className="bg-white/90 backdrop-blur-sm p-8 rounded-3xl shadow-lg border border-white/20">
          <h1 className="text-4xl font-bold mb-3 bg-gradient-to-r from-[#FFB5A7] to-[#7EC8E3] bg-clip-text text-transparent">🌱 Reflect</h1>
          <p className="text-lg text-neutral-700 mb-6">
            Personal development, reflection, and self-awareness tools to support your growth as a healthcare professional.
          </p>
          
          {/* Module Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              href="/modules/reflect/voice-journal"
              className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-white/30 hover:scale-[1.02]"
            >
              <div className="flex items-start gap-4">
                <span className="text-4xl">🎤</span>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-800">Voice Journal</h3>
                  <p className="text-sm text-neutral-600">
                    Record private clinical reflections. AI-powered transcription and summarization helps you track your learning journey.
                  </p>
                  <p className="text-xs text-[#86C5A8] font-medium mt-2">🔒 100% Private</p>
                </div>
              </div>
            </Link>

            {/* Future modules - coming soon */}
            <div className="bg-white/60 backdrop-blur-sm p-6 rounded-2xl border border-white/20 opacity-75">
              <div className="flex items-start gap-4">
                <span className="text-4xl">📝</span>
                <div>
                  <h3 className="text-xl font-semibold mb-2 text-neutral-700">Difficult Conversations</h3>
                  <p className="text-sm text-neutral-500">
                    Practice navigating challenging patient and team interactions.
                  </p>
                  <p className="text-xs text-neutral-400 font-medium mt-2">Coming Soon</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Notice for Voice Journal */}
      {pathname?.includes('/voice-journal') && (
        <div className="bg-[#D4F1F4]/80 backdrop-blur-sm border border-[#7EC8E3]/30 p-4 rounded-2xl shadow-sm">
          <p className="text-xs text-neutral-700 flex items-center gap-2">
            <svg className="w-4 h-4 text-[#7EC8E3]" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg>
            <strong className="text-neutral-800">Your Privacy is Guaranteed:</strong> Voice Journal entries are encrypted and visible only to you. No one else can access them.
          </p>
        </div>
      )}

      {/* Main Content */}
      <div>{children}</div>
    </div>
    </ModuleGuard>
  );
}

