# Planning.md: Elevate Architecture & Implementation Strategy

**Project:** Elevate (www.lev8.ai)  
**Version:** 1.0 Production  
**Last Updated:** December 23, 2025  
**Current Phase:** Six Modules Operational + Admin Portal (Learn, Grow, Understand, Truths, Expectations, Admin Portal)

---

## 1. High-Level Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    User's Browser                            │
│                 (www.lev8.ai on Vercel)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ React Components (TypeScript)                        │  │
│  │ ├── Auth Pages (Login, Register, 2FA)              │  │
│  │ ├── Dashboard Layout (Sidebar, Settings)           │  │
│  │ ├── Voice Journal UI                               │  │
│  │ └── Module Bucket Navigation                       │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           │
                    HTTPS/TLS Layer
                           │
┌─────────────────────────────────────────────────────────────┐
│              Next.js Backend (on Vercel)                    │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ API Routes (TypeScript)                             │  │
│  │ ├── /api/auth/* (Register, Login, Verify 2FA)     │  │
│  │ ├── /api/voice-journal/* (Upload, Get, Delete)    │  │
│  │ ├── /api/users/* (Profile, Directory)             │  │
│  │ └── /api/modules/* (Get buckets, modules)         │  │
│  │                                                      │  │
│  │ Background Jobs (Async)                            │  │
│  │ ├── Whisper Transcription Pipeline                │  │
│  │ └── Claude Summarization Pipeline                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
         │                       │                       │
         │                       │                       │
    Supabase              OpenAI API            Claude API
    (PostgreSQL)          (Whisper)             (Anthropic)
    ├── Auth              └─ Transcription      └─ Summarization
    ├── Users
    ├── Residents
    ├── Voice Journal
    └── Audit Logs
```

### Data Flow: Voice Journal Example

```
1. Resident Records Voice Memo
   └─> Web Audio API captures audio stream
   └─> User reviews preview

2. Upload Audio Blob
   └─> POST /api/voice-journal/upload (multipart/form-data)
   └─> Backend validates user auth
   └─> Audio uploaded to Supabase Storage (encrypted)
   └─> DB record created in grow_voice_journal
   └─> Response: entryId, status: "uploading"

3. Whisper Transcription (Async Job)
   └─> Background job triggered
   └─> Calls OpenAI Whisper API with audio file
   └─> Stores transcription in DB (grow_voice_journal.transcription)
   └─> Updates status: "transcribed"
   └─> Frontend polls /api/voice-journal/:id for status

4. Claude Summarization (Async Job)
   └─> Background job triggered (after transcription complete)
   └─> Calls Claude API with transcription
   └─> Stores summary in DB (grow_voice_journal.claude_summary)
   └─> Updates status: "complete"
   └─> Frontend displays summary to user

5. Voice Journal Entry Stored & Accessible
   └─> User can view entry in Voice Journal list
   └─> Can play audio, read transcription, view summary
   └─> Can delete entry (only owner)
   └─> Program Director cannot access (RLS enforced)
```

---

## 2. Technology Stack Rationale

### Frontend: React 18 + Next.js 14

**Why React?**
- Industry standard for web UIs
- Component-based architecture scales well
- Large ecosystem of libraries
- TypeScript support is excellent

**Why Next.js?**
- Server-side rendering (better SEO, faster initial load)
- API routes on same codebase (simpler deployment)
- Built-in image optimization, code splitting
- Vercel is native platform (zero config deployment)
- Easier to implement 2FA, auth flows

**Alternatives Considered:**
- Vue.js: Lighter weight, but smaller ecosystem
- Svelte: Great DX, but less mature for healthcare projects
- Plain HTML/CSS: Too much boilerplate, no component reusability

### Backend: Next.js API Routes

**Why Not Separate Backend?**
- Simpler deployment: Frontend + backend on same Vercel project
- No additional infrastructure to manage
- API routes are just HTTP endpoints (no vendor lock-in)
- Easier to share types between frontend and backend (TypeScript)

**When to Consider Separate Backend (Future):**
- If API usage scales to >1000 req/sec
- If you add multiple clients (mobile app, integrations)
- If compute needs are separate from frontend

### Database: Supabase PostgreSQL

**Why Supabase?**
- Managed PostgreSQL (no DevOps overhead)
- Built-in auth system (Supabase Auth)
- Row-level security (RLS) policies for data isolation
- Real-time subscriptions (future feature)
- Easy migrations with Supabase CLI
- Free tier supports MVP

**Why PostgreSQL?**
- Relational schema is ideal for this domain
- Strong ACID guarantees (transactions matter for payments later)
- JSON support (JSONB) for flexible fields
- Excellent performance for queries <100ms

**Alternatives Considered:**
- MongoDB: NoSQL flexibility, but harder to enforce RLS at database layer
- Firebase: Easy but vendor lock-in, harder multi-tenancy
- DynamoDB: Overkill for MVP, complex query patterns

### Authentication: Supabase Auth + Custom 2FA

**Why Supabase Auth?**
- Handles email/password hashing securely
- Built-in session management
- Easy integration with RLS policies
- Free tier

**Why Custom 2FA Logic?**
- Supabase doesn't have built-in device trust (30-day bypass)
- Custom logic required for "trust this device" feature
- Implementation: Device fingerprinting + DB record with expiry

**Alternatives Considered:**
- Auth0: Overkill for MVP, adds cost
- Okta: Enterprise-focused, expensive
- Custom auth: Too much security risk

### Styling: Tailwind CSS + Shadcn/ui

**Why Tailwind?**
- Utility-first approach (faster iteration)
- Small bundle size (purges unused styles)
- Built-in dark mode support
- Consistent design system

**Why Shadcn/ui?**
- Pre-built, unstyled components
- Customizable (copy components into project)
- No component library lock-in
- Works great with Tailwind

**Alternatives Considered:**
- Material-UI: Heavy, opinionated
- Bootstrap: Outdated feel
- CSS-in-JS (Styled Components): Adds runtime overhead

### External APIs

**OpenAI Whisper (Transcription)**
- Industry leading accuracy (>95%)
- Supports multiple languages (English for MVP)
- Costs ~$0.02-0.03 per minute of audio
- Alternative: Google Cloud Speech-to-Text, Azure

**Claude API (Summarization)**
- Advanced reasoning for reflections
- API-based (no model training needed)
- Cost: ~$0.0015 per 1K input tokens
- Integrates with credit system naturally (Phase 2)

**Alternative Approach:**
- Local ML models (faster, no API calls)
- But: Harder to deploy, less accurate, more latency

---

## 3. Database Schema (MVP)

### Core Tables

**health_systems** (Institutions)
```sql
id UUID PRIMARY KEY
name VARCHAR NOT NULL
abbreviation VARCHAR
location VARCHAR
contact_email VARCHAR
created_at TIMESTAMP DEFAULT now()
```

**programs**
```sql
id UUID PRIMARY KEY
health_system_id UUID NOT NULL (FK → health_systems)
name VARCHAR NOT NULL
specialty VARCHAR
pgm_director_id UUID (FK → user_profiles)
created_at TIMESTAMP DEFAULT now()
UNIQUE(health_system_id, name)
```

**academic_classes**
```sql
id UUID PRIMARY KEY
program_id UUID NOT NULL (FK → programs)
class_year VARCHAR NOT NULL (PGY-1, PGY-2, etc)
start_date DATE
graduation_date DATE
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT now()
```

**user_profiles** (Linked to Supabase Auth)
```sql
id UUID PRIMARY KEY (from Supabase Auth)
email VARCHAR NOT NULL UNIQUE
first_name VARCHAR
last_name VARCHAR
phone VARCHAR
role VARCHAR NOT NULL (resident, faculty, program_director, super_admin)
institution_id UUID NOT NULL (FK → health_systems)
created_at TIMESTAMP DEFAULT now()
UNIQUE(email, institution_id)
```

**residents**
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL UNIQUE (FK → user_profiles)
program_id UUID NOT NULL (FK → programs)
class_id UUID NOT NULL (FK → academic_classes)
medical_school VARCHAR
specialty VARCHAR
created_at TIMESTAMP DEFAULT now()
```

**faculty**
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL UNIQUE (FK → user_profiles)
program_id UUID NOT NULL (FK → programs)
title VARCHAR
department VARCHAR
is_evaluator BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT now()
```

**device_trusts** (For 2FA bypass)
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL (FK → user_profiles)
device_fingerprint VARCHAR NOT NULL
ip_address INET
user_agent TEXT
trust_expires_at TIMESTAMP NOT NULL
created_at TIMESTAMP DEFAULT now()
UNIQUE(user_id, device_fingerprint)
```

**user_sharing_preferences** (Privacy Framework - Tier 4 toggles)
```sql
id UUID PRIMARY KEY
user_id UUID NOT NULL UNIQUE (FK → auth.users)
share_learning_interests BOOLEAN DEFAULT false
share_experience_level BOOLEAN DEFAULT false
share_previous_outcomes BOOLEAN DEFAULT false
share_engagement_visibility BOOLEAN DEFAULT false
share_profile_discoverability BOOLEAN DEFAULT false
consent_acknowledged_at TIMESTAMPTZ
consent_version VARCHAR DEFAULT 'v1.0'
last_updated_at TIMESTAMPTZ DEFAULT now()
created_at TIMESTAMPTZ DEFAULT now()
```
**Note:** See `docs/PRIVACY-FRAMEWORK-ANALYSIS.md` for full privacy framework details

**grow_voice_journal** (Core MVP feature)
```sql
id UUID PRIMARY KEY
institution_id UUID NOT NULL (FK → health_systems)
resident_id UUID NOT NULL (FK → residents)
audio_blob_url VARCHAR NOT NULL (Supabase Storage path)
transcription TEXT
transcription_confidence FLOAT
claude_summary TEXT
recording_duration_seconds INT
is_private BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT now()
updated_at TIMESTAMP DEFAULT now()
```

**module_buckets** (Learn, Grow, Understand)
```sql
id UUID PRIMARY KEY
institution_id UUID NOT NULL (FK → health_systems)
name VARCHAR NOT NULL (Learn, Grow, Understand)
description TEXT
display_order INT
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT now()
UNIQUE(institution_id, name)
```

**modules** (Individual modules, empty for MVP except Voice Journal)
```sql
id UUID PRIMARY KEY
institution_id UUID NOT NULL (FK → health_systems)
bucket_id UUID NOT NULL (FK → module_buckets)
slug VARCHAR NOT NULL (clinical_cases, difficult_conversations, etc)
name VARCHAR NOT NULL
description TEXT
available_to_roles VARCHAR[] DEFAULT '{}' (roles allowed to access)
is_active BOOLEAN DEFAULT true
created_at TIMESTAMP DEFAULT now()
UNIQUE(institution_id, slug)
```

**audit_logs** (Compliance & security)
```sql
id UUID PRIMARY KEY
user_id UUID (FK → user_profiles)
action VARCHAR NOT NULL (CREATE, READ, UPDATE, DELETE)
table_name VARCHAR
record_id UUID
changes JSONB (what was changed)
ip_address INET
user_agent TEXT
created_at TIMESTAMP DEFAULT now()
```

### Row-Level Security (RLS) Policies

**grow_voice_journal: Owner-only access**
```sql
ALTER TABLE grow_voice_journal ENABLE ROW LEVEL SECURITY;

CREATE POLICY voice_journal_owner_only ON grow_voice_journal
  FOR ALL USING (auth.uid()::uuid = resident_id);

CREATE POLICY voice_journal_super_admin ON grow_voice_journal
  FOR SELECT USING (
    auth.uid()::uuid IN (
      SELECT id FROM user_profiles WHERE role = 'super_admin'
    )
  );
```

**user_profiles: Self + admin**
```sql
CREATE POLICY users_self_read ON user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY users_admin_all ON user_profiles
  FOR SELECT USING (
    auth.uid()::uuid IN (
      SELECT id FROM user_profiles WHERE role = 'super_admin'
    )
  );
```

**residents: Program-level visibility**
```sql
CREATE POLICY residents_program_visibility ON residents
  FOR SELECT USING (
    program_id IN (
      SELECT program_id FROM residents WHERE user_id = auth.uid()::uuid
      UNION
      SELECT program_id FROM faculty WHERE user_id = auth.uid()::uuid
    )
  );
```

---

## 4. Authentication & Authorization Flow

### Registration Flow

```
1. User navigates to /register
2. Fills form: First/Last name, email, phone, medical school, specialty, residency program
3. Clicks "Register"
4. Frontend validates input
5. POST /api/auth/register
   ├─ Backend validates input again
   ├─ Calls Supabase Auth: auth.signUp()
   ├─ Creates user_profiles record
   ├─ Creates residents or faculty record
   ├─ Returns { userId, email, next: "/verify-email" }
6. User checks email for verification link
7. Clicks link, redirected to /verify
8. Verification confirmed, redirected to /login
```

### Login Flow

```
1. User navigates to /login
2. Enters email and password
3. Clicks "Login"
4. POST /api/auth/login
   ├─ Calls Supabase Auth: auth.signInWithPassword()
   ├─ If success:
   │   ├─ Check device_trusts table for trusted device
   │   ├─ If trusted (device exists and not expired):
   │   │   └─ Redirect to /dashboard (skip 2FA)
   │   └─ If not trusted:
   │       └─ Return { userId, next: "/verify-2fa" }
   └─ If fail: Return error 401
5. Redirect to /verify-2fa or /dashboard
```

### 2FA Verification Flow

```
1. User at /verify-2fa after login
2. User opens authenticator app (Google Authenticator, Authy, etc)
3. Enters 6-digit code
4. Clicks "Verify"
5. POST /api/auth/verify-2fa
   ├─ Backend validates TOTP code
   ├─ If valid:
   │   ├─ Request user to confirm device trust
   │   └─ If "Trust for 30 days":
   │       ├─ Create device_trusts record (expires in 30 days)
   │       └─ Generate device fingerprint (user agent + IP hash)
   │   └─ Else: Redirect to /dashboard
   └─ If invalid: Return error 401
6. Redirect to /dashboard
```

### Authorization: Role-Based Access Control

| Role | Can Access | Cannot Access |
|------|-----------|----------------|
| **resident** | Own profile, voice journal, own SWOT/scores, class/program aggregates | Other residents' detailed data, admin portal |
| **faculty** | All resident data, SWOT, scores, resident directory | Voice journals (privacy), admin portal |
| **clerkship_director** | All resident data, class cohorts | Voice journals, admin portal |
| **assistant_program_director** | All resident data, faculty management | Voice journals, admin portal |
| **program_director** | All resident data, faculty management, program settings | Voice journals (absolute privacy), admin portal |
| **admin** | Everything + admin portal | Nothing (audited) |
| **super_admin** | Everything + admin portal (with full audit logging) | Nothing (audited) |

### Token Management

- **Supabase Auth:** Manages JWT tokens automatically
- **Session:** Stored in HttpOnly cookies (secure, not accessible to JavaScript)
- **Expiry:** 1 hour access token, 7 day refresh token (Supabase defaults)
- **Refresh:** Automatic on background via middleware
- **Logout:** Clear cookies, invalidate session in Supabase

---

## 5. Voice Journal Pipeline (Detailed)

### Component Breakdown

**Frontend:**
- `VoiceJournalRecorder.tsx` - Recording UI (record, pause, stop, preview)
- `VoiceJournalList.tsx` - List of entries
- `VoiceJournalEntry.tsx` - Single entry view (transcription + summary)

**Backend API Routes:**
- `POST /api/voice-journal/upload` - Handle audio upload
- `GET /api/voice-journal` - List entries
- `GET /api/voice-journal/:id` - Get single entry
- `DELETE /api/voice-journal/:id` - Delete entry

**Background Jobs:**
- Whisper transcription job (triggered on upload)
- Claude summarization job (triggered after transcription)

### Recording Flow (Frontend)

```typescript
// VoiceJournalRecorder.tsx
const [isRecording, setIsRecording] = useState(false);
const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
const mediaRecorderRef = useRef<MediaRecorder | null>(null);

async function startRecording() {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  mediaRecorderRef.current = new MediaRecorder(stream);
  mediaRecorderRef.current.ondataavailable = (e) => setAudioBlob(e.data);
  mediaRecorderRef.current.start();
  setIsRecording(true);
}

async function stopRecording() {
  mediaRecorderRef.current?.stop();
  setIsRecording(false);
  // Now upload audioBlob
}

async function uploadAudio() {
  const formData = new FormData();
  formData.append('audio', audioBlob, 'recording.wav');
  
  const res = await fetch('/api/voice-journal/upload', {
    method: 'POST',
    body: formData,
  });
  
  const { entryId, status } = await res.json();
  // Poll for status updates
  pollStatus(entryId);
}
```

### Upload & Transcription (Backend)

```typescript
// app/api/voice-journal/upload/route.ts
export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const audioBlob = formData.get('audio') as File;
  
  // 1. Authenticate
  const userId = await auth.user();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  
  // 2. Upload to Supabase Storage
  const fileName = `voice_journal/${userId}/${Date.now()}.wav`;
  const { data, error } = await supabase.storage
    .from('voice_journal')
    .upload(fileName, audioBlob);
  
  // 3. Create DB record
  const { data: entry } = await supabase
    .from('grow_voice_journal')
    .insert({
      resident_id: userId,
      audio_blob_url: data.path,
      is_private: true,
    })
    .select('id')
    .single();
  
  // 4. Trigger async transcription job
  await triggerTranscriptionJob(entry.id, data.path);
  
  return NextResponse.json({ entryId: entry.id, status: 'uploading' });
}

async function triggerTranscriptionJob(entryId: string, audioPath: string) {
  // Queue job (using Vercel Cron, Bull, or similar - Phase 2)
  // For MVP: Call directly (might timeout, but acceptable)
  transcribeAudio(entryId, audioPath);
}

async function transcribeAudio(entryId: string, audioPath: string) {
  // Get audio from Supabase Storage
  const { data: audioBuffer } = await supabase.storage
    .from('voice_journal')
    .download(audioPath);
  
  // Call Whisper API
  const transcription = await openai.audio.transcriptions.create({
    file: audioBuffer,
    model: 'whisper-1',
  });
  
  // Update DB
  await supabase
    .from('grow_voice_journal')
    .update({
      transcription: transcription.text,
      transcription_confidence: 0.95, // placeholder
    })
    .eq('id', entryId);
  
  // Trigger summarization
  await summarizeTranscription(entryId, transcription.text);
}

async function summarizeTranscription(entryId: string, transcription: string) {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 256,
    system: 'Summarize this medical resident voice journal entry into 2-3 key points.',
    messages: [
      {
        role: 'user',
        content: transcription,
      },
    ],
  });
  
  const summary = response.content[0].type === 'text' ? response.content[0].text : '';
  
  // Update DB
  await supabase
    .from('grow_voice_journal')
    .update({ claude_summary: summary })
    .eq('id', entryId);
}
```

### Frontend Polling for Status

```typescript
async function pollStatus(entryId: string) {
  const maxAttempts = 30; // 5 minutes max
  let attempts = 0;
  
  const interval = setInterval(async () => {
    const res = await fetch(`/api/voice-journal/${entryId}`);
    const { entry } = await res.json();
    
    if (entry.claude_summary) {
      setCurrentEntry(entry);
      clearInterval(interval);
    } else if (entry.transcription) {
      setStatus('summarizing...');
    } else {
      setStatus('transcribing...');
    }
    
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(interval);
      setStatus('timeout - refresh page');
    }
  }, 10000); // Poll every 10 seconds
}
```

---

## 6. Implementation Phases

### Phase 1: Core Platform (Weeks 1-3)

**Authentication & Authorization**
- Email/password registration
- Login with email/password
- 2FA setup and verification
- Device trust system (30-day bypass)
- Role-based access control
- Protected routes

**UI Foundation**
- Landing page (unauthenticated)
- Login/register pages
- 2FA verification page
- Dashboard layout (sidebar, settings)
- Role-based navigation

**Database & Security**
- Supabase project setup
- Schema migration scripts
- RLS policies enforcement
- Audit logging infrastructure

**Voice Journal MVP**
- Voice recording UI (Web Audio API)
- Audio upload to Supabase Storage
- Whisper transcription pipeline
- Claude summarization pipeline
- Voice journal list view
- Entry view (transcription + summary)

**Deployment**
- GitHub repository setup
- Vercel project configuration
- Domain DNS setup (lev8.ai)
- CI/CD pipeline (GitHub Actions)
- Automated testing

**End of Phase 1:**
- 8 test users can register and log in
- Residents can record and store voice journals
- Program Director cannot access voice journals
- All features deployed to www.lev8.ai

### Phase 2: Module Content & First Use Cases (Weeks 4-6)

**Status:** Phase 5 Complete, Ready for Testing  
**Started:** November 6, 2025  
**Latest Update:** January 6, 2025  
**Theme:** Create first complete, production-ready use cases for each learning module

**Phase 2 Goals:**
1. **Difficult Conversations:** Implement v2 vignette architecture with MED-001 (Adenosine Error) as first use case
2. **Clinical Cases:** Create first complete clinical case scenario
3. **EKG & ACLS:** Build first ACLS simulation scenario  
4. **Running the Board:** Develop first multi-patient board configuration
   - **Status:** Complete (Dec 22, 2025)
   - **Features Delivered:**
     - Multi-patient simulation grid (4 patients) matching Excel layout
     - Sticky headers for patient info and facilitator scripts
     - Synced horizontal scrolling for header/body
     - iPad optimization (touch targets, scroll behavior)
     - Educator/Learner selection with custom inputs
     - Active phase tracking with non-intrusive visual cues
     - Custom column coloring overrides (e.g., forcing Orange for Patient B)
     - Leaderboard integration for gamification
5. **Content Authoring:** Establish workflows and templates for educators

**Key Deliverables:**
- Sophisticated conversation engine with phase-based flow, emotional tracking, branching logic
- Multi-model AI support (Gemini and Claude)
- Semantic assessment system
- Complete vignette authoring framework
- At least one production-ready use case per module

**Epic 2.1: Difficult Conversations - First Use Case**
- 5-file modular architecture
- Phase-based conversations (opening, disclosure, emotional_processing, clinical_questions, next_steps)
- Emotional state tracking (0-1 scale with modifiers)
- Branching logic and adaptive difficulty
- Dynamic prompt layers
- Voice avatar integration hooks

**Success Criteria:**
- MED-001 vignette fully functional with all phases
- Both Gemini and Claude providers working
- Assessment scores align with educator observations
- Phase-based UI provides clear guidance
- Vignette authoring process documented and repeatable

**Module Bucket Infrastructure**
- Learn bucket (empty, routing ready)
- Grow bucket (Voice Journal functional)
- Understand bucket (empty, routing ready)
- Module navigation and routing
- Placeholder module detail pages

**Credit System (Backend Only)**
- User credit tracking table
- Credit transaction logging
- Free monthly credit allocation
- Credit deduction on Claude API calls
- Credit balance UI (no purchase flow yet)

**Monitoring & Error Handling**
- Sentry integration for error logging
- Better error messages for users
- Retry logic for API calls

### Phase 3: Multi-User Testing & Refinement (Weeks 6-8)

**Feedback Incorporation**
- Test users provide feedback
- UI/UX improvements
- Performance optimization
- Bug fixes

**Documentation**
- API documentation
- Deployment runbook
- User guide for residents
- Admin guide for program director

**Prepare for Phase 4**
- Plan Learning Modules integration
- Plan Stripe payment integration

---

## 7. Development Environment Setup

### Local Development

```bash
# 1. Clone repo and install dependencies
git clone https://github.com/yourusername/elevate.git
cd elevate
npm install

# 2. Set up environment
cp .env.local.example .env.local
# Fill in API keys (Supabase, OpenAI, Claude)

# 3. Start local Supabase (optional, for local DB)
supabase start

# 4. Start dev server
npm run dev
# Opens on http://localhost:3000

# 5. Run tests
npm run test

# 6. Lint and format
npm run lint
npm run format
```

### Deployment: Local → GitHub → Vercel

```bash
# 1. Make changes locally
npm run dev  # Test locally

# 2. Commit to feature branch
git checkout -b feature/voice-journal-ui
git add .
git commit -m "Add voice journal recording component"

# 3. Push to GitHub
git push origin feature/voice-journal-ui

# 4. Create Pull Request on GitHub
# → GitHub Actions runs tests, linting, builds
# → Vercel creates preview deployment (URL in PR)
# → You review, test preview

# 5. Merge to main (triggers live deployment)
git checkout main
git pull origin main
git merge feature/voice-journal-ui
git push origin main

# 6. Vercel auto-deploys to www.lev8.ai
# Monitor deployment in Vercel dashboard
```

---

## 8. Testing Strategy

### Unit Tests (Individual functions/components)

```typescript
// Example: VoiceJournalRecorder.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import VoiceJournalRecorder from '@/components/voice-journal/VoiceJournalRecorder';

describe('VoiceJournalRecorder', () => {
  it('should start recording when record button is clicked', () => {
    render(<VoiceJournalRecorder />);
    const recordButton = screen.getByRole('button', { name: /record/i });
    fireEvent.click(recordButton);
    expect(recordButton).toHaveTextContent('Stop');
  });

  it('should upload audio when save button is clicked', async () => {
    render(<VoiceJournalRecorder />);
    // ... simulate recording ...
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    // Verify fetch was called with audio blob
  });
});
```

### Integration Tests (API routes + DB)

```typescript
// Example: voice-journal.integration.test.ts
describe('POST /api/voice-journal/upload', () => {
  it('should upload audio and create DB record', async () => {
    const audioBlob = new Blob(['audio data']);
    const formData = new FormData();
    formData.append('audio', audioBlob);

    const res = await fetch('/api/voice-journal/upload', {
      method: 'POST',
      body: formData,
      headers: { Authorization: 'Bearer ' + testToken },
    });

    expect(res.status).toBe(200);
    const { entryId } = await res.json();
    
    // Verify DB record exists
    const entry = await supabase
      .from('grow_voice_journal')
      .select('*')
      .eq('id', entryId)
      .single();
    expect(entry.data).toBeDefined();
  });
});
```

### E2E Tests (Complete user flows)

```typescript
// Example: voice-journal.e2e.test.ts (using Playwright)
test('Complete voice journal flow', async ({ page }) => {
  // 1. Login
  await page.goto('/login');
  await page.fill('input[name=email]', 'resident@test.com');
  await page.fill('input[name=password]', 'password');
  await page.click('button[type=submit]');
  
  // 2. Wait for 2FA
  await page.fill('input[name=totp]', '123456');
  await page.click('button[type=submit]');
  
  // 3. Navigate to voice journal
  await page.click('a:has-text("Voice Journal")');
  
  // 4. Record and save
  await page.click('button:has-text("Record")');
  await page.waitForTimeout(3000);
  await page.click('button:has-text("Stop")');
  await page.click('button:has-text("Save")');
  
  // 5. Verify entry appears in list
  await page.waitForSelector('text=Transcribing');
  await page.waitForSelector('text=Summarizing');
  await page.waitForSelector('text=Ready');
});
```

---

## 9. Performance Optimization Strategies

### Frontend

- **Code splitting:** Use Next.js dynamic imports for large components
- **Image optimization:** Use `<Image>` component, lazy load
- **Bundle analysis:** Run `npm run build && npm run analyze` to check bundle size
- **Caching:** Implement HTTP caching headers for static assets

### Backend

- **Database indexing:** Index frequently queried columns
- **Query optimization:** Select only needed fields, use JOINs efficiently
- **API caching:** Cache user profiles, program data for 5-10 minutes
- **Async jobs:** Move transcription/summarization to background (Phase 2)

### Monitoring

- **Vercel Analytics:** Built-in Web Vitals monitoring
- **API Response Times:** Log and alert on slow endpoints
- **Database Query Performance:** Use Supabase dashboard to monitor
- **Error Rates:** Sentry will track exceptions (Phase 2)

---

## 10. Security Hardening Checklist

- [ ] HTTPS enforced (Vercel handles this)
- [ ] CORS properly configured (allow only www.lev8.ai)
- [ ] Rate limiting on sensitive endpoints (login, upload)
- [ ] Input validation on all API endpoints
- [ ] SQL injection prevention (use parameterized queries)
- [ ] XSS prevention (React escapes by default)
- [ ] CSRF tokens on state-changing endpoints
- [ ] API keys never logged or exposed
- [ ] Audit logs for sensitive actions (login, voice journal access)
- [ ] Regular security dependency updates
- [ ] RLS policies tested and verified

---

## 11. Scaling Considerations (Future)

### Single Institution → Multiple Institutions

**Current Design:**
- All data in one `lev8` Supabase project
- Institution isolation via `institution_id` and RLS

**To Scale to 10+ institutions:**
1. Continue using single project (if row count <1M)
2. Optimize RLS policies for performance
3. Add caching layer (Redis) for institutional data
4. Use database connection pooling (PgBouncer)

**To Scale Beyond 1M rows:**
1. Consider separate Supabase projects per institution (easier than sharding)
2. Or implement read replicas and sharding

### Resident Count Scaling

**Current Design:**
- Handles 100+ residents per institution easily
- API response time <500ms for standard queries

**At 1000+ residents:**
1. Add pagination to resident lists
2. Implement search indexing (Elasticsearch, Algolia)
3. Use read replicas for reporting queries

### API Call Scaling

**Whisper & Claude calls:**
- Current: ~1-2 per resident per day
- Cost: ~$0.05 per resident per day
- At 1000 residents: ~$50/day
- Solution: Batch processing, rate limiting, user quotas (credit system)

---

## 12. Disaster Recovery & Backup

### Backup Strategy

- **Supabase Automated Backups:** Daily, retained for 7 days
- **Manual Backups:** Before major migrations
- **Code Backup:** GitHub is source of truth

### Disaster Recovery Scenarios

**Scenario 1: Accidental data deletion**
- Recovery: Restore from Supabase backup
- RTO: <4 hours
- RPO: Up to 24 hours

**Scenario 2: Compromised API key**
- Response: Revoke key immediately, rotate to new key in Vercel
- RTO: <5 minutes
- Impact: No API calls for 5 minutes

**Scenario 3: Vercel outage**
- Response: DNS failover to backup host (if configured)
- RTO: Depends on failover setup (Phase 2)
- Current: Limited to Vercel availability

---

## 13. Monitoring & Alerting

### Metrics to Track

**Availability:**
- Uptime percentage (target: 99.5%)
- API endpoint response times (target: <500ms p95)
- Page load times (target: <3s)

**Usage:**
- Active users per day
- Voice journal entries created per day
- API call volume (Whisper, Claude)

**Errors:**
- 4xx/5xx error rate
- Failed login attempts
- Failed transcription/summarization jobs

### Alerting (Phase 2)

- Alert if uptime drops below 98%
- Alert if API response time exceeds 1s p95
- Alert if error rate exceeds 1%
- Daily digest of metrics to email

---

## 14. Maintenance & Updates

### Weekly
- Monitor Vercel/Supabase dashboards
- Check error logs
- Review user feedback

### Monthly
- Dependency updates (`npm outdated`, `npm update`)
- Security vulnerability scans
- Performance analysis

### Quarterly
- Full security audit
- Database optimization review
- Infrastructure cost review

---

## 15. Module Status Summary

| Module | Status | Key Features |
|--------|--------|--------------|
| **Learn** | ✅ Complete | Clinical cases, modules, progress tracking |
| **Grow** | ✅ Complete | Voice journal, Whisper transcription, Claude summarization |
| **Running the Board** | ✅ Complete | Multi-patient simulation, sticky headers, educator controls, iPad optimization |
| **Understand** | ✅ Complete | SWOT analysis, EQ/PQ/IQ scores, trendlines, class analytics |
| **Truths** | ✅ Complete | Document repository, PDF/MD storage, category filtering |
| **Expectations** | ✅ Phase 1 | ACGME compliance, requirements browser, status tracking |
| **Admin Portal** | ✅ Complete | User management, access requests, role-based permissions |

### Admin Portal & User Access Management (Completed Dec 23, 2025)

**Access Control Model:**
- Replaced open registration with controlled access model
- Users request access via `/request-access` page
- Admins review and approve/reject requests via Admin Portal
- Email notifications for approval/rejection (configurable)

**Admin Portal Features:**
- Dashboard with pending request count and recent activity
- Access Requests page for reviewing/approving/rejecting requests
- User Management page for creating/suspending/reactivating users
- Faculty type categorization (Core Faculty, Teaching Faculty)
- Leadership roles (Program Director, Asst. Program Director, Clerkship Director)
- Specialty tracking (Emergency Medicine)

**Role-Based Access Control (RBAC):**
- Roles: `resident`, `faculty`, `program_director`, `assistant_program_director`, `clerkship_director`, `super_admin`, `admin`
- RLS policies on all sensitive tables (residents, swot_summaries, period_scores, etc.)
- Residents see only their own detailed data + class/program aggregates
- Faculty+ see all resident data
- Super Admin has full access

**Sidebar Integration:**
- Admin Portal appears as collapsible nav section (like Expectations)
- Sub-items: Dashboard, Access Requests, User Management
- Auto-expands on admin pages
- Only visible to Super Admin / Admin roles
- User email and role displayed in footer

**Dual Email Support:**
- `personal_email` and `institutional_email` columns on `user_profiles`
- Personal emails used for initial seeding
- Institutional emails can be added later

**Database Tables Added:**
- `access_requests` - Stores access request submissions
- `admin_activity_log` - Audit trail for admin actions
- Added columns to `user_profiles`: `personal_email`, `institutional_email`, `account_status`, `invited_by`, `invited_at`, `faculty_type`, `specialty`

### Upcoming Features
- **ILP (Individualized Learning Plan)**: Under consideration - see `docs/_guidance/ILP/`
- **Evidence Management**: Attach documents to ACGME requirements
- **Graph RAG**: Visualize connections between sources of truth and learner journey

---

## 16. This Document

**Last Reviewed:** December 23, 2025  
**Maintainer:** You  
**Review Frequency:** After each phase completion

Update this document when:
- Architecture changes
- New tech introduced
- Lessons learned from development
- Performance optimizations implemented

### Change Log

| Date | Changes |
|------|---------|
| Dec 23, 2025 | Added Admin Portal & User Access Management System |
| Dec 22, 2025 | Running the Board module completed with iPad optimization |
| Dec 2, 2025 | Five modules operational |