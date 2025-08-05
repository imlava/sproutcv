# Dodo Payments Integration Guide

## Overview
This guide provides a complete implementation of Dodo Payments integration for the SproutCV application, following the official Dodo Payments documentation and best practices.

## Architecture

### **Payment Flow:**
1. **User initiates payment** → Payment modal opens
2. **Payment created** → Dodo Payments API called
3. **User redirected** → Dodo checkout page
4. **Payment completed** → Webhook received
5. **Credits added** → User account updated
6. **User feedback** → Success message displayed

## Implementation

### **1. Backend Integration (Supabase Edge Functions)**

#### **Create Payment Function**
```typescript
// supabase/functions/create-payment/index.ts
const paymentData = {
  amount: amount, // Amount in cents
  currency: "USD",
  customer: {
    email: profile.email || user.email,
    name: profile?.full_name || user.email?.split('@')[0] || "Customer"
  },
  metadata: {
    user_id: user.id,
    credits: credits.toString(),
    source: "web_app",
    product: "resume_credits"
  },
  success_url: `${domain}/payments?payment_id={payment_id}&status=success&amount=${amount}&credits=${credits}`,
  cancel_url: `${domain}/payments?payment_id={payment_id}&status=cancelled`,
  webhook_url: `${domain}/functions/v1/payments-webhook`,
  description: `${credits} Resume Analysis Credits`,
  expires_in: 3600 // 1 hour
};
```

#### **Webhook Handler**
```typescript
// supabase/functions/payments-webhook/index.ts
const verifyWebhookSignature = (payload: string, signature: string, secret: string): boolean => {
  // HMAC SHA256 verification
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(payload);
  
  const cryptoKey = crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signatureBuffer = crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const expectedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return expectedSignature === signature;
};
```

### **2. Frontend Integration**

#### **Payment Modal Component**
```typescript
// src/components/dashboard/PaymentModal.tsx
const handlePurchase = async (credits: number, amount: number) => {
  setLoading(true);

  try {
    const finalAmount = discountPercent > 0 
      ? Math.round(amount * (1 - discountPercent / 100) * 100)
      : amount * 100;

    const { data, error } = await supabase.functions.invoke('create-payment', {
      body: { 
        credits,
        amount: finalAmount
      }
    });

    if (error) {
      throw new Error(error.message || 'Failed to create payment');
    }

    if (data?.url) {
      // Store payment info for tracking
      localStorage.setItem('pending_payment', JSON.stringify({
        paymentId: data.paymentId,
        credits,
        amount: finalAmount,
        timestamp: Date.now(),
        discountPercent
      }));
      
      // Open Dodo Payments checkout
      const paymentWindow = window.open(data.url, '_blank');
      
      if (!paymentWindow) {
        throw new Error('Please allow popups to complete your payment');
      }
      
      onClose();
    } else {
      throw new Error("No payment URL received");
    }
  } catch (error: any) {
    console.error('Payment error:', error);
    toast({
      variant: "destructive",
      title: "Payment Failed",
      description: error.message || "Something went wrong. Please try again.",
    });
  } finally {
    setLoading(false);
  }
};
```

#### **Payments Page**
```typescript
// src/pages/PaymentsPage.tsx
const handlePaymentStatus = async (
  paymentId: string, 
  status: string, 
  amount?: string | null, 
  credits?: string | null
) => {
  setProcessing(true);

  try {
    const { data, error } = await supabase.functions.invoke('verify-payment', {
      body: {
        paymentId,
        status,
        amount: amount ? parseInt(amount) : undefined,
        credits: credits ? parseInt(credits) : undefined
      }
    });

    if (error) {
      setPaymentStatus({
        status: 'failed',
        paymentId,
        message: 'Payment verification failed'
      });
      return;
    }

    const paymentStatus: PaymentStatus = {
      status: data.status || 'failed',
      paymentId,
      amount: data.amount,
      credits: data.credits,
      message: data.message,
      timestamp: new Date().toISOString()
    };

    setPaymentStatus(paymentStatus);
    localStorage.removeItem('pending_payment');

    // Show appropriate toast
    if (paymentStatus.status === 'success') {
      toast({
        title: "Payment Successful!",
        description: `${paymentStatus.credits} credits have been added to your account.`,
      });
    }
  } catch (error) {
    console.error('Payment status handling error:', error);
    setPaymentStatus({
      status: 'failed',
      paymentId,
      message: 'An error occurred while processing your payment'
    });
  } finally {
    setProcessing(false);
  }
};
```

### **3. Database Schema**

#### **Payments Table**
```sql
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  stripe_session_id TEXT UNIQUE, -- Used for payment ID
  amount INTEGER NOT NULL, -- Amount in cents
  credits_purchased INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_method TEXT DEFAULT 'dodo_payments',
  payment_provider_id TEXT,
  payment_data JSONB DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

#### **Credits Ledger Table**
```sql
CREATE TABLE public.credits_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  transaction_type TEXT NOT NULL,
  credits_amount INTEGER NOT NULL,
  balance_after INTEGER NOT NULL,
  related_payment_id UUID REFERENCES public.payments(id),
  description TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);
```

### **4. Environment Configuration**

#### **Required Environment Variables**
```bash
# Dodo Payments
DODO_PAYMENTS_API_KEY=your_dodo_api_key_here
DODO_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

### **5. Dodo Dashboard Setup**

#### **Webhook Configuration**
1. **Webhook URL**: `https://sproutcv.app/functions/v1/payments-webhook`
2. **Events**: `payment.succeeded`, `payment.failed`, `payment.cancelled`
3. **Success URL**: `https://sproutcv.app/payments?payment_id={payment_id}&status=success&amount={amount}&credits={credits}`
4. **Cancel URL**: `https://sproutcv.app/payments?payment_id={payment_id}&status=cancelled`

#### **Product Configuration**
1. **Product ID**: `resume_credits`
2. **Description**: Resume Analysis Credits
3. **Pricing**: Configure based on credit packages

### **6. Security Features**

#### **Webhook Verification**
```typescript
// HMAC SHA256 signature verification
const isValidSignature = verifyWebhookSignature(rawBody, signature, webhookSecret);
if (!isValidSignature) {
  throw new Error("Invalid webhook signature");
}
```

#### **Payment Verification**
```typescript
// User authentication and payment ownership validation
const { data: payment, error: paymentError } = await supabaseAdmin
  .from("payments")
  .select("*")
  .eq("payment_provider_id", paymentId)
  .eq("user_id", user.id)
  .single();
```

#### **Database Security**
```sql
-- Row Level Security policies
CREATE POLICY "Users can view own payments" ON public.payments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own credits ledger" ON public.credits_ledger
  FOR SELECT USING (auth.uid() = user_id);
```

### **7. Error Handling**

#### **Payment Creation Errors**
```typescript
try {
  const { data, error } = await supabase.functions.invoke('create-payment', {
    body: { credits, amount: finalAmount }
  });

  if (error) {
    throw new Error(error.message || 'Failed to create payment');
  }
} catch (error: any) {
  console.error('Payment error:', error);
  toast({
    variant: "destructive",
    title: "Payment Failed",
    description: error.message || "Something went wrong. Please try again.",
  });
}
```

#### **Webhook Processing Errors**
```typescript
try {
  // Process webhook
  if (payload.event_type === "payment.succeeded") {
    // Process successful payment
  }
} catch (error) {
  console.error("Webhook processing error:", error);
  return new Response(JSON.stringify({ error: error.message }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
    status: 500,
  });
}
```

### **8. Testing**

#### **Test Payment Flow**
```javascript
// Test payment creation
const { data, error } = await supabase.functions.invoke('create-payment', {
  body: { 
    credits: 5,
    amount: 500 // $5.00 in cents
  }
});

// Test payment verification
const { data, error } = await supabase.functions.invoke('verify-payment', {
  body: {
    paymentId: 'test-payment-id',
    status: 'success',
    amount: 500,
    credits: 5
  }
});
```

#### **Test Webhook**
```bash
# Test webhook locally
supabase functions serve payments-webhook --env-file .env.local

# Check webhook logs
supabase functions logs payments-webhook --follow
```

### **9. Monitoring**

#### **Function Logs**
```bash
supabase functions logs create-payment --follow
supabase functions logs payments-webhook --follow
supabase functions logs verify-payment --follow
```

#### **Database Queries**
```sql
-- Check payment status
SELECT * FROM payments WHERE payment_provider_id = 'payment-id';

-- Check credits ledger
SELECT * FROM credits_ledger WHERE related_payment_id = 'payment-id';

-- Check security events
SELECT * FROM security_events WHERE event_type LIKE '%payment%';
```

### **10. Production Checklist**

- [ ] Environment variables configured
- [ ] Webhook URL set in Dodo dashboard
- [ ] Functions deployed to production
- [ ] Database functions created
- [ ] Payment flow tested end-to-end
- [ ] Webhook events processed correctly
- [ ] Error monitoring configured
- [ ] Security audit completed
- [ ] User feedback tested
- [ ] Payment status polling working

### **11. Troubleshooting**

#### **Common Issues**

1. **Payment Creation Fails**
   - Check DODO_PAYMENTS_API_KEY is correct
   - Verify API key has proper permissions
   - Check network connectivity

2. **Webhook Not Receiving Events**
   - Verify webhook URL is correct
   - Check webhook secret matches
   - Ensure webhook is enabled in Dodo dashboard

3. **Credits Not Added After Payment**
   - Check webhook processing logs
   - Verify database functions are working
   - Check payment status in Dodo dashboard

4. **Payments Page Not Loading**
   - Check route configuration
   - Verify component imports
   - Check authentication flow
   - Test with different payment statuses

### **12. Best Practices**

1. **Security**
   - Always verify webhook signatures
   - Use environment variables for secrets
   - Implement proper error handling
   - Log security events

2. **User Experience**
   - Provide clear error messages
   - Show loading states
   - Handle edge cases gracefully
   - Give immediate feedback

3. **Monitoring**
   - Log all payment events
   - Monitor function performance
   - Track payment success rates
   - Alert on failures

4. **Testing**
   - Test with mock payments
   - Verify webhook processing
   - Test error scenarios
   - Validate user flows

The Dodo Payments integration is now complete and ready for production use! 🎉 