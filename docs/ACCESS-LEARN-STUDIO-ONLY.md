# Learn + Studio Only Access (e.g. Sandra Lopez)

This doc explains how to give a user **only** Learn modules and Studio (no Reflect, Understand, Truths), and how to avoid the token/link issues that affected Kyle.

## Role: `studio_creator`

- **Dashboard**: Yes  
- **Learn** (Clinical Cases, Difficult Conversations, EKG & ACLS, Running the Board): Yes  
- **Studio**: Yes  
- **Reflect** (Voice Journal): No  
- **Understand** (Analytics, CCC): No  
- **Truths**: No  
- **Expectations**: No  

## Giving Sandra Lopez Learn + Studio Only

### If Sandra is already in the system

1. **Find her account**  
   Admin → User Management, or query `user_profiles` for name/email.  
   Seed script email: `sandramarcellalopez@gmail.com` (see `scripts/seed-core-faculty.ts`).

2. **Set her role to `studio_creator`**  
   - In **Admin → User Management**: edit her user and set Role to **Studio creator** (if the UI supports it after the migration).  
   - Or in Supabase SQL:
     ```sql
     UPDATE user_profiles
     SET role = 'studio_creator'
     WHERE email = 'sandramarcellalopez@gmail.com'
        OR full_name ILIKE '%Sandra%Lopez%';
     ```

3. **Send a password-set link (avoid token issues)**  
   - **Preferred**: Have her go to **Login → “Forgot password?”** and enter her email. That flow uses the app’s redirect to `/update-password`, so the link works.  
   - Or in Admin → User Management use “Send invite” / “Reset password” if that button uses the same flow.  
   - **Avoid** creating a *new* account for the same email via “Approve access request” if she already has an account; that can cause confusion.

### If Sandra does not have an account yet

1. **Create her in Admin → User Management**  
   - Full name: Sandra Lopez  
   - Personal email: (her email)  
   - Role: **Studio creator**  
   - Check **Send invite** so she gets the welcome email with the “Set your password” link.

2. **Ensure token/link works**  
   - The invite now uses a recovery link that redirects to your app’s `/update-password` page (see “Token fixes” below).  
   - In **Supabase Dashboard → Authentication → URL Configuration**, add your app’s redirect URL (e.g. `https://lev8.ai/update-password`) to **Redirect URLs**.

## Avoiding the same token problems as Kyle

What was going wrong:

- The “Approve access request” and “Create user + send invite” flows used Supabase’s **recovery link** but did **not** pass a **redirect URL**.
- So the link could send users to Supabase’s default URL instead of your app’s `/update-password` page, or the link could be wrong/expired.

What was changed:

1. **Redirect URL**  
   All recovery links are now generated with  
   `options: { redirectTo: `${APP_URL}/update-password` }`  
   so the user lands on your app’s password-set page.

2. **Validation**  
   If the link is missing, the welcome email no longer shows a broken “Set your password” button; it shows “Go to Login” and tells the user to use **Forgot password** with their email to get a new link.

3. **Admin “Create user” invite**  
   The Admin “Create user” flow with “Send invite” now actually sends the welcome email with the reset link (it used to call `generateLink` but never send the email).

**What you should do:**

- In **Supabase Dashboard → Authentication → URL Configuration**:
  - Add `https://lev8.ai/update-password` (and `http://localhost:3000/update-password` for dev) to **Redirect URLs**.
- For **existing users** (e.g. Kyle, Sandra) who had bad links: ask them to use **Login → Forgot password** and their email; that flow uses the correct redirect and avoids the old token mess.

## Running the migration

So that `user_profiles.role` can be `studio_creator`, run:

```bash
npx supabase db push
# or apply migration 20260210000003_add_studio_creator_role.sql
```

After that, you can set any user’s role to `studio_creator` in the DB or (when wired) in Admin → User Management.
