import { NextRequest, NextResponse } from 'next/server';
import { checkAccess } from '@/lib/stripe/subscription';

const FREE_CANDIDATE_LIMIT = 5;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const sessionType = searchParams.get('sessionType') as 'individual' | 'group';

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }

    if (!sessionType || !['individual', 'group'].includes(sessionType)) {
      return NextResponse.json({ error: 'Invalid session type' }, { status: 400 });
    }

    const accessResult = await checkAccess(email, sessionType, FREE_CANDIDATE_LIMIT);

    return NextResponse.json({
      hasAccess: accessResult.hasAccess,
      reason: accessResult.reason,
      subscription: accessResult.subscription ? {
        status: accessResult.subscription.status,
        planType: accessResult.subscription.planType,
        trialEndsAt: accessResult.subscription.trialEndsAt?.toISOString() || null,
        currentPeriodEnd: accessResult.subscription.currentPeriodEnd?.toISOString() || null,
      } : null,
      candidateCount: accessResult.candidateCount,
      limit: FREE_CANDIDATE_LIMIT,
    });
  } catch (error) {
    console.error('[subscription/check] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
