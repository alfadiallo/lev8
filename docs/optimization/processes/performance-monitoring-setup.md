# Performance Monitoring Setup Guide

## Overview

This guide explains how to set up and use performance monitoring for the platform.

## Available Tools

### Vercel Analytics (Recommended)

If using Vercel for hosting:
1. Enable Vercel Analytics in project settings
2. Add `@vercel/analytics` package
3. Import and use in `app/layout.tsx`

### Custom Performance Tracking

For custom tracking, add performance marks and measures:

```typescript
// In API routes
performance.mark('api-start');
// ... route logic ...
performance.mark('api-end');
performance.measure('api-duration', 'api-start', 'api-end');
```

### Database Query Monitoring

Monitor Supabase query performance:
- Use Supabase Dashboard > Logs
- Track slow queries
- Monitor RLS policy performance

## Metrics to Track

### Client-Side Metrics

- **Page Load Time**: `window.performance.timing.loadEventEnd - window.performance.timing.navigationStart`
- **Time to Interactive**: Use Lighthouse or Web Vitals
- **First Contentful Paint**: Use Web Vitals
- **Largest Contentful Paint**: Use Web Vitals

### Server-Side Metrics

- **API Response Time**: Track in API routes
- **Database Query Time**: Track in Supabase queries
- **Auth Check Time**: Track in auth utilities

### Architecture Metrics

- **Auth Checks per Request**: Count in middleware/layout
- **Profile Fetches per Request**: Count in auth utilities
- **API Route Count**: Track over time
- **Bundle Size**: Track in builds

## Implementation

### 1. Add Performance Tracking to API Routes

Create a wrapper for API routes:

```typescript
// lib/performance/track-api.ts
export async function trackApiPerformance(
  route: string,
  handler: () => Promise<Response>
): Promise<Response> {
  const start = Date.now();
  try {
    const response = await handler();
    const duration = Date.now() - start;
    console.log(`[API] ${route}: ${duration}ms`);
    return response;
  } catch (error) {
    const duration = Date.now() - start;
    console.error(`[API] ${route}: ${duration}ms (ERROR)`);
    throw error;
  }
}
```

### 2. Add Client-Side Performance Tracking

```typescript
// lib/performance/track-page-load.ts
export function trackPageLoad() {
  if (typeof window !== 'undefined') {
    window.addEventListener('load', () => {
      const perfData = window.performance.timing;
      const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
      console.log(`[Performance] Page load: ${pageLoadTime}ms`);
    });
  }
}
```

### 3. Create Metrics Dashboard

Create a simple dashboard page at `/admin/performance` (admin only) that displays:
- Current metrics
- Trends over time
- Budget compliance
- Architecture health scores

## Monitoring Schedule

- **Real-time**: Error tracking, critical performance issues
- **Daily**: Review error logs, check for anomalies
- **Weekly**: Review performance trends
- **Monthly**: Comprehensive performance review (part of monthly health check)

## Alerts

Set up alerts for:
- API response time > 500ms (p95)
- Page load time > 1s
- Error rate > 1%
- Bundle size increase > 10%

## Next Steps

1. Set up Vercel Analytics (if using Vercel)
2. Add performance tracking to critical API routes
3. Create performance dashboard
4. Set up alerting
5. Establish baseline measurements



