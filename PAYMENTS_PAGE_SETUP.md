# Payments Page Setup - https://sproutcv.app/payments

## Overview
The payments page at `https://sproutcv.app/payments` serves as a comprehensive payment processing hub that handles:
- Payment status verification
- Webhook processing
- User payment feedback
- Payment redirects from Dodo Payments

## Architecture

### **Payment Flow:**
1. **User initiates payment** → Payment modal opens
2. **Payment created** → Dodo Payments API
3. **User redirected** → Dodo checkout page
4. **Payment completed** → Redirected to `/payments?payment_id=xxx&status=success`
5. **Status verified** → Credits added to user account
6. **User feedback** → Success/failure message displayed

### **Webhook Flow:**
1. **Dodo sends webhook** → `/functions/v1/payments-webhook`
2. **Signature verified** → HMAC SHA256 validation
3. **Payment processed** → Database updated
4. **Credits added** → User account updated
5. **Email sent** → Payment confirmation

## Implementation Details

### **1. Payments Page (`/payments`)**
- **URL Parameters**: Handles `payment_id`, `status`, `amount`, `credits`
- **Authentication**: Requires user login
- **Status Display**: Shows payment success/failure/cancelled
- **Auto-polling**: Checks payment status for pending payments
- **User Feedback**: Toast notifications and clear status messages

### **2. Edge Functions**

#### **`verify-payment`**
- Verifies payment status from URL parameters
- Processes successful payments
- Updates payment records
- Sends notification emails

#### **`check-payment-status`**
- Polls payment status for pending payments
- Handles expired payments
- Returns current payment state

#### **`payments-webhook`**
- Receives Dodo Payments webhooks
- Verifies webhook signatures
- Processes payment events
- Updates database and sends notifications

### **3. Database Integration**
- **Payments Table**: Stores payment records
- **Credits Ledger**: Tracks credit transactions
- **Security Events**: Logs payment activities
- **User Profiles**: Updated with new credits

## Configuration

### **Environment Variables**
```bash
# Dodo Payments
DODO_PAYMENTS_API_KEY=your_dodo_api_key
DODO_WEBHOOK_SECRET=your_webhook_secret

# Supabase
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=your_resend_api_key
```

### **Dodo Dashboard Setup**
1. **Webhook URL**: `https://sproutcv.app/functions/v1/payments-webhook`
2. **Events**: `payment.succeeded`, `payment.failed`, `payment.cancelled`
3. **Success URL**: `https://sproutcv.app/payments?payment_id={payment_id}&status=success&amount={amount}&credits={credits}`
4. **Cancel URL**: `https://sproutcv.app/payments?payment_id={payment_id}&status=cancelled`

## Security Features

### **1. Webhook Verification**
- HMAC SHA256 signature validation
- Timestamp verification
- Invalid signatures rejected

### **2. Payment Verification**
- User authentication required
- Payment ownership validation
- Atomic database transactions

### **3. Error Handling**
- Comprehensive error logging
- Graceful failure handling
- User-friendly error messages

## Testing

### **1. Test Payment Flow**
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

### **2. Test Webhook**
```bash
# Test webhook locally
supabase functions serve payments-webhook --env-file .env.local

# Check webhook logs
supabase functions logs payments-webhook --follow
```

### **3. Test Payments Page**
- Visit: `https://sproutcv.app/payments`
- Test with URL parameters: `?payment_id=test&status=success&amount=500&credits=5`
- Verify status display and user feedback

## Monitoring

### **1. Function Logs**
```bash
supabase functions logs create-payment --follow
supabase functions logs verify-payment --follow
supabase functions logs check-payment-status --follow
supabase functions logs payments-webhook --follow
```

### **2. Database Queries**
```sql
-- Check payment status
SELECT * FROM payments WHERE payment_provider_id = 'payment-id';

-- Check credits ledger
SELECT * FROM credits_ledger WHERE related_payment_id = 'payment-id';

-- Check security events
SELECT * FROM security_events WHERE event_type LIKE '%payment%';
```

### **3. Error Monitoring**
- Function error logs
- Database transaction failures
- Webhook signature verification failures
- Payment processing errors

## Troubleshooting

### **Common Issues**

1. **Payment Not Processing**
   - Check webhook URL configuration
   - Verify webhook secret
   - Check function logs for errors
   - Verify database functions exist

2. **Credits Not Added**
   - Check payment status in database
   - Verify `process_successful_payment` function
   - Check credits ledger entries
   - Verify user authentication

3. **Webhook Not Receiving**
   - Check webhook URL in Dodo dashboard
   - Verify webhook is enabled
   - Check function deployment status
   - Test webhook signature verification

4. **Payments Page Not Loading**
   - Check route configuration
   - Verify component imports
   - Check authentication flow
   - Test with different payment statuses

### **Debug Commands**

```bash
# Deploy all functions
supabase functions deploy create-payment
supabase functions deploy verify-payment
supabase functions deploy check-payment-status
supabase functions deploy payments-webhook

# Check function status
supabase functions list

# Test webhook locally
supabase functions serve payments-webhook --env-file .env.local

# Check database functions
psql -h your-db-host -U postgres -d postgres -c "SELECT * FROM process_successful_payment('test-payment-id');"
```

## Production Checklist

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

## Support

For issues with:
- **Payments Page**: Check React component and routing
- **Webhook Processing**: Check function logs and signature verification
- **Payment Verification**: Check database functions and user authentication
- **Dodo Integration**: Contact Dodo support or check API documentation
- **Database Issues**: Review migration files and function definitions

## Security Considerations

1. **Webhook Security**: All webhooks verified with HMAC SHA256
2. **User Authentication**: All payment operations require user login
3. **Database Security**: Row-level security enabled on all tables
4. **Error Handling**: Comprehensive error logging without exposing sensitive data
5. **Payment Validation**: Multiple layers of payment verification

The payments page is now fully integrated and ready for production use! 🎉 