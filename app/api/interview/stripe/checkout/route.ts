import { NextRequest, NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, planType, successUrl, cancelUrl } = body;

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!planType || !['monthly', 'annual'].includes(planType)) {
      return NextResponse.json({ error: 'Invalid plan type' }, { status: 400 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has a subscription
    const { data: existingSubscription } = await supabase
      .from('interview_subscriptions')
      .select('*')
      .eq('user_email', email.toLowerCase())
      .single();

    let stripeCustomerId = existingSubscription?.stripe_customer_id;

    // Create or retrieve Stripe customer
    if (!stripeCustomerId) {
      // Check if email is a lev8 user
      const { data: user } = await supabase
        .from('user_profiles')
        .select('id, full_name')
        .eq('email', email.toLowerCase())
        .single();

      // Create Stripe customer
      const customer = await stripe.customers.create({
        email: email.toLowerCase(),
        name: user?.full_name || undefined,
        metadata: {
          user_id: user?.id || '',
          source: 'eqpqiq',
        },
      });

      stripeCustomerId = customer.id;

      // Create subscription record in pending state
      await supabase.from('interview_subscriptions').upsert({
        user_email: email.toLowerCase(),
        user_id: user?.id || null,
        stripe_customer_id: stripeCustomerId,
        status: 'incomplete',
      }, {
        onConflict: 'user_email',
      });
    }

    // Determine price ID based on plan type
    const priceId = planType === 'monthly' 
      ? STRIPE_CONFIG.monthlyPriceId 
      : STRIPE_CONFIG.annualPriceId;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      subscription_data: {
        trial_period_days: STRIPE_CONFIG.trialDays,
        metadata: {
          plan_type: planType,
          user_email: email.toLowerCase(),
        },
      },
      success_url: successUrl || `${process.env.NEXT_PUBLIC_APP_URL}/interview/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: cancelUrl || `${process.env.NEXT_PUBLIC_APP_URL}/interview/pricing`,
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    });

    return NextResponse.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('[stripe/checkout] Error:', error);
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
