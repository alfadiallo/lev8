'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { STRIPE_CONFIG } from '@/lib/stripe/config';

interface PricingCardProps {
  name: string;
  price: number;
  interval: string;
  description: string;
  features: string[];
  highlighted?: boolean;
  buttonText: string;
  onSelect: () => void;
  isLoading?: boolean;
  savings?: string;
}

function PricingCard({
  name,
  price,
  interval,
  description,
  features,
  highlighted,
  buttonText,
  onSelect,
  isLoading,
  savings,
}: PricingCardProps) {
  return (
    <div
      className={`relative bg-white dark:bg-slate-800 rounded-xl p-6 shadow-sm border-2 transition-all ${
        highlighted
          ? 'border-blue-500 dark:border-blue-400 scale-105'
          : 'border-slate-200 dark:border-slate-700'
      }`}
    >
      {highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2">
          <span className="bg-blue-600 text-white text-xs font-medium px-3 py-1 rounded-full">
            Most Popular
          </span>
        </div>
      )}

      <div className="text-center mb-6">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-1">
          {name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400">{description}</p>
      </div>

      <div className="text-center mb-6">
        <span className="text-4xl font-bold text-slate-900 dark:text-white">
          ${price}
        </span>
        <span className="text-slate-500 dark:text-slate-400">/{interval}</span>
        {savings && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-1">
            {savings}
          </p>
        )}
      </div>

      <ul className="space-y-3 mb-6">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-2 text-sm">
            <svg
              className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            <span className="text-slate-600 dark:text-slate-400">{feature}</span>
          </li>
        ))}
      </ul>

      <button
        onClick={onSelect}
        disabled={isLoading}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-colors ${
          highlighted
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-900 dark:text-white'
        } disabled:opacity-50`}
      >
        {isLoading ? 'Loading...' : buttonText}
      </button>
    </div>
  );
}

export default function PricingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';

  const [isLoading, setIsLoading] = useState<'monthly' | 'annual' | null>(null);
  const [error, setError] = useState('');
  const [hasProfile, setHasProfile] = useState(false);

  useEffect(() => {
    // Check if user has a profile
    const checkProfile = async () => {
      if (!email) return;

      try {
        const response = await fetch(`/api/interview/register?email=${encodeURIComponent(email)}`);
        const data = await response.json();
        setHasProfile(data.exists);
      } catch {
        console.error('Failed to check profile');
      }
    };

    checkProfile();
  }, [email]);

  const handleSelectPlan = async (planType: 'monthly' | 'annual') => {
    if (!email) {
      router.push('/interview/register?redirect=/interview/pricing');
      return;
    }

    if (!hasProfile) {
      router.push(`/interview/register?email=${encodeURIComponent(email)}&redirect=/interview/pricing`);
      return;
    }

    setIsLoading(planType);
    setError('');

    try {
      const response = await fetch('/api/interview/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          planType,
          successUrl: `${window.location.origin}/interview/success?session_id={CHECKOUT_SESSION_ID}`,
          cancelUrl: `${window.location.origin}/interview/pricing?email=${encodeURIComponent(email)}`,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to start checkout');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setIsLoading(null);
    }
  };

  const monthlyPrice = STRIPE_CONFIG.pricing.monthly.amount;
  const annualPrice = STRIPE_CONFIG.pricing.annual.amount;
  const annualMonthly = Math.round(annualPrice / 12);
  const annualSavings = Math.round(((monthlyPrice * 12 - annualPrice) / (monthlyPrice * 12)) * 100);

  return (
    <div className="max-w-4xl mx-auto">
      <button
        onClick={() => router.push('/interview')}
        className="text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300 mb-6 flex items-center gap-1"
      >
        ← Back to Home
      </button>

      {/* Header */}
      <div className="text-center mb-12">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
          Choose Your Plan
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
          Unlock the full power of EQ·PQ·IQ for your interview process.
          Start with a 14-day free trial.
        </p>
      </div>

      {/* Free Tier Info */}
      <div className="bg-slate-50 dark:bg-slate-800/50 rounded-xl p-6 mb-8 border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-lg flex items-center justify-center">
            <span className="text-2xl">🆓</span>
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              Free Individual Sessions
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Create individual sessions with up to 5 candidates - no payment required.
              Upgrade to unlock group sessions and unlimited candidates.
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Pricing Cards */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        <PricingCard
          name="Monthly"
          price={monthlyPrice}
          interval="month"
          description="Flexible month-to-month"
          features={[
            '14-day free trial',
            'Unlimited candidates',
            'Group sessions with team',
            'Side-by-side review dashboard',
            'Multi-interviewer support',
            'Session sharing & collaboration',
            'Export & reporting',
          ]}
          buttonText="Start Free Trial"
          onSelect={() => handleSelectPlan('monthly')}
          isLoading={isLoading === 'monthly'}
        />

        <PricingCard
          name="Annual"
          price={annualMonthly}
          interval="month"
          description={`Billed annually ($${annualPrice}/year)`}
          features={[
            '14-day free trial',
            'Unlimited candidates',
            'Group sessions with team',
            'Side-by-side review dashboard',
            'Multi-interviewer support',
            'Session sharing & collaboration',
            'Export & reporting',
            'Priority support',
          ]}
          highlighted
          buttonText="Start Free Trial"
          onSelect={() => handleSelectPlan('annual')}
          isLoading={isLoading === 'annual'}
          savings={`Save ${annualSavings}%`}
        />
      </div>

      {/* Trial Info */}
      <div className="text-center text-sm text-slate-500 dark:text-slate-400">
        <p>
          Start your 14-day free trial today. No credit card required to start.
          Cancel anytime.
        </p>
      </div>

      {/* FAQ */}
      <div className="mt-16">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-6 text-center">
          Frequently Asked Questions
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">
              What&apos;s included in the free trial?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Full access to all features for 14 days. Create group sessions, invite team members, and rate unlimited candidates.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">
              Can I switch plans?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Yes! You can switch between monthly and annual plans at any time. Pro-rated credits will apply.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">
              What happens after the trial?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              You&apos;ll be charged for your selected plan. You can cancel anytime before the trial ends to avoid charges.
            </p>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-lg p-5 border border-slate-200 dark:border-slate-700">
            <h3 className="font-medium text-slate-900 dark:text-white mb-2">
              Is my data secure?
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Yes. All data is encrypted and stored securely. We comply with healthcare data privacy standards.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
