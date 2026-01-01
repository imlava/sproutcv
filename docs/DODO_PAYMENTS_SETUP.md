# Dodo Payments Integration Setup

## Overview
This document outlines the complete setup for Dodo Payments integration in the SproutCV application.

## Environment Variables Required

Add these environment variables to your Supabase project:

```bash
# Dodo Payments API Configuration
DODO_PAYMENTS_API_KEY=your_dodo_api_key_here
DODO_WEBHOOK_SECRET=your_webhook_secret_here

# Supabase Configuration (should already exist)
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

## Dodo Payments Dashboard Setup

### 1. Create Dodo Payments Account
1. Sign up at [Dodo Payments Dashboard](https://dashboard.dodopayments.com)
2. Complete account verification
3. Get your API keys from the dashboard

### 2. Configure Webhooks
1. Go to Webhooks section in Dodo Dashboard
2. Add webhook URL: `https://your-project.supabase.co/functions/v1/dodo-webhook`
3. Select events: `payment.succeeded`, `payment.failed`, `payment.cancelled`
4. Copy the webhook secret and add to environment variables

### 3. Create Products
1. Go to Products section
2. Create a product with ID: `resume_credits`
3. Set pricing and description

## Database Schema

The following tables are required:

### Payments Table
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

### Credits Ledger Table
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

## Edge Functions

### 1. Deploy Functions
```bash
supabase functions deploy create-payment
supabase functions deploy dodo-webhook
supabase functions deploy payment-notification
```

### 2. Function Permissions
Ensure functions have access to:
- Database tables: `payments`, `profiles`, `credits_ledger`, `security_events`
- Environment variables: `DODO_PAYMENTS_API_KEY`, `DODO_WEBHOOK_SECRET`

## Testing the Integration

### 1. Test Payment Creation
```javascript
// Test the create-payment function
const { data, error } = await supabase.functions.invoke('create-payment', {
  body: { 
    credits: 5,
    amount: 500 // $5.00 in cents
  }
});
```

### 2. Test Webhook
Use Dodo's webhook testing tool or create a test payment and verify webhook processing.

### 3. Monitor Logs
Check Supabase function logs for any errors:
```bash
supabase functions logs create-payment
supabase functions logs dodo-webhook
```

## Security Considerations

### 1. Webhook Verification
- All webhooks are verified using HMAC SHA256
- Invalid signatures are rejected
- Webhook secret must be kept secure

### 2. Payment Processing
- Payments are processed atomically using database transactions
- Failed payments are logged for debugging
- User credits are updated only after successful payment verification

### 3. Error Handling
- Comprehensive error logging
- Graceful failure handling
- User-friendly error messages

## Troubleshooting

### Common Issues

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

### Debug Commands

```bash
# Check function logs
supabase functions logs create-payment --follow
supabase functions logs dodo-webhook --follow

# Test webhook locally
supabase functions serve dodo-webhook --env-file .env.local

# Check database functions
psql -h your-db-host -U postgres -d postgres -c "SELECT * FROM process_successful_payment('test-payment-id');"
```

## Production Checklist

- [ ] Environment variables configured
- [ ] Webhook URL set in Dodo dashboard
- [ ] Functions deployed to production
- [ ] Database functions created
- [ ] Test payments completed successfully
- [ ] Webhook events processed correctly
- [ ] Error monitoring configured
- [ ] Security audit completed

## Support

For issues with:
- **Dodo Payments API**: Contact Dodo support
- **Supabase Functions**: Check Supabase documentation
- **Database Issues**: Review migration files
- **Frontend Integration**: Check browser console for errors 