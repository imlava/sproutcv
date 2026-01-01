# 🔐 Security Issue Resolution Guide

This document provides step-by-step instructions to resolve all detected security issues.

## 📋 Issues Summary

| Issue | Severity | Status | Resolution |
|-------|----------|--------|------------|
| PUBLIC_USER_DATA | 🔴 Error | Apply SQL Fix | RLS policies on `profiles` |
| EXPOSED_SENSITIVE_DATA | 🔴 Error | Apply SQL Fix | RLS policies on `contact_messages` |
| MISSING_RLS_PROTECTION | 🟡 Warning | Apply SQL Fix | RLS on `payment_transactions` |
| Leaked Password Protection | 🟡 Warning | Supabase Dashboard | Enable in Auth settings |
| Postgres Version | 🟡 Warning | Supabase Dashboard | Upgrade database |

---

## 🔴 Error 1: Customer Personal Information Exposed (PUBLIC_USER_DATA)

**Issue**: The `profiles` table is publicly readable, exposing emails, phone numbers, and names.

**Fix**: Apply the SQL script to enable strict RLS policies.

```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- Users can ONLY access their own profile
CREATE POLICY "profiles_select_own"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

**Verification**:
```sql
-- As anonymous user, this should return NO rows
SET ROLE anon;
SELECT * FROM profiles LIMIT 1;
RESET ROLE;
```

---

## 🔴 Error 2: Customer Support Messages Leaked (EXPOSED_SENSITIVE_DATA)

**Issue**: The `contact_messages` table may allow unauthorized SELECT access.

**Fix**: Block anonymous SELECT while allowing INSERT for contact forms.

```sql
-- Run in Supabase SQL Editor
ALTER TABLE public.contact_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_messages FORCE ROW LEVEL SECURITY;

-- Allow anonymous INSERT (for contact form)
CREATE POLICY "contact_messages_anon_insert"
ON public.contact_messages FOR INSERT
TO anon
WITH CHECK (true);

-- Block anonymous SELECT (no policy = no access)
-- Service role handles admin access
```

---

## 🟡 Warning 1: Payment Transaction Details (MISSING_RLS_PROTECTION)

**Issue**: Complex JOIN in policy could be misconfigured.

**Fix**: Add direct `user_id` check for robust protection.

```sql
CREATE POLICY "payment_transactions_select_own"
ON public.payment_transactions FOR SELECT
TO authenticated
USING (
    user_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.payments p
        WHERE p.id = payment_transactions.payment_id
        AND p.user_id = auth.uid()
    )
);
```

---

## 🟡 Warning 2: Leaked Password Protection Disabled

**Location**: Supabase Dashboard → Authentication → Settings

**Steps to Enable**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Authentication** → **Settings**
4. Scroll to **Security Settings**
5. Enable **"Leaked Password Protection"** (HaveIBeenPwned integration)
6. Click **Save**

This prevents users from setting passwords that have appeared in data breaches.

---

## 🟡 Warning 3: Postgres Version Security Patches

**Location**: Supabase Dashboard → Settings → Infrastructure

**Steps to Upgrade**:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **Settings** → **Infrastructure**
4. Look for **Database Version**
5. Click **Upgrade** if available
6. Schedule during low-traffic period

⚠️ **Note**: Database upgrades may cause a few minutes of downtime. Schedule accordingly.

---

## 🚀 Apply All Fixes (Recommended)

Run the comprehensive security fix script:

```bash
# In Supabase SQL Editor, run:
database/scripts/SECURITY_FIX_2026_01_01.sql
```

Or copy-paste the contents into Supabase SQL Editor.

---

## ✅ Verification Checklist

After applying fixes, verify:

- [ ] **RLS Enabled**: All tables have RLS enabled
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';
  ```

- [ ] **Anonymous Access Blocked**: Anonymous users cannot SELECT sensitive data
  ```sql
  SET ROLE anon;
  SELECT COUNT(*) FROM profiles; -- Should be 0 or error
  SELECT COUNT(*) FROM contact_messages; -- Should be 0 or error
  RESET ROLE;
  ```

- [ ] **Authenticated Access Works**: Users can access their own data
  
- [ ] **Admin Functions Work**: Edge Functions using service_role can access data

- [ ] **Leaked Password Protection**: Shows "Enabled" in Auth settings

- [ ] **Postgres Version**: No upgrade notification in Infrastructure settings

---

## 🔒 Security Best Practices

1. **Always use RLS**: Every table with user data should have RLS enabled
2. **Principle of Least Privilege**: Users should only access their own data
3. **Service Role for Admin**: Use Edge Functions with service_role for admin operations
4. **Audit Logging**: Monitor security_audit_log for suspicious activity
5. **Regular Reviews**: Re-run security scans monthly

---

## 📞 Support

If you encounter issues applying these fixes:
- Check [Supabase Docs](https://supabase.com/docs/guides/auth/row-level-security)
- Review Edge Function logs for service_role access issues
- Contact support@sproutcv.app
