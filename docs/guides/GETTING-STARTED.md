# Getting Started with Lev8

**Quick start guide for new developers**

---

## Prerequisites

Before you begin, ensure you have:

- **Node.js 18+** installed ([Download](https://nodejs.org/))
- **Git** installed
- **Supabase account** ([Sign up](https://supabase.com/))
- **OpenAI API key** (for Whisper transcription)
- **Anthropic API key** (for Claude AI)
- Basic knowledge of TypeScript, React, and Next.js

---

## 1. Clone the Repository

```bash
git clone <repository-url>
cd lev8
```

---

## 2. Install Dependencies

```bash
npm install
```

This installs:
- Next.js 14
- React 18
- Supabase client
- Recharts (analytics)
- Tailwind CSS
- TypeScript
- And all other dependencies

---

## 3. Set Up Environment Variables

Create `.env.local` in the project root:

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# AI Services
OPENAI_API_KEY=sk-your-openai-key-here
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here

# Application
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Finding Supabase Keys:**
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to Settings → API
4. Copy the URL, anon key, and service_role key

---

## 4. Set Up the Database

See **[Database Setup Guide](DATABASE-SETUP.md)** for detailed instructions.

**Quick version:**
1. Run migrations in Supabase SQL Editor (in order):
   - `supabase/migrations/20250115000000_base_schema.sql`
   - `supabase/migrations/20250115000001_add_learning_modules.sql`
   - `supabase/migrations/20250115000002_analytics_foundation.sql`
   - `supabase/migrations/20250115000003_analytics_rls_policies.sql`

2. Seed initial data:
   - `scripts/04-seed-initial-data.sql`
   - `scripts/seed-analytics-config.sql`

---

## 5. Run the Development Server

```bash
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000)

---

## 6. Create a Test Account

1. Navigate to `http://localhost:3000/register`
2. Fill out the registration form
3. Log in with your new account
4. Explore the three modules:
   - **Learn:** Difficult Conversations, Clinical Cases
   - **Grow:** Voice Journal
   - **Understand:** Analytics Dashboard

---

## Project Structure

```
lev8/
├── app/                      # Next.js App Router
│   ├── (auth)/              # Auth pages (login, register)
│   ├── (dashboard)/         # Protected pages
│   │   ├── modules/        # Module pages
│   │   └── settings/       # User settings
│   └── api/                # API routes
├── components/              # React components
│   ├── forms/              # Form components
│   └── modules/            # Module-specific components
├── lib/                    # Utilities and helpers
│   ├── ai/                # AI integration (Claude)
│   ├── analytics/         # Analytics utilities
│   └── permissions/       # RBAC utilities
├── docs/                   # Documentation
│   └── guides/            # User guides
├── scripts/               # Database and import scripts
│   ├── migrations/       # Database setup
│   └── archive/          # Historical scripts
└── supabase/             # Supabase migrations
```

---

## Key Concepts

### Next.js App Router
- Uses file-based routing
- Route groups like `(dashboard)` organize files without affecting URLs
- API routes must be in `route.ts` files

### Authentication
- Supabase Auth for user management
- Role-based access control (RBAC)
- Roles: resident, faculty, program_director, super_admin

### Database
- PostgreSQL via Supabase
- Row-Level Security (RLS) for data protection
- 30+ tables for comprehensive data model

### AI Integration
- OpenAI Whisper for voice transcription
- Anthropic Claude for:
  - SWOT analysis generation
  - Conversation AI
  - Text summarization

---

## Development Workflow

### Making Changes

1. Create a feature branch:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. Make your changes

3. Test locally:
   ```bash
   npm run dev
   ```

4. Check for TypeScript errors:
   ```bash
   npx tsc --noEmit
   ```

5. Commit and push:
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin feature/your-feature-name
   ```

### Code Standards

- **TypeScript Strict Mode:** All code must pass strict type checking
- **Logging:** Use `console.log('[ComponentName]', ...)` format
- **API Routes:** Must be in `route.ts` files
- **RLS:** Never bypass Row-Level Security in client code
- **Testing:** Test end-to-end flows before committing

---

## Common Tasks

### Adding a New API Endpoint

1. Create folder in `app/api/your-endpoint/`
2. Create `route.ts` file
3. Export handler functions (GET, POST, etc.)
4. Use Supabase client for database access
5. Implement proper error handling

Example:
```typescript
// app/api/example/route.ts
import { createClient } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const supabase = createClient();
  
  const { data, error } = await supabase
    .from('your_table')
    .select('*');
    
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  
  return NextResponse.json(data);
}
```

### Adding a New Component

1. Create file in appropriate `components/` subdirectory
2. Use TypeScript for props interface
3. Add `'use client'` if component needs interactivity
4. Follow existing naming conventions

Example:
```typescript
'use client';

interface MyComponentProps {
  title: string;
  onAction: () => void;
}

export default function MyComponent({ title, onAction }: MyComponentProps) {
  return (
    <div>
      <h2>{title}</h2>
      <button onClick={onAction}>Click Me</button>
    </div>
  );
}
```

### Running Database Migrations

1. Create SQL file in `supabase/migrations/`
2. Name with timestamp: `YYYYMMDDHHMMSS_description.sql`
3. Run in Supabase SQL Editor
4. Verify with test queries

---

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 3000
lsof -ti:3000

# Kill the process
kill -9 $(lsof -ti:3000)

# Restart dev server
npm run dev
```

### Environment Variables Not Loading

- Ensure `.env.local` exists in project root
- Restart dev server after changing env vars
- Check for typos in variable names
- Verify no extra spaces around `=`

### Database Connection Issues

- Verify Supabase URL and keys are correct
- Check if Supabase project is active (not paused)
- Ensure RLS policies allow your operations
- Check Supabase dashboard for errors

### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Restart dev server
npm run dev
```

---

## Next Steps

1. **[Database Setup](DATABASE-SETUP.md)** - Set up the complete database schema
2. **[Data Import](DATA-IMPORT.md)** - Import residents, faculty, and evaluations
3. **[Dashboard Usage](DASHBOARD-USAGE.md)** - Learn to use the analytics dashboard
4. **[Setup Guide](../SETUP.md)** - Comprehensive setup reference

---

## Additional Resources

- **[Main README](../../README.md)** - Project overview
- **[Analytics Documentation](../ANALYTICS.md)** - Analytics engine details
- **[EQ+PQ+IQ Documentation](../EQ-PQ-IQ.md)** - Evaluation framework
- **[Current State Summary](../CURRENT-STATE-SUMMARY.md)** - System overview

---

## Getting Help

If you encounter issues:

1. Check the troubleshooting section above
2. Review relevant documentation
3. Check browser console for errors
4. Review server logs in terminal
5. Verify database state with SQL queries

---

**Welcome to the Lev8 development team!** 🎉


