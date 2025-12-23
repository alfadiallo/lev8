'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

/**
 * Registration is now handled through the access request flow.
 * This page redirects to /request-access.
 */
export default function RegisterPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to the access request page
    router.replace('/request-access');
  }, [router]);

  return (
    <div className="p-8 rounded-2xl shadow-lg glass-panel text-center">
      <Loader2 
        className="w-8 h-8 animate-spin mx-auto mb-4" 
        style={{ color: 'var(--theme-primary)' }} 
      />
      <p style={{ color: 'var(--theme-text-muted)' }}>
        Redirecting to access request...
      </p>
    </div>
  );
}
