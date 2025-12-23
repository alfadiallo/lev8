'use client';

import { ReactNode } from 'react';

export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div 
      className="min-h-screen flex items-center justify-center"
      style={{ background: 'transparent' }}
    >
      <div className="w-full max-w-md">
        {children}
      </div>
    </div>
  );
}
