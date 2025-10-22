# Elevate - Medical Education Portal

This is a [Next.js](https://nextjs.org) project for a healthcare platform focused on medical residency programs, specifically Emergency Medicine. The platform features voice journaling with AI transcription and summarization.

## Project Overview

**Elevate** is a comprehensive medical education platform designed for:
- Medical residents and faculty
- Voice journaling with AI-powered transcription (Whisper) and summarization (Claude)
- Module-based learning system (Learn, Grow, Understand)
- Emergency Medicine focus

## Tech Stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind CSS
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **AI Services:** OpenAI Whisper API (transcription), Claude API (summarization)
- **Authentication:** Supabase Auth with 2FA TOTP support

## Getting Started

### Prerequisites
- Node.js 18+ 
- Supabase account
- OpenAI API key
- Claude API key

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd lev8
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
# Edit .env.local with your API keys
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

```
app/
├── (auth)/           # Authentication pages
├── (dashboard)/      # Protected dashboard pages
│   └── modules/      # Module-based features
│       └── grow/     # Voice journaling module
├── api/              # API routes
└── layout.tsx        # Root layout

components/
└── voice-journal/    # Voice recording components

lib/
├── supabase.ts       # Supabase client
├── totp.ts          # 2FA utilities
└── deviceTrust.ts   # Device trust system
```

## Key Features

### ✅ Completed Features
- **Authentication System:** Email/password registration and login
- **Voice Journaling:** Record, transcribe, and summarize voice entries
- **Dashboard:** Expandable navigation with module organization
- **Database Schema:** Complete user profiles, residents, and voice journal tables
- **RLS Policies:** Secure data access with Row Level Security

### 🚧 In Development
- Settings pages (account, program, devices)
- Additional module content (Learn, Understand)
- Unit tests and error handling improvements

## Documentation

- **[Setup Guide](SETUP-GUIDE.md)** - Complete setup instructions
- **[Version History](versions.md)** - Detailed development log
- **[Product Requirements](prd.md)** - Feature specifications
- **[Bug Fixes](BUGFIX-VOICE-JOURNAL.md)** - Voice journal issue resolution
- **[Layout Bug Fix](BUGFIX-LAYOUT-UPDATES.md)** - Dashboard layout issue resolution

## Recent Updates

### Session 3E: Layout Updates Fix (October 21, 2025)
**Issue:** Design changes not reflecting in browser due to Next.js App Router routing confusion.

**Root Cause:** User was accessing `app/page.tsx` (old layout) instead of `app/(dashboard)/page.tsx` (new layout). Route groups `(dashboard)` don't create accessible routes.

**Solution:** Consolidated layouts by moving new dashboard design directly into root page.

**Result:** ✅ All expected changes now visible:
- Expandable "Modules" section with arrow (▶)
- "Action Items" instead of "Module Buckets"
- Settings link in sidebar
- Improved navigation structure

## Development Notes

### Next.js App Router
- Route groups `(dashboard)` create organization but not accessible routes
- Root page `app/page.tsx` serves `/` route
- Client components need `'use client'` for interactivity

### Database Schema
- `user_profiles` - Base user information
- `residents` - Resident-specific data linked to programs
- `grow_voice_journal` - Voice entries with RLS policies
- `programs` - Residency programs
- `health_systems` - Medical institutions

### Authentication
- Currently simplified for MVP testing (2FA disabled)
- Uses Supabase Auth with session management
- Device trust system for 30-day bypass

## Troubleshooting

### Common Issues
1. **Layout changes not reflecting:** Check if accessing correct route
2. **Voice journal upload failing:** Verify authentication credentials
3. **Server errors:** Check for file watching issues (`EMFILE` errors)

### Debug Commands
```bash
# Check server status
lsof -ti:3000

# Verify served content
curl -s http://localhost:3000 | grep -E "(Action Items|Module Buckets)"

# Clear Next.js cache
rm -rf .next
```

## Contributing

1. Follow TypeScript strict mode
2. Use `console.log('[ComponentName]', ...)` for debugging
3. API routes must be in `route.ts` files (Next.js 14 requirement)
4. Test voice journal functionality end-to-end

## License

This project is proprietary software for Elevate Medical Education Platform.

---

**Status:** MVP Core complete, ready for feature expansion and testing
