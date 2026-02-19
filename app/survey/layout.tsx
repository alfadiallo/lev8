import { ReactNode } from 'react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'EQ·PQ·IQ Survey',
  description: 'Complete your EQ·PQ·IQ evaluation survey',
  icons: {
    icon: '/interview/icon.svg',
  },
};

interface SurveyLayoutProps {
  children: ReactNode;
}

export default function SurveyLayout({ children }: SurveyLayoutProps) {
  return (
    <div className="min-h-screen bg-neutral-50">
      {children}
    </div>
  );
}
