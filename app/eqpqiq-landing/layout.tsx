import { ReactNode } from 'react';
import type { Metadata } from 'next';
import EqpqiqLandingLayoutClient from './EqpqiqLandingLayoutClient';

export const metadata: Metadata = {
  title: 'EQ·PQ·IQ | Measure What Matters',
  description:
    'Comprehensive evaluation framework for Emotional, Professional, and Intellectual Quotients. Interview assessment, provider evaluations, and resident analytics.',
  icons: {
    icon: '/interview/icon.svg',
  },
};

interface EqpqiqLandingLayoutProps {
  children: ReactNode;
}

export default function EqpqiqLandingLayout({ children }: EqpqiqLandingLayoutProps) {
  return <EqpqiqLandingLayoutClient>{children}</EqpqiqLandingLayoutClient>;
}
