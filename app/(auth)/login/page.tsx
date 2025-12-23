'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    if (searchParams.get('registered') === 'true') {
      setSuccessMessage('Registration successful! Please log in with your credentials.');
    }
    if (searchParams.get('approved') === 'true') {
      setSuccessMessage('Your account has been approved! Please set your password using the link in your email.');
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(email, password);
      // Check for redirect parameter, otherwise go to home
      const redirectTo = searchParams.get('redirect') || '/';
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="p-8 rounded-2xl shadow-lg glass-panel"
    >
      <h1 
        className="text-3xl font-bold mb-2 logo-gradient"
        style={{ textShadow: '0 1px 2px rgba(0,0,0,0.1)' }}
      >
        Elevate
      </h1>
      <p className="mb-6" style={{ color: 'var(--theme-text-muted)' }}>
        Medical Education Portal
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          type="email"
          label="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <Input
          type="password"
          label="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {successMessage && (
          <div 
            className="p-4 rounded-lg border"
            style={{ 
              background: 'rgba(16, 185, 129, 0.1)',
              borderColor: 'var(--theme-success)',
              color: 'var(--theme-success)'
            }}
          >
            {successMessage}
          </div>
        )}

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
          isLoading={loading}
        >
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <p 
        className="text-center text-sm mt-6"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        Don&apos;t have an account?{' '}
        <Link 
          href="/request-access" 
          className="font-medium transition-colors"
          style={{ color: 'var(--theme-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-primary-dark)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-primary)'}
        >
          Request access
        </Link>
      </p>

      <p 
        className="text-center text-sm mt-2"
        style={{ color: 'var(--theme-text-muted)' }}
      >
        <Link 
          href="#" 
          className="transition-colors"
          style={{ color: 'var(--theme-primary)' }}
          onMouseEnter={(e) => e.currentTarget.style.color = 'var(--theme-primary-dark)'}
          onMouseLeave={(e) => e.currentTarget.style.color = 'var(--theme-primary)'}
        >
          Forgot password?
        </Link>
      </p>

      {/* Connection Debug Info */}
      <div 
        className="mt-8 pt-4 border-t text-xs text-center"
        style={{ 
          borderColor: 'var(--theme-border)',
          color: 'var(--theme-text-muted)',
          opacity: 0.6
        }}
      >
        <p>System Status: {loading ? 'Checking...' : 'Ready'}</p>
        <p>Supabase: {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Configured' : 'Missing Config'}</p>
        <p className="mt-2 text-[10px] opacity-50">
          If you cannot log in, <Link href="/reset" className="underline">reset application</Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="p-8 rounded-2xl shadow-lg glass-panel">
        <h1 
          className="text-3xl font-bold mb-2 logo-gradient"
        >
          Elevate
        </h1>
        <p style={{ color: 'var(--theme-text-muted)' }} className="mb-6">
          Medical Education Portal
        </p>
        <div style={{ color: 'var(--theme-text-muted)' }}>Loading...</div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
