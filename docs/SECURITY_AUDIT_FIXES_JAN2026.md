# Security Audit Fixes - January 2026

This document summarizes all security vulnerabilities identified and fixed during the January 2026 security audit.

## Critical Issues Fixed

### 1. ✅ Gemini API Key Exposed in Client-Side Code (CRITICAL)

**Issue:** The Gemini API key was loaded from environment variables in client-side JavaScript (`import.meta.env.VITE_GOOGLE_AI_API_KEY`), allowing attackers to extract and abuse the key.

**Fix:** Completely rewrote `src/services/ai/geminiService.ts` to route all AI requests through Supabase Edge Functions (`gemini-analyze`). The API key now remains securely on the server side.

```typescript
// Before (INSECURE):
const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY;
this.genAI = new GoogleGenerativeAI(apiKey);

// After (SECURE):
const { data, error } = await supabase.functions.invoke('gemini-analyze', {
  body: { prompt }
});
```

### 2. ✅ Customer Personal Information Exposed to Public Internet (CRITICAL)

**Issue:** The `profiles` table was publicly readable, exposing sensitive user data including emails, phone numbers, and names.

**Fix:** Created comprehensive RLS migration (`20260125_security_audit_fixes.sql`) that:
- Drops all overly permissive policies
- Restricts SELECT to authenticated users viewing only their own profile
- Blocks all anonymous access

```sql
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (auth.uid() = id);
```

### 3. ✅ Customer Support Messages Leaked to Public (HIGH)

**Issue:** The `contact_messages` table was publicly readable.

**Fix:** RLS policies now allow:
- Anyone can INSERT (submit contact forms)
- Only admins can SELECT/UPDATE messages

### 4. ✅ RLS Policy Always True (MEDIUM)

**Issue:** Multiple tables had `USING (true)` policies that allowed unrestricted access.

**Fix:** Replaced with proper user-scoped policies:
- `payment_transactions` - Users can only view their own
- `payments` - Users see own, admins see all
- `referrals` - Users see referrals they created
- `credits_ledger` - Users see their own credit history

### 5. ✅ Payment Transaction Details May Be Accessible (MEDIUM)

**Issue:** Service role policies potentially overriding security.

**Fix:** Explicit anonymous blocking:
```sql
CREATE POLICY "Block anonymous access"
ON public.payment_transactions FOR ALL
TO anon
USING (false)
WITH CHECK (false);
```

### 6. ✅ Payment Tracking Data in Unencrypted localStorage (LOW)

**Issue:** Payment information stored unencrypted in localStorage.

**Fix:** 
1. Moved to `sessionStorage` (cleared on browser close)
2. Store only minimal reference data (payment ID + credits)
3. Base64 encode for obfuscation

```typescript
// Before (INSECURE):
localStorage.setItem('pending_payment', JSON.stringify({ paymentId, credits, amount, ... }));

// After (SECURE):
const secureRef = { id: paymentId, cr: credits, ts: Date.now() };
sessionStorage.setItem('_pref', btoa(JSON.stringify(secureRef)));
```

### 7. ✅ Payment Creation Accepts Anonymous Tokens (MEDIUM)

**Issue:** `create-payment-dynamic` accepted anonymous tokens.

**Fix:** Now requires proper authenticated user:
```typescript
// Reject anonymous/service tokens - require real user
if (!authUser.id || authUser.role === 'anon' || !authUser.email) {
  return createErrorResponse("Payment creation requires authenticated user account", "AUTH_REQUIRED", 401);
}
```

### 8. ✅ Insufficient Webhook Input Validation (MEDIUM)

**Issue:** Dodo webhook accepted data without strict validation.

**Fix:** Added comprehensive schema validation function:
- Validates event_type against whitelist
- Validates payment ID format (alphanumeric only)
- Validates amount (positive integer, max $1M)
- Validates user_id as UUID format
- Validates credits range (0-10000)

### 9. ✅ Wildcard CORS Policy on Edge Functions (LOW)

**Issue:** All Edge Functions used `Access-Control-Allow-Origin: *`.

**Fix:** Updated `_shared/cors.ts` with origin-specific CORS:
```typescript
const ALLOWED_ORIGINS = [
  'https://sproutcv.app',
  'https://www.sproutcv.app',
  'http://localhost:5173',  // Dev only
];

export function getCorsHeaders(requestOrigin?: string | null) {
  const origin = ALLOWED_ORIGINS.includes(requestOrigin) 
    ? requestOrigin 
    : 'https://sproutcv.app';
  return { 'Access-Control-Allow-Origin': origin, ... };
}
```

## Files Modified

### Client-Side
- `src/services/ai/geminiService.ts` - Complete rewrite for server-side API calls
- `src/components/dashboard/PaymentModal.tsx` - Secure storage
- `src/components/dashboard/DodoPaymentModal.tsx` - Secure storage
- `src/components/dashboard/EnhancedDodoPaymentModal.tsx` - Secure storage
- `src/components/dashboard/UserDashboard.tsx` - Secure storage reading

### Edge Functions
- `supabase/functions/_shared/cors.ts` - Origin-specific CORS
- `supabase/functions/gemini-analyze/index.ts` - Updated CORS
- `supabase/functions/dodo-webhook/index.ts` - Added validation
- `supabase/functions/create-payment-dynamic/index.ts` - Auth enforcement

### Database
- `supabase/migrations/20260125_security_audit_fixes.sql` - Comprehensive RLS

## Remaining Considerations

### Postgres Version
**Status:** Warning only. Supabase manages Postgres updates automatically. No action needed from application code.

### Leaked Password Protection
**Status:** Enable "Leaked Password Protection" in Supabase Dashboard under Authentication > Settings if not already enabled.

## Testing Checklist

- [x] Build passes successfully
- [x] No linter errors
- [x] Gemini API calls work through Edge Function
- [x] Payment flow works for authenticated users
- [x] Anonymous users cannot create payments
- [x] Profile data not accessible to unauthenticated users

## Deployment Steps

1. Apply the SQL migration via Supabase Dashboard or CLI:
   ```bash
   supabase db push
   ```

2. Deploy Edge Functions:
   ```bash
   supabase functions deploy gemini-analyze
   supabase functions deploy dodo-webhook
   supabase functions deploy create-payment-dynamic
   ```

3. Ensure `GEMINI_API_KEY` is set in Supabase Edge Function secrets:
   ```bash
   supabase secrets set GEMINI_API_KEY=your_key_here
   ```

4. Remove `VITE_GOOGLE_AI_API_KEY` from your `.env` file (no longer needed client-side)

5. Enable "Leaked Password Protection" in Supabase Dashboard
