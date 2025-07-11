const { prisma } = require('../config/db');
const paystackService = require('../services/paystackService');

// Subscription plans configuration (should be moved to a shared config file)
const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 15000,
    currency: 'NGN',
    maxEmployees: 25,
    features: [
      'basicAttendance', 'employeeManagement', 'departmentManagement',
      'basicReports', 'dataExport', 'emailSupport'
    ]
  },
  professional: {
    id: 'professional',
    name: 'Professional',
    price: 35000,
    currency: 'NGN',
    maxEmployees: 100,
    features: [
      'basicAttendance', 'biometricFingerprint', 'biometricFacial',
      'geofencing', 'employeeManagement', 'departmentManagement',
      'shiftScheduling', 'leaveManagement', 'basicReports', 'advancedReports',
      'analyticsCharts', 'dataExport', 'whiteLabelBranding', 'customLogo',
      'themeCustomization', 'thirdPartyIntegrations', 'emailSupport',
      'prioritySupport', 'advancedSecurity'
    ]
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 150000,
    currency: 'NGN',
    maxEmployees: -1, // Unlimited
    features: [
      'basicAttendance', 'biometricFingerprint', 'biometricFacial',
      'geofencing', 'qrCodeAttendance', 'employeeManagement', 'departmentManagement',
      'shiftScheduling', 'leaveManagement', 'basicReports', 'advancedReports',
      'customReports', 'analyticsCharts', 'dataExport', 'whiteLabelBranding',
      'customLogo', 'themeCustomization', 'apiAccess', 'webhooks',
      'thirdPartyIntegrations', 'emailSupport', 'prioritySupport',
      'phoneSupport', 'dedicatedAccountManager', 'onPremiseDeployment',
      'ssoIntegration', 'advancedSecurity', 'multiTenant'
    ]
  }
};

// Helper function to calculate end date based on billing cycle
const calculateEndDate = (billingCycle = 'monthly') => {
  const now = new Date();
  if (billingCycle === 'yearly') {
    return new Date(now.getFullYear() + 1, now.getMonth(), now.getDate());
  } else {
    return new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  }
};

// @desc    Handle Paystack webhooks
// @route   POST /api/webhooks/paystack
// @access  Public (but verified with signature)
const handlePaystackWebhook = async (req, res) => {
  try {
    console.log('🔔 Paystack webhook received:', req.body.event);

    // Get the signature from headers
    const signature = req.get('x-paystack-signature');
    
    if (!signature) {
      console.error('❌ No signature found in webhook');
      return res.status(400).json({
        success: false,
        message: 'No signature found'
      });
    }

    // Verify webhook signature
    const isValid = paystackService.verifyWebhookSignature(
      JSON.stringify(req.body),
      signature
    );

    if (!isValid) {
      console.error('❌ Invalid webhook signature');
      return res.status(400).json({
        success: false,
        message: 'Invalid signature'
      });
    }

    const { event, data } = req.body;

    // Handle different webhook events
    switch (event) {
      case 'charge.success':
        await handleChargeSuccess(data);
        break;
        
      case 'subscription.create':
        await handleSubscriptionCreate(data);
        break;
        
      case 'subscription.disable':
        await handleSubscriptionDisable(data);
        break;
        
      case 'invoice.create':
        await handleInvoiceCreate(data);
        break;
        
      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(data);
        break;
        
      default:
        console.log(`ℹ️ Unhandled webhook event: ${event}`);
    }

    // Log webhook receipt
    await prisma.webhookLog.create({
      data: {
        provider: 'paystack',
        event,
        data: JSON.stringify(req.body),
        signature,
        processed: true,
        processedAt: new Date()
      }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Webhook processing error:', error);
    
    // Log failed webhook
    try {
      await prisma.webhookLog.create({
        data: {
          provider: 'paystack',
          event: req.body?.event || 'unknown',
          data: JSON.stringify(req.body),
          signature: req.get('x-paystack-signature'),
          processed: false,
          error: error.message,
          processedAt: new Date()
        }
      });
    } catch (logError) {
      console.error('❌ Failed to log webhook error:', logError);
    }

    res.status(500).json({
      success: false,
      message: 'Webhook processing failed'
    });
  }
};

// Helper function to update organization subscription - centralized logic
const updateOrganizationSubscription = async (organizationId, planId, billingCycle, paymentData = {}) => {
  const plan = SUBSCRIPTION_PLANS[planId];
  if (!plan) {
    throw new Error(`Invalid plan: ${planId}`);
  }

  // Create new subscription object
  const newSubscription = {
    plan: planId,
    status: 'active',
    startDate: new Date().toISOString(),
    endDate: calculateEndDate(billingCycle).toISOString(),
    maxEmployees: plan.maxEmployees,
    features: plan.features,
    billingCycle,
    paymentReference: paymentData.reference,
    lastPaymentDate: new Date().toISOString(),
    paystackCustomerCode: paymentData.customer?.customer_code,
    amount: paymentData.amount ? paymentData.amount / 100 : plan.price // Convert from kobo
  };

  console.log('🔄 Updating organization subscription via webhook:', {
    organizationId,
    planId,
    billingCycle,
    newSubscription: {
      plan: newSubscription.plan,
      status: newSubscription.status,
      features: newSubscription.features?.length || 0
    }
  });

  // Update organization subscription and status
  const updatedOrganization = await prisma.organization.update({
    where: { id: organizationId },
    data: {
      subscription: JSON.stringify(newSubscription),
      subscriptionStatus: 'active',
      updatedAt: new Date()
    }
  });

  console.log('✅ Organization subscription updated successfully via webhook:', {
    organizationId,
    subscriptionStatus: updatedOrganization.subscriptionStatus,
    plan: newSubscription.plan
  });

  return { organization: updatedOrganization, subscription: newSubscription };
};

// Handle successful charge
const handleChargeSuccess = async (data) => {
  try {
    console.log('💰 Processing charge success:', data.reference);

    const { reference, customer, amount, metadata } = data;

    // Find payment session
    const paymentSession = await prisma.paymentSession.findFirst({
      where: {
        reference,
        status: 'pending'
      }
    });

    if (!paymentSession) {
      console.log('⚠️ Payment session not found for reference:', reference);
      return;
    }

    // Update payment session
    await prisma.paymentSession.update({
      where: { id: paymentSession.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        paystackVerification: JSON.stringify(data)
      }
    });

    // Update organization subscription
    await updateOrganizationSubscription(
      paymentSession.organizationId,
      paymentSession.planId,
      paymentSession.billingCycle,
      {
        reference,
        customer,
        amount,
        metadata
      }
    );

    // Create audit log
    await prisma.auditLog.create({
      data: {
        action: 'subscription_activated',
        details: `Subscription activated for plan: ${paymentSession.planId} via webhook`,
        resourceType: 'subscription',
        resourceId: String(paymentSession.organizationId),
        metadata: JSON.stringify({
          reference,
          amount: amount / 100, // Convert from kobo
          plan: paymentSession.planId
        })
      }
    });

    console.log('✅ Subscription activated via webhook:', {
      organizationId: paymentSession.organizationId,
      plan: paymentSession.planId,
      reference
    });

  } catch (error) {
    console.error('❌ Error handling charge success:', error);
    throw error;
  }
};

// Handle subscription creation
const handleSubscriptionCreate = async (data) => {
  console.log('🔄 Subscription created:', data.subscription_code);
  // Additional logic for recurring subscriptions
};

// Handle subscription disable
const handleSubscriptionDisable = async (data) => {
  console.log('⏸️ Subscription disabled:', data.subscription_code);
  
  try {
    // Find organization with this subscription
    const organization = await prisma.organization.findFirst({
      where: {
        subscription: {
          contains: data.subscription_code
        }
      }
    });

    if (organization) {
      const currentSubscription = JSON.parse(organization.subscription || '{}');
      
      // Update subscription status
      const updatedSubscription = {
        ...currentSubscription,
        status: 'cancelled',
        cancelledAt: new Date().toISOString()
      };

      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          subscription: JSON.stringify(updatedSubscription),
          subscriptionStatus: 'cancelled'
        }
      });

      console.log('✅ Subscription cancelled via webhook:', organization.id);
    }
  } catch (error) {
    console.error('❌ Error handling subscription disable:', error);
    throw error;
  }
};

// Handle invoice creation
const handleInvoiceCreate = async (data) => {
  console.log('📄 Invoice created:', data.invoice_code);
  // Log invoice creation, send notifications, etc.
};

// Handle invoice payment failure
const handleInvoicePaymentFailed = async (data) => {
  console.log('💸 Invoice payment failed:', data.invoice_code);
  
  try {
    // Find organization and update subscription status
    const organization = await prisma.organization.findFirst({
      where: {
        subscription: {
          contains: data.subscription?.subscription_code
        }
      }
    });

    if (organization) {
      const currentSubscription = JSON.parse(organization.subscription || '{}');
      
      // Update subscription status to past due
      const updatedSubscription = {
        ...currentSubscription,
        status: 'past_due',
        lastFailedPayment: new Date().toISOString()
      };

      await prisma.organization.update({
        where: { id: organization.id },
        data: {
          subscription: JSON.stringify(updatedSubscription),
          subscriptionStatus: 'past_due'
        }
      });

      console.log('⚠️ Subscription marked as past due:', organization.id);
    }
  } catch (error) {
    console.error('❌ Error handling payment failure:', error);
    throw error;
  }
};

module.exports = {
  handlePaystackWebhook
};