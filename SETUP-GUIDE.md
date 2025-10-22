# Lev8 Setup Guide

## The Problem You Hit

When you try to register and use Voice Journal, you get:
**"Account profile not found. Please complete your registration or contact support."**

### Why This Happens:

1. **Database is empty** - No programs or institutions exist
2. **Registration needs a program** - Can't create a resident without a program
3. **Voice Journal needs a resident/faculty record** - Not just a user account

## Step-by-Step Fix

### Step 1: Seed the Database (ONE TIME ONLY)

**Option A - Use the API (Easiest):**

1. Make sure your dev server is running: `npm run dev`
2. Open your browser or use curl:
   ```bash
   curl -X POST http://localhost:3002/api/seed-data
   ```
   Or visit in browser and click POST in dev tools

3. You should see:
   ```json
   {
     "success": true,
     "message": "Seed data created successfully!",
     "data": {
       "healthSystem": "Memorial Healthcare System",
       "program": "Emergency Medicine Residency",
       "classes": 3,
       "buckets": 3
     }
   }
   ```

**Option B - Use Supabase Dashboard:**

1. Go to https://supabase.com/dashboard
2. Select your project
3. Click "SQL Editor" in left sidebar
4. Copy/paste contents of `scripts/seed-basic-data.sql`
5. Click "Run"

### Step 2: Register a New Account

1. Go to http://localhost:3002/register
2. Fill out the form completely:
   - **First Name** (required)
   - **Last Name** (required)
   - **Email** (required)
   - **Password** (required)
   - **Phone** (optional)
   - **Medical School** (optional - e.g., "University of Miami")
   - **Specialty** (optional - e.g., "Emergency Medicine")

3. Click "Register"

4. Look at your terminal for `[Register]` logs to confirm:
   ```
   [Register] Creating profile: { id: '...', email: '...', first_name: '...', last_name: '...' }
   [Register] Using program ID: b0000000-0000-0000-0000-000000000001
   [Register] Creating resident record...
   [Register] Resident record created successfully!
   ```

### Step 3: Test Voice Journal

1. Go to http://localhost:3002/login
2. Log in with your new account
3. Navigate to Voice Journal
4. Click "New Entry"
5. Record, preview, and save
6. Should work! 🎉

## What Gets Created During Registration

### In Supabase Auth:
- User account with email/password

### In `user_profiles` table:
- `id` (matches Supabase Auth user ID)
- `email`
- `first_name` and `last_name` (or `full_name` depending on schema)
- `phone`
- `role` = 'resident'
- `is_active` = true

### In `residents` table:
- `user_id` (links to user_profiles)
- `program_id` (links to Emergency Medicine program)
- `medical_school`
- `specialty`

## Diagnostic Tools

### Check if database is seeded:
```
GET http://localhost:3002/api/diagnostic
```

Look for:
- ✅ `voiceJournalBucket: "✅ Exists"`
- ✅ `users: "✅ 1 users"`
- ✅ `residents: "✅ 1 residents"`

### Check user profiles:
```
GET http://localhost:3002/api/check-profile
```

Look for:
- `hasValidProfile: true`
- `needsSetup: false`
- Either `resident` or `faculty` should have data

### Check database schema:
```
GET http://localhost:3002/api/check-schema
```

Shows what columns exist in your tables and if programs are seeded.

## Common Issues

### "No program configured"
- **Fix:** Run `/api/seed-data` endpoint

### "Failed to create user profile record"
- **Fix:** Check terminal for detailed error
- **Likely:** Missing `class_id` or foreign key constraint issues

### "Bucket not found"  
- **Fix:** Create voice_journal bucket in Supabase Dashboard > Storage

### Registration succeeds but Voice Journal fails
- **Fix:** Check if resident record was created: `/api/check-profile`
- **Solution:** Resident record creation might have failed silently

## About the Schema

### Why first_name/last_name?
Better for:
- Sorting by last name
- Displaying "LastName, FirstName" format
- International names
- Formal vs informal displays

### Why resident AND user_profiles?
- `user_profiles` = Base user info (all roles)
- `residents` = Resident-specific data (program, medical school)
- `faculty` = Faculty-specific data (title, department)
- This allows one person to have multiple roles

### Why program_id is required?
- Voice journal entries need `institution_id`
- `institution_id` comes from `program.health_system_id`
- Without a program, we can't determine the institution
- This ensures proper data isolation

## Next Steps After Setup

1. ✅ Database seeded
2. ✅ Account registered with resident record
3. ✅ Voice Journal works
4. 🔜 Add more programs (optional)
5. 🔜 Add faculty accounts (optional)
6. 🔜 Enable 2FA (when ready)
7. 🔜 Add program selector to registration form

## Need Help?

Check logs in this order:
1. Browser console (F12) - frontend errors
2. Terminal where `npm run dev` runs - backend logs with `[Register]` and `[Upload]` prefixes
3. Supabase Dashboard > Logs - database errors

