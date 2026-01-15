'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

interface SubscriptionStatus {
  hasAccess: boolean;
  reason: 'active_subscription' | 'trial' | 'free_tier' | 'limit_reached' | 'subscription_required';
  subscription: {
    status: string;
    planType: string | null;
    trialEndsAt: string | null;
    currentPeriodEnd: string | null;
  } | null;
  candidateCount?: number;
}

interface SubscriptionGateProps {
  email: string;
  sessionType: 'individual' | 'group';
  children: ReactNode;
  fallback?: ReactNode;
  onAccessDenied?: (reason: SubscriptionStatus['reason']) => void;
}

export default function SubscriptionGate({
  email,
  sessionType,
  children,
  fallback,
  onAccessDenied,
}: SubscriptionGateProps) {
  const router = useRouter();
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!email) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/interview/subscription/check?email=${encodeURIComponent(email)}&sessionType=${sessionType}`
        );
        const data = await response.json();
        setStatus(data);

        if (!data.hasAccess && onAccessDenied) {
          onAccessDenied(data.reason);
        }
      } catch (error) {
        console.error('Failed to check subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [email, sessionType, onAccessDenied]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!email) {
    return (
      <AccessDeniedCard
        title="Sign in Required"
        message="Please enter your email to continue."
        buttonText="Get Started"
        onButtonClick={() => router.push('/interview')}
      />
    );
  }

  if (!status?.hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    const content = getAccessDeniedContent(status?.reason, status?.candidateCount);

    return (
      <AccessDeniedCard
        title={content.title}
        message={content.message}
        buttonText={content.buttonText}
        onButtonClick={() => router.push(content.redirectUrl + `?email=${encodeURIComponent(email)}`)}
        badge={status?.subscription?.status === 'trialing' ? 'Trial Expired' : undefined}
      />
    );
  }

  // User has access - show trial/subscription badge if applicable
  return (
    <div>
      {status.subscription?.status === 'trialing' && status.subscription.trialEndsAt && (
        <TrialBanner
          trialEndsAt={status.subscription.trialEndsAt}
          email={email}
        />
      )}
      {children}
    </div>
  );
}

function getAccessDeniedContent(
  reason: SubscriptionStatus['reason'] | undefined,
  candidateCount?: number
): {
  title: string;
  message: string;
  buttonText: string;
  redirectUrl: string;
} {
  switch (reason) {
    case 'limit_reached':
      return {
        title: 'Candidate Limit Reached',
        message: `You've used ${candidateCount || 5} of 5 free candidates. Upgrade to add unlimited candidates.`,
        buttonText: 'Upgrade Now',
        redirectUrl: '/interview/pricing',
      };
    case 'subscription_required':
      return {
        title: 'Subscription Required',
        message: 'Group sessions require an active subscription. Start your 14-day free trial.',
        buttonText: 'Start Free Trial',
        redirectUrl: '/interview/pricing',
      };
    default:
      return {
        title: 'Access Denied',
        message: 'You need a subscription to access this feature.',
        buttonText: 'View Plans',
        redirectUrl: '/interview/pricing',
      };
  }
}

function AccessDeniedCard({
  title,
  message,
  buttonText,
  onButtonClick,
  badge,
}: {
  title: string;
  message: string;
  buttonText: string;
  onButtonClick: () => void;
  badge?: string;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-xl p-8 shadow-sm border border-slate-200 dark:border-slate-700 text-center max-w-md mx-auto">
      {badge && (
        <span className="inline-block bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium px-2 py-1 rounded mb-4">
          {badge}
        </span>
      )}
      <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
          />
        </svg>
      </div>
      <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2">
        {title}
      </h3>
      <p className="text-slate-600 dark:text-slate-400 mb-6">{message}</p>
      <button
        onClick={onButtonClick}
        className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
      >
        {buttonText}
      </button>
    </div>
  );
}

function TrialBanner({ trialEndsAt, email }: { trialEndsAt: string; email: string }) {
  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(trialEndsAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  );

  if (daysLeft <= 0) return null;

  return (
    <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg p-3 mb-6 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="text-blue-600 dark:text-blue-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
        <span className="text-sm text-blue-700 dark:text-blue-300">
          <strong>{daysLeft} days</strong> left in your free trial
        </span>
      </div>
      <a
        href={`/interview/pricing?email=${encodeURIComponent(email)}`}
        className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
      >
        Upgrade now
      </a>
    </div>
  );
}

// Export a hook for checking subscription status
export function useSubscription(email: string, sessionType: 'individual' | 'group') {
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAccess = async () => {
      if (!email) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `/api/interview/subscription/check?email=${encodeURIComponent(email)}&sessionType=${sessionType}`
        );
        const data = await response.json();
        setStatus(data);
      } catch (error) {
        console.error('Failed to check subscription:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAccess();
  }, [email, sessionType]);

  return { status, isLoading };
}
