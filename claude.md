# Claude.md: Elevate Development Guidelines

**Project:** Elevate (www.lev8.ai)  
**Last Updated:** October 20, 2025  
**Purpose:** AI-specific coding standards, session workflow, and project guidelines

---

## 1. Project Identity

**Name:** Elevate  
**Domain:** www.lev8.ai  
**Institution:** Memorial Hospital West Emergency Medicine Residency Program  
**Vision:** Secure, role-based platform for resident reflection, learning, and program management.  
**Core Value:** Privacy first—resident data is sacred.

---

## 2. Coding Standards & Preferences

### Language & Framework Choices
- **Language:** TypeScript (strict mode always)
- **Frontend:** Next.js 14+ (App Router), React 18+
- **Backend:** Next.js API routes
- **Database:** Supabase PostgreSQL
- **Styling:** Tailwind CSS + Shadcn/ui components
- **State Management:** React Context or Zustand (prefer Context for MVP simplicity)
- **Package Manager:** npm (or pnpm for monorepos later)

### Code Organization
```
project-root/
├── app/
│   ├── (auth)/          # Authentication routes
│   │   ├── login/
│   │   ├── register/
│   │   └── verify-2fa/
│   ├── (dashboard)/     # Protected routes
│   │   ├── layout.tsx
│   │   ├── page.tsx     # Dashboard home
│   │   ├── modules/     # Module navigation
│   │   ├── voice-journal/
│   │   └── settings/
│   ├── api/             # API routes
│   │   ├── auth/
│   │   ├── voice-journal/
│   │   ├── users/
│   │   └── modules/
│   └── layout.tsx       # Root layout
├── components/
│   ├── auth/            # Auth-specific components
│   ├── dashboard/       # Dashboard layout/shared
│   ├── voice-journal/   # Voice Journal components
│   ├── modules/         # Module components
│   ├── ui/              # Shadcn/ui components (generated)
│   └── common/          # Reusable components
├── lib/
│   ├── supabase.ts      # Supabase client
│   ├── types.ts         # TypeScript types
│   ├── auth.ts          # Auth utilities
│   ├── api-utils.ts     # API helpers
│   └── constants.ts     # App constants
├── hooks/               # Custom React hooks
├── context/             # React Context providers
├── styles/              # Global CSS
├── public/              # Static assets
├── .env.local.example   # Environment template
├── tsconfig.json        # TypeScript config
├── tailwind.config.ts   # Tailwind config
├── next.config.ts       # Next.js config
├── package.json
└── README.md
```

### TypeScript Standards
- **Strict Mode:** Always enabled in `tsconfig.json`
- **Types:** Never use `any`. Use `unknown` and narrow, or `as const` for literals.
- **Interfaces:** Prefer `interface` for object shapes, `type` for unions/primitives
- **Naming:** 
  - Components: PascalCase (`VoiceJournal.tsx`)
  - Functions: camelCase (`getUserProfile()`)
  - Constants: UPPER_SNAKE_CASE (`API_TIMEOUT`)
  - Types: PascalCase (`UserProfile`, `VoiceJournalEntry`)

### Component Standards
- **Functional components only** (no class components)
- **Props interface:** Always define props type
- **Default exports:** One component per file, always default export
- **Prop drilling:** Limit to 2 levels; use Context or URL params for deeper data
- **File naming:** Match component name (`VoiceJournal.tsx` exports `<VoiceJournal />`)

```typescript
// Example component structure
import { FC } from 'react';

interface VoiceJournalProps {
  residentId: string;
  onSave?: (entryId: string) => void;
}

const VoiceJournal: FC<VoiceJournalProps> = ({ residentId, onSave }) => {
  return <div>Voice Journal</div>;
};

export default VoiceJournal;
```

### API Route Standards
- **File naming:** Match HTTP method + resource (`route.ts` in folder)
- **Response format:** Always JSON with consistent structure
- **Error handling:** Use HTTP status codes correctly (400, 401, 403, 404, 500)
- **Validation:** Validate request body, query params, auth before logic

```typescript
// Example: app/api/voice-journal/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const userId = req.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    // Logic here
    
    return NextResponse.json({ data: [] });
  } catch (error) {
    console.error('GET /voice-journal failed:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
```

### Error Handling
- **Client:** Use try-catch, never silent failures. Show user-friendly error messages.
- **API:** Return structured error responses: `{ error: string, details?: object }`
- **Logging:** Console.error for development; Sentry/monitoring for production (Phase 2)
- **No console.log in production:** Use debug library or logging service

### Async/Await
- **Prefer async/await** over `.then()` chains
- **Always handle rejections:** Wrap in try-catch or `.catch()`
- **No floating promises:** Always `await` or explicitly handle

### Security First
- **Never expose API keys** in frontend code or logs
- **HTTPS only:** All communication encrypted
- **Rate limiting:** Implement on backend
- **Input validation:** Sanitize and validate all user inputs
- **SQL injection:** Use parameterized queries (Supabase client does this automatically)
- **XSS prevention:** React escapes by default; be careful with `dangerouslySetInnerHTML`

### Testing
- **Unit tests:** For utilities, hooks, business logic
- **Integration tests:** For API routes, auth flows
- **E2E tests:** For critical user paths (voice journal record→transcribe)
- **Test command:** `npm run test`
- **Coverage:** Aim for 90%+ on critical paths

### Performance
- **Code splitting:** Use Next.js dynamic imports for large components
- **Image optimization:** Use Next.js `<Image>` component
- **Bundle analysis:** Run `npm run build && npm run analyze` periodically
- **API caching:** Implement Redis or Next.js revalidation (Phase 2)
- **Database queries:** Use indexes, limit SELECT fields

### Git & Version Control
- **Commit messages:** Clear, concise, imperative mood
  - Good: `Add voice journal upload endpoint`
  - Bad: `fixed stuff`, `wip`
- **Branch naming:** `feature/`, `fix/`, `docs/` prefixes
- **PR reviews:** Always have another set of eyes before merge
- **Merge strategy:** Squash + merge for cleaner history

---

## 3. Session Workflow

### Starting a Session

When beginning a development session, run this command to document context:

```
/START_SESSION
Context: [What you're working on]
Expected Duration: [Time estimate]
Dependencies: [Any blocking issues or previous sessions to reference]
```

**What This Does:**
1. Records session start time in Claude.md under "## Active Sessions"
2. Claude references current Tasks.md status
3. Establishes context window baseline
4. Links to previous session notes if applicable

**Example:**
```
/START_SESSION
Context: Building Voice Journal recording UI component + backend transcription pipeline
Expected Duration: 3 hours
Dependencies: Supabase project created, OpenAI Whisper API key active
```

### During Session

- **Keep Tasks.md open:** Reference current task, update status as you go
- **Frequent commits:** Small, logical commits every 30-60 minutes
- **Document decisions:** If you make an architectural choice, note it in Claude.md "## Decision Log"
- **Track context:** If approaching 100K tokens, call `/SAVE_SESSION` to create checkpoint

### Saving Mid-Session (Context Checkpoint)

If you're approaching context limit mid-session:

```
/SAVE_SESSION
Progress: [What's been completed]
Next Steps: [What to do in next session]
Code Location: [Files modified, branches]
Blockers: [Any issues to resolve]
```

**What This Does:**
1. Creates a checkpoint in Claude.md
2. Commits current work to feature branch
3. Summarizes progress for next session
4. Resets conversation (you start fresh, but have checkpoint to reference)

**Example:**
```
/SAVE_SESSION
Progress: Voice recording UI complete, Supabase schema for voice_journal created, Whisper API integration started
Next Steps: Finish Whisper transcription job, implement Claude summarization, create UI for viewing entries
Code Location: app/components/voice-journal/, app/api/voice-journal/
Blockers: None
```

### Ending a Session

At end of session, run:

```
/END_SESSION
Built: [List of completed features/components]
Tests Added: [Test coverage for new code]
Pushed to: [branch or main]
Next Session: [Recommended next tasks from Tasks.md]
```

**What This Does:**
1. Records session end time
2. Updates Tasks.md completion status
3. Commits and pushes to GitHub (with session tag)
4. Creates VERSIONS.md entry
5. Vercel auto-deploys if pushed to main

**Example:**
```
/END_SESSION
Built: Voice Journal recording component, Whisper transcription pipeline, basic entry list view
Tests Added: Tests for VoiceJournalRecorder component (85% coverage), API endpoint tests
Pushed to: main (Session 1 complete)
Next Session: Implement Claude summarization, add error handling, improve UI/UX based on test feedback
```

---

## 4. Versioning & Deployment Documentation

### VERSIONS.md File

Every session ends with an entry in `VERSIONS.md`:

```markdown
# Elevate: Version History & Deployment Log

**Last Updated:** [Date]  
**Live Version:** [Git commit hash]  
**Live URL:** www.lev8.ai

---

## Session 1: [Start Date] - [End Date]
**Duration:** [Hours]  
**Developer:** You  

**Features Built:**
- Voice Journal recording UI (Web Audio API)
- Supabase schema: grow_voice_journal table
- Whisper API integration for transcription
- Basic entry list view

**Tests Added:**
- VoiceJournalRecorder.test.tsx (85% coverage)
- /api/voice-journal/upload.test.ts

**Database Changes:**
- Created grow_voice_journal table with RLS policies
- Added audit_logs tracking for voice uploads

**API Endpoints Added:**
- POST /api/voice-journal/upload
- GET /api/voice-journal

**Commits:**
- `abc1234` - Add Voice Journal recording UI
- `def5678` - Implement Whisper transcription pipeline
- `ghi9012` - Add database schema and RLS

**Deployed:** www.lev8.ai (Vercel auto-deploy)  
**Status:** Live ✅

**Known Issues / Next Session:**
- Claude summarization not yet integrated
- Error handling needs refinement
- Loading states incomplete

---

## Session 2: [Start Date] - [End Date]
...
```

### Git Tagging

End each session with a tag:

```bash
git tag -a session-1 -m "Session 1: Voice Journal MVP - recording, transcription, storage"
git tag -a session-1-deployed -m "Session 1 deployed to www.lev8.ai"
git push origin --tags
```

### Deployment Checklist

Before pushing to main (which triggers live deployment):

- [ ] All tests passing (`npm run test`)
- [ ] Linting clean (`npm run lint`)
- [ ] No console.error in dev tools
- [ ] Manual smoke test: [Key user flows]
- [ ] Environment variables set in Vercel
- [ ] Database migrations (if any) tested
- [ ] No hard-coded secrets in code

---

## 5. Decision Log

Use this section to document architectural decisions and rationale:

### Decision Template
```
**Date:** [Date]  
**Topic:** [Feature/Component/Architecture]  
**Decision:** [What was decided]  
**Rationale:** [Why this approach]  
**Alternatives Considered:** [Other options rejected]  
**Impact:** [What changes as a result]  
```

### Example Decision Entry
```
**Date:** October 20, 2025  
**Topic:** Federation vs. Consolidation (VirtualSIM)  
**Decision:** Keep VirtualSIM separate; integrate at app layer  
**Rationale:** Cleaner schema separation, easier to scale content independently, lower risk  
**Alternatives:** Merge all into lev8 (risk of monolith), multiple projects (cost + complexity)  
**Impact:** App must fetch from two databases for some queries; implement caching for performance  
```

---

## 6. Code Quality Checklist

Before marking a task done, ensure:

### Functional Requirements
- [ ] Feature works as specified in PRD / task description
- [ ] All user stories for feature are covered
- [ ] Edge cases handled (empty states, errors, slow network)

### Code Quality
- [ ] TypeScript: No `any` types, strict mode passes
- [ ] Naming: Variables, functions, components clearly named
- [ ] Comments: Complex logic has comments; obvious code doesn't
- [ ] DRY: No repeated code blocks (extract to functions/components)
- [ ] Performance: No unnecessary re-renders, API calls, or data fetches

### Testing
- [ ] Unit tests for new functions/hooks (>80% coverage)
- [ ] Integration tests for API routes
- [ ] Manual testing of user flow
- [ ] Cross-browser testing (Chrome, Safari, Firefox)

### Security
- [ ] No API keys in frontend code
- [ ] No sensitive data in console.log
- [ ] Input validation and sanitization
- [ ] Auth checks on protected routes/API endpoints

### Documentation
- [ ] README updated if setup changes
- [ ] Complex functions/components have JSDoc comments
- [ ] API endpoints documented in code
- [ ] Commit message is clear and descriptive

### Accessibility
- [ ] Semantic HTML (buttons are `<button>`, not `<div>`)
- [ ] Keyboard navigation works
- [ ] Color contrast meets WCAG AA standards
- [ ] Form labels associated with inputs

---

## 7. Debugging & Troubleshooting

### Common Issues & Solutions

**Issue: "Unauthorized" errors from Supabase**
- Check: Is user authenticated? (localStorage has auth token)
- Check: Does RLS policy allow this user? (auth.uid() = correct value)
- Solution: Review RLS policy, ensure auth user_id matches

**Issue: Voice upload fails**
- Check: Is audio blob valid? (console.log(audioBlob.size))
- Check: Is multipart/form-data header set?
- Check: Supabase Storage bucket permissions
- Solution: Add error logging, implement retry logic

**Issue: Transcription takes too long**
- Check: Audio file size (keep <25MB)
- Check: Whisper API status (openai.com/status)
- Solution: Implement timeout, show progress to user, allow skip

**Issue: Vercel deployment fails**
- Check: Build logs in Vercel dashboard
- Check: Environment variables set?
- Check: TypeScript compilation errors
- Solution: Run `npm run build` locally, debug before push

### Logging Strategy

**Development:**
```typescript
console.log('[VoiceJournal] Recording started');
console.error('[VoiceJournal] Upload failed:', error);
```

**Production (Phase 2):**
```typescript
import Sentry from '@sentry/nextjs';
Sentry.captureException(error, { tags: { component: 'VoiceJournal' } });
```

---

## 8. External Dependencies & API Keys

### Required APIs (MVP)

**OpenAI Whisper**
- Purpose: Voice transcription
- Key Location: `.env.local` as `NEXT_PUBLIC_OPENAI_API_KEY` (backend only)
- Rate Limit: Depends on plan
- Fallback: Manual transcription input

**Claude API**
- Purpose: Voice memo summarization
- Key Location: `.env.local` as `ANTHROPIC_API_KEY` (backend only)
- Rate Limit: Depends on plan
- Fallback: Show transcription without summary

**Supabase**
- Purpose: Database + auth + storage
- Key Location: `.env.local` as `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_KEY`
- Documentation: supabase.com/docs
- Local Testing: Use `supabase start` for local dev

### Environment Variables (.env.local)

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJxxxxxx
SUPABASE_JWT_SECRET=xxxxx

# OpenAI (Whisper)
OPENAI_API_KEY=sk-xxxxx

# Claude (Anthropic)
ANTHROPIC_API_KEY=sk-ant-xxxxx

# Vercel (auto-set on deployment)
NEXT_PUBLIC_VERCEL_URL=lev8.vercel.app

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000 (local)
NODE_ENV=development
```

**Never commit .env.local to Git.** Use `.env.local.example` as template.

---

## 9. Project Values & Principles

### Privacy First
- Resident voice journals are sacred. Zero backdoors.
- Default to private; never expose more data than necessary.
- Always question: "Should this role see this data?"

### Security Over Convenience
- 2FA is inconvenient but required for first login.
- Encrypted storage is slower but necessary.
- Type safety prevents bugs.

### Clarity Over Cleverness
- Simple, readable code beats clever one-liners.
- New developer should understand code in 10 minutes.
- Explicit is better than implicit.

### Iterate Based on Feedback
- MVP is not final. Build, test, iterate.
- Test users are goldmines of feedback.
- Be willing to refactor if approach isn't working.

### Ship Small, Ship Often
- Smaller PRs are easier to review and debug.
- Deploy frequently to catch issues early.
- Each session should result in at least one feature pushed to main.

---

## 10. Communication & Handoffs

### Between Sessions

If stopping mid-task or mid-session:

1. **Commit current work:** Even if incomplete, commit to feature branch
2. **Leave clear notes:** What's done, what's next, any blockers
3. **Update Tasks.md:** Mark progress percentage
4. **Document in Claude.md:** Next developer can pick up without guessing

### With Other Developers

- **Code reviews:** Assume good intent. Be constructive, not judgmental.
- **Questions:** Ask in code comments or GitHub issues, not Slack threads
- **Documentation:** If you figure something out, document it so others don't struggle

---

## 11. This Document

**Last Reviewed:** October 20, 2025  
**Maintainer:** You  
**Review Frequency:** Every 3 sessions or when major architecture changes

When you discover something that would improve this document, add it immediately. Keep this as the source of truth for how Elevate is built.