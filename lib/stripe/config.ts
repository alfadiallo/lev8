import Stripe from 'stripe';

// Server-side Stripe instance
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-12-15.clover',
  typescript: true,
});

// Environment variables required for Stripe
// Add these to your .env.local file:
// STRIPE_SECRET_KEY=sk_test_...
// NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
// STRIPE_WEBHOOK_SECRET=whsec_...
// STRIPE_MONTHLY_PRICE_ID=price_...
// STRIPE_ANNUAL_PRICE_ID=price_...

export const STRIPE_CONFIG = {
  publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!,
  monthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID!,
  annualPriceId: process.env.STRIPE_ANNUAL_PRICE_ID!,
  trialDays: 14,
  // Pricing display (update these to match your Stripe prices)
  pricing: {
    monthly: {
      amount: 49,
      currency: 'usd',
      interval: 'month' as const,
    },
    annual: {
      amount: 399,
      currency: 'usd',
      interval: 'year' as const,
    },
  },
};

export type SubscriptionStatus = 'trialing' | 'active' | 'past_due' | 'canceled' | 'incomplete';
export type PlanType = 'monthly' | 'annual';

export interface SubscriptionData {
  id: string;
  userId: string | null;
  userEmail: string;
  stripeCustomerId: string | null;
  stripeSubscriptionId: string | null;
  planType: PlanType | null;
  status: SubscriptionStatus;
  trialEndsAt: Date | null;
  currentPeriodStart: Date | null;
  currentPeriodEnd: Date | null;
  createdAt: Date;
}
