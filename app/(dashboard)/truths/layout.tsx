'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ReactNode } from 'react';
import { FileText, Database } from 'lucide-react';

export default function TruthsLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  
  // Scores page has its own full-page layout (like Residents page)
  const isScoresPage = pathname.includes('/truths/scores');
  
  if (isScoresPage) {
    return <>{children}</>;
  }

  const tabs = [
    {
      name: 'Uploads',
      href: '/truths/uploads',
      icon: FileText,
      active: pathname.includes('/truths/uploads')
    },
    {
      name: 'Scores',
      href: '/truths/scores',
      icon: Database,
      active: pathname.includes('/truths/scores')
    }
  ];

  return (
    <div className="min-h-screen bg-neutral-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-neutral-900 mb-2">Truths</h1>
          <p className="text-neutral-600">
            Source of truth for residency data and documents.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-neutral-200 mb-6">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <Link
                key={tab.name}
                href={tab.href}
                className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors relative ${
                  tab.active
                    ? 'text-[#0EA5E9]'
                    : 'text-neutral-500 hover:text-neutral-700'
                }`}
              >
                <Icon size={16} />
                {tab.name}
                {tab.active && (
                  <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#0EA5E9] rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Content */}
        {children}
      </div>
    </div>
  );
}



