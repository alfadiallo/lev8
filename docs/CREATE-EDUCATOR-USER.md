# How to Create an Educator User

## Quick Method: Automated SQL Script (Recommended)

### Step 1: Create Auth User in Supabase Dashboard

1. Go to **Supabase Dashboard** → **Authentication** → **Users**
2. Click **"Add User"** or **"Create User"**
3. Fill in:
   - **Email**: `adiallo@mhs.net`
   - **Password**: (set a secure password)
   - **Auto Confirm User**: ✅ (check this)
4. Click **"Create User"**

### Step 2: Run SQL Script

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Open and run: `scripts/create-alfa-diallo-educator.sql`
   - This script automatically finds the auth user by email
   - No need to manually copy/paste user IDs!
3. The script will:
   - Find the auth user
   - Create/update the user profile
   - Create/update the faculty record
   - Show verification results

### Step 3: Verify and Login

1. Check the verification query results at the end of the script
2. Go to `http://localhost:3000/login`
3. Login with:
   - Email: `adiallo@mhs.net`
   - Password: (the password you set in Step 1)

## Alternative: TypeScript Script

If the SQL script doesn't work due to cache issues, you can try:

```bash
npx tsx scripts/create-educator-user.ts "YourPasswordHere"
```

**Note:** This may fail due to PostgREST cache issues. If it does, use the SQL script method above.

## Role Options

In the SQL script, you can change the role from `'faculty'` to:
- `'faculty'` - Regular faculty member (default)
- `'program_director'` - Program director (more permissions)
- `'super_admin'` - Super admin (all permissions)

Just change this line in the script:
```sql
role: 'faculty', -- Change to 'program_director' if needed
```

## Files Available

- `scripts/create-alfa-diallo-educator.sql` - **Recommended** - Auto-finds auth user
- `scripts/create-educator-user-complete.sql` - Manual user ID entry required
- `scripts/create-educator-user.ts` - TypeScript script (may have cache issues)
