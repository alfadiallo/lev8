'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to account settings by default
    router.replace('/settings/account');
  }, [router]);

  return (
    <div className="text-center py-12">
      <p className="text-slate-600">Redirecting to settings...</p>
    </div>
  );
}

