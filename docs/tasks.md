# Tasks.md: Elevate Implementation Roadmap

**Project:** Elevate (www.lev8.ai) + EQ·PQ·IQ (www.eqpqiq.com)  
**Version:** 2.0 Production  
**Last Updated:** February 17, 2026  
**Status:** All Core Modules + EQ·PQ·IQ Product Suite Operational  

---

## Legend

- 📋 **Epic** (multiple tasks)
- ✅ **Task** (specific, actionable work)
- 🔄 **In Progress**
- ✓ **Complete**
- ⏳ **Blocked**
- 🌐 **Depends on:** Task ID

---

## PHASE 1: Core Platform & Voice Journal MVP (Weeks 1-3)

### Epic 1.1: Project Setup & Infrastructure 📋

**1.1.1** ✅ Create GitHub repository
- [ ] Create private repo on GitHub: `elevate`
- [ ] Set up `.gitignore` (Node, .env.local, DS_Store, etc.)
- [ ] Create `.env.local.example` template
- [ ] Create README.md with project overview and local dev instructions
- **Estimated:** 30 min
- **Depends:** Nothing

**1.1.2** ✅ Initialize Next.js project
- [ ] Run `npx create-next-app@latest elevate --typescript --tailwind`
- [ ] Configure `tsconfig.json` (strict mode, lib target ES2020)
- [ ] Configure `next.config.ts` (image optimization, environment variables)
- [ ] Remove unused pages/components from scaffold
- **Estimated:** 45 min
- **Depends:** 1.1.1

**1.1.3** ✅ Set up Tailwind CSS + Shadcn/ui
- [ ] Install shadcn/ui CLI: `npx shadcn-ui@latest init`
- [ ] Configure Tailwind colors for healthcare aesthetic (teal primary, clean neutrals)
- [ ] Set up dark mode support
- [ ] Install initial components: Button, Input, Card, Dialog, Toast
- **Estimated:** 30 min
- **Depends:** 1.1.2

**1.1.4** ✅ Create Supabase project
- [ ] Create account on supabase.com
- [ ] Create project: `lev8` (region: nearest to Coral Springs, FL)
- [ ] Generate service role key
- [ ] Download SQL schema files (provided in Planning.md)
- [ ] Run initial schema migration script
- **Estimated:** 30 min
- **Depends:** Nothing

**1.1.5** ✅ Connect Next.js to Supabase
- [ ] Install: `npm install @supabase/supabase-js`
- [ ] Create `lib/supabase.ts` with client and service client
- [ ] Add Supabase env variables to `.env.local.example` and `.env.local`
- [ ] Test connection with simple query
- **Estimated:** 30 min
- **Depends:** 1.1.2, 1.1.4

**1.1.6** ✅ Set up Vercel project
- [ ] Connect GitHub repo to Vercel
- [ ] Configure environment variables in Vercel dashboard
- [ ] Set up automatic deployments on main branch push
- [ ] Verify preview deployments work on PR
- **Estimated:** 20 min
- **Depends:** 1.1.1

**1.1.7** ✅ Configure domain DNS (lev8.ai)
- [ ] In Vercel project settings, add custom domain: lev8.ai
- [ ] Vercel provides DNS records to add
- [ ] Go to GoDaddy DNS management for lev8.ai
- [ ] Add DNS records from Vercel
- [ ] Wait for DNS propagation (24-48 hours)
- [ ] Verify HTTPS certificate auto-provisioned
- **Estimated:** 20 min (plus 24-48h for DNS propagation)
- **Depends:** 1.1.6

**1.1.8** ✅ Set up CI/CD pipeline
- [ ] Create `.github/workflows/test.yml` for running tests on PR
- [ ] Create `.github/workflows/lint.yml` for linting on PR
- [ ] Create `.github/workflows/build.yml` for build verification
- [ ] Verify workflows run on push to feature branch
- **Estimated:** 45 min
- **Depends:** 1.1.1

---

### Epic 1.2: Database Schema & RLS 📋

**1.2.1** ✅ Create core database tables
- [ ] Create table: `health_systems`
- [ ] Create table: `programs`
- [ ] Create table: `academic_classes`
- [ ] Create table: `user_profiles`
- [ ] Create table: `residents`
- [ ] Create table: `faculty`
- [ ] Create table: `device_trusts`
- [ ] Run migrations: `supabase db push`
- [ ] Verify tables in Supabase dashboard
- **Estimated:** 1 hour
- **Depends:** 1.1.4

**1.2.2** ✅ Create voice journal table
- [ ] Create table: `grow_voice_journal` (columns per schema)
- [ ] Set up Supabase Storage bucket: `voice_journal` (private)
- [ ] Configure encryption for storage bucket
- [ ] Run migration: `supabase db push`
- **Estimated:** 30 min
- **Depends:** 1.2.1

**1.2.3** ✅ Create module tables
- [ ] Create table: `module_buckets`
- [ ] Create table: `modules`
- [ ] Run migration: `supabase db push`
- [ ] Create seed data: Learn, Grow, Understand buckets
- **Estimated:** 30 min
- **Depends:** 1.2.1

**1.2.4** ✅ Create audit logs table
- [ ] Create table: `audit_logs` (for compliance)
- [ ] Run migration: `supabase db push`
- **Estimated:** 20 min
- **Depends:** 1.2.1

**1.2.5** ✅ Set up RLS policies
- [ ] Enable RLS on grow_voice_journal (owner-only access)
- [ ] Enable RLS on user_profiles (self + admin)
- [ ] Enable RLS on residents (program-level visibility)
- [ ] Enable RLS on audit_logs (super admin only)
- [ ] Test RLS policies with different roles
- [ ] Document policy logic in code comments
- **Estimated:** 1.5 hours
- **Depends:** 1.2.1, 1.2.2, 1.2.3

**1.2.6** ✅ Set up Supabase Auth
- [ ] Enable email auth in Supabase dashboard
- [ ] Configure email templates (verification, password reset)
- [ ] Set up JWT secret
- [ ] Generate API keys (anon, service role)
- [ ] Test auth endpoints with Supabase API
- **Estimated:** 30 min
- **Depends:** 1.1.4

---

### Epic 1.3: Authentication & Authorization 📋

**1.3.1** ✅ Create auth API routes
- [ ] Create: `app/api/auth/register.ts` (email/password signup)
- [ ] Create: `app/api/auth/login.ts` (email/password login)
- [ ] Create: `app/api/auth/logout.ts` (clear session)
- [ ] Create: `app/api/auth/verify-2fa.ts` (TOTP verification)
- [ ] Create: `app/api/auth/trust-device.ts` (device trust logic)
- [ ] Create: `app/api/auth/session.ts` (get current session)
- [ ] Add input validation to all routes
- [ ] Add error handling and proper HTTP status codes
- **Estimated:** 2 hours
- **Depends:** 1.1.5, 1.2.6

**1.3.2** ✅ Install & set up 2FA (TOTP)
- [ ] Install: `npm install speakeasy qrcode`
- [ ] Create utility functions: generateTOTP, verifyTOTP
- [ ] Create QR code generator for authenticator apps
- [ ] Add TOTP secret storage in user_profiles
- [ ] Test with Google Authenticator / Authy
- **Estimated:** 1 hour
- **Depends:** 1.3.1

**1.3.3** ✅ Implement device trust system
- [ ] Create device fingerprinting function (user-agent + IP hash)
- [ ] Store device trust in `device_trusts` table
- [ ] Implement 30-day expiry logic
- [ ] Check device trust on login (skip 2FA if trusted & valid)
- [ ] API endpoint to list/revoke trusted devices
- **Estimated:** 1.5 hours
- **Depends:** 1.3.1, 1.2.1

**1.3.4** ✅ Create seed data script
- [ ] Create: `scripts/seed.sql`
- [ ] Insert: Memorial Hospital West institution
- [ ] Insert: Emergency Medicine program
- [ ] Insert: PGY-1, PGY-2, PGY-3 classes
- [ ] Insert: 8 test users (you, 3 faculty, 4 residents)
- [ ] Insert: Module buckets (Learn, Grow, Understand)
- [ ] Run seed script: `supabase db push && supabase db seed scripts/seed.sql`
- [ ] Verify data in Supabase dashboard
- **Estimated:** 1 hour
- **Depends:** 1.2.1, 1.2.3

**1.3.5** ✅ Set up auth context & hooks
- [ ] Create: `context/AuthContext.tsx` (user, loading, logout)
- [ ] Create: `hooks/useAuth.ts` (access auth context)
- [ ] Create: `hooks/useRequireAuth.ts` (redirect if not logged in)
- [ ] Wrap app with AuthProvider
- [ ] Test auth state persistence on page refresh
- **Estimated:** 45 min
- **Depends:** 1.3.1

**1.3.6** ✅ Create protected routes wrapper
- [ ] Create: `app/(dashboard)/layout.tsx` (protected route group)
- [ ] Create: `components/ProtectedRoute.tsx` (redirect if not auth)
- [ ] Set up route structure: (auth), (dashboard), (app)
- [ ] Test: Unauthenticated users redirected to login
- [ ] Test: Authenticated users can access dashboard
- **Estimated:** 45 min
- **Depends:** 1.3.5

---

### Epic 1.4: UI Foundation & Layout 📋

**1.4.1** ✅ Create landing/login page
- [ ] Create: `app/(auth)/login/page.tsx`
- [ ] Design: Email input, password input, login button
- [ ] Add: "Don't have account?" link to register
- [ ] Add: "Forgot password?" link
- [ ] Integrate: POST /api/auth/login
- [ ] Styling: Clean, healthcare-appropriate design
- [ ] Test: Login flow with seed user
- **Estimated:** 1 hour
- **Depends:** 1.3.1, 1.1.3

**1.4.2** ✅ Create registration page
- [ ] Create: `app/(auth)/register/page.tsx`
- [ ] Design: Form fields (first/last name, email, phone, program details)
- [ ] Add: Medical school dropdown (or free text for MVP)
- [ ] Add: Specialty dropdown (or free text for MVP)
- [ ] Add: Program selection (Memorial Hospital West)
- [ ] Integrate: POST /api/auth/register
- [ ] Styling: Consistent with login page
- [ ] Test: Registration flow, validation
- **Estimated:** 1.5 hours
- **Depends:** 1.3.1, 1.1.3

**1.4.3** ✅ Create 2FA verification page
- [ ] Create: `app/(auth)/verify-2fa/page.tsx`
- [ ] Design: TOTP code input (6 digits), submit button
- [ ] Add: "Can't use authenticator?" link (future recovery codes)
- [ ] Add: "Trust this device for 30 days" checkbox
- [ ] Integrate: POST /api/auth/verify-2fa
- [ ] Styling: Consistent with auth pages
- [ ] Test: 2FA flow with real authenticator app
- **Estimated:** 1 hour
- **Depends:** 1.3.2

**1.4.4** ✅ Create dashboard layout
- [ ] Create: `app/(dashboard)/layout.tsx`
- [ ] Design: Left sidebar (collapsible), main content area
- [ ] Add: Sidebar navigation (Dashboard, Modules, Settings)
- [ ] Add: Logo, user menu (top-right)
- [ ] Add: Settings icon (bottom-left)
- [ ] Styling: Responsive, dark/light mode ready
- [ ] Test: Sidebar collapse/expand, navigation
- **Estimated:** 1.5 hours
- **Depends:** 1.1.3, 1.3.5

**1.4.5** ✅ Create dashboard home page
- [ ] Create: `app/(dashboard)/page.tsx`
- [ ] Design: Welcome message, quick stats (residents, entries)
- [ ] Add: Recent voice journal entries
- [ ] Add: Quick action buttons (Record Voice Journal, View Settings)
- [ ] Styling: Dashboard aesthetic
- **Estimated:** 1 hour
- **Depends:** 1.4.4

---

### Epic 1.5: Voice Journal Recording UI 📋

**1.5.1** ✅ Create VoiceJournalRecorder component
- [x] Create: `components/voice-journal/VoiceJournalRecorder.tsx`
- [x] Feature: Record button (start/stop)
- [x] Feature: Visual waveform (or timer) during recording
- [x] Feature: Playback preview of recorded audio
- [x] Feature: Re-record option
- [x] Feature: Save button (upload to backend)
- [x] Feature: Cancel button
- [x] State: Recording state, audio blob, upload status
- [x] Error handling: Microphone permission denied, audio errors
- [x] Styling: Clean, intuitive UI
- **Estimated:** 2 hours
- **Depends:** 1.1.3
- **Status:** ✅ COMPLETE

**1.5.2** ✅ Create Voice Journal list page
- [x] Create: `app/(dashboard)/modules/grow/voice-journal/page.tsx`
- [x] Design: List of user's voice journal entries
- [x] Columns: Date, duration, transcription preview, status, actions
- [x] Feature: Filter by date range (future enhancement)
- [x] Feature: Search in transcriptions (future enhancement)
- [x] Feature: Pagination (if >20 entries)
- [x] Styling: Clean table or card layout
- **Estimated:** 1.5 hours
- **Depends:** 1.1.3
- **Status:** ✅ COMPLETE

**1.5.3** ✅ Create Voice Journal entry detail page
- [x] Create: `app/(dashboard)/modules/grow/voice-journal/[id]/page.tsx`
- [x] Design: Full transcription, Claude summary, audio playback
- [x] Feature: Play/pause audio
- [x] Feature: Show timestamp of entry
- [x] Feature: Show confidence score of transcription
- [x] Feature: Delete entry button (owner only)
- [x] Styling: Clean, readable layout
- **Estimated:** 1 hour
- **Depends:** 1.1.3
- **Status:** ✅ COMPLETE

**1.5.4** ✅ Create Voice Journal layout
- [x] Create: `app/(dashboard)/modules/grow/layout.tsx`
- [x] Design: Grow bucket header, navigation to Voice Journal
- [x] Add: "Record new entry" button
- [x] Add: Info text about privacy ("Only you can see these entries")
- **Estimated:** 30 min
- **Depends:** 1.4.4
- **Status:** ✅ COMPLETE

---

### Epic 1.6: Voice Journal Backend - Upload & Storage 📋

**1.6.1** ✅ Create voice journal upload API route
- [x] Create: `app/api/voice-journal/upload/route.ts`
- [x] Feature: Accept multipart/form-data (audio file)
- [x] Feature: Validate user authentication
- [x] Feature: Upload to Supabase Storage
- [x] Feature: Create database record in grow_voice_journal
- [x] Feature: Return entry ID and status: "uploading"
- [x] Error handling: Invalid file, upload failure, auth failure
- [x] Estimated file size: <50MB per recording
- **Estimated:** 1.5 hours
- **Depends:** 1.2.2, 1.1.5
- **Status:** ✅ COMPLETE

**1.6.2** ✅ Create voice journal GET routes
- [x] Create: `app/api/voice-journal/route.ts` (list entries)
  - Feature: Return user's entries (paginated)
  - Feature: Include transcription, summary, status
  - Feature: Order by created_at DESC
- [x] Create: `app/api/voice-journal/[id]/route.ts` (get single entry)
  - Feature: Return full entry (transcription + summary)
  - Feature: Verify user ownership (RLS)
- **Estimated:** 1 hour
- **Depends:** 1.2.2, 1.1.5
- **Status:** ✅ COMPLETE

**1.6.3** ✅ Create voice journal DELETE route
- [x] Create: `app/api/voice-journal/[id]/route.ts` (DELETE method)
- [x] Feature: Delete audio file from Supabase Storage
- [x] Feature: Delete database record
- [x] Feature: Verify user ownership
- [x] Error handling: Record not found, deletion failure
- **Estimated:** 45 min
- **Depends:** 1.2.2, 1.1.5
- **Status:** ✅ COMPLETE

**1.6.4** ✅ Set up Supabase Storage bucket
- [x] Create bucket: `voice_journal` (private)
- [x] Configure: Auto-delete files after 90 days (via Supabase policy)
- [x] Configure: Encryption enabled
- [x] Configure: RLS policies (only user can read their files)
- [x] Test: Upload and retrieve audio file
- **Estimated:** 30 min
- **Depends:** 1.1.4
- **Status:** ✅ COMPLETE

---

### Epic 1.7: Voice Journal Backend - Transcription 📋

**1.7.1** ✅ Create Whisper transcription integration
- [x] Install: `npm install openai`
- [x] Create: `lib/openai.ts` (Whisper client setup)
- [x] Create: `lib/transcription.ts` (transcribeAudio function)
- [x] Feature: Call OpenAI Whisper API with audio file
- [x] Feature: Extract transcription text
- [x] Feature: Return confidence score
- [x] Error handling: API errors, timeout, invalid audio
- [x] Testing: Test with sample audio files
- **Estimated:** 1 hour
- **Depends:** 1.1.5
- **Status:** ✅ COMPLETE

**1.7.2** ✅ Create transcription job handler
- [x] Create: `lib/jobs/transcriptionJob.ts`
- [x] Feature: Get audio from Supabase Storage
- [x] Feature: Call Whisper API
- [x] Feature: Update database record with transcription
- [x] Feature: Trigger summarization job after completion
- [x] Error handling: Retry logic (3 attempts), failure logging
- **Estimated:** 1 hour
- **Depends:** 1.7.1, 1.6.1
- **Status:** ✅ COMPLETE

**1.7.3** ✅ Create API endpoint for transcription status
- [x] Create: `app/api/voice-journal/[id]/status/route.ts`
- [x] Feature: Return transcription status (uploading, transcribing, summarizing, complete)
- [x] Feature: Frontend polls this endpoint every 10 seconds
- **Estimated:** 30 min
- **Depends:** 1.6.2
- **Status:** ✅ COMPLETE

**1.7.4** ✅ Trigger transcription job on upload
- [x] Modify: `app/api/voice-journal/upload/route.ts`
- [x] Feature: After upload to storage, call transcriptionJob()
- [x] Feature: Handle job response
- [x] For MVP: Call synchronously (might timeout, acceptable)
- [x] For Phase 2: Queue jobs (Bull, Vercel Cron)
- **Estimated:** 30 min
- **Depends:** 1.7.2
- **Status:** ✅ COMPLETE

---

### Epic 1.8: Voice Journal Backend - Summarization 📋

**1.8.1** ✅ Create Claude API integration
- [x] Install: `npm install @anthropic-ai/sdk`
- [x] Create: `lib/claude.ts` (Claude client setup)
- [x] Create: `lib/summarization.ts` (summarizeTranscription function)
- [x] Feature: Call Claude API with transcription text
- [x] Feature: Prompt: "Summarize this medical resident voice journal entry into 2-3 key points"
- [x] Feature: Extract summary from response
- [x] Error handling: API errors, timeout, rate limiting
- **Estimated:** 1 hour
- **Depends:** 1.1.5
- **Status:** ✅ COMPLETE

**1.8.2** ✅ Create summarization job handler
- [x] Create: `lib/jobs/summarizationJob.ts`
- [x] Feature: Get transcription from database
- [x] Feature: Call Claude API to summarize
- [x] Feature: Update database record with summary
- [x] Feature: Update status to "complete"
- [x] Error handling: Retry logic, failure logging
- **Estimated:** 45 min
- **Depends:** 1.8.1
- **Status:** ✅ COMPLETE

**1.8.3** ✅ Trigger summarization job after transcription
- [x] Modify: `lib/jobs/transcriptionJob.ts`
- [x] Feature: After transcription complete, call summarizationJob()
- [x] Feature: Async flow: record uploaded → transcribed → summarized
- **Estimated:** 30 min
- **Depends:** 1.8.2, 1.7.2
- **Status:** ✅ COMPLETE

**1.8.4** ✅ Frontend polling for status updates
- [x] Create: `hooks/useVoiceJournalStatus.ts`
- [x] Feature: Poll `/api/voice-journal/[id]/status` every 10 seconds
- [x] Feature: Update UI as status changes (uploading → transcribing → summarizing → complete)
- [x] Feature: Stop polling when complete
- [x] Feature: Handle timeout (>5 minutes)
- **Estimated:** 45 min
- **Depends:** 1.7.3
- **Status:** ✅ COMPLETE

---

### Epic 1.9: Settings & User Management 📋

**1.9.1** ✅ Create settings page layout
- [ ] Create: `app/(dashboard)/settings/layout.tsx`
- [ ] Design: Tab navigation (Account, Program, Devices)
- [ ] Feature: Show only tabs relevant to user role
- [ ] Styling: Consistent with dashboard
- **Estimated:** 45 min
- **Depends:** 1.4.4

**1.9.2** ✅ Create Account settings tab
- [ ] Create: `app/(dashboard)/settings/account/page.tsx`
- [ ] Feature: Display user profile (first/last name, email, phone)
- [ ] Feature: Edit button to modify profile
- [ ] Feature: Change password form
- [ ] Feature: 2FA setup/disable toggle
- [ ] Feature: View current session info
- [ ] Integrate: PUT /api/users/me (update profile)
- **Estimated:** 1.5 hours
- **Depends:** 1.1.3

**1.9.3** ✅ Create Program settings tab (Program Director only)
- [ ] Create: `app/(dashboard)/settings/program/page.tsx`
- [ ] Feature: Display program info (name, specialty, director)
- [ ] Feature: List of residents (name, email, class)
- [ ] Feature: List of faculty (name, title, email)
- [ ] Feature: List of staff/admins
- [ ] Feature: Show module status (Learn, Grow, Understand)
- [ ] Feature: Future: Enable/disable modules per role
- [ ] Condition: Only show for program_director role
- **Estimated:** 2 hours
- **Depends:** 1.1.3

**1.9.4** ✅ Create Devices/Trust settings tab
- [ ] Create: `app/(dashboard)/settings/devices/page.tsx`
- [ ] Feature: List trusted devices (device name, IP, trust expires at)
- [ ] Feature: Revoke device trust button
- [ ] Feature: Option to revoke all devices
- [ ] Integrate: GET /api/devices/trusted, DELETE /api/devices/trusted/:id
- **Estimated:** 1 hour
- **Depends:** 1.1.3, 1.3.3

**1.9.5** ✅ Create user profile API routes
- [ ] Create: `app/api/users/me.ts` (GET current user, PUT update profile)
- [ ] Create: `app/api/users/directory.ts` (GET program directory)
- [ ] Feature: Validate user auth and ownership
- [ ] Feature: Return appropriate data per role
- **Estimated:** 1 hour
- **Depends:** 1.1.5

---

### Epic 1.10: Module Bucket Navigation 📋

**1.10.1** ✅ Create modules page
- [ ] Create: `app/(dashboard)/modules/page.tsx`
- [ ] Design: Show three buckets (Learn, Grow, Understand) as cards
- [ ] Feature: Click to navigate to bucket
- [ ] Feature: Show bucket descriptions
- [ ] Feature: Show number of modules per bucket (future)
- **Estimated:** 1 hour
- **Depends:** 1.1.3, 1.4.4

**1.10.2** ✅ Create Learn bucket layout
- [ ] Create: `app/(dashboard)/modules/learn/page.tsx`
- [ ] Design: Placeholder showing "Coming soon"
- [ ] Feature: Navigation ready for future modules
- **Estimated:** 30 min
- **Depends:** 1.10.1

**1.10.3** ✅ Create Grow bucket layout
- [ ] Create: `app/(dashboard)/modules/grow/page.tsx`
- [ ] Design: Show Voice Journal as only module
- [ ] Feature: Link to Voice Journal
- **Estimated:** 30 min
- **Depends:** 1.10.1

**1.10.4** ✅ Create Understand bucket layout
- [ ] Create: `app/(dashboard)/modules/understand/page.tsx`
- [ ] Design: Placeholder showing "Coming soon"
- [ ] Feature: Navigation ready for future modules
- **Estimated:** 30 min
- **Depends:** 1.10.1

**1.10.5** ✅ Create modules API endpoint
- [ ] Create: `app/api/modules/index.ts`
- [ ] Feature: GET /api/modules → return all buckets and modules
- [ ] Feature: GET /api/modules?bucket=learn → filter by bucket
- [ ] Feature: Filter by user role (role-based visibility)
- **Estimated:** 1 hour
- **Depends:** 1.1.5, 1.2.3

---

### Epic 1.11: Testing 📋

**1.11.1** ✅ Set up testing infrastructure
- [ ] Install: `npm install --save-dev jest @testing-library/react @testing-library/jest-dom`
- [ ] Create: `jest.config.ts`
- [ ] Create: `__tests__/setup.ts`
- [ ] Create: Test utilities (render with providers, etc.)
- **Estimated:** 45 min
- **Depends:** 1.1.2

**1.11.2** ✅ Write unit tests for VoiceJournalRecorder
- [ ] Create: `__tests__/components/voice-journal/VoiceJournalRecorder.test.tsx`
- [ ] Test: Component renders correctly
- [ ] Test: Record button starts recording
- [ ] Test: Stop button stops recording
- [ ] Test: Preview button plays audio
- [ ] Test: Save button triggers upload
- [ ] Target: >80% code coverage
- **Estimated:** 1.5 hours
- **Depends:** 1.11.1, 1.5.1

**1.11.3** ✅ Write API route tests
- [ ] Create: `__tests__/api/auth/login.test.ts`
- [ ] Create: `__tests__/api/voice-journal/upload.test.ts`
- [ ] Test: Success cases
- [ ] Test: Error cases (invalid input, auth failure, etc.)
- [ ] Test: Database operations
- [ ] Target: >80% code coverage
- **Estimated:** 2 hours
- **Depends:** 1.11.1, 1.3.1, 1.6.1

**1.11.4** ✅ Write integration tests
- [ ] Test: Complete auth flow (register → login → 2FA → dashboard)
- [ ] Test: Voice journal flow (record → upload → transcribe → view)
- [ ] Test: Settings management
- **Estimated:** 2 hours
- **Depends:** 1.11.1

**1.11.5** ✅ Test RLS policies
- [ ] Manual test: Resident can only see own voice journals
- [ ] Manual test: Program director cannot access voice journals
- [ ] Manual test: Super admin can access audit logs
- [ ] Document test results
- **Estimated:** 1 hour
- **Depends:** 1.2.5

---

### Epic 1.12: Deployment & Documentation 📋

**1.12.1** ✅ Create README.md
- [ ] Overview of project
- [ ] Local development setup
- [ ] Environment variables template
- [ ] Database setup instructions
- [ ] Running tests
- [ ] Deployment instructions
- **Estimated:** 1 hour
- **Depends:** 1.1.1

**1.12.2** ✅ Create VERSIONS.md
- [ ] Template for session documentation
- [ ] First entry: Session 1 summary
- [ ] Git commit references
- [ ] Features built, tests added
- **Estimated:** 30 min
- **Depends:** 1.1.1

**1.12.3** ✅ Document API endpoints
- [ ] Create: `API_DOCUMENTATION.md`
- [ ] Document: All auth endpoints (with request/response examples)
- [ ] Document: All voice journal endpoints
- [ ] Document: All user endpoints
- [ ] Document: All module endpoints
- **Estimated:** 1.5 hours
- **Depends:** 1.3.1, 1.6.1, 1.9.5

**1.12.4** ✅ Final deployment to www.lev8.ai
- [ ] Run full test suite: `npm run test`
- [ ] Run linter: `npm run lint`
- [ ] Build locally: `npm run build`
- [ ] Verify no errors
- [ ] Commit final changes: `git commit -m "MVP complete: Core platform + Voice Journal"`
- [ ] Push to main: `git push origin main`
- [ ] Monitor Vercel deployment
- [ ] Verify www.lev8.ai loads correctly
- [ ] Test login with seed user
- [ ] Test voice journal flow end-to-end
- **Estimated:** 1 hour
- **Depends:** All Epic tasks

**1.12.5** ✅ Create user guide
- [ ] Guide: How to register and login
- [ ] Guide: Setting up 2FA and device trust
- [ ] Guide: Recording a voice journal entry
- [ ] Guide: Viewing voice journal entries
- [ ] Guide: Accessing settings and managing profile
- **Estimated:** 1 hour
- **Depends:** 1.12.1

---

## Summary: Phase 1 Totals

**Total Tasks:** 55  
**Total Estimated Time:** ~50-55 hours  
**Recommended Pacing:** 3 weeks (weeks 1-3)

**Weekly Breakdown:**
- **Week 1:** Epics 1.1-1.4 (Project setup, database, auth, UI foundation)
- **Week 2:** Epics 1.5-1.8 (Voice Journal recording, transcription, summarization)
- **Week 3:** Epics 1.9-1.12 (Settings, modules, testing, deployment)

---

## PHASE 2: Module Content & First Use Cases (Weeks 4-6)

**Status:** In Progress  
**Theme:** Create first complete, production-ready use cases for each learning module

**Phase 2 Overview:**
- Implement sophisticated v2 vignette architecture for Difficult Conversations
- Create first working clinical case scenario
- Build first EKG & ACLS simulation scenario
- Develop first Running the Board configuration
- Establish content authoring workflows and templates

**Success Criteria:**
- Each module has at least one fully functional, educationally validated use case
- All modules support the advanced features (phase-based conversations, emotional tracking, branching logic)
- Content can be easily authored and imported by educators
- Assessment and analytics systems are fully operational

---

### Epic 2.1: Difficult Conversations - First Use Case (MED-001) 📋

**Status:** In Progress  
**Priority:** High  
**Estimated:** 40-50 hours (1-2 weeks)  
**Theme:** Implement sophisticated v2 vignette architecture starting with MED-001 (Adenosine Error) case

**Overview:**
Implement the 5-file vignette architecture (clinical scenario, avatar profiles, conversation design, index, educator guide) with phase-based conversations, emotional state tracking, dynamic prompt layers, and semantic assessment. This establishes the foundation for all future Difficult Conversations vignettes.

**Key Features:**
- 5-file modular architecture for vignette authoring
- Phase-based conversation flow (opening, disclosure, emotional_processing, clinical_questions, next_steps)
- Continuous emotional state tracking (0-1 scale with modifiers)
- Branching logic based on learner performance
- Dynamic prompt layers (emotional state, conversation history, information boundaries, difficulty)
- Semantic assessment with pattern recognition
- Multi-model AI support (Gemini and Claude)
- Voice avatar integration hooks (future-ready)

**Deliverables:**
1. Complete MED-001 vignette data structure
2. Refactored conversation engine supporting v2 architecture
3. Phase-based UI components
4. Assessment system with semantic pattern matching
5. Gemini integration alongside Claude
6. Database schema extensions for v2 structure
7. Migration tools for importing v2 vignettes
8. Documentation for vignette authoring

---

### Epic 2.2: Clinical Cases - First Use Case (Future) 📋

**Status:** Planned  
**Priority:** High  
**Estimated:** 20-30 hours

**Overview:**
Create first complete clinical case with step-by-step progression, questions, scoring rubric, and educational objectives.

---

### Epic 2.3: EKG & ACLS - First Scenario (Future) 📋

**Status:** Planned  
**Priority:** Medium  
**Estimated:** 25-35 hours

**Overview:**
Implement first ACLS scenario with full state machine, EKG rendering, clinical decision points, and performance tracking.

---

### Epic 2.4: Running the Board - First Configuration (Future) 📋

**Status:** Planned  
**Priority:** Medium  
**Estimated:** 30-40 hours

**Overview:**
Build first multi-patient board configuration with dynamic patient progression, resource management, and prioritization challenges.

---

## PHASE 2B: Module Scaffolding & Credit System (Future)

**NOT DETAILED YET** - Will be created after Phase 2 complete. Will include:
- Basic credit system backend (no payments yet)
- Monitoring & error handling (Sentry)
- User feedback incorporation

---

## Epic 2.1: Difficult Conversations - First Use Case (MED-001) 📋

**Status:** Phase 5 Complete, Ready for Testing  
**Priority:** High  
**Estimated:** 40-50 hours (1-2 weeks)  
**Started:** November 6, 2025  
**Latest Update:** January 6, 2025

### Phase 1: Data Structure & Type Definitions (4-5 hours)

**2.1.1** ✅ Create v2 Type Definitions
- [x] Create `lib/types/difficult-conversations.ts` with complete v2 structure types
- [x] Define `VignetteV2` interface matching 5-file architecture
- [x] Define `ConversationPhase` with branching logic
- [x] Define `EmotionalState` tracking types
- [x] Define `AvatarProfile` with psychology layers
- [x] Define `ConversationContext` with dynamic layers
- [x] Update `lib/types/modules.ts` to extend Vignette interface
- [x] Create TypeScript type exports for all components
- **Estimated:** 4-5 hours
- **Depends:** Nothing

### Phase 2: Vignette Data Migration (3-4 hours)

**2.1.2** ✅ Convert MED-001 to Database Format
- [x] Create `lib/vignettes/v2/` directory structure
- [x] Convert MED-001 TypeScript files to consolidated JSON structure
- [x] Create `lib/vignettes/v2/MED-001-adenosine-error.ts` export
- [x] Validate data structure against type definitions
- [x] Create migration script `scripts/import-v2-vignette.ts`
- [x] Create API endpoint `POST /api/vignettes/v2/import`
- [ ] Test importing MED-001 into Supabase
- [ ] Verify data integrity after import
- **Estimated:** 3-4 hours
- **Depends:** 2.1.1

### Phase 3: Conversation Engine Refactor (12-15 hours)

**2.1.3** ✅ Build Phase Manager
- [x] Create `lib/conversations/v2/PhaseManager.ts`
- [x] Implement phase transition logic
- [x] Implement branching condition evaluation
- [x] Add phase objective tracking
- [x] Create phase completion criteria
- [ ] Add unit tests for phase transitions
- **Estimated:** 4-5 hours
- **Depends:** 2.1.1

**2.1.4** ✅ Build Emotional State Tracker
- [x] Create `lib/conversations/v2/EmotionalStateTracker.ts`
- [x] Implement continuous 0-1 emotional scale
- [x] Implement modifier system (empathy, jargon, defensiveness, etc.)
- [x] Add emotional state persistence to session data
- [x] Create emotional threshold triggers
- [x] Add recalibration mechanisms
- [ ] Add unit tests for state tracking
- **Estimated:** 3-4 hours
- **Depends:** 2.1.1

**2.1.5** ✅ Build Dynamic Prompt Builder
- [x] Create `lib/conversations/v2/PromptBuilder.ts`
- [x] Implement base prompt construction
- [x] Implement dynamic layer integration:
  - Emotional state layer (updates every response)
  - Conversation history layer (cumulative context)
  - Information boundary layer (phase-limited knowledge)
  - Difficulty adjustment layer (performance-based)
- [x] Create prompt templates for each phase
- [x] Implement avatar personality injection
- [x] Add prompt optimization for token efficiency
- **Estimated:** 4-5 hours
- **Depends:** 2.1.3, 2.1.4

**2.1.6** ✅ Build Conversation Engine
- [x] Create `lib/conversations/v2/ConversationEngine.ts`
- [x] Integrate PhaseManager, EmotionalStateTracker, PromptBuilder
- [x] Implement conversation flow orchestration
- [x] Add session state management
- [x] Implement automatic phase progression
- [x] Add error handling and recovery
- **Estimated:** 3-4 hours
- **Depends:** 2.1.5

### Phase 4: Multi-Model AI Integration (6-8 hours)

**2.1.7** ✅ Create Model Provider Interface
- [x] Create `lib/conversations/v2/modelProviders/ConversationProvider.ts` interface
- [x] Define unified interface methods (getResponse, streamResponse)
- [x] Document expected behavior and response format
- **Estimated:** 1 hour
- **Depends:** Nothing

**2.1.8** ✅ Implement Gemini Provider
- [x] Install `@google/generative-ai` package
- [x] Create `lib/conversations/v2/modelProviders/GeminiProvider.ts`
- [x] Implement ConversationProvider interface
- [x] Configure Gemini 1.5 Pro model
- [x] Add response parsing and error handling
- [x] Add rate limiting and retry logic
- [ ] Test with MED-001 vignette
- **Estimated:** 3-4 hours
- **Depends:** 2.1.7

**2.1.9** ✅ Refactor Claude Provider
- [x] Create `lib/conversations/v2/modelProviders/ClaudeProvider.ts`
- [x] Refactor existing Claude integration to use new interface
- [x] Implement ConversationProvider interface
- [x] Maintain backward compatibility
- [x] Add model selection (Haiku vs Sonnet) based on difficulty
- [ ] Test with MED-001 vignette
- **Estimated:** 2-3 hours
- **Depends:** 2.1.7

**2.1.10** ✅ Update API Routes
- [x] Create `app/api/conversations/v2/chat/route.ts`
- [x] Implement model selection based on vignette `aiModel` field
- [x] Integrate with ConversationEngine
- [x] Add request validation
- [x] Add error handling
- [x] Maintain legacy `/api/conversations/chat` for backward compatibility
- **Estimated:** 2-3 hours
- **Depends:** 2.1.6, 2.1.8, 2.1.9

### Phase 5: UI Components Enhancement (8-10 hours) ✅

**2.1.11** ✅ Refactor Conversation Interface
- [x] Update `components/modules/difficult-conversations/ConversationInterface.tsx`
- [x] Integrate with new ConversationEngine
- [x] Add phase awareness and display
- [x] Add emotional state visualization (optional)
- [x] Add branching hint system
- [x] Update message rendering for phase context
- [ ] Add phase-specific guidance
- **Estimated:** 5-6 hours
- **Depends:** 2.1.6

**2.1.12** ✅ Create Phase Indicator Component
- [x] Create `components/modules/difficult-conversations/PhaseIndicator.tsx`
- [x] Display current phase and progress
- [x] Show phase objectives
- [x] Add visual phase progression
- [x] Make it collapsible/expandable
- **Estimated:** 2-3 hours
- **Depends:** 2.1.11
- **Status:** ✅ COMPLETE

**2.1.13** ✅ Create Emotional State Indicator (Optional)
- [x] Create `components/modules/difficult-conversations/EmotionalStateIndicator.tsx`
- [x] Display current emotional state (for learner feedback)
- [x] Show emotional trajectory
- [x] Add color-coded indicators
- [x] Make it toggleable (show/hide)
- **Estimated:** 2-3 hours
- **Depends:** 2.1.11
- **Status:** ✅ COMPLETE

**2.1.14** ✅ Create Branching Hint Component
- [x] Create `components/modules/difficult-conversations/BranchingHint.tsx`
- [x] Display hints when learner is stuck
- [x] Show guidance based on current phase
- [x] Add escalation prevention hints
- **Estimated:** 2-3 hours
- **Depends:** 2.1.11
- **Status:** ✅ COMPLETE

### Phase 6: Assessment System (6-8 hours)

**2.1.15** Build Assessment Engine
- [ ] Create `lib/conversations/v2/AssessmentEngine.ts`
- [ ] Implement semantic pattern matching
- [ ] Add anti-pattern detection
- [ ] Create weighted scoring system
- [ ] Implement real-time assessment updates
- **Estimated:** 3-4 hours
- **Depends:** 2.1.1

**2.1.16** Build Pattern Matcher
- [ ] Create `lib/conversations/v2/PatternMatcher.ts`
- [ ] Implement empathy pattern recognition
- [ ] Implement clarity pattern recognition
- [ ] Implement accountability pattern recognition
- [ ] Add pattern weight calculation
- [ ] Add unit tests for pattern matching
- **Estimated:** 3-4 hours
- **Depends:** 2.1.15

**2.1.17** Update Analytics Service
- [ ] Update `lib/modules/analytics.ts`
- [ ] Implement semantic assessment methods
- [ ] Add phase-based scoring
- [ ] Integrate with AssessmentEngine
- [ ] Update session analytics storage
- **Estimated:** 2-3 hours
- **Depends:** 2.1.16

### Phase 7: Database & API Updates (4-5 hours)

**2.1.18** Update Database Schema (if needed)
- [ ] Review `vignettes.vignette_data` JSONB structure
- [ ] Document expected v2 schema
- [ ] Add indexes if needed for performance
- [ ] Create migration if schema changes required
- **Estimated:** 1-2 hours
- **Depends:** 2.1.2

**2.1.19** Update Session Storage
- [ ] Update `app/api/conversations/sessions/route.ts`
- [ ] Add phase tracking to session_data
- [ ] Add emotional state to metrics
- [ ] Add branch path tracking
- [ ] Ensure backward compatibility
- **Estimated:** 2-3 hours
- **Depends:** 2.1.3, 2.1.4

### Phase 8: Testing & Validation (6-8 hours)

**2.1.20** Unit Tests
- [ ] Test PhaseManager phase transitions
- [ ] Test EmotionalStateTracker state updates
- [ ] Test PromptBuilder prompt construction
- [ ] Test AssessmentEngine pattern matching
- [ ] Test model providers (Gemini and Claude)
- **Estimated:** 3-4 hours
- **Depends:** All previous tasks

**2.1.21** Integration Tests
- [ ] Test full conversation flow through all phases
- [ ] Test emotional state progression
- [ ] Test branching logic
- [ ] Test assessment accuracy
- [ ] Test model switching
- **Estimated:** 2-3 hours
- **Depends:** 2.1.20

**2.1.22** Manual Testing & Validation
- [ ] Test MED-001 vignette end-to-end
- [ ] Test all difficulty levels (beginner, intermediate, advanced)
- [ ] Validate phase transitions
- [ ] Validate emotional state tracking
- [ ] Validate assessment scores
- [ ] Test with educators for feedback
- **Estimated:** 3-4 hours
- **Depends:** 2.1.21

### Phase 9: Documentation (3-4 hours)

**2.1.23** Technical Documentation
- [ ] Document v2 architecture
- [ ] Document vignette authoring process
- [ ] Create vignette template
- [ ] Document API endpoints
- [ ] Document type definitions
- **Estimated:** 2-3 hours
- **Depends:** All implementation tasks

**2.1.24** User Documentation
- [ ] Update educator guide for v2 structure
- [ ] Create vignette authoring guide
- [ ] Document phase-based conversation flow
- [ ] Document assessment system
- **Estimated:** 1-2 hours
- **Depends:** 2.1.23

---

## EPIC 2.10: Privacy Framework & Data Consent (Future Enhancement) 📋

**Status:** Planned (Not Started)  
**Priority:** High (Before Beta Launch)  
**Estimated:** 21-27 hours (3-4 days)  
**See:** `docs/PRIVACY-FRAMEWORK-ANALYSIS.md` for full implementation details

### Phase 1: Database Changes (2-3 hours)

**2.10.1** Database Schema Updates
- [ ] Add Tier 2 fields to `user_profiles`:
  - `timezone VARCHAR DEFAULT 'America/New_York'`
  - `language VARCHAR DEFAULT 'en'`
  - `communication_preferences JSONB`
- [ ] Make Tier 3 fields optional in `residents`:
  - `ALTER TABLE residents ALTER COLUMN program_id DROP NOT NULL`
  - Add `institutional_data_consent_at TIMESTAMPTZ`
  - Add `institutional_data_consent_version VARCHAR`
- [ ] Create `user_sharing_preferences` table with Tier 4 toggles:
  - `share_learning_interests BOOLEAN DEFAULT false`
  - `share_experience_level BOOLEAN DEFAULT false`
  - `share_previous_outcomes BOOLEAN DEFAULT false`
  - `share_engagement_visibility BOOLEAN DEFAULT false`
  - `share_profile_discoverability BOOLEAN DEFAULT false`
- [ ] Add RLS policies for `user_sharing_preferences`
- [ ] Create trigger to auto-insert preferences on user registration
- [ ] Backfill existing users
- **Estimated:** 2-3 hours
- **Depends:** Nothing (additive changes)

### Phase 2: API Routes (3-4 hours)

**2.10.2** Privacy Preferences API
- [ ] Create `GET /api/users/me/privacy` - fetch current preferences
- [ ] Create `PUT /api/users/me/privacy` - update preferences
- [ ] Create `POST /api/users/me/privacy/acknowledge-consent` - track consent
- [ ] Add audit logging for preference changes
- [ ] Write API tests for privacy endpoints
- **Estimated:** 3-4 hours
- **Depends:** 2.10.1

**2.10.3** Registration Flow Updates
- [ ] Update `/api/auth/register` to make Tier 3 fields optional
- [ ] Add consent tracking for institutional data
- [ ] Create `/api/users/me/institutional-consent` endpoint
- [ ] Ensure backward compatibility with existing registrations
- **Estimated:** 1-2 hours
- **Depends:** 2.10.1

### Phase 3: Frontend UI (8-10 hours)

**2.10.4** Privacy Settings Page
- [ ] Create `/app/(dashboard)/settings/privacy/page.tsx`
- [ ] Build `ToggleCard` component for each privacy setting
- [ ] Add 5 toggles with clear descriptions:
  - Share Learning Interests
  - Share Experience Level
  - Share Previous Outcomes
  - Show Engagement to Cohort
  - Profile Discoverability
- [ ] Add "Voice Journal Always Private" callout banner
- [ ] Integrate with `GET/PUT /api/users/me/privacy`
- [ ] Add success/error toast notifications
- [ ] Mobile responsive design
- **Estimated:** 4-5 hours
- **Depends:** 2.10.2

**2.10.5** Simplified Registration Flow
- [ ] Remove Tier 3 fields (medical_school, specialty) from signup form
- [ ] Keep minimal: email, password, name only
- [ ] Update registration UI/UX
- [ ] Add "Complete Your Profile" modal for post-login
- [ ] Add consent checkbox for institutional data
- [ ] Link to `/settings/privacy` for privacy preferences
- **Estimated:** 3-4 hours
- **Depends:** 2.10.3

**2.10.6** Settings Layout Updates
- [ ] Add "Privacy" tab to `/app/(dashboard)/settings/layout.tsx`
- [ ] Update tab icon and ordering
- [ ] Ensure role-based visibility (all users can see Privacy)
- [ ] Test navigation between settings tabs
- **Estimated:** 15 minutes
- **Depends:** 2.10.4

### Phase 4: Analytics Preparation (2-3 hours)

**2.10.7** Privacy-Respecting Analytics Foundation
- [ ] Create `analytics_consented_users` database view
- [ ] Document query patterns for future analytics features
- [ ] Add helper functions for consent-filtered queries
- [ ] Update audit logging to track consent changes
- [ ] Create developer guidelines document
- **Estimated:** 2-3 hours
- **Depends:** 2.10.1

### Phase 5: Testing & Documentation (4-5 hours)

**2.10.8** Comprehensive Testing
- [ ] Database tests: RLS policies, triggers, backfill
- [ ] API tests: authentication, authorization, validation
- [ ] UI tests: toggle functionality, responsive design
- [ ] Integration tests: opt-in/opt-out analytics queries
- [ ] Load testing: performance with 1000+ users
- **Estimated:** 3-4 hours
- **Depends:** 2.10.1 - 2.10.7

**2.10.9** Legal & Compliance Documentation
- [ ] Draft Privacy Policy updates (Tier 1-4 explanations)
- [ ] Update Terms of Service (institutional data sharing)
- [ ] Create Data Retention Policy document
- [ ] Schedule legal review with healthcare privacy lawyer
- [ ] Update user-facing consent language
- **Estimated:** 1-2 hours
- **Depends:** 2.10.8

---

## PHASE 3: Multi-User Testing & Refinement (Weeks 6-8)

**NOT DETAILED YET** - Will be created after Phase 2 complete. Will include:
- Feedback from 8 test users
- UI/UX iterations
- Performance optimization
- Bug fixes and refinements
- Privacy framework implementation (Epic 2.10)
- Final documentation

---

## PHASE 4: Expectations Module - ACGME Compliance Platform

### Epic 4.1: Database & Infrastructure 📋

**4.1.1** ✅ Create ACGME database schema
- [x] Create table: `acgme_requirements` (master catalog)
- [x] Create table: `acgme_compliance_status` (per-program status)
- [x] Create table: `acgme_compliance_evidence` (documents)
- [x] Create table: `acgme_action_items` (remediation tasks)
- [x] Create table: `acgme_compliance_history` (audit log)
- [x] Create table: `acgme_site_visits` (visit records)
- [x] Create table: `acgme_citations` (citations from visits)
- **Completed:** December 2, 2025

**4.1.2** ✅ Create RLS policies for ACGME tables
- [x] Super admin full access to all tables
- [x] Program director full access to program data
- [x] Faculty view access to program data
- [x] Action item assignment-based access
- **Completed:** December 2, 2025

**4.1.3** ✅ Create PostgreSQL helper functions
- [x] `calculate_program_compliance()` - overall compliance score
- [x] `get_compliance_by_category()` - breakdown by category
- [x] `get_upcoming_deadlines()` - action items due soon
- **Completed:** December 2, 2025

**4.1.4** ✅ Create ACGME requirements import script
- [x] Parse `ACGME_Unified_Master_Catalog.json`
- [x] Handle 312 requirements with metadata
- [x] Batch upsert with error handling
- **Completed:** December 2, 2025

---

### Epic 4.2: UI Pages & Components 📋

**4.2.1** ✅ Create Expectations dashboard page
- [x] Compliance score display
- [x] Status summary cards (Compliant, At Risk, Non-Compliant)
- [x] Category breakdown with progress bars
- [x] Upcoming deadlines list
- [x] Quick action buttons
- **Completed:** December 2, 2025

**4.2.2** ✅ Create Requirements browser page
- [x] Search by ID, title, text
- [x] Filter by category, risk level, status
- [x] Expandable section groups
- [x] Status badges with color coding
- [x] View Details modal integration
- **Completed:** December 2, 2025

**4.2.3** ✅ Create Requirement detail modal
- [x] Full requirement text display
- [x] Metadata (category, section, owner, risk)
- [x] Compliance status dropdown (editable)
- [x] Notes textarea
- [x] "View Source PDF in Truths" button (opens new tab)
- [x] Save functionality
- **Completed:** December 2, 2025

**4.2.4** 🔄 Create Action Items page (placeholder)
- [x] Basic page structure
- [ ] Full CRUD functionality
- [ ] Priority and status management
- **Status:** Placeholder complete

**4.2.5** 🔄 Create Site Visits page (placeholder)
- [x] Basic page structure
- [ ] Visit history display
- [ ] Citation tracking
- **Status:** Placeholder complete

---

### Epic 4.3: API Endpoints 📋

**4.3.1** ✅ Create dashboard API
- [x] `/api/expectations/dashboard` - GET
- [x] Compliance score calculation
- [x] Category breakdown
- [x] Upcoming deadlines
- **Completed:** December 2, 2025

**4.3.2** ✅ Create requirements API
- [x] `/api/expectations/requirements` - GET (list all)
- [x] `/api/expectations/requirements/[id]` - GET (single)
- [x] `/api/expectations/requirements/[id]` - PATCH (update status/notes)
- **Completed:** December 2, 2025

**4.3.3** 🔄 Create action items API (placeholder)
- [x] `/api/expectations/action-items` - GET
- [ ] POST, PATCH, DELETE endpoints
- **Status:** Placeholder complete

**4.3.4** 🔄 Create site visits API (placeholder)
- [x] `/api/expectations/site-visits` - GET
- [ ] POST, PATCH, DELETE endpoints
- **Status:** Placeholder complete

---

### Epic 4.4: Navigation & Integration 📋

**4.4.1** ✅ Add Expectations to sidebar
- [x] New expandable "Expectations" section
- [x] Sub-links: Dashboard, Requirements, Action Items, Site Visits
- [x] Proper icons (Lucide)
- **Completed:** December 2, 2025

**4.4.2** ✅ Link to Truths module
- [x] "View Source PDF" opens ACGME CPR document
- [x] Opens in new tab to preserve context
- **Completed:** December 2, 2025

---

## Blocked Tasks

**None currently.** All Phase 1-4 core tasks are complete.

---

## PHASE 5: EQ·PQ·IQ Product Suite (January-February 2026) ✅

**Status:** Complete  
**Theme:** Build the EQ·PQ·IQ evaluation product suite at eqpqiq.com

### Epic 5.1: Interview Assessment Tool ✅

**5.1.1** ✅ Full session lifecycle (create → rate → review → export)
**5.1.2** ✅ 0-100 EQ/PQ/IQ rating with auto-save
**5.1.3** ✅ Z-score normalization engine with toggle
**5.1.4** ✅ Season-wide rank list with decile distribution
**5.1.5** ✅ Interviewer statistics dashboard
**5.1.6** ✅ Built-in interview question guide (15 sub-attributes, 50+ questions)
**5.1.7** ✅ Stripe subscription integration for group sessions
**5.1.8** ✅ Share token collaboration
**5.1.9** ✅ Demo accounts with seeded data
**5.1.10** ✅ CSV export (raw + normalized)

### Epic 5.2: Pulse Check ✅

**5.2.1** ✅ Provider evaluation: 13 EQ/PQ/IQ attributes (1-5 scale)
**5.2.2** ✅ Operational metrics (LOS, Imaging CT/US/MRI, PPH)
**5.2.3** ✅ Sparkline trend visualizations with bezier curves
**5.2.4** ✅ Reports dashboard with site-level rollup
**5.2.5** ✅ Provider Profile Modal (current scores + history)
**5.2.6** ✅ Admin panel: sites, departments, directors, providers
**5.2.7** ✅ CSV import for bulk provider onboarding
**5.2.8** ✅ Frequency management with site-level overrides
**5.2.9** ✅ Cycle management with auto-provisioning
**5.2.10** ✅ Demo accounts with seeded historical data

### Epic 5.3: EQ·PQ·IQ Brand Landing Page ✅

**5.3.1** ✅ Philosophy, use cases, AI analytics, archetyping sections
**5.3.2** ✅ Middleware rewrite: eqpqiq.com / → /eqpqiq-landing
**5.3.3** ✅ Contact email: hello@eqpqiq.com (Google Workspace)

### Epic 5.4: Progress Check Survey System ✅

**5.4.1** ✅ Survey creation (educator assessment / learner self-assessment)
**5.4.2** ✅ Audience targeting: class filter, faculty type filter
**5.4.3** ✅ Token-based email distribution via Resend (48-char hex tokens)
**5.4.4** ✅ Public survey form (`/survey/[token]`) — compact slider design, auto-save, scrollable layout
**5.4.5** ✅ Respondent status tracking (pending / started / completed)
**5.4.6** ✅ Toggle recipients on/off during distribution
**5.4.7** ✅ Add respondents to active surveys after initial distribution
**5.4.8** ✅ View respondent results inline (EQ/PQ/IQ averages with expandable scores)
**5.4.9** ✅ Demo accounts for PD, Faculty, and Resident roles

### Epic 5.5: CCC → Progress Check Rename ✅

**5.5.1** ✅ Database migration: rename tables, columns, session types
**5.5.2** ✅ API route rename: `/api/ccc-sessions` → `/api/progress-check-sessions`
**5.5.3** ✅ API route rename: `/api/v2/sessions/ccc` → `/api/v2/sessions/progress-check`
**5.5.4** ✅ UI references updated across all components

### Epic 5.6: Terminology & Cleanup ✅

**5.6.1** ✅ "Intelligence" → "Quotient" in framework pillar names (database migration)
**5.6.2** ✅ ESLint technical debt cleanup (~300 warnings across 64 files)
**5.6.3** ✅ Warning noise cleanup pass (top-noise files targeted)
**5.6.4** ✅ 0-100 scale migration (from 1.0-5.0 for structured_ratings)
**5.6.5** ✅ Rater type refinement (core_faculty, teaching_faculty, self)

---

## PHASE 6: Enhancements & Integrations (Upcoming)

**Status:** Not Started  
**Theme:** Deepen integrations, automate workflows, expand analytics

### Epic 6.1: Progress Check Integrations

**6.1.1** Survey comments → AI SWOT generation pipeline
**6.1.2** Survey ratings → period_scores aggregation
**6.1.3** Automated survey reminders on configurable cadence
**6.1.4** Read-only survey view for respondents post-submission
- **Estimated:** 15-20 hours

### Epic 6.2: Pulse Check Enhancements

**6.2.1** Voice memo recording + Whisper transcription
**6.2.2** Email reminder automation (connect API to Resend)
**6.2.3** PDF/Presentation export for provider profiles
**6.2.4** Provider self-assessment with gap analysis
- **Estimated:** 20-25 hours

### Epic 6.3: Interview Enhancements

**6.3.1** AI-powered scoring from interview notes
**6.3.2** Season management (activate season_id FK)
**6.3.3** Guest interviewer role
**6.3.4** ERAS/NRMP integration for candidate data import
- **Estimated:** 25-30 hours

### Epic 6.4: Platform-Wide

**6.4.1** Privacy Framework & Data Consent (Epic 2.10 — 4-tier system)
**6.4.2** Credit system for Claude API usage (Stripe billing for Elevate)
**6.4.3** Sentry error monitoring
**6.4.4** Expectations: Action Items and Site Visits full CRUD
- **Estimated:** 30-40 hours

---

## Quick Start Commands

```bash
# 1. Start developing
npm run dev

# 2. Seed test data
supabase db seed scripts/seed.sql

# 3. Run tests
npm run test

# 4. Lint code
npm run lint

# 5. Build and deploy
git add .
git commit -m "Your message"
git push origin main

# 6. Check deployment
# Monitor at: vercel.com dashboard
# Live at: www.lev8.ai + www.eqpqiq.com
```

---

**Last Updated:** February 17, 2026  
**Status:** Phase 5 (EQ·PQ·IQ Product Suite) Complete  
**Next Steps:** See Phase 5+ below for current priorities