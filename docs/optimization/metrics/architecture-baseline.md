# Architecture Baseline Metrics

**Date**: January 2025  
**Baseline Established**: After foundational architecture refactor (Phases 1-4)

## Current State

### API Routes
- **Total Routes**: 77
- **Routes Using New Pattern**: 12 (15.6%)
- **Routes Using Legacy Pattern**: 65 (84.4%)
- **Routes Needing Update**: 65

### Authentication Patterns

**New Pattern Usage** (Using `getServerUser`, `getServerUserWithProfile`, `getApiUser`):
- **Count**: 47 instances across 15 files
- **Files Using New Pattern**:
  - `lib/auth/server.ts` (10)
  - `lib/auth/api.ts` (3)
  - `lib/auth/checkApiPermission.ts` (3)
  - `lib/supabase/server.ts` (3)
  - `app/layout.tsx` (3)
  - `app/(dashboard)/modules/understand/page.tsx` (4)
  - Updated API routes: 9 routes

**Legacy Pattern Usage** (Direct Supabase client creation):
- **Count**: 4 instances in API routes
- **Files**: 
  - `app/api/auth/logout/route.ts` (2) - Acceptable (needs cookie setting)
  - `app/api/running-board/learners/route.ts` (2) - Needs update

**Client-Side Auth Checks** (getSession/onAuthStateChange):
- **Count**: 13 instances
- **Files**:
  - `app/debug/page.tsx` (1) - Acceptable (debug page)
  - `app/debug/ClientDebug.tsx` (1) - Acceptable (debug page)
  - `app/(dashboard)/modules/learn/clinical-cases/[id]/page.tsx` (2) - Review
  - `app/(auth)/update-password/page.tsx` (1) - Review
  - `app/(dashboard)/modules/learn/difficult-conversations/page.tsx` (1) - Review
  - `app/admin/users/page.tsx` (2) - Review
  - `app/admin/requests/page.tsx` (2) - Review
  - `app/(dashboard)/modules/learn/running-board/simulation/[sessionId]/debrief/page.tsx` (2) - Review
  - `app/api/voice-journal/[id]/route.ts` (1) - Review

### Server Components
- **Total Pages**: ~50+ pages
- **Server Components**: 1 (`app/(dashboard)/modules/understand/page.tsx`)
- **Client Components**: ~49+
- **Server Component Ratio**: ~2%

### Bundle Size
- **Next.js Version**: 15.5.9
- **React Version**: 19.1.0
- **Dependencies**: 24 production dependencies
- **Dev Dependencies**: 9

## Performance Targets

### Current Targets (Post-Refactor)
- **Page Load Time**: < 500ms (from 2-3s)
- **Auth Checks per Page**: 1 (from 4-5)
- **Profile Fetches per Page**: 1 (from 3-4)
- **API Response Time**: < 200ms average (from 500ms+)
- **Database Queries**: 60-80% reduction

### Architecture Compliance Targets
- **API Routes Using New Pattern**: 100% (currently 15.6%)
- **Server Component Ratio**: > 60% (currently 2%)
- **Client-Side Auth Checks**: < 5 (currently 13, excluding debug)
- **Direct Supabase Client Creation in API Routes**: 0 (currently 4)

## Next Review Date
- **Monthly Check**: February 2025
- **Quarterly Audit**: April 2025
- **Annual Review**: January 2026

