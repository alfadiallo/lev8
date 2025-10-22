'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function Verify2FAPage() {
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
    <div className="bg-white p-8 rounded-lg shadow-lg">
      <h1 className="text-2xl font-bold mb-2">Two-Factor Authentication</h1>
      <p className="text-slate-600 mb-6">Enter the 6-digit code from your authenticator app</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Authentication Code</label>
          <input
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value.replace(/\D/g, '').slice(0, 6))}
            maxLength={6}
            placeholder="000000"
            className="w-full px-4 py-2 text-2xl text-center tracking-widest border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="trustDevice"
            checked={trustDevice}
            onChange={(e) => setTrustDevice(e.target.checked)}
            className="w-4 h-4 rounded border-slate-300"
          />
          <label htmlFor="trustDevice" className="ml-2 text-sm text-slate-600">
            Trust this device for 30 days
          </label>
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || token.length !== 6}
          className="w-full bg-blue-600 text-white py-2 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Verifying...' : 'Verify'}
        </button>
      </form>

      <p className="text-center text-sm text-slate-600 mt-6">
        Don't have an authenticator app?{' '}
        <a href="#" className="text-blue-600 hover:underline">
          Recovery codes (coming soon)
        </a>
      </p>
    </div>
  );
}