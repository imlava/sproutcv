# 🔧 Dodo Payments Environment Setup

## **CRITICAL: Set These Environment Variables in Supabase**

### **1. Fix API Key (Remove Trailing Space)**
```bash
# Current API Key has 66 characters with trailing space
# Correct: Should be 65 characters without space

# Get the current key from Supabase Dashboard > Settings > Edge Functions > Environment Variables
# Remove the trailing space and update it to exactly 65 characters
```

### **2. Set Webhook URL**
```bash
# Add this environment variable in Supabase Dashboard:
DODO_WEBHOOK_URL=https://yucdpvnmcuokemhqpnvz.supabase.co/functions/v1/dodo-webhook
```

### **3. Current Environment Status**
✅ **DODO_PAYMENTS_API_KEY**: Present (but needs trimming)  
❌ **DODO_WEBHOOK_URL**: NOT SET (needs to be added)

---

## **🚀 Quick Fix Steps:**

### **Step 1: Go to Supabase Dashboard**
1. Open https://supabase.com/dashboard/project/yucdpvnmcuokemhqpnvz
2. Go to **Settings** > **Edge Functions** > **Environment Variables**

### **Step 2: Fix API Key**
1. Find `DODO_PAYMENTS_API_KEY`
2. Edit the value
3. Remove any trailing spaces (should be exactly 65 characters)
4. Current: `SMzMMpFGbSsiIhS_.uEBWeP9DdTfcXGdpj-HXgCke010zaY92zlNdmet_sVMuLpSA ` (66 chars)
5. Fixed: `SMzMMpFGbSsiIhS_.uEBWeP9DdTfcXGdpj-HXgCke010zaY92zlNdmet_sVMuLpSA` (65 chars)

### **Step 3: Add Webhook URL**
1. Click **Add Variable**
2. Name: `DODO_WEBHOOK_URL`
3. Value: `https://yucdpvnmcuokemhqpnvz.supabase.co/functions/v1/dodo-webhook`
4. Save

### **Step 4: Deploy Updated Functions**
After setting environment variables, deploy the fixed functions.

---

## **🔍 What We Fixed:**

### **API Endpoint Issue** ✅
- **Old**: `https://api.dodopayments.com/v1/payments` (doesn't exist)
- **New**: `https://test.dodopayments.com/api/checkout_sessions` (correct)

### **API Key Issue** ✅
- **Problem**: Trailing space causing ByteString error
- **Solution**: Trim to exactly 65 characters

### **Missing Webhook** ✅
- **Problem**: No webhook URL configured
- **Solution**: Set DODO_WEBHOOK_URL environment variable

---

## **Expected Result After Fix:**
- ✅ Real Dodo payment URLs (not fallback)
- ✅ Successful payment creation
- ✅ Proper webhook notifications
- ✅ No more "Something went wrong" errors
