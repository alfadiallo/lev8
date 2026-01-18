import { ReactNode } from 'react';
import type { Metadata } from 'next';
import PulseCheckLayoutClient from './PulseCheckLayoutClient';
import { PulseCheckUserProvider } from '@/context/PulseCheckUserContext';

export const metadata: Metadata = {
  title: 'Pulse Check',
  description: 'Physician and APC Performance Evaluation using the EQ·PQ·IQ framework',
  icons: {
    icon: '/pulsecheck/icon.svg',
  },
};

interface PulseCheckLayoutProps {
  children: ReactNode;
}

export default function PulseCheckLayout({ children }: PulseCheckLayoutProps) {
  return (
    <PulseCheckUserProvider>
      <PulseCheckLayoutClient>{children}</PulseCheckLayoutClient>
    </PulseCheckUserProvider>
  );
}
