'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send reset email');
      }

      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="p-8 rounded-2xl shadow-lg glass-panel max-w-md w-full text-center">
          <div className="text-5xl mb-4">📧</div>
          <h1 className="text-2xl font-bold mb-4" style={{ color: 'var(--theme-text)' }}>
            Check Your Email
          </h1>
          <p className="mb-6" style={{ color: 'var(--theme-text-muted)' }}>
            If an account exists with <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
          </p>
          <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm font-medium text-yellow-800">
              ⚠️ Don&apos;t see the email?
            </p>
            <p className="text-sm text-yellow-700 mt-1">
              Please check your <strong>Junk</strong> or <strong>Spam</strong> folder.
            </p>
          </div>
          <Link href="/login">
            <Button variant="secondary" className="w-full">
              Back to Login
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
          Reset Password
        </h1>
        <p className="text-center mb-6" style={{ color: 'var(--theme-text-muted)' }}>
          Enter your email and we&apos;ll send you a reset link
        </p>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label 
              htmlFor="email" 
              className="block text-sm font-medium mb-2"
              style={{ color: 'var(--theme-text)' }}
            >
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={loading || !email}
          >
            {loading ? 'Sending...' : 'Send Reset Link'}
          </Button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--theme-text-muted)' }}>
          Remember your password?{' '}
          <Link 
            href="/login" 
            className="font-medium transition-colors"
            style={{ color: 'var(--theme-primary)' }}
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

