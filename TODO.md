# TODO - Fix NextAuth v5 handler error

## Root Cause
`next-auth@^5.0.0-beta.32` is installed. In v5, `NextAuth()` returns an object
`{ handlers, auth, signIn, signOut }`, NOT a callable function. The route file
used the v4 API pattern (`NextAuth(authOptions)` returns a handler function),
causing: `TypeError: Function.prototype.apply was called on #<Object>`.

## Plan
- [x] 1. Rewrite `app/api/auth/[...nextauth]/route.ts` to re-export v5 handlers from `@/auth`
- [x] 2. Add Google provider to `auth.ts` (merging from route.ts)
- [x] 3. Verify `.env` has `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `NEXTAUTH_SECRET`, `DATABASE_URL`
- [x] 4. Build succeeded — `/api/auth/[...nextauth]` route registered correctly

## Second issue: Module not found @/lib/supabaseClient
The login/daftar pages were partially migrated to Supabase auth (broken — no env vars,
no @supabase/supabase-js package, no /auth/callback route). The app is fully wired for
NextAuth + Prisma. Fix: revert both pages to the NextAuth flow.
- [x] 1. Revert `app/login/page.tsx` to NextAuth `signIn`
- [x] 2. Revert `app/daftar/page.tsx` to POST `/api/auth/register` + NextAuth Google signIn
- [x] 3. Re-run `npx next build` — succeeded, module-not-found resolved
