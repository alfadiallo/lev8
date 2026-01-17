import { ReactNode } from 'react';
import type { Metadata } from 'next';
import InterviewLayoutClient from './InterviewLayoutClient';
import { InterviewUserProvider } from '@/context/InterviewUserContext';

export const metadata: Metadata = {
  title: 'EQ·PQ·IQ',
  description: 'Interview Assessment Tool - Evaluate candidates on Emotional, Professional, and Intellectual Quotients',
  icons: {
    icon: '/interview/icon.svg',
  },
};

interface InterviewLayoutProps {
  children: ReactNode;
}

export default function InterviewLayout({ children }: InterviewLayoutProps) {
  return (
    <InterviewUserProvider>
      <InterviewLayoutClient>{children}</InterviewLayoutClient>
    </InterviewUserProvider>
  );
}
