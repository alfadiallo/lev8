import { createClient } from '@supabase/supabase-js';
import { SubscriptionData, SubscriptionStatus } from './config';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

// DEV MODE: Set to true to bypass all subscription checks during development
const DEV_BYPASS_SUBSCRIPTIONS = process.env.NEXT_PUBLIC_DEV_BYPASS_SUBSCRIPTIONS === 'true';

/**
 * Get subscription for a user by email
 */
export async function getSubscription(email: string): Promise<SubscriptionData | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data, error } = await supabase
    .from('interview_subscriptions')
    .select('*')
    .eq('user_email', email.toLowerCase())
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    userEmail: data.user_email,
    stripeCustomerId: data.stripe_customer_id,
    stripeSubscriptionId: data.stripe_subscription_id,
    planType: data.plan_type,
    status: data.status,
    trialEndsAt: data.trial_ends_at ? new Date(data.trial_ends_at) : null,
    currentPeriodStart: data.current_period_start ? new Date(data.current_period_start) : null,
    currentPeriodEnd: data.current_period_end ? new Date(data.current_period_end) : null,
    createdAt: new Date(data.created_at),
  };
}

/**
 * Check if a subscription is active (including trial)
 */
export function isSubscriptionActive(subscription: SubscriptionData | null): boolean {
  if (!subscription) return false;
  
  const activeStatuses: SubscriptionStatus[] = ['active', 'trialing'];
  return activeStatuses.includes(subscription.status);
}

/**
 * Get candidate count for a user (for free tier limits)
 */
export async function getCandidateCount(email: string): Promise<number> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Count candidates across all sessions created by this user
  const { data: sessions } = await supabase
    .from('interview_sessions')
    .select('id')
    .eq('creator_email', email.toLowerCase());

  if (!sessions || sessions.length === 0) {
    return 0;
  }

  const sessionIds = sessions.map((s) => s.id);

  const { count } = await supabase
    .from('interview_candidates')
    .select('*', { count: 'exact', head: true })
    .in('session_id', sessionIds);

  return count || 0;
}

/**
 * Check access for a user based on session type
 * @param email User email
 * @param sessionType Type of session (individual or group)
 * @param candidateLimit Max candidates for free individual sessions (default 5)
 */
export async function checkAccess(
  email: string,
  sessionType: 'individual' | 'group',
  candidateLimit: number = 5
): Promise<{
  hasAccess: boolean;
  reason: 'active_subscription' | 'trial' | 'free_tier' | 'limit_reached' | 'subscription_required';
  subscription: SubscriptionData | null;
  candidateCount?: number;
}> {
  // DEV BYPASS: Skip all subscription checks
  if (DEV_BYPASS_SUBSCRIPTIONS) {
    console.log('[checkAccess] DEV MODE: Bypassing subscription checks');
    return {
      hasAccess: true,
      reason: 'active_subscription',
      subscription: null,
    };
  }

  const subscription = await getSubscription(email);

  // Check if user has active subscription
  if (isSubscriptionActive(subscription)) {
    return {
      hasAccess: true,
      reason: subscription?.status === 'trialing' ? 'trial' : 'active_subscription',
      subscription,
    };
  }

  // For individual sessions, check free tier limits
  if (sessionType === 'individual') {
    const candidateCount = await getCandidateCount(email);
    
    if (candidateCount < candidateLimit) {
      return {
        hasAccess: true,
        reason: 'free_tier',
        subscription,
        candidateCount,
      };
    }

    return {
      hasAccess: false,
      reason: 'limit_reached',
      subscription,
      candidateCount,
    };
  }

  // Group sessions require subscription
  return {
    hasAccess: false,
    reason: 'subscription_required',
    subscription,
  };
}

/**
 * Create or update subscription record
 */
export async function upsertSubscription(data: {
  userEmail: string;
  userId?: string;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  planType?: 'monthly' | 'annual';
  status: SubscriptionStatus;
  trialEndsAt?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
}): Promise<SubscriptionData | null> {
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: existing } = await supabase
    .from('interview_subscriptions')
    .select('id')
    .eq('user_email', data.userEmail.toLowerCase())
    .single();

  const subscriptionData = {
    user_email: data.userEmail.toLowerCase(),
    user_id: data.userId || null,
    stripe_customer_id: data.stripeCustomerId || null,
    stripe_subscription_id: data.stripeSubscriptionId || null,
    plan_type: data.planType || null,
    status: data.status,
    trial_ends_at: data.trialEndsAt?.toISOString() || null,
    current_period_start: data.currentPeriodStart?.toISOString() || null,
    current_period_end: data.currentPeriodEnd?.toISOString() || null,
  };

  if (existing) {
    const { data: updated, error } = await supabase
      .from('interview_subscriptions')
      .update(subscriptionData)
      .eq('id', existing.id)
      .select()
      .single();

    if (error) {
      console.error('[upsertSubscription] Update error:', error);
      return null;
    }

    return updated;
  }

  const { data: created, error } = await supabase
    .from('interview_subscriptions')
    .insert(subscriptionData)
    .select()
    .single();

  if (error) {
    console.error('[upsertSubscription] Insert error:', error);
    return null;
  }

  return created;
}
