'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';

function Verify2FAContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const userId = searchParams.get('userId');
  const { verify2FA } = useAuth();

  const [token, setToken] = useState('');
  const [trustDevice, setTrustDevice] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await verify2FA(token, trustDevice);
      router.push('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : '2FA verification failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 rounded-2xl shadow-lg glass-panel">
      <h1 
        className="text-2xl font-bold mb-2"
        style={{ color: 'var(--theme-text)' }}
      >
        Two-Factor Authentication
      </h1>
      <p 
        className="mb-6"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        Enter the 6-digit code from your authenticator app
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label 
            className="block text-sm font-medium mb-1.5"
            style={{ color: 'var(--theme-text)' }}
          >
            Authentication Code
          </label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            placeholder="000000"
            className="w-full px-4 py-3 text-2xl text-center tracking-widest rounded-xl transition-all duration-200"
            style={{
              border: '1px solid var(--theme-border-solid)',
              background: 'var(--theme-surface-solid)',
              color: 'var(--theme-text)',
            }}
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="trustDevice"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="w-4 h-4 rounded"
            style={{ 
              borderColor: 'var(--theme-border-solid)',
              accentColor: 'var(--theme-primary)'
            }}
          />
          <label 
            htmlFor="trustDevice" 
            className="ml-2 text-sm"
            style={{ color: 'var(--theme-text-muted)' }}
          >
            Trust this device for 30 days
          </label>
        </div>

        {error && (
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              background: 'rgba(239, 68, 68, 0.1)',
              borderColor: 'var(--theme-error)',
              color: 'var(--theme-error)'
            }}
          >
            {error}
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          size="lg"
          className="w-full"
          disabled={loading || token.length !== 6}
          isLoading={loading}
        >
          {loading ? 'Verifying...' : 'Verify'}
        </Button>
      </form>

      <p 
        className="text-center text-sm mt-6"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        Don&apos;t have an authenticator app?{' '}
        <a 
          href="#" 
          className="transition-colors"
          style={{ color: 'var(--theme-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-primary-dark)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-primary)'}
        >
          Recovery codes (coming soon)
        </a>
      </p>
    </div>
  );
}

export default function Verify2FAPage() {
  return (
    <Suspense fallback={
      <div className="p-8 rounded-2xl shadow-lg glass-panel">
        <div style={{ color: 'var(--theme-text-muted)' }}>Loading...</div>
      </div>
    }>
      <Verify2FAContent />
    </Suspense>
  );
}
