# Product Requirements Document (PRD)
## Elevate: Medical Education Portal Platform

**Project Name:** Elevate (www.lev8.ai)  
**Version:** 1.0 MVP  
**Last Updated:** October 20, 2025  
**Status:** PRD Definition Phase  
**Institution:** Memorial Hospital West Emergency Medicine Residency Program

---

## 1. Executive Summary

Elevate is a secure, role-based web platform designed to support medical education and resident training, starting with Emergency Medicine residency at Memorial Hospital West. The MVP establishes a unified platform foundation with modular architecture that allows residents to access personalized learning experiences, private reflection tools, and program-level insights. Learn and Understand modules are structured as empty containers ready for content integration; the Voice Journal (Grow module) is fully functional for resident reflection and Claude-powered summarization.

Future phases will integrate sophisticated clinical case content from VirtualSIM (federated architecture), implement credit-based Claude API access, and expand to additional institutions and specialties.

---

## 2. Problem Statement

Emergency Medicine residents need a centralized, secure platform that:
- Provides personalized learning experiences with private reflection capabilities
- Maintains strict privacy boundaries (especially for resident voice journals and clinical reflections)
- Offers program directors cohort-level insights without compromising resident privacy
- Integrates AI-powered analysis (Claude API) for voice transcription and reflection summarization
- Supports role-based access control (residents, faculty, program leadership, super admin)
- Scales across multiple institutions while maintaining data isolation and competitive privacy
- Enables residents to reflect asynchronously via voice, with transcription and AI summarization

---

## 3. Goals & Success Metrics

### MVP Goals
- [ ] Build platform foundation with secure authentication (email/password + 2FA)
- [ ] Establish device trust system (2FA required on new devices, 30-day trust window)
- [ ] Create role-based access control for 4 user types (resident, faculty, program director, super admin)
- [ ] Build Voice Journal with complete pipeline: record → transcribe → summarize → store privately
- [ ] Implement module bucket structure (Learn, Grow, Understand) with no content yet
- [ ] Deploy production-ready system with Supabase RLS and zero unauthorized data access
- [ ] Achieve successful MVP deployment with 8 test users at Memorial Hospital West

### Success Metrics (MVP Phase)
- User authentication success rate: 99%+
- Voice transcription accuracy: >95% (via Whisper)
- Voice Journal entries private: 100% (RLS enforced, Program Directors cannot access)
- API response time: <500ms (p95)
- Zero unauthorized data access incidents
- Resident adoption: 100% of test users can successfully record, transcribe, and store voice memos

---

## 4. Target Users & Personas (MVP)

### Primary User: Emergency Medicine Resident
**Needs:**
- Private, secure space for clinical reflection (voice journals)
- Easy navigation to learning modules (even if empty in MVP)
- Clear indication of program affiliation and role

**Access Level:** 
- Personal voice journal entries only (no admin visibility)
- View program-level aggregate data (anonymized)
- Access Learn/Grow/Understand module buckets (content added post-MVP)

**Test Residents (4):**
1. Andrei Simon
2. Spencer Rice
3. Aleksandr Butovskiy
4. Morgan Reel

---

### Secondary User: Program Director
**Role:** Leon Melnitsky, DO MHS

**Needs:**
- Dashboard showing resident cohort performance and engagement
- Ability to view program structure and resident directory
- NO access to resident voice journals (absolute privacy)

**Access Level:**
- View program statistics and resident list
- View faculty and staff assignments
- Manage program settings
- Cannot access Voice Journal entries

---

### Tertiary Users: Faculty & Coordinators
**Roles:**
1. Hanan Atia, MD MHS - Associate Residency Program Director
2. Yehuda Wenger, MD MHS - Medical Student Clerkship Director

**Needs:**
- Access to relevant program information
- Ability to view resident directory
- (Future) ability to contribute clinical cases, feedback

**Access Level:**
- View program data relevant to their role
- View non-private resident information
- Cannot access Voice Journals

---

### Super Admin User
**Role:** You

**Needs:**
- Full system access for platform management
- Ability to configure institutions, programs, users
- Access to audit logs and system health

**Access Level:**
- Full access to all data (with audit logging)
- User and program management
- System configuration

---

## 5. Scope: MVP (Phase 1)

### In Scope

#### 5.1 Platform Foundation
- **Authentication:** Supabase Auth with email/password signup
- **2FA:** TOTP-based 2FA for new device access
- **Device Trust:** Device fingerprinting + trust for 30 days (bypasses 2FA on trusted devices)
- **Session Management:** Secure JWT-based sessions with auto-logout on inactivity
- **Role-Based Access Control (RBAC):** 4 roles (resident, faculty, program_director, super_admin)
- **Multi-Tenancy Ready:** Institution-level data isolation via row-level security (RLS)

#### 5.2 UI/UX Foundation
- **Responsive, Modern Design:** Clean interface (light/dark mode capable) inspired by Stripe Docs aesthetic
- **Left Sidebar Navigation:** Collapsible module bucket navigation
- **Module Bucket Structure:** Three empty containers (Learn, Grow, Understand) with routing ready
- **Settings Panel:** Bottom-left corner gear icon for account and program management
- **Loading States, Error Handling, Toast Notifications:** Professional user feedback

#### 5.3 Core Features: Voice Journal (Grow Module)
**Complete End-to-End Pipeline:**
1. **Recording:** Browser-based voice recording using Web Audio API
   - Record button, pause, resume, stop, playback preview
   - Visual waveform or timer display
   - Max duration: 60 minutes per recording
   - Auto-save if user navigates away

2. **Storage:** Audio file uploaded to Supabase Storage (encrypted)
   - File naming convention: `voice_journal/{resident_id}/{timestamp}.mp3`
   - Automatic deletion after 90 days (configurable) or on user delete

3. **Transcription:** Async job via OpenAI Whisper API
   - Triggered immediately after upload
   - Stores transcription in Supabase `grow_voice_journal` table
   - Confidence score attached
   - Fallback error handling if transcription fails

4. **Summarization:** Async job via Claude API
   - Takes transcription as input
   - Generates 2-3 sentence summary of key reflection points
   - Stores summary in same table
   - Uses backend API key (never exposed to frontend)

5. **Personal Dashboard:** List view of all user's voice journal entries
   - Timestamp, duration, transcription preview, Claude summary
   - Play/listen option (audio playback)
   - Delete option (resident only)
   - Search by date or transcription text

6. **Privacy & Security:**
   - **Absolute Privacy:** Only the recording resident can access their entries (RLS enforced at database level)
   - **Program Director Cannot Access:** Zero backdoor access to Voice Journal
   - **Encrypted Storage:** Audio files encrypted in Supabase Storage
   - **Audit Logging:** All access attempts logged (including failed attempts)

#### 5.4 User Management & Settings
- **Account Settings Tab:**
  - First/Last name, cell number, work email, personal email
  - Medical school, specialty, residency program, graduation year
  - Password change, 2FA management
  - Device trust management (view trusted devices, revoke trust)

- **Program Settings Tab (Program Director only):**
  - View program structure: leadership, administrators, faculty, residents
  - Resident directory with contact info (work/personal email, phone)
  - Program statistics dashboard (placeholder for future analytics)
  - Module management (enable/disable buckets, future module configuration)

#### 5.5 Module Bucket Structure (Scaffold Only)
**Navigation Routes Ready:**
- `/modules/learn` - Learn bucket (empty, routing ready)
- `/modules/grow/voice-journal` - Voice Journal (fully functional)
- `/modules/understand` - Understand bucket (empty, routing ready)

**Backend Structure:**
- `module_buckets` table: Learn, Grow, Understand
- `modules` table: Individual module definitions (created but no content)
- Routing architecture supports adding modules without refactoring

#### 5.6 Security & Compliance
- **Data Encryption:** All data encrypted in transit (HTTPS) and at rest (Supabase)
- **API Keys Hidden:** Claude API key, Whisper API key stored server-side only
- **Supabase RLS:** Row-level security policies enforce data access rules
- **Audit Logging:** All user actions logged to `audit_logs` table
- **Rate Limiting:** API endpoints rate-limited to prevent abuse
- **GDPR Readiness:** Data export and deletion capabilities built in

#### 5.7 Privacy Framework & Data Consent (Planned - Epic 2.10)

**Status:** Planned for implementation before beta launch  
**Priority:** High (GDPR/CCPA compliance + competitive differentiator)  
**See:** `docs/PRIVACY-FRAMEWORK-ANALYSIS.md` for full implementation details

**4-Tier Privacy System:**

**Tier 1: Authentication & Communication (Required, Never Shared)**
- Email, phone (2FA), password hash, account status
- Collected at signup, required for service delivery
- Never shared with analytics or third parties

**Tier 2: Personalization (Minimal, User-Controlled)**
- Display name, timezone, language preference, communication preferences
- User can edit anytime in account settings
- Used only for personal UX customization

**Tier 3: Contextual Role Data (Conditional, Purpose-Limited)**
- Institution ID, program affiliation, medical school, specialty, cohort/class year
- Collected with explicit consent at signup or post-login
- Required for institutional features (program directory, cohort analytics)
- User can view/edit consent status

**Tier 4: Optional Sharing Toggles (User-Controlled, Granular)**
Users control 5 independent privacy toggles:
1. **Share Learning Interests** - Topic preferences in aggregated trend reports
2. **Share Experience Level** - Training year (PGY-X) for benchmarking data
3. **Share Previous Outcomes** - Exam scores for AI recommendations
4. **Show Engagement to Cohort** - Completion rates visible to program directors
5. **Profile Discoverability** - Searchable by other residents for peer learning

**Key Privacy Principles:**
- **Voice Journal Always Private:** Regardless of settings, voice journal entries remain strictly private (RLS enforced)
- **Opt-In, Not Opt-Out:** All Tier 4 toggles default to OFF (high privacy by default)
- **Granular Control:** Users can toggle each setting independently
- **Right to Withdraw:** Users can change settings at any time
- **Consent Tracking:** All consent actions timestamped and versioned
- **Audit Trail:** Privacy preference changes logged for compliance

**Implementation Features:**
- Privacy settings page (`/settings/privacy`) with 5 toggle cards
- Simplified registration (collect minimal data upfront)
- "Complete Your Profile" modal for optional post-login data
- Privacy-respecting analytics views (filter by user consent)
- Helper database views for consent-filtered queries

**Compliance Benefits:**
- ✅ GDPR Article 6 & 7 (Lawful processing, explicit consent)
- ✅ CCPA (Right to opt out of data sharing)
- ✅ HIPAA (De-identified aggregated data)
- ✅ Audit trail for legal compliance

---

### Out of Scope (Post-MVP)

- **Learning Modules:** Clinical Cases, Difficult Conversations, ACLS & EKGs, Running the Board (content only; infrastructure ready)
- **Understand Module:** Progress Check analytics and dashboards
- **Data Upload:** CSV/bulk data import workflows
- **Advanced Analytics:** Resident performance dashboards, benchmarking
- **Mobile App:** iOS/Android applications
- **Credit System & Payments:** Stripe integration, user credit management, Claude API usage billing (Phase 2)
- **Multi-Institution:** Scalable multi-tenant features beyond initial setup (Phase 3)
- **Integration:** External system connections (EHRs, LMS)

---

## 6. Data Model Overview

### Core Entities (MVP)

**Institutions (health_systems)**
- `id`, `name`, `abbreviation`, `location`, `contact_email`
- Tenant identifier for data isolation
- Sample data: Memorial Hospital West

**Programs**
- `id`, `health_system_id`, `name`, `specialty`, `pgm_director_id`
- Links institution to residency program
- Sample: Emergency Medicine

**Academic Classes**
- `id`, `program_id`, `class_year`, `start_date`, `graduation_date`
- Cohort tracking
- Sample: PGY-1, PGY-2, PGY-3

**Users (user_profiles)**
- `id`, `email`, `first_name`, `last_name`, `phone`, `institution_id`, `role`
- Links to Supabase Auth via `id`
- Role: resident, faculty, program_director, super_admin

**Residents**
- `id`, `user_id`, `program_id`, `class_id`, `medical_school`, `specialty`
- Links resident user to program and class

**Faculty**
- `id`, `user_id`, `program_id`, `title`, `department`, `is_evaluator`
- Program faculty/staff

**Device Trusts**
- `id`, `user_id`, `device_fingerprint`, `ip_address`, `user_agent`, `trust_expires_at`
- Tracks trusted devices for 2FA bypass

**Voice Journal Entries (grow_voice_journal)**
- `id`, `resident_id`, `audio_blob_url`, `transcription`, `claude_summary`
- `transcription_confidence`, `recording_duration_seconds`, `is_private`
- `created_at`, `updated_at`
- **RLS:** Only resident can access

**Module Buckets**
- `id`, `institution_id`, `name` (Learn, Grow, Understand)
- `display_order`, `is_active`, `created_at`

**Modules**
- `id`, `institution_id`, `bucket_id`, `slug`, `name`, `description`
- `available_to_roles`, `is_active`
- Placeholder for future module definitions

**Audit Logs**
- `id`, `user_id`, `action`, `table_name`, `record_id`, `changes` (JSONB)
- `ip_address`, `user_agent`, `created_at`
- Compliance and security tracking

---

## 7. Technical Stack

**Frontend**
- React 18+ with TypeScript
- Next.js 14+ (App Router)
- Tailwind CSS for styling
- Shadcn/ui for components
- Web Audio API for voice recording
- Zustand or React Context for state

**Backend**
- Next.js API routes (deployed on Vercel Edge Functions)
- TypeScript for type safety
- Environment variables for API key management

**Database & Storage**
- Supabase PostgreSQL (primary database)
- Supabase Storage (encrypted audio files)
- Row-Level Security (RLS) policies for data isolation

**Authentication**
- Supabase Auth with email/password
- TOTP-based 2FA (via Supabase or third-party library)
- JWT sessions with refresh tokens

**External APIs**
- OpenAI Whisper (voice transcription)
- Claude API (voice memo summarization)
- (Future) Stripe for payment processing

**Hosting & Deployment**
- Frontend: Vercel (auto-deploy from GitHub on main branch push)
- Backend: Vercel (Next.js API routes)
- Database: Supabase (managed PostgreSQL)
- Domain: www.lev8.ai (GoDaddy → Vercel DNS)

**CI/CD & Version Control**
- GitHub for source code management
- GitHub Actions for automated testing and linting
- Vercel for continuous deployment
- Environment-specific secrets (dev, staging, production)

---

## 8. Architecture: Multi-Schema Federation

### Single Institution (MVP)
- One Supabase project (`lev8`)
- Memorial Hospital West instance
- Data isolated via `institution_id` and RLS policies

### Federation with VirtualSIM (Learning Content)
- **VirtualSIM** (separate Supabase project) contains clinical case content:
  - Cases, clinical details, labs, imaging, patient profiles
  - Difficult conversation scenarios (avatar vignettes)
  - Learning objectives, references
- **lev8** (this project) contains:
  - User authentication, residency program management
  - Voice Journal (private reflections)
  - Module scaffolding and navigation
  - Evaluation and performance metrics (future)
- **App-Layer Integration:**
  - Next.js API routes fetch from both databases when needed
  - Results combined at app layer, not SQL layer
  - Caching strategies implemented for performance
  - No cross-database SQL joins

### Row-Level Security (RLS) Policies
**Voice Journal: Owner-Only Access**
```sql
ALTER TABLE grow_voice_journal ENABLE ROW LEVEL SECURITY;
CREATE POLICY voice_journal_owner_only ON grow_voice_journal
  FOR ALL USING (auth.uid()::uuid = resident_id);
```

**User Profiles: Self + Role-Based**
```sql
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY users_self_or_admin ON user_profiles
  FOR SELECT USING (
    auth.uid() = id 
    OR auth.uid()::uuid IN (
      SELECT user_id FROM user_profiles WHERE role = 'super_admin'
    )
  );
```

**Residents: Program-Level Visibility**
```sql
CREATE POLICY residents_program_visibility ON residents
  FOR SELECT USING (
    program_id IN (
      SELECT program_id FROM residents WHERE user_id = auth.uid()::uuid
    )
  );
```

---

## 9. API Endpoints (High-Level)

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - Email/password login
- `POST /api/auth/verify-2fa` - Verify TOTP code
- `POST /api/auth/trust-device` - Mark device as trusted (30 days)
- `POST /api/auth/logout` - Clear session
- `GET /api/auth/session` - Get current session

### User & Profile
- `GET /api/users/me` - Current user profile
- `PUT /api/users/me` - Update profile
- `GET /api/users/directory?program_id=X` - Program resident/faculty directory
- `GET /api/devices/trusted` - List trusted devices
- `DELETE /api/devices/trusted/:id` - Revoke device trust

### Voice Journal
- `POST /api/voice-journal/upload` - Upload audio blob (multipart)
- `GET /api/voice-journal` - List user's entries (paginated)
- `GET /api/voice-journal/:id` - Get single entry (transcription + summary)
- `DELETE /api/voice-journal/:id` - Delete entry (owner only)
- `GET /api/voice-journal/stats` - User's journal statistics (count, total duration)

### Modules
- `GET /api/modules/buckets` - List module buckets (Learn, Grow, Understand)
- `GET /api/modules?bucket=grow` - List modules in bucket (filtered by role)
- `GET /api/modules/:id` - Get module details
- `POST /api/modules/:id/progress` - Record user progress on module

### Settings
- `GET /api/settings/account` - Account settings
- `PUT /api/settings/account` - Update account settings
- `GET /api/settings/program` - Program settings (program director only)
- `PUT /api/settings/program` - Update program settings (program director only)

### Admin
- `GET /api/admin/audit-logs` - View audit logs (super admin only)
- `GET /api/admin/users` - List all users (super admin only)
- `POST /api/admin/users` - Create user (super admin only)

---

## 10. Voice Journal: Complete Pipeline

### User Flow
1. **Navigate to Grow → Voice Journal**
2. **Record:**
   - Click "Record" button
   - Browser requests microphone permission
   - Record voice memo (visual feedback: waveform, timer)
   - Click "Stop" to end recording
3. **Preview:**
   - Optional: Listen to playback before saving
   - Optional: Delete and re-record
4. **Save:**
   - Click "Save to Journal"
   - Audio uploaded to Supabase Storage
   - Toast notification: "Recording saved"
5. **Transcription (Async):**
   - Backend job triggered immediately
   - Whisper API transcribes audio
   - Stored in Supabase `grow_voice_journal.transcription`
   - User sees "Transcribing..." → "Transcribed" status update
6. **Summarization (Async):**
   - Backend job triggered after transcription completes
   - Claude API summarizes transcription
   - Stored in `grow_voice_journal.claude_summary`
   - User sees "Summarizing..." → "Ready" status
7. **View Entry:**
   - Entry appears in Voice Journal list
   - Shows: Date, duration, transcription, Claude summary
   - User can click to expand and read full transcription

### Backend Pipeline
```
1. Audio Upload
   ↓
2. Store in Supabase Storage (encrypted)
   ↓
3. Create DB record (grow_voice_journal)
   ↓
4. Trigger Whisper Job (async)
   ├─ Call OpenAI Whisper API
   ├─ Store transcription
   └─ Update status to "transcribed"
   ↓
5. Trigger Claude Summarization Job (async)
   ├─ Call Claude API with transcription
   ├─ Store summary
   └─ Update status to "complete"
   ↓
6. Real-time UI Update (WebSocket or polling)
   └─ User sees status changes in real-time
```

### Error Handling
- **Upload Failure:** Retry 3x, then show error message
- **Transcription Failure:** Manual fallback (user can paste transcript)
- **Summarization Failure:** Show transcription, allow retry
- **Storage Failure:** Log error, alert super admin

---

## 11. User Stories: MVP

### Resident Stories
- **Story 1:** As a resident, I can register with my work email, medical school, and residency program details
- **Story 2:** As a resident, I can log in with email/password
- **Story 3:** As a resident, I see a 2FA prompt when logging in from a new device
- **Story 4:** As a resident, I can trust a device for 30 days to skip future 2FA
- **Story 5:** As a resident, I can navigate to Voice Journal and record a voice memo
- **Story 6:** As a resident, my voice memo is automatically transcribed and summarized
- **Story 7:** As a resident, I can view all my voice journal entries with transcriptions and summaries
- **Story 8:** As a resident, I can delete my voice journal entries
- **Story 9:** As a resident, I can see placeholder Learn/Grow/Understand module buckets
- **Story 10:** As a resident, my voice journal entries are completely private (Program Director cannot see them)
- **Story 11:** As a resident, I can update my profile information

### Program Director Stories
- **Story 12:** As a Program Director, I can log in and see resident cohort information
- **Story 13:** As a Program Director, I can view the resident directory with contact info
- **Story 14:** As a Program Director, I can manage program settings
- **Story 15:** As a Program Director, I cannot access resident voice journal entries
- **Story 16:** As a Program Director, I can see program-level statistics (placeholder for future)

### Faculty Stories
- **Story 17:** As faculty, I can log in and view resident directory
- **Story 18:** As faculty, I can see relevant program information

### Admin Stories
- **Story 19:** As super admin, I have full access to user management
- **Story 20:** As super admin, I can view audit logs
- **Story 21:** As super admin, I can configure institutions and programs

---

## 12. Deployment & CI/CD

### Development Workflow
```
Local Development (laptop)
  ↓ (npm run dev)
  ↓ (Test locally)
  ↓ (Commit to GitHub feature branch)
  ↓ (Create Pull Request)
  ↓ (GitHub Actions runs tests, linting)
  ↓ (Vercel creates preview deployment)
  ↓ (Review changes on preview URL)
  ↓ (Merge PR to main branch)
  ↓ (GitHub Actions runs full test suite)
  ↓ (Vercel auto-deploys to www.lev8.ai)
  ↓ (Live on production)
```

### Environment Setup
- **Local:** `.env.local` (git-ignored, never committed)
- **Staging:** Vercel preview deployments (auto-created per PR)
- **Production:** www.lev8.ai (manual merge to main triggers deploy)

### Secrets Management
- GitHub Secrets for CI/CD (API keys, database URLs)
- Vercel Environment Variables dashboard (separate for staging/production)
- `.env.local` for local development (git-ignored)

### Database Migrations
- Supabase has built-in migration tools
- Migrations committed to GitHub as SQL files
- Migrations run automatically on deployment (or manual if needed)

---

## 13. Non-Functional Requirements

### Performance
- Page load time: <3 seconds
- API response time: <500ms (p95)
- Voice upload: <5 minutes for transcription
- Claude summarization: <2 minutes after transcription completes
- Database queries: <100ms for standard operations

### Security
- OWASP Top 10 compliance
- SSL/TLS for all traffic (HTTPS enforced)
- Rate limiting: 100 requests/min per user per endpoint
- Supabase RLS enforced at database layer
- All API keys stored server-side (never in frontend code or logs)
- Regular security audits (quarterly post-launch)
- Incident response plan documented

### Scalability
- Support 100+ users per institution
- Horizontal scaling via Vercel (automatic)
- Database query optimization and indexing
- Caching strategies for frequently accessed data (future)
- CDN for static assets (Vercel built-in)

### Reliability
- Uptime SLA: 99.5%
- Automated backups: Daily (Supabase managed)
- Disaster recovery: <24 hour RTO
- Error logging and monitoring (Sentry or similar, Phase 2)

### Compliance
- GDPR-ready: Data export, deletion, consent mechanisms
- HIPAA-adjacent: No PHI storage, but sensitive data encryption
- SOC 2 readiness: Logging, access controls, encryption
- Audit trail: All actions logged for compliance

---

## 14. Future Roadmap

### Phase 2: Credit System & Analytics (Q1 2026)
- Implement user credit system (free monthly credits + paid top-ups)
- Stripe integration for payments
- Claude API call metering and billing
- Basic resident analytics dashboard
- Error monitoring (Sentry)

### Phase 3: Learning Modules (Q2 2026)
- Integrate VirtualSIM clinical cases (federated architecture)
- Implement Learn bucket: Clinical Cases module
- Implement Learn bucket: Difficult Conversations module
- User progress tracking across modules
- Module completion certificates

### Phase 4: Advanced Analytics (Q3 2026)
- Implement Understand bucket: Progress Check competency framework
- Program Director analytics dashboard
- Comparative benchmarking (anonymized)
- Resident performance reports

### Phase 5: Multi-Tenancy & Mobile (Q4 2026)
- Support multiple institutions
- iOS app with Voice Journal integration
- Advanced RBAC and custom roles
- API for third-party integrations

---

## 15. Test Data & MVP Setup

### Test Institution
- **Name:** Memorial Hospital West
- **Specialty:** Emergency Medicine
- **Location:** Placeholder (Coral Springs, FL reference)

### Test Users (8 total)

**Super Admin (1)**
- Email: [Your email]
- Role: super_admin
- Name: [Your name]

**Program Leadership (3)**
1. Leon Melnitsky, DO MHS
   - Email: leon.melnitsky@mhwest.edu
   - Role: program_director
   - Phone: [Placeholder]

2. Hanan Atia, MD MHS
   - Email: hanan.atia@mhwest.edu
   - Role: faculty (associate_program_director)
   - Phone: [Placeholder]

3. Yehuda Wenger, MD MHS
   - Email: yehuda.wenger@mhwest.edu
   - Role: faculty (clerkship_coordinator)
   - Phone: [Placeholder]

**Test Residents (4)**
1. Andrei Simon
   - Email: andrei.simon@mhwest.edu
   - Role: resident
   - Class: PGY-1
   - Medical School: [Placeholder]

2. Spencer Rice
   - Email: spencer.rice@mhwest.edu
   - Role: resident
   - Class: PGY-2
   - Medical School: [Placeholder]

3. Aleksandr Butovskiy
   - Email: aleksandr.butovskiy@mhwest.edu
   - Role: resident
   - Class: PGY-3
   - Medical School: [Placeholder]

4. Morgan Reel
   - Email: morgan.reel@mhwest.edu
   - Role: resident
   - Class: PGY-1
   - Medical School: [Placeholder]

### Seed Data Script
A `seed.sql` script will be created to populate:
- health_systems (Memorial Hospital West)
- programs (Emergency Medicine)
- academic_classes (PGY-1, PGY-2, PGY-3)
- user_profiles (8 users above)
- residents (4 residents)
- faculty (3 faculty)
- module_buckets (Learn, Grow, Understand)
- modules (empty, ready for content)

---

## 16. Success Criteria for MVP Completion

- [ ] All MVP features implemented, tested, and deployed
- [ ] Security audit passed (internal)
- [ ] 8 test users successfully onboard with lev8.ai
- [ ] Voice Journal end-to-end working: record → transcribe → summarize → store
- [ ] Voice Journal entries confirmed private (zero Program Director access)
- [ ] 2FA functional for new device access
- [ ] Device trust working (30-day bypass)
- [ ] Zero unauthorized data access incidents during testing
- [ ] Documentation complete (README, API docs, deployment guide, user guide)
- [ ] CI/CD pipeline fully automated (GitHub → Vercel deployment)
- [ ] 90%+ test coverage for critical authentication and Voice Journal paths
- [ ] Performance benchmarks met (<500ms API response, <3s page load)
- [ ] User feedback collected from test users and incorporated

---

## 17. Assumptions & Dependencies

### Assumptions
- Users have modern browsers (Chrome, Safari, Firefox, Edge on latest versions)
- Users have stable internet connection for voice recording
- Microphone access permissions granted by users
- Test data can be manually entered (no bulk CSV import in MVP)
- Single institution deployment for MVP (Memorial Hospital West)

### Dependencies
- Supabase account with project created (`lev8`)
- OpenAI API key (Whisper) active and funded
- Claude API key (Organization) active and funded
- GitHub repository created (private, with proper .gitignore)
- Vercel account connected to GitHub
- GoDaddy domain (lev8.ai) DNS management access
- Node.js 18+ and npm installed locally

### Risks & Mitigations
| Risk | Impact | Mitigation |
|------|--------|-----------|
| Voice transcription inaccuracy | User frustration | Test Whisper with various accents/audio quality; provide manual override |
| Claude API latency | Delayed feedback | Set SLA expectations; implement retry with exponential backoff |
| Data privacy breach | Loss of trust, compliance issues | Implement RLS policies; regular security audits; encrypt sensitive data |
| User adoption issues | MVP failure | Early user feedback; iterate UI based on resident/faculty input |
| Vercel/Supabase outage | Service unavailable | Use status pages; implement graceful degradation |

---

## 18. Acceptance Criteria

### Functional
- ✅ User can register with email, name, program details
- ✅ User can log in and see personalized dashboard
- ✅ 2FA works on new device login
- ✅ Device trust allows 30-day 2FA bypass
- ✅ Voice Journal: record, upload, transcribe, summarize, store
- ✅ Voice Journal entries private to owner (RLS enforced)
- ✅ Program Director can view resident directory but NOT Voice Journals
- ✅ Module bucket navigation works (Learn, Grow, Understand visible)
- ✅ Settings allow profile and program management

### Non-Functional
- ✅ All endpoints respond in <500ms (p95)
- ✅ Page load time <3 seconds
- ✅ HTTPS enforced
- ✅ Voice transcription accuracy >95%
- ✅ Zero data leakage in logs

### Security
- ✅ All API keys in environment variables (server-side only)
- ✅ Supabase RLS policies enforced
- ✅ 2FA functional and tested
- ✅ Device trust expires after 30 days
- ✅ Audit logs track all user actions

---

## 19. Questions Addressed in This PRD

✅ MVP scope: Platform foundation + Voice Journal (modules are scaffold)  
✅ User priority: Residents (with Program Director secondary)  
✅ Multi-tenancy: Institution-level isolation via RLS, ready to scale  
✅ Voice transcription: Whisper API, English only, no translation  
✅ Federation: VirtualSIM stays separate, lev8 integrates at app layer  
✅ Credit system: Phase 2 (post-MVP), not included in MVP  
✅ Test users: 8 total (you + 3 faculty + 4 residents)  
✅ Hosting: Vercel (frontend) + Supabase (backend) + GoDaddy DNS  
✅ Design aesthetic: Modern, clean (Stripe Docs inspired), light/dark mode ready

---

## 20. Sign-Off

**PRD Owner:** [Your Name]  
**Last Reviewed:** October 20, 2025  
**Status:** Awaiting Approval

**Approval:** _____________________ (Sign-off before proceeding to Claude.md, Planning.md, Tasks.md)