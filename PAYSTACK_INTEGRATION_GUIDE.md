# WorkBeat Paystack Payment Integration Guide

## Overview
This guide covers the complete Paystack payment integration for WorkBeat's subscription system, including setup, testing, and deployment.

## Features Implemented

### ✅ Backend Integration
- **Paystack Service**: Complete wrapper service for Paystack API operations
- **Payment Flow**: Initialize payments, verify transactions, handle webhooks
- **Database Tracking**: Payment sessions and webhook logs stored in PostgreSQL
- **Security**: Webhook signature verification and request validation
- **Error Handling**: Comprehensive error handling and logging

### ✅ Frontend Integration
- **Subscription Modal**: Integrated with Paystack payment URLs
- **Payment Callback**: Handles successful/failed payment redirects
- **Payment Verification**: Automatic verification after payment completion
- **User Experience**: Loading states, error messages, and success confirmations

### ✅ Webhook Support
- **Real-time Processing**: Automatic subscription activation via webhooks
- **Event Handling**: Support for charge.success, subscription events, invoice events
- **Signature Verification**: Secure webhook processing with signature validation
- **Audit Logging**: Complete webhook activity logging

## Setup Instructions

### 1. Environment Variables
Add the following to your `.env` file:

```bash
# Paystack Configuration
PAYSTACK_SECRET_KEY=sk_test_985f55825ce1df76461a1c3a0dc953a06319db1e
PAYSTACK_PUBLIC_KEY=pk_test_c90af10dcc748a6c4e3cf481230abadd819037c1
PAYSTACK_WEBHOOK_SECRET=https://8f1e-197-210-52-120.ngrok-free.app 
```

### 2. Database Migration
Run the Prisma migration to add payment tracking tables:

```bash
cd server
npx prisma migrate dev --name add_payment_tables
npx prisma generate
```

### 3. Paystack Dashboard Setup

#### API Keys
1. Login to [Paystack Dashboard](https://dashboard.paystack.com/)
2. Go to Settings > API Keys & Webhooks
3. Copy your Test/Live API keys to environment variables

#### Webhook Configuration
1. In Paystack Dashboard, go to Settings > API Keys & Webhooks
2. Add webhook URL: `https://your-domain.com/api/webhooks/paystack`
3. Select events to listen for:
   - `charge.success`
   - `subscription.create`
   - `subscription.disable`
   - `invoice.create`
   - `invoice.payment_failed`
4. Copy the webhook secret to your environment

## Payment Flow

### 1. Payment Initialization
```javascript
// Frontend: User clicks upgrade button
const purchaseData = await SubscriptionService.initiatePurchase('professional', 'monthly');

// Backend: Creates Paystack payment session
POST /api/subscription/purchase
{
  "planId": "professional",
  "billingCycle": "monthly"
}

// Response includes payment URL
{
  "success": true,
  "data": {
    "paymentSession": {
      "paymentUrl": "https://checkout.paystack.com/xxx",
      "reference": "wb_sub_1234567890_abcdef",
      // ... other details
    }
  }
}
```

### 2. Payment Processing
```javascript
// User is redirected to Paystack checkout
window.open(paymentSession.paymentUrl, '_blank');

// After payment, user is redirected to callback URL
// https://your-app.com/subscription/callback?reference=wb_sub_1234567890_abcdef
```

### 3. Payment Verification
```javascript
// Frontend: Payment callback page processes verification
const result = await SubscriptionService.verifyPayment(reference);

// Backend: Verifies with Paystack and updates subscription
POST /api/subscription/payment-success
{
  "reference": "wb_sub_1234567890_abcdef"
}
```

### 4. Webhook Processing
```javascript
// Paystack sends webhook to your server
POST /api/webhooks/paystack
{
  "event": "charge.success",
  "data": {
    "reference": "wb_sub_1234567890_abcdef",
    "status": "success",
    // ... payment details
  }
}

// Server automatically activates subscription
```

## API Endpoints

### Subscription Endpoints
- `GET /api/subscription/plans` - Get available plans
- `GET /api/subscription/current` - Get current subscription
- `POST /api/subscription/purchase` - Initialize payment
- `POST /api/subscription/payment-success` - Verify payment
- `POST /api/subscription/cancel` - Cancel subscription

### Webhook Endpoints
- `POST /api/webhooks/paystack` - Handle Paystack webhooks

## Database Schema

### PaymentSession Table
```sql
CREATE TABLE payment_sessions (
  id SERIAL PRIMARY KEY,
  reference VARCHAR(100) UNIQUE NOT NULL,
  session_id VARCHAR(100) UNIQUE NOT NULL,
  organization_id INTEGER NOT NULL,
  plan_id VARCHAR(50) NOT NULL,
  amount FLOAT NOT NULL,
  currency VARCHAR(3) DEFAULT 'NGN',
  billing_cycle VARCHAR(20) DEFAULT 'monthly',
  status VARCHAR(20) DEFAULT 'pending',
  payment_url TEXT NOT NULL,
  paystack_data TEXT,
  paystack_verification TEXT,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### WebhookLog Table
```sql
CREATE TABLE webhook_logs (
  id SERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL,
  event VARCHAR(100) NOT NULL,
  data TEXT NOT NULL,
  signature VARCHAR(500),
  processed BOOLEAN DEFAULT FALSE,
  error TEXT,
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Testing

### Test Mode Setup
1. Use Paystack test API keys (starting with `pk_test_` and `sk_test_`)
2. Use test card numbers for payments:
   - Success: `4084084084084081`
   - Insufficient Funds: `4111111111111112`
   - Invalid Card: `4084084084084082`

### Test Flow
1. Start the application with test environment variables
2. Navigate to subscription page
3. Click "Upgrade" button
4. Complete payment with test card
5. Verify subscription activation
6. Check webhook logs in database

### Webhook Testing
Use tools like ngrok to expose your local server:
```bash
# Install ngrok
npm install -g ngrok

# Expose local server
ngrok http 5000

# Update Paystack webhook URL to: https://abc123.ngrok.io/api/webhooks/paystack
```

## Production Deployment

### 1. Environment Setup
- Replace test API keys with live keys
- Update webhook URL to production domain
- Ensure HTTPS is enabled for webhook endpoint

### 2. Security Checklist
- ✅ Webhook signature verification enabled
- ✅ HTTPS for all payment endpoints
- ✅ API keys stored securely (environment variables)
- ✅ Input validation and sanitization
- ✅ Error logging without exposing sensitive data

### 3. Monitoring
- Monitor webhook logs for processing errors
- Set up alerts for failed payments
- Track payment session completion rates
- Monitor subscription activation success

## Subscription Plans

### Plan Configuration
```javascript
const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 15000, // ₦15,000
    currency: 'NGN',
    maxEmployees: 25,
    features: [...]
  },
  professional: {
    id: 'professional',
    name: 'Professional', 
    price: 35000, // ₦35,000
    currency: 'NGN',
    maxEmployees: 100,
    features: [...]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 150000, // ₦150,000
    currency: 'NGN',
    maxEmployees: -1, // Unlimited
    features: [...]
  }
};
```

### Billing Cycles
- **Monthly**: Standard monthly billing
- **Yearly**: 10% discount applied automatically

## Error Handling

### Common Errors
1. **Payment Failed**: User's card was declined
2. **Session Expired**: Payment session older than 30 minutes
3. **Verification Failed**: Payment verification with Paystack failed
4. **Webhook Processing Failed**: Error processing webhook event

### Error Recovery
- Automatic retry for webhook processing
- User-friendly error messages
- Support contact information for payment issues
- Audit logging for debugging

## Support and Troubleshooting

### Payment Issues
1. Check webhook logs in database
2. Verify Paystack dashboard for transaction status
3. Review audit logs for payment session details
4. Contact Paystack support for transaction-specific issues

### Development Issues
1. Ensure all environment variables are set
2. Check database connections and migrations
3. Verify webhook URL accessibility
4. Test with Paystack test cards

## Next Steps

### Future Enhancements
- [ ] Recurring subscription management
- [ ] Pro-rated upgrades/downgrades
- [ ] Multiple payment methods (bank transfer, USSD)
- [ ] Subscription analytics dashboard
- [ ] Automated dunning management
- [ ] Customer billing portal

### Integration Extensions
- [ ] Email notifications for payment events
- [ ] SMS notifications via African's Talking
- [ ] Invoice generation and PDF exports
- [ ] Revenue analytics and reporting

## Support

For technical support or questions about this integration:
- Review the Paystack API documentation
- Check webhook logs in the database
- Contact the development team with specific error messages
- Test payments using Paystack test environment first

---

**Note**: Always test thoroughly in the Paystack test environment before deploying to production. Keep your API keys secure and never commit them to version control.