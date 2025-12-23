# Expectations Module - ACGME Compliance Platform

## Overview

The Expectations module is Elevate's ACGME compliance management platform, designed for residency program educators and leadership. It provides tools to track, manage, and demonstrate compliance with ACGME Common Program Requirements.

**Last Updated:** December 2, 2025
**Status:** Phase 1 Complete - Core functionality operational

## Features

### 1. Compliance Dashboard (`/expectations`)
- **Compliance Score**: Overall percentage of compliant requirements
- **Status Summary Cards**: Counts for Compliant, At Risk, Non-Compliant
- **Category Breakdown**: Visual progress bars by requirement category
- **Upcoming Deadlines**: Action items and evidence expirations within 30 days
- **Quick Actions**: Links to browse requirements, manage action items, view site visits

### 2. Requirements Browser (`/expectations/requirements`)
- **Full Catalog**: All 312 ACGME Common Program Requirements
- **Search**: By ID, title, or requirement text
- **Filters**: 
  - Category (Oversight, Personnel, Curriculum, etc.)
  - Risk Level (Critical, High, Medium, Low)
  - Compliance Status (Compliant, At Risk, Non-Compliant, Not Assessed)
- **Expandable Sections**: Grouped by CPR section number
- **Status Badges**: Color-coded compliance indicators
- **Requirement Detail Modal**: Click "View Details" to open modal with:
  - Full requirement text (untruncated)
  - Metadata (category, section, owner, risk level)
  - Editable compliance status dropdown
  - Notes textarea for assessment comments
  - "View Source PDF in Truths" button (opens ACGME CPR document in new tab)
  - Save functionality to persist changes

### 3. Action Items (`/expectations/action-items`)
- **Task Management**: Track remediation tasks for compliance gaps
- **Priority Levels**: Urgent, High, Medium, Low
- **Status Tracking**: Pending, In Progress, Completed, Cancelled
- **Due Date Monitoring**: Overdue and due-soon indicators
- **Assignment**: Track who is responsible for each task

### 4. Site Visits (`/expectations/site-visits`)
- **Visit History**: Track all ACGME site visits
- **Outcome Recording**: Continued Accreditation, Warning, Probation, etc.
- **Citations Tracking**: Link citations to specific requirements
- **Commendations & Areas for Improvement**: Document feedback
- **Report Storage**: Attach official site visit reports

## Database Schema

### Tables

| Table | Purpose |
|-------|---------|
| `acgme_requirements` | Master catalog of all ACGME requirements |
| `acgme_compliance_status` | Program-specific compliance status per requirement |
| `acgme_compliance_evidence` | Supporting documents and evidence |
| `acgme_action_items` | Remediation tasks and deadlines |
| `acgme_compliance_history` | Audit log of status changes |
| `acgme_site_visits` | Site visit records and outcomes |
| `acgme_citations` | Specific citations from site visits |

### Key Fields

**acgme_requirements:**
- `id`: Requirement ID (e.g., "CPR-1.1", "CPR-2.3.a")
- `scope`: UNIVERSAL, EM_SPECIFIC, or FELLOWSHIP
- `section`: CPR section number (1-6)
- `category`: Oversight, Personnel, Curriculum, etc.
- `risk_level`: Critical, High, Medium, Low
- `owner`: DIO, PD, PC, APD, Faculty, Resident

**acgme_compliance_status:**
- `status`: compliant, at_risk, non_compliant, not_assessed, not_applicable
- `assessment_date`: When status was last assessed
- `next_review_date`: When to review again

### Database Functions

```sql
-- Calculate overall compliance percentage
calculate_program_compliance(p_program_id UUID)

-- Get breakdown by category
get_compliance_by_category(p_program_id UUID)

-- Get upcoming deadlines (action items + evidence expirations)
get_upcoming_deadlines(p_program_id UUID, p_days INTEGER)
```

## API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/expectations/dashboard` | GET | Dashboard summary data |
| `/api/expectations/requirements` | GET | All requirements with compliance status |
| `/api/expectations/requirements/[id]` | GET | Single requirement with compliance status |
| `/api/expectations/requirements/[id]` | PATCH | Update compliance status and notes |
| `/api/expectations/action-items` | GET | Action items for program |
| `/api/expectations/site-visits` | GET | Site visit history |

## Setup Instructions

### 1. Apply Database Migration

Run the migration in Supabase SQL Editor:

```bash
# Or copy contents of:
supabase/migrations/20250129000001_acgme_expectations.sql
```

### 2. Import ACGME Requirements

```bash
npx tsx --env-file=.env.local scripts/import-acgme-requirements.ts
```

This imports the 312 requirements from `docs/_guidance/ACGME CPR/v6 - Gemini/coreAnalyzedFiles/ACGME_Unified_Master_Catalog.json`.

### 3. Initialize Compliance Status (Optional)

After import, all requirements will show as "Not Assessed". Program admins can then:
- Manually assess each requirement
- Bulk import existing compliance data
- Use automated compliance checks (future feature)

## Access Control

### Role-Based Access

| Role | Dashboard | Requirements | Action Items | Site Visits |
|------|-----------|--------------|--------------|-------------|
| Super Admin | Full | Full | Full | Full |
| Program Director | Full | Full | Full | Full |
| Associate PD | Full | Full | Full | Full |
| Faculty | View | View | Assigned Only | View |
| Resident | - | - | - | - |

### Row-Level Security

All tables have RLS policies that:
- Restrict access to program-specific data
- Allow program admins full access
- Allow faculty to view their program's data
- Allow users to see only their assigned action items

## UI Components

### Status Badges

| Status | Color | Hex |
|--------|-------|-----|
| Compliant | Green | `#059669` bg: `#D1FAE5` |
| At Risk | Amber | `#D97706` bg: `#FEF3C7` |
| Non-Compliant | Red | `#DC2626` bg: `#FEE2E2` |
| Not Assessed | Gray | `#6B7280` bg: `#F3F4F6` |

### Risk Level Badges

| Level | Color | Hex |
|-------|-------|-----|
| Critical | Red | `#DC2626` bg: `#FEE2E2` |
| High | Orange | `#EA580C` bg: `#FFEDD5` |
| Medium | Amber | `#D97706` bg: `#FEF3C7` |
| Low | Green | `#059669` bg: `#D1FAE5` |

### Priority Badges

Same colors as Risk Level badges.

## File Structure

```
app/(dashboard)/expectations/
├── page.tsx                    # Dashboard
├── requirements/
│   └── page.tsx               # Requirements browser with modal
├── action-items/
│   └── page.tsx               # Action items management
└── site-visits/
    └── page.tsx               # Site visit tracking

app/api/expectations/
├── dashboard/
│   └── route.ts               # Dashboard API
├── requirements/
│   ├── route.ts               # Requirements list API
│   └── [id]/
│       └── route.ts           # Single requirement GET/PATCH
├── action-items/
│   └── route.ts               # Action items API
└── site-visits/
    └── route.ts               # Site visits API

components/expectations/
└── RequirementDetailModal.tsx  # Modal for viewing/editing requirements

lib/types/
└── acgme.ts                   # TypeScript types

supabase/migrations/
└── 20250129000001_acgme_expectations.sql

scripts/
└── import-acgme-requirements.ts
```

## Implementation Status

### Phase 1: Core Platform (COMPLETE)
- [x] Database schema with 7 tables
- [x] RLS policies for role-based access
- [x] Import script for 312 ACGME requirements
- [x] Dashboard with compliance summary
- [x] Requirements browser with search/filter
- [x] Requirement detail modal with status editing
- [x] Link to source PDF in Truths module
- [x] Sidebar navigation integration

### Phase 2: Evidence Management (PLANNED)
- [ ] Upload and attach evidence documents
- [ ] Evidence expiration tracking
- [ ] Automated reminders

### Phase 3: Automated Compliance (PLANNED)
- [ ] Connect to existing Elevate data
- [ ] Auto-detect compliance for certain requirements
- [ ] Integration with MedHub data

### Phase 4: Self-Study Preparation (PLANNED)
- [ ] Generate self-study documents
- [ ] Track milestone completion
- [ ] Export compliance reports

### Phase 5: Analytics (PLANNED)
- [ ] Compliance trends over time
- [ ] Benchmark against other programs
- [ ] Risk prediction

## Troubleshooting

### Requirements Not Loading
1. Check if migration was applied
2. Verify import script ran successfully
3. Check browser console for API errors

### Compliance Status Not Saving
1. Verify user has program admin role
2. Check RLS policies are correctly applied
3. Verify program_id exists in programs table

### Dashboard Shows All Zeros
1. Run the import script first
2. Check if program exists in database
3. Verify database functions were created

## Related Documentation

- `docs/prd.md` - Product requirements
- `docs/ARCHITECTURE.md` - System architecture
- `docs/_guidance/ACGME CPR/` - Source ACGME documents

