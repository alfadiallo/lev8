import { ReactNode } from 'react';
import type { Metadata } from 'next';
import ProgressCheckLayoutClient from './ProgressCheckLayoutClient';
import { ProgressCheckUserProvider } from '@/context/ProgressCheckUserContext';

export const metadata: Metadata = {
  title: 'Progress Check - EQ·PQ·IQ',
  description: 'Resident analytics, EQ·PQ·IQ scoring, and progress check meeting management using the EQ·PQ·IQ framework',
  icons: {
    icon: '/interview/icon.svg',
  },
};

interface ProgressCheckLayoutProps {
  children: ReactNode;
}

export default function ProgressCheckLayout({ children }: ProgressCheckLayoutProps) {
  return (
    <ProgressCheckUserProvider>
      <ProgressCheckLayoutClient>{children}</ProgressCheckLayoutClient>
    </ProgressCheckUserProvider>
  );
}
