'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailParam = searchParams.get('email') || '';
  const redirectTo = searchParams.get('redirect') || '/interview/pricing';

  const [formData, setFormData] = useState({
    email: emailParam,
    fullName: '',
    institution: '',
    specialty: '',
    title: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [existingUser, setExistingUser] = useState<{
    isLev8User: boolean;
    user: { full_name: string; institution: string; specialty: string; title: string } | null;
  } | null>(null);
  const [error, setError] = useState('');

  // Check if user exists when email changes
  useEffect(() => {
    const checkEmail = async () => {
      if (!formData.email || !formData.email.includes('@')) return;

      setIsCheckingEmail(true);
      try {
        const response = await fetch(`/api/interview/register?email=${encodeURIComponent(formData.email)}`);
        const data = await response.json();

        if (data.exists) {
          setExistingUser({
            isLev8User: data.isLev8User,
            user: data.user,
          });

          // Pre-fill form with existing data
          if (data.user) {
            setFormData((prev) => ({
              ...prev,
              fullName: data.user.full_name || '',
              institution: data.user.institution || '',
              specialty: data.user.specialty || '',
              title: data.user.title || '',
            }));
          }
        } else {
          setExistingUser(null);
        }
      } catch {
        console.error('Failed to check email');
      } finally {
        setIsCheckingEmail(false);
      }
    };

    const debounce = setTimeout(checkEmail, 500);
    return () => clearTimeout(debounce);
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/interview/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.email,
          fullName: formData.fullName,
          institution: formData.institution || null,
          specialty: formData.specialty || null,
          title: formData.title || null,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create profile');
      }

      // Redirect to pricing or intended destination
      router.push(`${redirectTo}?email=${encodeURIComponent(formData.email)}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto">
      <button
        onClick={() => router.push('/interview')}
        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 mb-6 flex items-center gap-1"
      >
        ← Back to Home
      </button>

      <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
          Create Your Profile
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Set up your profile to use the EQ·PQ·IQ interview tool.
        </p>

        {existingUser?.isLev8User && (
          <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-700 dark:text-blue-300">
              This email is already registered with lev8.ai. Your profile information has been loaded.
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Email *
            </label>
            <div className="relative">
              <input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                required
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              {isCheckingEmail && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full" />
                </div>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Full Name *
            </label>
            <input
              id="fullName"
              type="text"
              value={formData.fullName}
              onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
              placeholder="Dr. Jane Smith"
              required
              disabled={existingUser?.isLev8User}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:dark:bg-slate-600"
            />
          </div>

          <div>
            <label htmlFor="institution" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Institution
            </label>
            <input
              id="institution"
              type="text"
              value={formData.institution}
              onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
              placeholder="e.g., Memorial Hospital"
              disabled={existingUser?.isLev8User}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:dark:bg-slate-600"
            />
          </div>

          <div>
            <label htmlFor="specialty" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Specialty
            </label>
            <input
              id="specialty"
              type="text"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="e.g., Emergency Medicine"
              disabled={existingUser?.isLev8User}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:dark:bg-slate-600"
            />
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Title / Role
            </label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Program Director, Faculty"
              disabled={existingUser?.isLev8User}
              className="w-full px-4 py-2 border border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-700 text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-100 disabled:dark:bg-slate-600"
            />
          </div>

          {error && (
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || isCheckingEmail}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg font-medium transition-colors"
          >
            {isLoading ? 'Creating Profile...' : existingUser ? 'Continue' : 'Create Profile'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
          By continuing, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
