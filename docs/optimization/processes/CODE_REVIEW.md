# Code Review Checklist - Architecture Compliance

This checklist should be used for PRs that touch authentication, data fetching, or API routes.

## Authentication Patterns

### API Routes
- [ ] Uses `getApiUser()` or `checkApiPermission()` for auth (not direct `supabase.auth.getUser()`)
- [ ] Uses `getServerSupabaseClient()` or `getServiceSupabaseClient()` (not direct client creation)
- [ ] No redundant profile fetches (uses cached `getApiUser()` result)

### Server Components
- [ ] Uses `getServerUser()` or `getServerUserWithProfile()` for auth
- [ ] No client-side hooks (`useAuth`, `useRouter` in server components)
- [ ] Data fetched server-side, passed as props to client components

### Client Components
- [ ] Minimizes `getSession()` calls (prefers server-provided data)
- [ ] No Bearer token usage (uses cookie-based auth)
- [ ] Trusts AuthContext state (doesn't re-verify auth)

## Data Fetching Patterns

### Server Components
- [ ] Fetches data in server component
- [ ] Passes data as props to client components
- [ ] Uses request-level caching where appropriate

### Client Components
- [ ] Minimizes `useEffect` data fetching
- [ ] Uses API routes (not direct Supabase client)
- [ ] Handles loading and error states

## API Route Patterns

- [ ] Uses shared auth helpers (`getApiUser`, `checkApiPermission`)
- [ ] Uses shared Supabase client helpers
- [ ] Consistent error handling
- [ ] Proper HTTP status codes
- [ ] No redundant auth checks

## Performance Impact

- [ ] No new auth checks added (should be 1 per request)
- [ ] No new profile fetches added (should be 1 per request, cached)
- [ ] Bundle size impact assessed
- [ ] No unnecessary dependencies added

## Documentation

- [ ] New patterns documented (if introducing new pattern)
- [ ] Code comments explain non-obvious decisions
- [ ] API route documented (what it does, who can use it)

## Testing

- [ ] Auth flow tested (login, logout, protected routes)
- [ ] API route tested (success and error cases)
- [ ] Performance tested (no regressions)

## Questions to Ask

1. Could this be a server component instead?
2. Is this data fetching necessary? (could it be server-side?)
3. Are we following established patterns?
4. Will this add technical debt?

## Red Flags

🚩 Direct Supabase client creation in API routes  
🚩 Client-side `getSession()` in non-debug pages  
🚩 Multiple auth checks in same request  
🚩 Profile fetches outside of utilities  
🚩 Bearer token usage (should use cookies)  

## Approval Criteria

✅ All checklist items pass  
✅ No architecture violations  
✅ Performance impact acceptable  
✅ Documentation updated  
✅ Tests pass  

