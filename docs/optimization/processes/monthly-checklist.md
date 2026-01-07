# Monthly Health Check Checklist

**Purpose**: Quick health check to ensure platform performance and architecture compliance.

**Time Investment**: 2-4 hours/month

**Frequency**: First Monday of each month

## Pre-Check Setup

- [ ] Ensure latest code is pulled
- [ ] Run `npm install` to ensure dependencies are up to date
- [ ] Verify scripts are executable: `chmod +x scripts/architecture-health/*.ts`

## Automated Checks

### 1. Run Architecture Health Scripts

```bash
npm run audit:all
```

This runs:
- API route audit
- Auth pattern compliance check
- Bundle size analysis
- Server component analysis

**Review**:
- [ ] Check for new unused routes
- [ ] Check for auth pattern violations
- [ ] Verify bundle size is within budgets
- [ ] Review server component conversion candidates

### 2. Review Metrics Dashboard

- [ ] Page load times (should be < 500ms)
- [ ] API response times (should be < 200ms average)
- [ ] Error rates
- [ ] User activity trends

### 3. Quick Code Review

- [ ] Check for new API routes added (should follow patterns)
- [ ] Check for new dependencies added (review necessity)
- [ ] Review recent PRs for architecture compliance

## Manual Checks

### 4. Performance Spot Check

- [ ] Test login flow (should be < 1s)
- [ ] Test dashboard load (should be < 500ms)
- [ ] Test module navigation (should be smooth, no flashing)
- [ ] Check browser console for errors

### 5. Architecture Compliance

- [ ] Verify no new direct Supabase client creation in API routes
- [ ] Verify no new client-side `getSession()` calls (except debug/admin)
- [ ] Check that new routes use `getApiUser()` or `checkApiPermission()`

## Documentation

- [ ] Update monthly report template
- [ ] Document any issues found
- [ ] Create action items for next month if needed

## Report Generation

Generate monthly health report:

```bash
tsx scripts/architecture-health/generate-health-report.ts
```

Save report to: `docs/optimization/monthly-reports/YYYY-MM.md`

## Success Criteria

✅ All automated checks pass  
✅ No new architecture violations  
✅ Performance metrics stable or improving  
✅ Bundle size within budgets  

## Action Items

If issues are found:
1. Create GitHub issues for critical issues
2. Add to next month's agenda if non-critical
3. Update optimization backlog

## Next Steps

- [ ] Schedule next monthly check
- [ ] Share report with team (if applicable)
- [ ] Update metrics dashboard if needed



