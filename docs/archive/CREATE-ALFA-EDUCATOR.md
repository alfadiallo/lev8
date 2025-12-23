# Create Educator User - Alfa Diallo

## Quick Setup

Run the TypeScript script to create the educator user:

```bash
npx tsx scripts/create-educator-user.ts [password]
```

**Default password:** `TempPassword123!` (change it after first login)

**Example:**
```bash
npx tsx scripts/create-educator-user.ts MySecurePassword123!
```

## What It Does

The script will:
1. ✅ Get or create Memorial Healthcare System
2. ✅ Get or create Emergency Medicine Residency program
3. ✅ Create auth user for `adiallo@mhs.net`
4. ✅ Create user profile with role `faculty`
5. ✅ Create faculty record linked to the program

## User Details

- **Name:** Alfa Diallo
- **Email:** adiallo@mhs.net
- **Role:** faculty
- **Institution:** Memorial Healthcare System
- **Program:** Emergency Medicine Residency
- **Access:** All modules (Learn, Reflect, Understand)

## After Creation

1. Log in at `http://localhost:3001/login`
2. Use email: `adiallo@mhs.net`
3. Use the password you set (or default: `TempPassword123!`)
4. You should have access to all modules as an educator

## Alternative: SQL Script

If you prefer SQL, you can:
1. Create the auth user in Supabase Dashboard first
2. Run `scripts/create-alfa-diallo-educator.sql` with the user ID

But the TypeScript script is easier - it does everything automatically!



