# Privacy Framework Implementation Analysis
**Date:** October 22, 2025  
**For:** Lev8 Healthcare Platform  
**Analyst:** Claude (via Cursor)

**Last Updated:** January 23, 2025

---

## ✅ IMPLEMENTED: AI Anonymization for Analytics (January 2025)

### Overview

**Status:** PRODUCTION - Fully Operational

A comprehensive anonymization protocol has been implemented to protect resident privacy when sending evaluation data to external AI APIs (Anthropic Claude) for SWOT analysis.

### Implementation Details

#### 1. Anonymization Library
**File:** `lib/ai/anonymizer.ts`

**Features Implemented:**
- ✅ Name pseudonymization ("Resident A", "Resident B", etc.)
- ✅ Date generalization (specific dates → relative periods)
- ✅ PHI scrubbing (MRNs, SSNs, patient names, etc.)
- ✅ PII detection checks
- ✅ Session-based mapping (no persistent storage)

#### 2. SWOT Prompt Updates
**File:** `lib/ai/swot-prompt.ts`

**Changes:**
- ✅ Added `residentPseudonym` parameter to `PromptContext` interface
- ✅ Prompt uses pseudonym instead of real name when provided
- ✅ Privacy notice added to prompt: "This data has been anonymized for privacy protection"

#### 3. Analysis Scripts
**Files:** 
- `scripts/analyze-larissa-comments.ts` (single resident)
- `scripts/analyze-all-residents.ts` (production batch)

**Features:**
- ✅ Full anonymization before Claude API calls
- ✅ PII verification checks
- ✅ Audit trail logging
- ✅ Session cleanup after analysis

#### 4. Claude API Client
**File:** `lib/ai/claude-analyzer.ts`

**Security Added:**
- ✅ Pre-flight PII detection check
- ✅ API call aborted if PII detected
- ✅ Error logging with prompt preview
- ✅ No data sent to external API if check fails

#### 5. Audit Trail
**Migration:** `supabase/migrations/20250123000001_anonymization_audit.sql`

**Table:** `ai_anonymization_log`

**Tracks:**
- ✅ Resident ID (internal, not sent to API)
- ✅ Pseudonym used
- ✅ Period analyzed
- ✅ Number of comments sent
- ✅ API provider and model
- ✅ Privacy flags (data_sanitized, phi_scrubbed, names_anonymized, dates_generalized)
- ✅ Timestamp of analysis

### Privacy Guarantees

1. **No Real Names Sent to External APIs** ✓
   - All resident names replaced with pseudonyms before API calls
   
2. **No Specific Dates Sent** ✓
   - Dates generalized to relative periods
   
3. **PHI Automatically Scrubbed** ✓
   - Pattern matching removes patient identifiers, MRNs, SSNs, etc.
   
4. **Complete Audit Trail** ✓
   - Every API call logged for compliance
   
5. **Verification Before Sending** ✓
   - PII detection check aborts API call if any PII detected

### Compliance Status

**HIPAA Considerations:**
- ✅ Data anonymized before leaving system
- ✅ No PHI sent to external APIs
- ✅ Audit trail for compliance documentation
- ⚠️  Recommend BAA with Anthropic for production

**Anthropic Data Handling:**
- ✅ Commercial API data not used for training (per 2024 policy)
- ✅ SOC 2 Type II certified
- ⚠️  30-day data retention (consider ZDR for enterprise)

### Documentation

Full anonymization protocol documented in:
- `docs/ANALYTICS.md` - Section: "Data Privacy & Anonymization"
- `lib/ai/anonymizer.ts` - Implementation code with comments
- `supabase/migrations/20250123000001_anonymization_audit.sql` - Audit table schema

---

## Executive Summary

**Complexity Rating: MEDIUM-HIGH (7/10)**

Implementing the proposed **dual-email privacy matrix** is **feasible but non-trivial**. The good news: your Supabase architecture is well-suited for this. The challenge: significant refactoring of registration flow, settings UI, and analytics queries.

**Key Innovation: Dual-Email Privacy Matrix**
Users register with personal email, optionally add institutional email, then control data sharing via a sophisticated matrix:

| Data Field | Personal Network | Institutional Program |
|------------|------------------|----------------------|
| Learning Interests | 🔘 Toggle | 🔘 Toggle |
| Experience Level | 🔘 Toggle | 🔘 Toggle |
| Previous Outcomes | 🔘 Toggle | 🔘 Toggle |
| Engagement Visibility | 🔘 Toggle | 🔘 Toggle |
| Profile Discoverability | 🔘 Toggle | 🔘 Toggle |

**Why This Approach is Brilliant:**
- **Clear Context:** Users understand WHO sees their data (peers vs. program)
- **Granular Control:** Can say "Yes to peers, No to program" or vice versa
- **Institutional Trust:** Program directors can verify users via institutional email
- **Personal Privacy:** Personal network sharing independent of institutional oversight
- **Compliance Ready:** Separate consent tracking for each context

**Estimated Effort:**
- Database changes: **3-4 hours**
- Backend API updates: **6-8 hours**
- Frontend UI refactoring: **8-10 hours**
- Testing & RLS policies: **4-5 hours**
- **Total: 21-27 hours** (3-4 full work days)

---

## Current State Analysis

### What You Have Now

#### Database Schema (user_profiles)
```sql
id UUID PRIMARY KEY (from Supabase Auth)
email VARCHAR NOT NULL UNIQUE
full_name VARCHAR
display_name VARCHAR
phone VARCHAR
role VARCHAR NOT NULL
is_active BOOLEAN
created_at TIMESTAMP
```

#### Database Schema (residents)
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL UNIQUE (FK → user_profiles)
program_id UUID NOT NULL (FK → programs)
class_id UUID (FK → academic_classes)
medical_school TEXT
specialty TEXT
created_at TIMESTAMPTZ
updated_at TIMESTAMPTZ
```

#### Registration Flow (Current)
**All collected upfront at signup:**
- Tier 1: email, password, phone
- Tier 2: firstName, lastName (becomes full_name, display_name)
- Tier 3: medicalSchool, specialty, residencyProgram, institution

**Problem:** Everything is required during registration. No user choice. No granular control.

#### Privacy Controls (Current)
- ❌ No sharing preferences table
- ❌ No opt-in/opt-out toggles
- ❌ No consent tracking
- ✅ Voice Journal has `is_private` flag (binary privacy)
- ✅ Row-Level Security (RLS) on `grow_voice_journal`

---

## Proposed Framework → Lev8 Mapping

### Tier 1: Authentication & Communication (Enhanced) ✅
**Current Implementation:** Needs enhancement for dual-email system
- **Primary Email** → Supabase Auth + `user_profiles.email` (personal email)
- **Institutional Email** → `user_profiles.institutional_email` (NEW - optional)
- Phone → `user_profiles.phone` (for 2FA)
- Password → Supabase Auth (hashed)
- Account status → `user_profiles.is_active`

**Action Required:** Add institutional email field to registration and profile

---

### Tier 2: Personalization (Minor Changes) ⚠️

**Current State:**
- `full_name` and `display_name` stored in `user_profiles`
- No timezone or language preferences
- No communication preferences

**Proposed:**
- Display name ✅ (already exists)
- Timezone ❌ (missing)
- Language preference ❌ (missing)
- Communication preferences ❌ (missing)

**Action Required:**
Add optional columns to `user_profiles`:
```sql
ALTER TABLE user_profiles ADD COLUMN timezone VARCHAR DEFAULT 'America/New_York';
ALTER TABLE user_profiles ADD COLUMN language VARCHAR DEFAULT 'en';
ALTER TABLE user_profiles ADD COLUMN communication_preferences JSONB DEFAULT '{"email_notifications": true, "push_notifications": false}';
```

**Complexity:** LOW (30 minutes)

---

### Tier 3: Contextual Role Data (Moderate Changes) ⚠️⚠️

**Current State:**
- Institution, program, cohort/class collected **at signup**
- Stored in `residents` table (required for residents)
- No consent tracking

**Problem:**
Right now, you force residents to provide:
- `program_id` (institution)
- `class_id` (cohort/year)
- `medical_school`
- `specialty`

**Proposed:**
- Make these **optional** at signup
- Ask for consent explicitly: "Your program needs this to provide institutional features"
- Store consent timestamp

**Action Required:**

1. **Database Changes:**
```sql
-- Make program_id nullable (currently NOT NULL)
ALTER TABLE residents ALTER COLUMN program_id DROP NOT NULL;

-- Add consent tracking
ALTER TABLE residents ADD COLUMN institutional_data_consent_at TIMESTAMPTZ;
ALTER TABLE residents ADD COLUMN institutional_data_consent_version VARCHAR; -- e.g., "v1.0"
```

2. **Registration Flow Changes:**
- Allow signup **without** medicalSchool/specialty/program
- Create "Complete Your Profile" step after first login
- Show consent language: "Share with your program? Yes/No"

3. **API Changes:**
- `/api/auth/register` → make `program_id`, `medical_school`, `specialty` optional
- New endpoint: `/api/users/me/institutional-consent` (POST)

**Complexity:** MEDIUM (3-4 hours)

---

### Tier 4: Dual-Email Sharing Matrix (Major Changes) 🚨

**Current State:**
- ❌ No sharing preferences table
- ❌ No toggle UI
- ❌ No analytics that filter by consent
- ❌ No institutional email field

**This is the BIG change.** You need a sophisticated dual-email consent matrix.

**New Concept: Dual-Email Privacy Matrix**
Users register with personal email, optionally add institutional email, then control sharing via a matrix:

| Data Field | Personal Email Sharing | Institutional Email Sharing |
|------------|------------------------|----------------------------|
| Learning Interests | 🔘 Toggle | 🔘 Toggle |
| Experience Level | 🔘 Toggle | 🔘 Toggle |
| Previous Outcomes | 🔘 Toggle | 🔘 Toggle |
| Engagement Visibility | 🔘 Toggle | 🔘 Toggle |
| Profile Discoverability | 🔘 Toggle | 🔘 Toggle |

**Why This Makes Sense:**
- **Personal Email:** Share with peers, mentors, personal learning network
- **Institutional Email:** Share with program directors, faculty, institutional analytics
- **Granular Control:** Users can say "Yes to peers, No to program" or vice versa
- **Clear Intent:** Each toggle has clear context about WHO sees the data

---

## Enhanced Database Schema

### 1. Update `user_profiles` Table
```sql
-- Add institutional email field
ALTER TABLE user_profiles 
  ADD COLUMN institutional_email VARCHAR,
  ADD COLUMN institutional_email_verified BOOLEAN DEFAULT false,
  ADD COLUMN institutional_email_verified_at TIMESTAMPTZ;

-- Add Tier 2 personalization fields
ALTER TABLE user_profiles 
  ADD COLUMN timezone VARCHAR DEFAULT 'America/New_York',
  ADD COLUMN language VARCHAR DEFAULT 'en',
  ADD COLUMN communication_preferences JSONB DEFAULT '{"email_notifications": true, "push_notifications": false}';
```

### 2. New Table: `user_sharing_preferences` (Dual-Email Matrix)
```sql
CREATE TABLE user_sharing_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Personal Email Sharing Toggles (share with peers/mentors)
  personal_share_learning_interests BOOLEAN DEFAULT false,
  personal_share_experience_level BOOLEAN DEFAULT false,
  personal_share_previous_outcomes BOOLEAN DEFAULT false,
  personal_share_engagement_visibility BOOLEAN DEFAULT false,
  personal_share_profile_discoverability BOOLEAN DEFAULT false,
  
  -- Institutional Email Sharing Toggles (share with program/faculty)
  institutional_share_learning_interests BOOLEAN DEFAULT false,
  institutional_share_experience_level BOOLEAN DEFAULT false,
  institutional_share_previous_outcomes BOOLEAN DEFAULT false,
  institutional_share_engagement_visibility BOOLEAN DEFAULT false,
  institutional_share_profile_discoverability BOOLEAN DEFAULT false,
  
  -- Audit Trail
  personal_consent_acknowledged_at TIMESTAMPTZ,
  institutional_consent_acknowledged_at TIMESTAMPTZ,
  consent_version VARCHAR DEFAULT 'v1.0',
  last_updated_at TIMESTAMPTZ DEFAULT now(),
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX idx_user_sharing_user_id ON user_sharing_preferences(user_id);
CREATE INDEX idx_user_sharing_personal ON user_sharing_preferences(personal_share_learning_interests, personal_share_experience_level);
CREATE INDEX idx_user_sharing_institutional ON user_sharing_preferences(institutional_share_learning_interests, institutional_share_experience_level);

-- RLS Policy: Users can only read/update their own preferences
ALTER TABLE user_sharing_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own sharing preferences"
  ON user_sharing_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own sharing preferences"
  ON user_sharing_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- Auto-create row when user registers
CREATE OR REPLACE FUNCTION create_user_sharing_preferences()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_sharing_preferences (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created_sharing_prefs
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_sharing_preferences();
```

**Complexity:** MEDIUM (2 hours for schema + RLS + trigger)

---

## API Route Changes

### New Endpoints Needed

#### 1. GET `/api/users/me/privacy`
**Purpose:** Fetch current sharing preferences and institutional email status  
**Returns:**
```json
{
  "user_id": "uuid",
  "institutional_email": "user@hospital.edu",
  "institutional_email_verified": true,
  "personal_sharing": {
    "share_learning_interests": false,
    "share_experience_level": false,
    "share_previous_outcomes": false,
    "share_engagement_visibility": false,
    "share_profile_discoverability": false
  },
  "institutional_sharing": {
    "share_learning_interests": false,
    "share_experience_level": false,
    "share_previous_outcomes": false,
    "share_engagement_visibility": false,
    "share_profile_discoverability": false
  },
  "personal_consent_acknowledged_at": "2025-10-22T10:00:00Z",
  "institutional_consent_acknowledged_at": "2025-10-22T10:00:00Z",
  "last_updated_at": "2025-10-22T10:00:00Z"
}
```

**Complexity:** LOW (30 minutes)

---

#### 2. PUT `/api/users/me/privacy`
**Purpose:** Update sharing preferences (both personal and institutional)  
**Request Body:**
```json
{
  "personal_sharing": {
    "share_learning_interests": true,
    "share_experience_level": false,
    "share_engagement_visibility": true
  },
  "institutional_sharing": {
    "share_learning_interests": false,
    "share_experience_level": true,
    "share_engagement_visibility": false
  }
}
```

**Logic:**
```typescript
// Validate user is authenticated
const user = await getUser(request);

// Update preferences
const { data, error } = await supabase
  .from('user_sharing_preferences')
  .update({
    ...body.personal_sharing,
    ...body.institutional_sharing,
    last_updated_at: new Date().toISOString()
  })
  .eq('user_id', user.id);

// Audit log the change
await supabase.from('audit_logs').insert({
  user_id: user.id,
  action: 'UPDATE',
  table_name: 'user_sharing_preferences',
  changes: body
});
```

**Complexity:** MEDIUM (1 hour)

---

#### 3. POST `/api/users/me/institutional-email`
**Purpose:** Add/verify institutional email  
**Request Body:**
```json
{
  "institutional_email": "user@hospital.edu"
}
```

**Logic:**
```typescript
// Send verification email
const verificationToken = generateToken();
await supabase
  .from('user_profiles')
  .update({
    institutional_email: body.institutional_email,
    institutional_email_verified: false
  })
  .eq('id', user.id);

// Send verification email via Supabase Auth
await supabase.auth.signInWithOtp({
  email: body.institutional_email,
  options: {
    emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/verify-institutional-email`
  }
});
```

**Complexity:** MEDIUM (1 hour)

---

#### 4. POST `/api/users/me/privacy/acknowledge-consent`
**Purpose:** Record that user saw and acknowledged privacy controls  
**Request Body:**
```json
{
  "consent_type": "personal" | "institutional",
  "consent_version": "v1.0"
}
```

**Why:** GDPR/compliance. You need proof they saw the toggles for each context.

**Complexity:** LOW (30 minutes)

---

## Frontend UI Changes

### 1. Settings → New Tab: "Privacy & Sharing"

**Location:** `/app/(dashboard)/settings/privacy/page.tsx`

**UI Design: Dual-Email Privacy Matrix**
```tsx
<section>
  <h2>Privacy & Data Sharing</h2>
  <p className="text-sm text-slate-600">
    Control how your data is shared with your personal network vs. your institutional program.
    You can change these settings at any time.
  </p>

  {/* Institutional Email Setup */}
  <div className="mt-6 p-4 bg-slate-50 rounded-lg">
    <h3 className="font-medium text-slate-900 mb-2">Institutional Email</h3>
    <p className="text-sm text-slate-600 mb-3">
      Add your institutional email to enable program-specific sharing controls.
    </p>
    <div className="flex gap-3">
      <input
        type="email"
        placeholder="your.email@hospital.edu"
        value={institutionalEmail}
        onChange={(e) => setInstitutionalEmail(e.target.value)}
        className="flex-1 px-3 py-2 border border-slate-300 rounded-lg"
      />
      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg">
        Verify Email
      </button>
    </div>
  </div>

  {/* Privacy Matrix Table */}
  <div className="mt-8">
    <h3 className="font-medium text-slate-900 mb-4">Data Sharing Matrix</h3>
    
    <div className="overflow-x-auto">
      <table className="w-full border border-slate-200 rounded-lg">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-medium text-slate-700">
              Data Field
            </th>
            <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
              Personal Network
              <div className="text-xs text-slate-500 mt-1">
                Peers, mentors, personal learning
              </div>
            </th>
            <th className="px-4 py-3 text-center text-sm font-medium text-slate-700">
              Institutional Program
              <div className="text-xs text-slate-500 mt-1">
                Faculty, program directors, analytics
              </div>
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-200">
          {/* Learning Interests Row */}
          <tr>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Learning Interests</span>
                <InfoIcon 
                  tooltip="Your topic preferences (cardiology, emergency medicine, etc.) used for trend reports and peer matching"
                />
              </div>
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.personal_share_learning_interests}
                onChange={(val) => updatePreference('personal_share_learning_interests', val)}
              />
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.institutional_share_learning_interests}
                onChange={(val) => updatePreference('institutional_share_learning_interests', val)}
                disabled={!institutionalEmailVerified}
              />
            </td>
          </tr>

          {/* Experience Level Row */}
          <tr>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Experience Level</span>
                <InfoIcon 
                  tooltip="Your training year (PGY-1, PGY-2, etc.) for benchmarking and progress tracking"
                />
              </div>
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.personal_share_experience_level}
                onChange={(val) => updatePreference('personal_share_experience_level', val)}
              />
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.institutional_share_experience_level}
                onChange={(val) => updatePreference('institutional_share_experience_level', val)}
                disabled={!institutionalEmailVerified}
              />
            </td>
          </tr>

          {/* Previous Outcomes Row */}
          <tr>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Previous Outcomes</span>
                <InfoIcon 
                  tooltip="Exam scores, performance metrics to improve AI recommendations and peer comparisons"
                />
              </div>
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.personal_share_previous_outcomes}
                onChange={(val) => updatePreference('personal_share_previous_outcomes', val)}
              />
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.institutional_share_previous_outcomes}
                onChange={(val) => updatePreference('institutional_share_previous_outcomes', val)}
                disabled={!institutionalEmailVerified}
              />
            </td>
          </tr>

          {/* Engagement Visibility Row */}
          <tr>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Engagement Visibility</span>
                <InfoIcon 
                  tooltip="Your completion rates, activity levels visible in dashboards and reports"
                />
              </div>
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.personal_share_engagement_visibility}
                onChange={(val) => updatePreference('personal_share_engagement_visibility', val)}
              />
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.institutional_share_engagement_visibility}
                onChange={(val) => updatePreference('institutional_share_engagement_visibility', val)}
                disabled={!institutionalEmailVerified}
              />
            </td>
          </tr>

          {/* Profile Discoverability Row */}
          <tr>
            <td className="px-4 py-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Profile Discoverability</span>
                <InfoIcon 
                  tooltip="Allow others to find and connect with you for peer learning and collaboration"
                />
              </div>
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.personal_share_profile_discoverability}
                onChange={(val) => updatePreference('personal_share_profile_discoverability', val)}
              />
            </td>
            <td className="px-4 py-3 text-center">
              <ToggleSwitch
                enabled={preferences.institutional_share_profile_discoverability}
                onChange={(val) => updatePreference('institutional_share_profile_discoverability', val)}
                disabled={!institutionalEmailVerified}
              />
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>

  {/* Privacy Notice */}
  <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
    <p className="text-sm text-blue-800">
      🔒 <strong>Your privacy matters:</strong> Voice Journal entries are always private, regardless of these settings.
      Only you can access your recordings and reflections.
    </p>
  </div>
</section>
```

**Complexity:** MEDIUM-HIGH (4-5 hours including API integration)

---

### 2. Registration Flow Changes

**Current Flow:**
```
[Email/Password] → [Name] → [Phone] → [Medical School/Specialty] → [Done]
```

**Proposed Flow:**
```
[Email/Password] → [Name] → [Done] ✅
  ↓
[Post-Login: "Complete Your Profile" modal]
  ↓
[Optional: Medical School/Specialty with consent checkbox]
  ↓
[Optional: Privacy preferences wizard]
```

**UI Changes:**
- Make registration **minimal** (Tier 1 + Tier 2 only)
- Show "Profile Incomplete" banner after first login
- Link to `/settings/account` and `/settings/privacy`

**Complexity:** MEDIUM (3-4 hours)

---

### 3. Update Settings Layout

**Current Tabs:**
- Account
- Program (program_director only)
- Devices

**Add New Tab:**
- **Privacy & Sharing** (all roles)

**File:** `app/(dashboard)/settings/layout.tsx`

```diff
const tabs: TabItem[] = [
  { label: 'Account', href: '/settings/account', icon: '👤' },
+ { label: 'Privacy', href: '/settings/privacy', icon: '🔒' },
  { label: 'Program', href: '/settings/program', icon: '🏥', rolesAllowed: ['program_director'] },
  { label: 'Devices', href: '/settings/devices', icon: '🔐' },
];
```

**Complexity:** LOW (15 minutes)

---

## Analytics & Reporting Changes

### The Critical Question: Where Do You Use This Data?

**Current State:** You don't have analytics yet! This is a **huge win** for you.

You can build privacy-by-design into your analytics **from day one**.

### Example: Future Analytics Query with Dual-Email Privacy Filter

```sql
-- BAD (current approach if you built analytics today)
SELECT specialty, COUNT(*) as count
FROM residents
GROUP BY specialty;

-- GOOD (privacy-respecting approach - Personal Network Analytics)
SELECT r.specialty, COUNT(*) as count
FROM residents r
INNER JOIN user_sharing_preferences usp
  ON r.user_id = usp.user_id
WHERE usp.personal_share_learning_interests = true  -- Only count users who opted in for personal sharing
GROUP BY r.specialty;

-- GOOD (privacy-respecting approach - Institutional Analytics)
SELECT r.specialty, COUNT(*) as count
FROM residents r
INNER JOIN user_sharing_preferences usp
  ON r.user_id = usp.user_id
INNER JOIN user_profiles up
  ON up.id = r.user_id
WHERE usp.institutional_share_learning_interests = true  -- Only count users who opted in for institutional sharing
  AND up.institutional_email_verified = true  -- Must have verified institutional email
GROUP BY r.specialty;
```

**Action Required:**
- Document analytics query pattern: "Always join on `user_sharing_preferences` and filter by consent type"
- Build helper views:

```sql
-- Personal Network Analytics View
CREATE VIEW analytics_personal_consented_users AS
SELECT 
  up.id,
  up.email as personal_email,
  up.full_name,
  r.*,
  usp.personal_share_learning_interests,
  usp.personal_share_experience_level,
  usp.personal_share_engagement_visibility
FROM user_profiles up
LEFT JOIN residents r ON r.user_id = up.id
LEFT JOIN user_sharing_preferences usp ON usp.user_id = up.id
WHERE up.is_active = true;

-- Institutional Analytics View
CREATE VIEW analytics_institutional_consented_users AS
SELECT 
  up.id,
  up.email as personal_email,
  up.institutional_email,
  up.full_name,
  r.*,
  usp.institutional_share_learning_interests,
  usp.institutional_share_experience_level,
  usp.institutional_share_engagement_visibility
FROM user_profiles up
LEFT JOIN residents r ON r.user_id = up.id
LEFT JOIN user_sharing_preferences usp ON usp.user_id = up.id
WHERE up.is_active = true
  AND up.institutional_email_verified = true;
```

Then future analytics queries become:
```sql
-- Personal network trends
SELECT specialty, COUNT(*) FROM analytics_personal_consented_users
WHERE personal_share_learning_interests = true
GROUP BY specialty;

-- Institutional program insights
SELECT specialty, COUNT(*) FROM analytics_institutional_consented_users
WHERE institutional_share_learning_interests = true
GROUP BY specialty;
```

**Complexity:** MEDIUM (2-3 hours to document + create views)

---

## Migration Strategy

### Phase 1: Database Changes (Non-Breaking)
1. ✅ Add `timezone`, `language`, `communication_preferences` to `user_profiles`
2. ✅ Create `user_sharing_preferences` table
3. ✅ Add RLS policies
4. ✅ Create trigger to auto-insert preferences on user creation
5. ✅ Backfill existing users: `INSERT INTO user_sharing_preferences (user_id) SELECT id FROM auth.users WHERE id NOT IN (SELECT user_id FROM user_sharing_preferences);`

**Complexity:** 2-3 hours  
**Risk:** LOW (additive changes only)

---

### Phase 2: API Updates
1. ✅ Create `/api/users/me/privacy` endpoints (GET, PUT)
2. ✅ Update `/api/auth/register` to make Tier 3 fields optional
3. ✅ Add consent acknowledgment endpoint

**Complexity:** 3-4 hours  
**Risk:** LOW (backward compatible)

---

### Phase 3: Frontend UI
1. ✅ Create `/settings/privacy` page with toggles
2. ✅ Simplify registration form (remove Tier 3 fields)
3. ✅ Add "Complete Profile" prompt for users missing Tier 3 data
4. ✅ Update settings layout to include Privacy tab

**Complexity:** 8-10 hours  
**Risk:** MEDIUM (requires UX testing)

---

### Phase 4: Analytics Preparation
1. ✅ Create `analytics_consented_users` view
2. ✅ Document query patterns for future features
3. ✅ Update audit logging to track preference changes

**Complexity:** 2-3 hours  
**Risk:** LOW (future-proofing)

---

## Legal & Compliance Considerations

### What This Framework Solves

✅ **GDPR Article 6 (Lawfulness of Processing)**
- Tier 1-2: Legitimate interest (service delivery)
- Tier 3: Contractual necessity (institutional features)
- Tier 4: **Explicit consent** (opt-in analytics)

✅ **GDPR Article 7 (Consent)**
- User can withdraw consent at any time (toggle off)
- Clear, plain language explanations
- Audit trail of consent changes

✅ **HIPAA (if applicable)**
- Voice Journal remains strictly private (RLS enforced)
- Aggregated analytics are de-identified
- No PHI in Tier 4 sharing

✅ **California Consumer Privacy Act (CCPA)**
- Users can opt out of data sharing (Tier 4 toggles)
- Right to deletion (existing Supabase policies)

---

### What You Still Need

⚠️ **Privacy Policy Updates**
- Document what each tier means
- Explain how aggregated data is used
- Link to privacy policy from toggles

⚠️ **Terms of Service**
- Clarify institutional data sharing (Tier 3)
- Consent for program directors to see engagement (if Tier 4 enabled)

⚠️ **Data Retention Policy**
- How long do you keep Tier 4 data?
- Auto-delete voice journals after 90 days? (already planned per PRD)

**Recommendation:** Consult a healthcare privacy lawyer before launch. This framework is solid, but legal review is critical.

---

## Testing Checklist

### Database Tests
- [ ] New user registration creates `user_sharing_preferences` row
- [ ] Existing users can be backfilled
- [ ] RLS policies prevent users from seeing others' preferences
- [ ] Consent timestamp updates correctly

### API Tests
- [ ] `GET /api/users/me/privacy` returns preferences
- [ ] `PUT /api/users/me/privacy` updates toggles
- [ ] Audit logs record changes
- [ ] Unauthenticated requests are rejected

### UI Tests
- [ ] Privacy tab shows all 5 toggles
- [ ] Toggles update in real-time
- [ ] Success/error messages display
- [ ] Mobile responsive design
- [ ] Registration flow works without Tier 3 fields
- [ ] "Complete Profile" modal appears for incomplete profiles

### Integration Tests
- [ ] User opts out → verify they don't appear in analytics queries
- [ ] User opts in → verify they appear in analytics queries
- [ ] Consent acknowledged timestamp is recorded

---

## Risk Assessment

### Low Risk ✅
- Database schema changes (additive, non-breaking)
- New API endpoints (don't affect existing flows)
- Settings page addition (optional feature)

### Medium Risk ⚠️
- Registration flow changes (users might be confused by optional fields)
- Analytics query patterns (need to enforce privacy filters consistently)

### High Risk 🚨
- **None!** This is a well-scoped, low-risk change **if implemented carefully**.

**Biggest Pitfall:** Forgetting to filter analytics queries by consent. Mitigate by:
1. Creating helper views (forces filtering)
2. Documenting query patterns
3. Code review for all analytics features

---

## Alternatives Considered

### Option 1: All-or-Nothing Privacy (Simpler)
**Approach:** Single toggle: "Share my data with institution: Yes/No"

**Pros:**
- Simpler UI (1 toggle instead of 5)
- Easier to understand for users
- Less backend complexity

**Cons:**
- Less granular control
- Users might opt out entirely (losing valuable analytics)
- Not as GDPR-compliant (requires granular consent)

**Verdict:** ❌ Not recommended. Granularity is key for trust.

---

### Option 2: Consent at Signup Only (Current State)
**Approach:** Collect everything at signup, no toggles

**Pros:**
- Simple registration flow
- No new tables needed

**Cons:**
- Poor user experience (forced data sharing)
- Not compliant with GDPR "right to withdraw consent"
- Users feel trapped by initial decisions

**Verdict:** ❌ Not recommended. This is what you're moving away from.

---

### Option 3: Privacy Tiers with Roles (Hybrid)
**Approach:** Different defaults for residents vs faculty

**Example:**
- Residents: All toggles default OFF (high privacy)
- Faculty: Engagement toggle default ON (institutional visibility)

**Pros:**
- Respects different use cases
- Faculty expect institutional oversight

**Cons:**
- More complex to implement
- Risk of discrimination ("Why do residents get more privacy?")

**Verdict:** 🤔 Consider for Phase 2. Keep it simple for MVP.

---

## Final Recommendation

### ✅ Proceed with Implementation

**Why:**
1. **Well-scoped:** 21-27 hours is manageable for a 3-4 day sprint
2. **Low risk:** Additive changes, no breaking migrations
3. **High value:** Differentiates Lev8 as privacy-first
4. **Compliance:** Solves GDPR/CCPA requirements proactively
5. **Future-proof:** Analytics will be privacy-respecting from day one

**When:**
- **Best time:** Before beta launch (easier to migrate 10 users than 10,000)
- **Fallback:** If you need to ship fast, do Phase 1-2 now (backend only), defer UI to Phase 3

---

## Next Steps

### Immediate Actions
1. **Review this analysis** with your team/advisors
2. **Consult a healthcare privacy lawyer** (2-3 hour consultation)
3. **Create SQL migration scripts** (Phase 1 database changes)
4. **Update API routes** (Phase 2)
5. **Build Privacy settings page** (Phase 3)

### Documentation Updates
- [ ] Update `prd.md` with privacy tier framework
- [ ] Update `planning.md` with new database schema
- [ ] Create `PRIVACY-POLICY.md` (legal review required)

### Code Review Focus Areas
- RLS policies on `user_sharing_preferences`
- Audit logging for consent changes
- Analytics query patterns (enforce privacy filters)

---

## Questions for Product/Legal Team

1. **Consent Age:** Should users under 18 require parental consent? (healthcare context)
2. **Program Director Access:** If a user enables "Share Engagement", what exactly can program directors see?
3. **Data Retention:** How long do you keep preference change history? (audit logs)
4. **International Users:** Do EU residents get different defaults? (GDPR requires opt-in)
5. **Voice Journal:** Should there be a toggle for "Share anonymized voice journal summaries with research"? (future ML training)

---

## Conclusion

**Complexity: MEDIUM-HIGH (7/10)**  
**Feasibility: HIGH (9/10)**  
**Business Value: VERY HIGH (10/10)**

Your Supabase architecture is **perfectly suited** for this privacy framework. The main work is:
1. New table + RLS (straightforward)
2. API routes (standard CRUD operations)
3. Settings UI (design + React components)

**No re-architecture needed.** This is an additive feature that slots into your existing system beautifully.

**Go for it.** 🚀
