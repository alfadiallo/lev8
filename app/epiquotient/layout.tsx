import { ReactNode } from 'react';
import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'EPI·Q — Performance Fingerprint',
  description:
    'Interactive particle wave visualization of physician EQ, PQ, and IQ scores across a cohort. Explore the distribution, hover to identify, click to drill into domain breakdowns.',
  icons: {
    icon: '/interview/icon.svg',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  userScalable: true,
  viewportFit: 'cover',
  themeColor: '#07121D',
};

export default function EpiquotientLayout({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        background: '#07121D',
        color: '#c8e0ee',
        minHeight: '100vh',
        overflow: 'hidden',
        overflowX: 'hidden',
        position: 'relative',
        maxWidth: '100vw',
      }}
    >
      {children}
    </div>
  );
}
