'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseClient } from '@/lib/supabase-client';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

function UpdatePasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Check if we have a valid session from the reset link
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabaseClient.auth.getSession();
      if (!session) {
        // No session means the reset link is invalid or expired
        setError('Invalid or expired reset link. Please request a new one.');
      }
    };
    checkSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabaseClient.auth.updateUser({
        password,
      });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-2xl shadow-lg glass-panel max-w-md w-full text-center">
          <div className="text-5xl mb-4">✅</div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
            Password Updated!
          </h1>
          <p className="mb-6" style={{ color: 'var(--theme-text-muted)' }}>
            Your password has been successfully updated. Redirecting to login...
          </p>
          <Link href="/login">
            <Button className="w-full">
              Go to Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="p-8 rounded-2xl shadow-lg glass-panel max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-2" style={{ color: 'var(--theme-text)' }}>
          Set New Password
        </h1>
        <p className="text-center mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          Enter your new password below
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-500">{error}</p>
            {error.includes('expired') && (
              <Link 
                href="/forgot-password" 
                className="text-sm underline mt-2 block"
                style={{ color: 'var(--theme-primary)' }}
              >
                Request a new reset link
              </Link>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="password" 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--theme-text)' }}
            >
              New Password
            </label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoFocus
            />
          </div>

          <div>
            <label 
              htmlFor="confirmPassword" 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--theme-text)' }}
            >
              Confirm Password
            </label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              minLength={8}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !password || !confirmPassword || error.includes('expired')}
          >
            {loading ? 'Updating...' : 'Update Password'}
          </Button>
        </form>
      </div>
    </div>
  );
}

export default function UpdatePasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    }>
      <UpdatePasswordForm />
    </Suspense>
  );
}



