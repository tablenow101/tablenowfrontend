# 🧪 TableNow Auth Flow - Testing Checklist

## Preconditions
- [ ] New email address (never used in system)
- [ ] Vercel main deployed and updated
- [ ] Private/Incognito browser window
- [ ] Network DevTools open to monitor auth calls

## 1️⃣ Google OAuth Login Flow

| Step | Action | Expected Result | Status |
|------|--------|---|---|
| 1 | Open https://app.tablenow.io/login | Login page loads | ✓/✗ |
| 2 | Click "Sign up with Google" | Redirects to Google OAuth | ✓/✗ |
| 3 | Authenticate with Google | Returns to /auth/callback | ✓/✗ |
| 4 | /auth/callback processes code | Calls exchangeCodeForSession | ✓/✗ |
| 5 | Redirects to /dashboard | DashboardRedirect loads | ✓/✗ |
| 6 | /dashboard calls GET /api/auth/me | Restaurant data fetched | ✓/✗ |
| 7 | Restaurant has slug | Redirects to /r/{slug}/dashboard | ✓/✗ |
| 8 | Dashboard renders | No white page, no error | ✓/✗ |

## 2️⃣ Database Auto-Link Verification

After step 8 above, run SQL:

```sql
SELECT id, name, email, slug, supabase_user_id 
FROM restaurants 
WHERE email = '<test-email>';
```

| Expected | Actual | Status |
|---|---|---|
| supabase_user_id NOT NULL | | ✓/✗ |
| slug matches URL | | ✓/✗ |
| email matches login | | ✓/✗ |

## 3️⃣ Email Verification (Optional, for email/password flow)

| Step | Action | Expected Result | Status |
|------|--------|---|---|
| 1 | Register with email/password | Verification email sent | ✓/✗ |
| 2 | Check backend logs | `📧 Verification email sent` log present | ✓/✗ |
| 3 | Log entry includes | `recipient`, `template=verification`, `messageId` | ✓/✗ |
| 4 | Click verification link | Redirects to /dashboard | ✓/✗ |
| 5 | Dashboard loads | No white page | ✓/✗ |

## 4️⃣ Calendar Connect/Disconnect

| Step | Action | Expected Result | Status |
|------|--------|---|---|
| 1 | Navigate to Settings | Calendar widget visible | ✓/✗ |
| 2 | Click "Connect Google Calendar" | Redirects to Google OAuth | ✓/✗ |
| 3 | Authorize calendar access | Returns with ?code= parameter | ✓/✗ |
| 4 | Frontend exchanges code | POST /api/calendar/callback sent | ✓/✗ |
| 5 | DB updated | calendar_status = 'connected' | ✓/✗ |
| 6 | UI reflects connected state | "CONNECTED" badge visible | ✓/✗ |
| 7 | Click Disconnect | POST /api/calendar/disconnect sent | ✓/✗ |
| 8 | Status returns to pending | "NOT CONNECTED" badge visible | ✓/✗ |

## 5️⃣ Route Guard Verification

| Route | Logged In | Not Logged In | Expected | Status |
|---|---|---|---|---|
| /dashboard | → /r/{slug}/dashboard | → /login | ✓/✗ |
| /setup | → /r/{slug}/dashboard | → /login | ✓/✗ |
| /start | → /r/{slug}/dashboard | → /login | ✓/✗ |
| /setup/restaurant | → /r/{slug}/dashboard | → /login | ✓/✗ |
| /invalid | → /r/{slug}/dashboard | → /login | ✓/✗ |

## 6️⃣ Error Scenarios

| Scenario | Action | Expected Result | Status |
|---|---|---|---|
| Restaurant without slug | Login with email without slug assigned | "Restaurant not linked" message, not white page | ✓/✗ |
| API /auth/me fails | Simulate network error | Error message + "Return to Login" button | ✓/✗ |
| React error | Trigger component crash | ErrorBoundary catches, shows error page | ✓/✗ |

## ✅ Final Sign-Off

- [ ] All steps completed
- [ ] No white pages encountered
- [ ] Database auto-link verified
- [ ] Calendar flow working
- [ ] Email logs present with metadata
- [ ] Route guards working correctly
- [ ] Ready for production

**Date:** ___________  
**Tester:** ___________  
**Restaurant Email:** ___________  
**Restaurant Slug:** ___________  
