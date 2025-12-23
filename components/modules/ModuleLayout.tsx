// Consistent layout wrapper for all modules

'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface ModuleLayoutProps {
  children: ReactNode;
  title: string;
  description?: string;
  backHref?: string;
}

export default function ModuleLayout({ children, title, description, backHref = '/' }: ModuleLayoutProps) {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href={backHref}
          className="text-[#7EC8E3] hover:text-[#5BA8C4] transition-colors flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-white/50"
        >
          <ArrowLeft size={18} />
          <span>Back</span>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[#0EA5E9] to-[#4A90A8] bg-clip-text text-transparent" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}>
            {title}
          </h1>
          {description && (
            <p className="text-neutral-600 mt-2">{description}</p>
          )}
        </div>
      </div>

      {/* Content */}
      <div>{children}</div>
    </div>
  );
}

