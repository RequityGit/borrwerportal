# System Diagnosis: SUPABASE_SERVICE_ROLE_KEY Configuration Issue

## Summary
The error shown in the screenshot indicates that the Requity Borrower Portal is unable to add investors because the `SUPABASE_SERVICE_ROLE_KEY` environment variable is not configured.

**Error Message:**
```
Error adding investor
SUPABASE_SERVICE_ROLE_KEY is required to add investors.
Add it to your environment variables.
You can find it in Supabase Dashboard → Settings → API → service_role_key.
```

## Root Cause
The application requires three environment variables to function properly:
1. `NEXT_PUBLIC_SUPABASE_URL` - The Supabase project URL (public)
2. `NEXT_PUBLIC_SUPABASE_ANON_KEY` - The anonymous API key (public)
3. `SUPABASE_SERVICE_ROLE_KEY` - The service role key (secret, server-side only)

Currently, `SUPABASE_SERVICE_ROLE_KEY` is not configured in the deployment environment.

## Affected Functionality
The following features require the service role key:

1. **Adding Investors** (`/app/(authenticated)/admin/investors/new/actions.ts`)
   - Line 37-42: Validates the presence of service role key
   - Used to create new users via `adminClient.auth.admin.createUser()`
   - This is a privileged operation that requires the service role key

2. **Sending Activation Links** (`/app/(authenticated)/admin/investors/new/actions.ts`)
   - Line 114-115: Checks for service role key
   - Used to generate magic links for investor activation
   - Fallback to anonymous key with OTP if service role key unavailable

3. **Admin Operations** (`/lib/supabase/admin.ts`)
   - Creates an admin Supabase client that requires the service role key
   - Throws error if environment variables are missing

## Configuration Requirements

### Environment Variables
The following variables must be configured in your deployment environment:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Where to Find These Values
1. Go to your [Supabase Dashboard](https://supabase.com)
2. Navigate to **Settings → API**
3. Copy the values:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` → `SUPABASE_SERVICE_ROLE_KEY`

### Deployment Configuration
For different deployment platforms:

**Netlify:**
- Set environment variables in **Site Settings → Build & deploy → Environment**

**Vercel:**
- Set environment variables in **Settings → Environment Variables**

**Local Development:**
- Create a `.env.local` file in the project root (do NOT commit this file)
- Add the three environment variables
- Restart the dev server (`npm run dev`)

## Code Analysis

### Error Validation (Good Practice)
The codebase properly validates environment variables:

1. **Strict validation in `addInvestorAction`:**
   ```typescript
   if (!supabaseUrl || !supabaseServiceRoleKey) {
     return {
       error: "SUPABASE_SERVICE_ROLE_KEY is required to add investors..."
     };
   }
   ```

2. **Graceful fallback in `sendActivationLinkAction`:**
   ```typescript
   if (supabaseServiceRoleKey) {
     // Use admin client for magic link
   } else if (supabaseAnonKey) {
     // Fallback to OTP-based sign-in
   } else {
     // Error: missing configuration
   }
   ```

### Security Notes
- The service role key is secret and should **never** be exposed to the client
- It is correctly used only in server-side code (marked with `"use server"`)
- Public keys are prefixed with `NEXT_PUBLIC_` and are safe for client-side use
- The `.env` file should be added to `.gitignore` to prevent secrets from being committed

## Recommended Actions

### Immediate Fix
1. Obtain your Supabase service role key from the Supabase Dashboard
2. Set the `SUPABASE_SERVICE_ROLE_KEY` environment variable in your deployment platform
3. Verify all three Supabase environment variables are properly configured

### Verification
After setting the environment variables:
1. Restart the application/deployment
2. Navigate to the "Add Investor" page
3. Try adding a test investor to confirm the error is resolved

### For Local Development
1. Create `.env.local` in the project root
2. Add all three Supabase variables
3. Run `npm run dev`
4. The "Add Investor" feature should now work

## Files Involved
- `/app/(authenticated)/admin/investors/new/actions.ts` - Main investor management actions
- `/lib/supabase/admin.ts` - Admin client creation utility
- `/.env.example` - Environment variable template (reference only)

## Additional Notes
- The application gracefully handles missing the service role key in some cases
- The "Send Activation Link" feature can still work with just the anonymous key (using OTP)
- However, the "Add Investor" feature specifically requires the service role key due to the need for admin-level user creation permissions
