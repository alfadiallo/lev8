'use client';

import { ReactNode } from 'react';

export default function GrowLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <nav className="mb-6 border-b pb-4">
        <a href="/modules/grow/voice-journal" className="text-blue-600 hover:underline">
          ← Back to Grow
        </a>
      </nav>
      {children}
    </div>
  );
}