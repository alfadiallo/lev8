# Quarterly Comprehensive Audit Guide

**Purpose**: Deep architecture audit and optimization opportunity identification.

**Time Investment**: 1-2 days/quarter

**Frequency**: First week of each quarter (January, April, July, October)

## Pre-Audit Preparation

- [ ] Review previous quarter's audit report
- [ ] Check outstanding action items from last quarter
- [ ] Gather performance metrics for comparison
- [ ] Review any major changes since last audit

## Phase 1: Comprehensive Route Audit

### 1.1 Run Full API Route Analysis

```bash
npm run audit:routes
```

**Review**:
- [ ] Identify all unused routes
- [ ] Identify duplicate/legacy routes
- [ ] Map routes to modules
- [ ] Identify consolidation opportunities

### 1.2 Analyze Route Usage Patterns

- [ ] Which routes are called most frequently?
- [ ] Which routes have single callers? (server component candidates)
- [ ] Are there routes that could be consolidated?
- [ ] Are there routes that should be server actions instead?

### 1.3 Document Findings

Create route audit report with:
- Complete route inventory
- Usage map
- Duplicate identification
- Consolidation recommendations

## Phase 2: Architecture Pattern Compliance

### 2.1 Run Auth Pattern Check

```bash
npm run audit:auth
```

**Review**:
- [ ] Count violations
- [ ] Categorize violations by severity
- [ ] Identify patterns in violations
- [ ] Create remediation plan

### 2.2 Server Component Analysis

```bash
tsx scripts/architecture-health/check-server-components.ts
```

**Review**:
- [ ] Identify pages that should be server components
- [ ] Prioritize conversions
- [ ] Estimate effort for conversions

### 2.3 Client-Side Pattern Review

- [ ] Review remaining client-side auth checks
- [ ] Identify unnecessary `useEffect` data fetching
- [ ] Check for Bearer token usage (should use cookies)

## Phase 3: Performance Analysis

### 3.1 Bundle Size Analysis

```bash
npm run audit:bundle
```

**Review**:
- [ ] Compare to previous quarter
- [ ] Identify bundle size growth
- [ ] Find largest chunks
- [ ] Identify optimization opportunities

### 3.2 Performance Metrics Review

- [ ] Page load times (compare to baseline)
- [ ] API response times
- [ ] Database query performance
- [ ] Error rates

### 3.3 Performance Budget Compliance

- [ ] Check all budgets are met
- [ ] Identify trends (improving or degrading)
- [ ] Set new budgets if needed

## Phase 4: Database Query Optimization

### 4.1 Query Pattern Analysis

- [ ] Review common query patterns
- [ ] Identify N+1 query problems
- [ ] Check for missing indexes
- [ ] Review RLS policy performance

### 4.2 Profile Fetch Analysis

- [ ] Count profile fetches per request
- [ ] Verify caching is working
- [ ] Identify redundant fetches

## Phase 5: Dependency Review

### 5.1 Dependency Audit

```bash
npm audit
```

- [ ] Check for security vulnerabilities
- [ ] Review dependency updates
- [ ] Identify unused dependencies
- [ ] Check for dependency bloat

### 5.2 Technology Stack Review

- [ ] Review Next.js version (latest stable?)
- [ ] Review React version
- [ ] Review Supabase SDK version
- [ ] Check for deprecated packages

## Phase 6: Documentation Review

### 6.1 Architecture Documentation

- [ ] Verify documentation is up to date
- [ ] Update patterns if needed
- [ ] Document new anti-patterns found
- [ ] Update decision trees

### 6.2 Code Review Checklist

- [ ] Review and update code review checklist
- [ ] Add new patterns to checklist
- [ ] Remove outdated items

## Deliverables

### Quarterly Audit Report

Create comprehensive report including:

1. **Executive Summary**
   - Overall health score
   - Key findings
   - Critical issues

2. **Route Audit Results**
   - Unused routes
   - Consolidation opportunities
   - Migration recommendations

3. **Architecture Compliance**
   - Violation count and trends
   - Pattern compliance rate
   - Remediation priorities

4. **Performance Analysis**
   - Metrics comparison (quarter-over-quarter)
   - Budget compliance
   - Optimization opportunities

5. **Action Items**
   - High priority (this month)
   - Medium priority (next quarter)
   - Low priority (backlog)

### Optimization Backlog

- [ ] Create/update optimization backlog
- [ ] Prioritize items
- [ ] Estimate effort
- [ ] Assign owners (if applicable)

## Success Metrics

### Quantitative
- Route count reduction (if consolidation done)
- Violation count reduction
- Performance improvement (metrics)
- Bundle size reduction

### Qualitative
- Architecture patterns consistently followed
- Technical debt not accumulating
- Platform performance stable or improving

## Next Steps

1. **Immediate** (This Week):
   - Address critical issues
   - Create GitHub issues for high-priority items

2. **Short-term** (This Month):
   - Execute high-priority optimizations
   - Update documentation

3. **Medium-term** (Next Quarter):
   - Plan medium-priority optimizations
   - Schedule refactoring work

4. **Long-term** (This Year):
   - Track progress on annual goals
   - Update optimization process if needed

## Report Template

Save report to: `docs/optimization/quarterly-reports/YYYY-QX.md`

Use the following structure:
- Executive Summary
- Route Audit Results
- Architecture Compliance
- Performance Analysis
- Database Optimization
- Dependency Review
- Action Items & Priorities
- Next Quarter Goals

