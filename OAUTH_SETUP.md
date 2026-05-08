# Google OAuth Setup Guide

TableNow uses Supabase for OAuth-based authentication. This guide helps you set up and debug Google OAuth.

## Prerequisites

### 1. Supabase Project Configuration

Your Supabase project must be configured with:

1. **Google OAuth Provider** (Supabase Dashboard → Authentication → Providers → Google)
   - Google Client ID
   - Google Client Secret
   - Authorized Redirect URLs (critical!)

2. **Authorized Redirect URLs** (Supabase → Authentication → URL Configuration)
   
   For **local development**, add:
   ```
   http://localhost:5173/auth/callback
   http://localhost:3000/auth/callback
   ```
   
   For **production**, add:
   ```
   https://app.tablenow.io/auth/callback
   ```

   ⚠️ **Important**: If the callback URL doesn't match exactly (including protocol, domain, and path), Supabase will reject the OAuth redirect with a 401 error.

### 2. Environment Variables

Create `.env` in the frontend root (copy from `.env.example`):

```bash
VITE_API_URL=http://localhost:5000
VITE_FRONTEND_URL=http://localhost:5173
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Important**: 
- `VITE_SUPABASE_ANON_KEY` must be set. An empty value will cause authentication to fail silently.
- These variables are embedded in client JavaScript (they're public). Never put secrets here.

## How Google OAuth Works (PKCE Flow)

1. User clicks "Continue with Google" on Login page
2. Frontend calls `supabase.auth.signInWithOAuth({ provider: 'google', redirectTo: 'http://localhost:5173/auth/callback' })`
3. Supabase SDK:
   - Generates `code_verifier` (random string) and `code_challenge` (SHA256 hash)
   - Stores `code_verifier` in localStorage
   - Redirects to Google via Supabase auth endpoint
4. User authenticates with Google
5. Supabase redirects back to `/auth/callback?code=...&state=...`
6. Supabase SDK automatically:
   - Parses the code from URL
   - Retrieves `code_verifier` from localStorage
   - Exchanges code + code_verifier for session at `/auth/v1/token?grant_type=pkce`
7. Frontend's `AuthCallback` component receives `SIGNED_IN` event with access_token
8. Frontend calls `/api/auth/google/supabase` to create/login user and get JWT

## Common Issues & Solutions

### Issue: 401 Unauthorized on `/auth/v1/token?grant_type=pkce`

**Symptoms**: User clicks Google button, gets redirected to callback page, then error appears after 3 seconds.

**Root causes**:

1. **Wrong authorized redirect URL in Supabase**
   - Check: Supabase Dashboard → Authentication → URL Configuration
   - Ensure the exact callback URL is listed
   - Include the protocol (`http://` or `https://`) and full path (`/auth/callback`)
   - URLs are case-sensitive and must include trailing paths exactly

2. **Missing or invalid VITE_SUPABASE_ANON_KEY**
   - Check: `.env` file contains the key
   - Run: Open browser console on login page
   - Look for warning: `⚠️ VITE_SUPABASE_ANON_KEY not set. Supabase auth may not work.`

3. **Code verifier not stored in localStorage**
   - Check browser DevTools → Application → Local Storage
   - Look for keys containing `sb-`, `code_verifier`, or `pkce`
   - If missing: may indicate Supabase SDK didn't initialize properly

4. **Browser/storage privacy blocking**
   - Third-party cookies or localStorage might be disabled
   - Check: Chrome → Settings → Privacy → Third-party cookies
   - Some privacy browsers (Firefox strict mode) block cross-domain storage

### Issue: Stuck on "Finalisation de la connexion..." spinner

**Symptoms**: The AuthCallback page shows loading spinner indefinitely.

**Root causes**:

1. **onAuthStateChange not firing SIGNED_IN event**
   - The PKCE exchange succeeded but event not emitted
   - Check browser console for errors
   - Check: Is the Supabase SDK properly initialized?

2. **getSession() returning null**
   - Session might not be persisted
   - Check: localStorage has `sb-*` token keys
   - Check: Browser allows localStorage (not in private mode)

3. **Backend `/api/auth/google/supabase` endpoint not responding**
   - Verify backend is running on `VITE_API_URL` (default: `http://localhost:5000`)
   - Check: Endpoint returns JWT token and restaurant data

### Issue: 403 "Please verify your email first"

**Cause**: Account exists but email not verified.

**Solution**: Complete the email verification flow first (check inbox or spam folder).

## Debug Checklist

When OAuth fails:

1. **Check Console Logs**
   ```javascript
   // DevTools → Console
   // Look for:
   // 🔵 AuthCallback debug: ...
   // 🔵 Auth state: ...
   // ❌ Error: ...
   ```

2. **Check Network Tab**
   - POST to `https://your-supabase-url/auth/v1/token?grant_type=pkce`
   - Should respond with 200 + session data
   - If 401: code_verifier mismatch or not found

3. **Check localStorage**
   ```javascript
   // In browser console:
   Object.keys(localStorage)
   // Should include keys with 'sb-' or 'code_verifier'
   ```

4. **Verify Config**
   ```javascript
   // In browser console:
   import { config } from '/src/config/env.ts'
   console.log(config)
   // Should show correct supabaseUrl and supabaseAnonKey
   ```

5. **Test Backend Connection**
   ```bash
   curl http://localhost:5000/health
   # Should respond with { "status": "ok", ... }
   ```

## Local Development Setup

For a complete local test:

1. Start frontend:
   ```bash
   npm install
   cp .env.example .env
   # Edit .env with your Supabase credentials
   npm run dev
   ```

2. Start backend:
   ```bash
   cd ../tablenowbackend
   npm install
   npm run dev
   ```

3. Add localhost callback URLs to Supabase (see Prerequisites #1)

4. Test flow:
   - Visit http://localhost:5173/login
   - Click "Continue with Google"
   - Complete Google authentication
   - Should redirect to dashboard or onboarding

## Production Deployment

When deploying to production:

1. Add `https://app.tablenow.io/auth/callback` to Supabase authorized URLs
2. Set `VITE_FRONTEND_URL=https://app.tablenow.io` in deployment env vars
3. Set `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from your Supabase project
4. Verify backend is accessible at `VITE_API_URL` (usually `https://api.tablenow.io`)

## Security Notes

- `VITE_SUPABASE_ANON_KEY` is publicly visible (it's intended to be)
- Google OAuth uses PKCE (Proof Key for Code Exchange) for security — code_verifier is never transmitted
- Real secrets (JWT_SECRET, API keys) belong on the backend, never in VITE_* variables
- Always use HTTPS in production for OAuth callbacks
