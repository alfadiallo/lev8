# Elevate (lev8) - Data Dictionary

> Comprehensive schema reference for all database tables, columns, user roles, and access patterns.

Last Updated: December 2024

---

## Table of Contents

1. [Core Entity Tables](#core-entity-tables)
2. [Classes & PGY Tracking](#classes--pgy-tracking)
3. [CCC Session Tables](#ccc-session-tables)
4. [KPI Data Tables](#kpi-data-tables)
5. [Anonymization](#anonymization)
6. [User Roles & Access](#user-roles--access)
7. [Views](#views)
8. [Functions](#functions)

---

## Core Entity Tables

### `health_systems`
Institutions/hospitals that contain residency programs.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `name` | VARCHAR(255) | NOT NULL | Institution name |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

### `programs`
Residency training programs within health systems.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `health_system_id` | UUID | FK → health_systems(id) | Parent institution |
| `name` | VARCHAR(255) | NOT NULL | Program name (e.g., "Emergency Medicine Residency") |
| `specialty` | VARCHAR(100) | | Medical specialty |
| `program_length_years` | INT | DEFAULT 3 | Duration of training |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

### `user_profiles`
Base user information for all roles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, FK → auth.users(id) | Matches Supabase auth user |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | User email address |
| `full_name` | VARCHAR(255) | NOT NULL | Display name |
| `role` | VARCHAR(50) | NOT NULL | User role (see [Roles](#user-roles--access)) |
| `institution_id` | UUID | FK → health_systems(id) | User's institution |
| `anon_code` | VARCHAR(10) | UNIQUE | Anonymization code (e.g., "U001") |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### `residents`
Resident-specific data, extends user_profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | FK → user_profiles(id) | Link to user profile |
| `program_id` | UUID | FK → programs(id) | Residency program |
| `class_id` | UUID | FK → classes(id) | Graduating class |
| `medical_school` | VARCHAR(255) | | Medical school attended |
| `specialty` | VARCHAR(100) | | Primary specialty |
| `anon_code` | VARCHAR(10) | UNIQUE | Anonymization code (e.g., "R001") |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

### `faculty`
Faculty member data, extends user_profiles.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `user_id` | UUID | FK → auth.users(id) | Link to auth user |
| `program_id` | UUID | FK → programs(id) | Associated program |
| `full_name` | VARCHAR(255) | NOT NULL | Faculty name |
| `email` | VARCHAR(255) | NOT NULL, UNIQUE | Faculty email |
| `anon_code` | VARCHAR(10) | UNIQUE | Anonymization code (e.g., "F001") |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

---

## Classes & PGY Tracking

### `classes`
Defines graduating classes for PGY level calculation.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `program_id` | UUID | FK → programs(id), NOT NULL | Parent program |
| `graduation_year` | INT | NOT NULL | Year of graduation (e.g., 2026) |
| `name` | VARCHAR(50) | NOT NULL | Display name (e.g., "Class of 2026") |
| `is_active` | BOOLEAN | DEFAULT true | False for graduated classes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Unique Constraint:** `(program_id, graduation_year)`

**PGY Level Calculation:**
```
PGY = program_length - (graduation_year - academic_year - 1)
```

For a 3-year program in academic year 2025-2026:
- Class of 2026 → PGY-3 (graduating)
- Class of 2027 → PGY-2
- Class of 2028 → PGY-1

### `resident_class_changes`
Audit trail for resident class reassignments.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `resident_id` | UUID | FK → residents(id), NOT NULL | Affected resident |
| `from_class_id` | UUID | FK → classes(id) | Previous class (NULL if new) |
| `to_class_id` | UUID | FK → classes(id), NOT NULL | New class |
| `reason` | ENUM | NOT NULL | Change reason |
| `effective_date` | DATE | NOT NULL, DEFAULT CURRENT_DATE | When change takes effect |
| `notes` | TEXT | | Additional details |
| `changed_by` | UUID | FK → auth.users(id) | User who made change |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Reason Values:**
- `remediation` - Academic/clinical performance concerns
- `leave_of_absence` - Medical, personal, or family leave
- `academic_extension` - Extended training period
- `administrative` - Program restructuring
- `other` - Other reason (specify in notes)

---

## CCC Session Tables

### `ccc_sessions`
Clinical Competency Committee meeting sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `program_id` | UUID | FK → programs(id), NOT NULL | Parent program |
| `session_date` | DATE | NOT NULL | Meeting date |
| `academic_year` | VARCHAR(9) | NOT NULL | e.g., "2025-2026" |
| `session_type` | VARCHAR(20) | NOT NULL | "Fall", "Spring", or "Ad-hoc" |
| `title` | VARCHAR(255) | | Optional custom title |
| `pgy_level` | INT | CHECK 1-7 | Target PGY level (NULL = all) |
| `duration_minutes` | INT | DEFAULT 60 | Planned duration |
| `status` | VARCHAR(20) | DEFAULT 'scheduled' | Session status |
| `started_at` | TIMESTAMPTZ | | Actual start time |
| `ended_at` | TIMESTAMPTZ | | Actual end time |
| `created_by` | UUID | FK → auth.users(id), NOT NULL | Creator |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Status Values:**
- `scheduled` - Upcoming session
- `in_progress` - Currently running
- `completed` - Finished
- `cancelled` - Cancelled

### `ccc_session_residents`
Residents assigned to a CCC session.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `session_id` | UUID | FK → ccc_sessions(id), NOT NULL | Parent session |
| `resident_id` | UUID | FK → residents(id), NOT NULL | Resident to discuss |
| `discussion_order` | INT | NOT NULL, DEFAULT 1 | Order in agenda |
| `time_allocated` | INT | DEFAULT 5 | Minutes allocated |
| `time_spent` | INT | | Actual minutes (after discussion) |
| `status` | VARCHAR(20) | DEFAULT 'pending' | Discussion status |
| `started_at` | TIMESTAMPTZ | | Discussion start time |
| `ended_at` | TIMESTAMPTZ | | Discussion end time |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |

**Unique Constraint:** `(session_id, resident_id)`

**Status Values:**
- `pending` - Not yet discussed
- `in_progress` - Currently discussing
- `completed` - Discussion finished
- `skipped` - Skipped for this session

### `ccc_notes`
Real-time collaborative notes during CCC sessions.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `session_id` | UUID | FK → ccc_sessions(id), NOT NULL | Parent session |
| `resident_id` | UUID | FK → residents(id) | Related resident (NULL = session-level) |
| `note_type` | VARCHAR(30) | NOT NULL, DEFAULT 'general' | Note category |
| `note_text` | TEXT | NOT NULL | Note content |
| `is_confidential` | BOOLEAN | DEFAULT false | Restricted access flag |
| `created_by` | UUID | FK → auth.users(id) | Note author |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation timestamp |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update timestamp |

**Note Types:**
- `general` - General observation
- `strength` - Identified strength
- `weakness` - Identified weakness
- `opportunity` - Growth opportunity
- `threat` - Concern/risk
- `action_item` - Required action
- `milestone_note` - Milestone-related note
- `committee_decision` - Formal decision

**Realtime:** Enabled via `supabase_realtime` publication.

### `ccc_note_history`
Version history for edited notes.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK, DEFAULT uuid_generate_v4() | Unique identifier |
| `note_id` | UUID | FK → ccc_notes(id), NOT NULL | Parent note |
| `previous_text` | TEXT | NOT NULL | Text before edit |
| `changed_by` | UUID | FK → auth.users(id) | Editor |
| `changed_at` | TIMESTAMPTZ | DEFAULT NOW() | Edit timestamp |

---

## KPI Data Tables

### `ite_scores`
In-Training Examination results.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `resident_id` | UUID | FK → residents(id), NOT NULL | Tested resident |
| `test_date` | DATE | NOT NULL | Examination date |
| `academic_year` | VARCHAR(9) | NOT NULL | e.g., "2025-2026" |
| `pgy_level` | INT | | PGY level at time of test |
| `raw_score` | INT | | Raw score |
| `scaled_score` | INT | | Scaled score |
| `percentile` | DECIMAL | | National percentile |
| `subscores` | JSONB | | Category subscores |
| `entered_by` | UUID | FK → auth.users(id) | Data entry user |
| `notes` | TEXT | | Additional notes |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Record creation |
| `updated_at` | TIMESTAMPTZ | DEFAULT NOW() | Last update |

### `imported_comments`
Faculty evaluations and comments imported from external systems.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| `id` | UUID | PK | Unique identifier |
| `resident_id` | UUID | FK → residents(id) | Evaluated resident |
| `faculty_id` | UUID | FK → faculty(id) | Evaluating faculty |
| `comment_text` | TEXT | NOT NULL | Evaluation content |
| `evaluation_date` | DATE | | Date of evaluation |
| `rotation` | VARCHAR(100) | | Clinical rotation |
| `category` | VARCHAR(50) | | Evaluation category |
| `created_at` | TIMESTAMPTZ | DEFAULT NOW() | Import timestamp |

---

## Anonymization

### Anonymization Codes

Each person entity has an `anon_code` column for display when anonymization is active:

| Entity | Format | Example |
|--------|--------|---------|
| Residents | R + 3 digits | R001, R002, R050 |
| Faculty | F + 3 digits | F001, F002 |
| User Profiles | U + 3 digits | U001, U002 |

**Auto-assignment:** Triggers automatically assign codes on INSERT.

### Anonymization Toggle

Client-side toggle with 2-hour expiry (for CCC meeting duration):
- Stored in localStorage
- When ON: Display anon_codes instead of names
- Narrative text: Simple name replacement using roster

---

## User Roles & Access

### Role Definitions

| Role | Description | Access Level |
|------|-------------|--------------|
| `system_admin` | Platform administrator | Full access |
| `admin` | Institution administrator | Institution-wide |
| `program_director` | Program leadership | Program-wide + sensitive data |
| `faculty` | Teaching faculty | Evaluations + limited resident data |
| `coordinator` | Program coordinator | Administrative functions |
| `resident` | Trainee | Own data only |

### RLS Policy Summary

| Table | Select | Insert | Update | Delete |
|-------|--------|--------|--------|--------|
| `classes` | All authenticated | PD/Admin | PD/Admin | - |
| `resident_class_changes` | Staff | PD/Admin | - | - |
| `ccc_sessions` | Staff | PD/Admin | PD/Admin | - |
| `ccc_session_residents` | Staff | PD/Admin | PD/Admin | - |
| `ccc_notes` | Staff | Staff | Own/Admin | - |
| `ccc_note_history` | Staff | System | - | - |

**Staff** = program_director, admin, system_admin, faculty, coordinator

---

## Views

### `residents_with_pgy`
Convenience view joining residents with class and profile data, including calculated PGY level.

| Column | Source |
|--------|--------|
| `id` | residents.id |
| `user_id` | residents.user_id |
| `program_id` | residents.program_id |
| `class_id` | residents.class_id |
| `anon_code` | residents.anon_code |
| `medical_school` | residents.medical_school |
| `specialty` | residents.specialty |
| `graduation_year` | classes.graduation_year |
| `class_name` | classes.name |
| `class_is_active` | classes.is_active |
| `current_pgy_level` | Calculated via `calculate_pgy_level()` |
| `full_name` | user_profiles.full_name |
| `email` | user_profiles.email |

---

## Functions

### `calculate_pgy_level(graduation_year, reference_date, program_length)`
Calculates PGY level based on graduation year and reference date.

**Parameters:**
- `p_graduation_year` INT - Graduation year
- `p_reference_date` DATE - Date for calculation (default: CURRENT_DATE)
- `p_program_length` INT - Program length in years (default: 3)

**Returns:** INT (PGY level)

**Example:**
```sql
SELECT calculate_pgy_level(2026, '2026-02-15', 3); -- Returns 3 (PGY-3)
SELECT calculate_pgy_level(2027, '2026-02-15', 3); -- Returns 2 (PGY-2)
```

---

## Migration Files

| File | Description |
|------|-------------|
| `20250130000001_anonymization_codes.sql` | Adds anon_code columns + triggers |
| `20250130000004_classes_table.sql` | Classes table + resident_class_changes |
| `20250130000005_ccc_sessions.sql` | CCC session tables + realtime |

---

## Indexes

Key indexes for query performance:

```sql
-- Classes
idx_classes_program (program_id)
idx_classes_graduation_year (graduation_year)
idx_classes_is_active (is_active)

-- CCC Sessions
idx_ccc_sessions_program (program_id)
idx_ccc_sessions_date (session_date)
idx_ccc_sessions_status (status)

-- CCC Session Residents
idx_ccc_session_residents_session (session_id)
idx_ccc_session_residents_resident (resident_id)
idx_ccc_session_residents_order (session_id, discussion_order)

-- CCC Notes
idx_ccc_notes_session (session_id)
idx_ccc_notes_resident (resident_id)
idx_ccc_notes_type (note_type)

-- Resident Class Changes
idx_class_changes_resident (resident_id)
idx_class_changes_effective_date (effective_date)
```






