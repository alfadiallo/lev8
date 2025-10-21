# Tasks.md: Elevate Implementation Roadmap

**Project:** Elevate (www.lev8.ai)  
**Version:** 1.0 MVP  
**Last Updated:** October 20, 2025  
**Status:** Ready to Begin  

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
- [ ] Create: `components/voice-journal/VoiceJournalRecorder.tsx`
- [ ] Feature: Record button (start/stop)
- [ ] Feature: Visual waveform (or timer) during recording
- [ ] Feature: Playback preview of recorded audio
- [ ] Feature: Re-record option
- [ ] Feature: Save button (upload to backend)
- [ ] Feature: Cancel button
- [ ] State: Recording state, audio blob, upload status
- [ ] Error handling: Microphone permission denied, audio errors
- [ ] Styling: Clean, intuitive UI
- **Estimated:** 2 hours
- **Depends:** 1.1.3

**1.5.2** ✅ Create Voice Journal list page
- [ ] Create: `app/(dashboard)/modules/grow/voice-journal/page.tsx`
- [ ] Design: List of user's voice journal entries
- [ ] Columns: Date, duration, transcription preview, status, actions
- [ ] Feature: Filter by date range (future enhancement)
- [ ] Feature: Search in transcriptions (future enhancement)
- [ ] Feature: Pagination (if >20 entries)
- [ ] Styling: Clean table or card layout
- **Estimated:** 1.5 hours
- **Depends:** 1.1.3

**1.5.3** ✅ Create Voice Journal entry detail page
- [ ] Create: `app/(dashboard)/modules/grow/voice-journal/[id]/page.tsx`
- [ ] Design: Full transcription, Claude summary, audio playback
- [ ] Feature: Play/pause audio
- [ ] Feature: Show timestamp of entry
- [ ] Feature: Show confidence score of transcription
- [ ] Feature: Delete entry button (owner only)
- [ ] Styling: Clean, readable layout
- **Estimated:** 1 hour
- **Depends:** 1.1.3

**1.5.4** ✅ Create Voice Journal layout
- [ ] Create: `app/(dashboard)/modules/grow/layout.tsx`
- [ ] Design: Grow bucket header, navigation to Voice Journal
- [ ] Add: "Record new entry" button
- [ ] Add: Info text about privacy ("Only you can see these entries")
- **Estimated:** 30 min
- **Depends:** 1.4.4

---

### Epic 1.6: Voice Journal Backend - Upload & Storage 📋

**1.6.1** ✅ Create voice journal upload API route
- [ ] Create: `app/api/voice-journal/upload.ts`
- [ ] Feature: Accept multipart/form-data (audio file)
- [ ] Feature: Validate user authentication
- [ ] Feature: Upload to Supabase Storage
- [ ] Feature: Create database record in grow_voice_journal
- [ ] Feature: Return entry ID and status: "uploading"
- [ ] Error handling: Invalid file, upload failure, auth failure
- [ ] Estimated file size: <50MB per recording
- **Estimated:** 1.5 hours
- **Depends:** 1.2.2, 1.1.5

**1.6.2** ✅ Create voice journal GET routes
- [ ] Create: `app/api/voice-journal/route.ts` (list entries)
  - Feature: Return user's entries (paginated)
  - Feature: Include transcription, summary, status
  - Feature: Order by created_at DESC
- [ ] Create: `app/api/voice-journal/[id].ts` (get single entry)
  - Feature: Return full entry (transcription + summary)
  - Feature: Verify user ownership (RLS)
- **Estimated:** 1 hour
- **Depends:** 1.2.2, 1.1.5

**1.6.3** ✅ Create voice journal DELETE route
- [ ] Create: `app/api/voice-journal/[id]/delete.ts`
- [ ] Feature: Delete audio file from Supabase Storage
- [ ] Feature: Delete database record
- [ ] Feature: Verify user ownership
- [ ] Error handling: Record not found, deletion failure
- **Estimated:** 45 min
- **Depends:** 1.2.2, 1.1.5

**1.6.4** ✅ Set up Supabase Storage bucket
- [ ] Create bucket: `voice_journal` (private)
- [ ] Configure: Auto-delete files after 90 days (via Supabase policy)
- [ ] Configure: Encryption enabled
- [ ] Configure: RLS policies (only user can read their files)
- [ ] Test: Upload and retrieve audio file
- **Estimated:** 30 min
- **Depends:** 1.1.4

---

### Epic 1.7: Voice Journal Backend - Transcription 📋

**1.7.1** ✅ Create Whisper transcription integration
- [ ] Install: `npm install openai`
- [ ] Create: `lib/openai.ts` (Whisper client setup)
- [ ] Create: `lib/transcription.ts` (transcribeAudio function)
- [ ] Feature: Call OpenAI Whisper API with audio file
- [ ] Feature: Extract transcription text
- [ ] Feature: Return confidence score
- [ ] Error handling: API errors, timeout, invalid audio
- [ ] Testing: Test with sample audio files
- **Estimated:** 1 hour
- **Depends:** 1.1.5

**1.7.2** ✅ Create transcription job handler
- [ ] Create: `lib/jobs/transcriptionJob.ts`
- [ ] Feature: Get audio from Supabase Storage
- [ ] Feature: Call Whisper API
- [ ] Feature: Update database record with transcription
- [ ] Feature: Trigger summarization job after completion
- [ ] Error handling: Retry logic (3 attempts), failure logging
- **Estimated:** 1 hour
- **Depends:** 1.7.1, 1.6.1

**1.7.3** ✅ Create API endpoint for transcription status
- [ ] Create: `app/api/voice-journal/[id]/status.ts`
- [ ] Feature: Return transcription status (uploading, transcribing, summarizing, complete)
- [ ] Feature: Frontend polls this endpoint every 10 seconds
- **Estimated:** 30 min
- **Depends:** 1.6.2

**1.7.4** ✅ Trigger transcription job on upload
- [ ] Modify: `app/api/voice-journal/upload.ts`
- [ ] Feature: After upload to storage, call transcriptionJob()
- [ ] Feature: Handle job response
- [ ] For MVP: Call synchronously (might timeout, acceptable)
- [ ] For Phase 2: Queue jobs (Bull, Vercel Cron)
- **Estimated:** 30 min
- **Depends:** 1.7.2

---

### Epic 1.8: Voice Journal Backend - Summarization 📋

**1.8.1** ✅ Create Claude API integration
- [ ] Install: `npm install @anthropic-ai/sdk`
- [ ] Create: `lib/claude.ts` (Claude client setup)
- [ ] Create: `lib/summarization.ts` (summarizeTranscription function)
- [ ] Feature: Call Claude API with transcription text
- [ ] Feature: Prompt: "Summarize this medical resident voice journal entry into 2-3 key points"
- [ ] Feature: Extract summary from response
- [ ] Error handling: API errors, timeout, rate limiting
- **Estimated:** 1 hour
- **Depends:** 1.1.5

**1.8.2** ✅ Create summarization job handler
- [ ] Create: `lib/jobs/summarizationJob.ts`
- [ ] Feature: Get transcription from database
- [ ] Feature: Call Claude API to summarize
- [ ] Feature: Update database record with summary
- [ ] Feature: Update status to "complete"
- [ ] Error handling: Retry logic, failure logging
- **Estimated:** 45 min
- **Depends:** 1.8.1

**1.8.3** ✅ Trigger summarization job after transcription
- [ ] Modify: `lib/jobs/transcriptionJob.ts`
- [ ] Feature: After transcription complete, call summarizationJob()
- [ ] Feature: Async flow: record uploaded → transcribed → summarized
- **Estimated:** 30 min
- **Depends:** 1.8.2, 1.7.2

**1.8.4** ✅ Frontend polling for status updates
- [ ] Create: `hooks/useVoiceJournalStatus.ts`
- [ ] Feature: Poll `/api/voice-journal/[id]/status` every 10 seconds
- [ ] Feature: Update UI as status changes (uploading → transcribing → summarizing → complete)
- [ ] Feature: Stop polling when complete
- [ ] Feature: Handle timeout (>5 minutes)
- **Estimated:** 45 min
- **Depends:** 1.7.3

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

## PHASE 2: Module Scaffolding & Credit System (Weeks 4-5)

**NOT DETAILED YET** - Will be created after Phase 1 complete. Will include:
- Module bucket content structure (scaffold)
- Basic credit system backend (no payments yet)
- Monitoring & error handling (Sentry)
- User feedback incorporation

---

## PHASE 3: Multi-User Testing & Refinement (Weeks 6-8)

**NOT DETAILED YET** - Will be created after Phase 2 complete. Will include:
- Feedback from 8 test users
- UI/UX iterations
- Performance optimization
- Bug fixes and refinements
- Final documentation

---

## Blocked Tasks

**None currently.** All Phase 1 tasks are unblocked and ready to start.

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
# Live at: www.lev8.ai
```

---

**Last Updated:** October 20, 2025  
**Status:** Ready for development  
**Next Step:** Begin with Epic 1.1 (Project Setup)