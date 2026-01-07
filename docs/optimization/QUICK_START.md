# Quick Start Guide - Platform Optimization

## Running Health Checks

### All Checks
```bash
npm run audit:all
```

### Individual Checks
```bash
npm run audit:routes    # API route usage audit
npm run audit:auth      # Auth pattern compliance
npm run audit:bundle    # Bundle size analysis
```

### Generate Combined Report
```bash
tsx scripts/architecture-health/generate-health-report.ts
```

## Review Schedule

- **Monthly**: First Monday of each month (2-4 hours)
- **Quarterly**: First week of each quarter (1-2 days)
- **Annual**: January of each year (3-5 days)

## Key Metrics to Monitor

- **API Routes**: Currently 77 (target: reduce by 20-30%)
- **Auth Pattern Compliance**: Track violations
- **Bundle Size**: Should stay within budgets
- **Server Component Ratio**: Currently 2% (target: > 60%)

## Reports Location

- Monthly: `docs/optimization/monthly-reports/YYYY-MM.md`
- Quarterly: `docs/optimization/quarterly-reports/YYYY-QX.md`
- Annual: `docs/optimization/annual-reports/YYYY.md`

## CI/CD

Health checks run automatically on:
- Every pull request
- Every push to main
- Manual trigger (workflow_dispatch)

## Pre-Commit Hooks

Architecture violations are detected before commit. Install husky:
```bash
npx husky install
```

## Documentation

- Main docs: `docs/optimization/README.md`
- Monthly guide: `docs/optimization/processes/monthly-checklist.md`
- Quarterly guide: `docs/optimization/processes/quarterly-audit-guide.md`
- Annual guide: `docs/optimization/processes/annual-review-guide.md`



