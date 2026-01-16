import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseInstance = SupabaseClient<any, any, any>;

// Disable body parsing for webhook verification
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature');

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error('[stripe/webhook] Signature verification failed:', err);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(supabase, session);
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(supabase, subscription);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCanceled(supabase, subscription);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaid(supabase, invoice);
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        await handlePaymentFailed(supabase, invoice);
        break;
      }

      default:
        console.log(`[stripe/webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[stripe/webhook] Error processing event:', error);
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 });
  }
}

async function handleCheckoutCompleted(
  supabase: SupabaseInstance,
  session: Stripe.Checkout.Session
) {
  console.log('[stripe/webhook] Checkout completed:', session.id);

  if (session.mode !== 'subscription' || !session.subscription) {
    return;
  }

  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string;

  // Get customer email
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const email = customer.email?.toLowerCase();
  if (!email) return;

  // Get subscription details
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);

  // Update subscription record
  await supabase
    .from('interview_subscriptions')
    .upsert({
      user_email: email,
      stripe_customer_id: customerId,
      stripe_subscription_id: subscriptionId,
      plan_type: subscription.metadata.plan_type || 'monthly',
      status: mapStripeStatus(subscription.status),
      trial_ends_at: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    }, {
      onConflict: 'user_email',
    });
}

async function handleSubscriptionUpdate(
  supabase: SupabaseInstance,
  subscription: Stripe.Subscription
) {
  console.log('[stripe/webhook] Subscription updated:', subscription.id);

  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const email = customer.email?.toLowerCase();
  if (!email) return;

  await supabase
    .from('interview_subscriptions')
    .update({
      status: mapStripeStatus(subscription.status),
      plan_type: subscription.metadata.plan_type || undefined,
      trial_ends_at: subscription.trial_end 
        ? new Date(subscription.trial_end * 1000).toISOString() 
        : null,
      current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
      current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleSubscriptionCanceled(
  supabase: SupabaseInstance,
  subscription: Stripe.Subscription
) {
  console.log('[stripe/webhook] Subscription canceled:', subscription.id);

  await supabase
    .from('interview_subscriptions')
    .update({
      status: 'canceled',
      canceled_at: new Date().toISOString(),
    })
    .eq('stripe_subscription_id', subscription.id);
}

async function handleInvoicePaid(
  supabase: SupabaseInstance,
  invoice: Stripe.Invoice
) {
  console.log('[stripe/webhook] Invoice paid:', invoice.id);

  if (!invoice.subscription) return;

  // Get subscription record
  const { data: subscription } = await supabase
    .from('interview_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (!subscription) return;

  // Record payment
  await supabase.from('interview_payment_history').insert({
    subscription_id: subscription.id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent as string | null,
    amount_paid: invoice.amount_paid,
    currency: invoice.currency,
    status: 'succeeded',
    paid_at: invoice.status_transitions?.paid_at 
      ? new Date(invoice.status_transitions.paid_at * 1000).toISOString()
      : new Date().toISOString(),
  });
}

async function handlePaymentFailed(
  supabase: SupabaseInstance,
  invoice: Stripe.Invoice
) {
  console.log('[stripe/webhook] Payment failed:', invoice.id);

  if (!invoice.subscription) return;

  // Update subscription status to past_due
  await supabase
    .from('interview_subscriptions')
    .update({ status: 'past_due' })
    .eq('stripe_subscription_id', invoice.subscription as string);

  // Get subscription record
  const { data: subscription } = await supabase
    .from('interview_subscriptions')
    .select('id')
    .eq('stripe_subscription_id', invoice.subscription as string)
    .single();

  if (!subscription) return;

  // Record failed payment
  await supabase.from('interview_payment_history').insert({
    subscription_id: subscription.id,
    stripe_invoice_id: invoice.id,
    stripe_payment_intent_id: invoice.payment_intent as string | null,
    amount_paid: 0,
    currency: invoice.currency,
    status: 'failed',
  });
}

function mapStripeStatus(status: Stripe.Subscription.Status): string {
  switch (status) {
    case 'active':
      return 'active';
    case 'trialing':
      return 'trialing';
    case 'past_due':
      return 'past_due';
    case 'canceled':
    case 'unpaid':
      return 'canceled';
    default:
      return 'incomplete';
  }
}
