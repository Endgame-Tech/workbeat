const { prisma } = require('../config/db');
const jwt = require('jsonwebtoken');
const paystackService = require('../services/paystackService');

// Subscription plans configuration
const SUBSCRIPTION_PLANS = {
  free: {
    id: 'free',
    name: 'Free Trial (30 days)',
    price: 0,
    currency: 'NGN',
    maxEmployees: 7,
    features: ['basicAttendance', 'employeeManagement', 'emailSupport'],
    trialDays: 30
  },
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

// Helper function to check if subscription is active
const isSubscriptionActive = (subscription) => {
  if (!subscription) return false;
  
  const now = new Date();
  const endDate = new Date(subscription.endDate);
  
  return subscription.status === 'active' || 
         (subscription.status === 'trial' && now <= endDate);
};

// Helper function to validate feature access
const canAccessFeature = (subscription, feature) => {
  if (!isSubscriptionActive(subscription)) {
    // Only allow basic features for inactive subscriptions
    const basicFeatures = ['basicAttendance', 'employeeManagement', 'emailSupport'];
    return basicFeatures.includes(feature);
  }
  
  const plan = SUBSCRIPTION_PLANS[subscription.plan];
  return plan && plan.features.includes(feature);
};

// @desc    Get all available subscription plans
// @route   GET /api/subscription/plans
// @access  Public
const getSubscriptionPlans = async (req, res) => {
  try {
    // Return all plans except free (since free is trial only)
    const publicPlans = Object.values(SUBSCRIPTION_PLANS).filter(plan => plan.id !== 'free');
    
    res.json({
      success: true,
      data: publicPlans
    });
  } catch (error) {
    console.error('Error fetching subscription plans:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription plans'
    });
  }
};

// @desc    Get current subscription for organization
// @route   GET /api/subscription/current
// @access  Private
const getCurrentSubscription = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    console.log('📋 Fetching current subscription for organization:', organizationId);
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { subscription: true, subscriptionStatus: true, name: true }
    });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    console.log('📋 Organization subscription data:', {
      organizationId,
      subscriptionStatus: organization.subscriptionStatus,
      hasSubscriptionData: !!organization.subscription,
      subscriptionDataLength: organization.subscription?.length || 0,
      rawSubscriptionData: organization.subscription?.substring(0, 100) + '...'
    });
    
    let subscription = {};
    try {
      subscription = organization.subscription ? JSON.parse(organization.subscription) : {};
    } catch (parseError) {
      console.error('Error parsing subscription:', parseError);
      subscription = {};
    }
    
    // If subscription is empty or has no plan, create a default free trial
    if (!subscription.plan) {
      console.log('⚠️ No subscription plan found, creating default free trial');
      subscription = {
        plan: 'free',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'trial',
        maxEmployees: 7,
        features: ['basicAttendance', 'employeeManagement', 'emailSupport']
      };
    }
    
    console.log('📋 Parsed subscription:', {
      plan: subscription.plan,
      status: subscription.status,
      features: subscription.features?.length || 0
    });
    
    // Calculate days remaining
    const daysRemaining = subscription.endDate 
      ? Math.max(0, Math.ceil((new Date(subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)))
      : 0;
    
    // Get plan details
    const planDetails = SUBSCRIPTION_PLANS[subscription.plan] || SUBSCRIPTION_PLANS.free;
    
    res.json({
      success: true,
      data: {
        ...subscription,
        planDetails,
        daysRemaining,
        isActive: isSubscriptionActive(subscription)
      }
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch subscription details'
    });
  }
};

// @desc    Initiate subscription purchase
// @route   POST /api/subscription/purchase
// @access  Private
const initiateSubscriptionPurchase = async (req, res) => {
  try {
    const { planId, billingCycle = 'monthly' } = req.body;
    const organizationId = req.user.organizationId;
    
    // Validate plan
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan || plan.id === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }
    
    // Check if user is organization admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only organization admins can purchase subscriptions'
      });
    }
    
    // Calculate price based on billing cycle
    let finalPrice = plan.price;
    if (billingCycle === 'yearly') {
      finalPrice = plan.price * 12 * 0.9; // 10% discount for yearly
    }
    
    // Generate payment reference
    const reference = paystackService.generateReference('wb_sub');
    
    // Get organization details for the payment
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      include: {
        users: {
          where: {
            role: 'admin'
          },
          select: {
            email: true,
            name: true
          },
          take: 1
        }
      }
    });

    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Get the admin user for payment
    const adminUser = organization.users[0];
    if (!adminUser) {
      return res.status(404).json({
        success: false,
        message: 'No admin user found for organization'
      });
    }

    // Split name into first and last name
    const nameParts = adminUser.name.split(' ');
    const firstName = nameParts[0] || 'Admin';
    const lastName = nameParts.slice(1).join(' ') || 'User';

    // Create or get Paystack customer
    const customerData = {
      email: adminUser.email,
      first_name: firstName,
      last_name: lastName,
      metadata: {
        organization_id: organizationId,
        organization_name: organization.name
      }
    };

    let customer;
    try {
      customer = await paystackService.createCustomer(customerData);
    } catch (error) {
      // If customer creation fails, try to get existing customer
      customer = await paystackService.getCustomer(adminUser.email);
    }

    // Initialize Paystack payment
    const paymentData = {
      email: adminUser.email,
      amount: finalPrice,
      currency: plan.currency,
      reference,
      callback_url: `${process.env.FRONTEND_URL}/subscription/callback`,
      metadata: {
        payment_type: 'subscription',
        plan: planId,
        billing_cycle: billingCycle,
        organization_id: organizationId,
        customer_code: customer.data?.customer_code
      }
    };

    const paymentResponse = await paystackService.initializePayment(paymentData);

    if (!paymentResponse.success) {
      throw new Error('Failed to initialize payment with Paystack');
    }

    // Store payment session in database
    const paymentSession = await prisma.paymentSession.create({
      data: {
        reference,
        sessionId: paymentResponse.data.reference,
        organizationId,
        planId,
        amount: finalPrice,
        currency: plan.currency,
        billingCycle,
        status: 'pending',
        paymentUrl: paymentResponse.data.authorization_url,
        expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
        paystackData: JSON.stringify(paymentResponse.data)
      }
    });
    
    // Log the purchase attempt
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'subscription_purchase_initiated',
        details: `Subscription purchase initiated for plan: ${planId} with reference: ${reference}`,
        ipAddress: req.ip,
        resourceType: 'subscription',
        resourceId: String(organizationId)
      }
    });
    
    res.json({
      success: true,
      data: {
        paymentSession: {
          sessionId: paymentSession.sessionId,
          reference: paymentSession.reference,
          paymentUrl: paymentSession.paymentUrl,
          amount: paymentSession.amount,
          currency: paymentSession.currency,
          expiresAt: paymentSession.expiresAt
        },
        plan: {
          id: plan.id,
          name: plan.name,
          price: finalPrice,
          originalPrice: plan.price,
          currency: plan.currency,
          billingCycle,
          discount: billingCycle === 'yearly' ? 10 : 0
        },
        paystackPublicKey: paystackService.getPublicKey()
      }
    });
  } catch (error) {
    console.error('Error initiating subscription purchase:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to initiate subscription purchase'
    });
  }
};

// @desc    Process successful payment (webhook or redirect)
// @route   POST /api/subscription/payment-success
// @access  Private
const processSuccessfulPayment = async (req, res) => {
  try {
    const { reference, sessionId } = req.body;
    const organizationId = req.user.organizationId;
    
    if (!reference && !sessionId) {
      return res.status(400).json({
        success: false,
        message: 'Payment reference or session ID is required'
      });
    }

    // Get payment session from database
    const paymentSession = await prisma.paymentSession.findFirst({
      where: {
        OR: [
          { reference },
          { sessionId }
        ],
        organizationId,
        status: 'pending'
      }
    });

    if (!paymentSession) {
      return res.status(404).json({
        success: false,
        message: 'Payment session not found or already processed'
      });
    }

    // Verify payment with Paystack
    const verification = await paystackService.verifyPayment(paymentSession.reference);
    
    if (!verification.success || verification.data.status !== 'success') {
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed',
        details: verification.data
      });
    }

    // Validate plan
    const plan = SUBSCRIPTION_PLANS[paymentSession.planId];
    if (!plan || plan.id === 'free') {
      return res.status(400).json({
        success: false,
        message: 'Invalid subscription plan'
      });
    }
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }

    // Update payment session status
    await prisma.paymentSession.update({
      where: { id: paymentSession.id },
      data: {
        status: 'completed',
        completedAt: new Date(),
        paystackVerification: JSON.stringify(verification.data)
      }
    });
    
    console.log('💳 Processing payment for subscription activation:', {
      organizationId,
      paymentSessionPlanId: paymentSession.planId,
      planDetails: plan,
      billingCycle: paymentSession.billingCycle,
      paymentAmount: verification.data.amount / 100
    });

    // Update organization subscription using centralized helper
    const { subscription: newSubscription } = await updateOrganizationSubscription(
      organizationId,
      paymentSession.planId,
      paymentSession.billingCycle,
      verification.data
    );
    
    // Log successful subscription
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'subscription_activated',
        details: `Subscription activated for plan: ${paymentSession.planId} with reference: ${verification.data.reference}`,
        ipAddress: req.ip,
        resourceType: 'subscription',
        resourceId: String(organizationId)
      }
    });
    
    res.json({
      success: true,
      data: {
        subscription: newSubscription,
        plan: {
          id: plan.id,
          name: plan.name,
          features: plan.features
        },
        amount: verification.data.amount / 100,
        reference: verification.data.reference,
        billingCycle: paymentSession.billingCycle
      },
      message: 'Subscription activated successfully'
    });
  } catch (error) {
    console.error('Error processing payment:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process payment'
    });
  }
};

// @desc    Cancel subscription
// @route   POST /api/subscription/cancel
// @access  Private
const cancelSubscription = async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    const { reason } = req.body;
    
    // Check if user is organization admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only organization admins can cancel subscriptions'
      });
    }
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId }
    });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    let currentSubscription = {};
    try {
      currentSubscription = organization.subscription ? JSON.parse(organization.subscription) : {};
    } catch (parseError) {
      console.error('Error parsing subscription:', parseError);
    }
    
    // Update subscription status to cancelled
    const cancelledSubscription = {
      ...currentSubscription,
      status: 'cancelled',
      cancelledAt: new Date().toISOString(),
      cancellationReason: reason || 'User requested cancellation'
    };
    
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        subscription: JSON.stringify(cancelledSubscription)
      }
    });
    
    // Log cancellation
    await prisma.auditLog.create({
      data: {
        userId: req.user.id,
        action: 'subscription_cancelled',
        details: `Subscription cancelled. Reason: ${reason || 'Not provided'}`,
        ipAddress: req.ip,
        resourceType: 'subscription',
        resourceId: String(organizationId)
      }
    });
    
    res.json({
      success: true,
      data: {
        subscription: cancelledSubscription,
        message: 'Subscription cancelled successfully'
      }
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel subscription'
    });
  }
};

// @desc    Check feature access
// @route   GET /api/subscription/feature/:feature
// @access  Private
const checkFeatureAccess = async (req, res) => {
  try {
    const { feature } = req.params;
    const organizationId = req.user.organizationId;
    
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { subscription: true }
    });
    
    if (!organization) {
      return res.status(404).json({
        success: false,
        message: 'Organization not found'
      });
    }
    
    let subscription = {};
    try {
      subscription = organization.subscription ? JSON.parse(organization.subscription) : {};
    } catch (parseError) {
      console.error('Error parsing subscription:', parseError);
    }
    
    const hasAccess = canAccessFeature(subscription, feature);
    const plan = SUBSCRIPTION_PLANS[subscription.plan] || SUBSCRIPTION_PLANS.free;
    
    res.json({
      success: true,
      data: {
        hasAccess,
        feature,
        currentPlan: subscription.plan || 'free',
        requiredPlan: hasAccess ? null : getMinimumPlanForFeature(feature),
        planDetails: plan
      }
    });
  } catch (error) {
    console.error('Error checking feature access:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check feature access'
    });
  }
};

// Helper function to get minimum plan required for a feature
const getMinimumPlanForFeature = (feature) => {
  const plans = ['starter', 'professional', 'enterprise'];
  
  for (const planId of plans) {
    const plan = SUBSCRIPTION_PLANS[planId];
    if (plan.features.includes(feature)) {
      return planId;
    }
  }
  
  return 'enterprise'; // Fallback to enterprise if feature not found
};

// Middleware function to check feature access
const requireFeature = (featureName) => {
  return async (req, res, next) => {
    try {
      const organizationId = req.user.organizationId;
      
      const organization = await prisma.organization.findUnique({
        where: { id: organizationId },
        select: { subscription: true }
      });
      
      if (!organization) {
        return res.status(404).json({
          success: false,
          message: 'Organization not found'
        });
      }
      
      let subscription = {};
      try {
        subscription = organization.subscription ? JSON.parse(organization.subscription) : {};
      } catch (parseError) {
        console.error('Error parsing subscription:', parseError);
      }
      
      if (!canAccessFeature(subscription, featureName)) {
        return res.status(403).json({
          success: false,
          message: `Feature '${featureName}' not available in your current plan`,
          featureRequired: featureName,
          currentPlan: subscription.plan || 'free',
          requiredPlan: getMinimumPlanForFeature(featureName),
          upgradeUrl: `/subscription/upgrade?feature=${featureName}`
        });
      }
      
      next();
    } catch (error) {
      console.error('Error in requireFeature middleware:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to check feature access'
      });
    }
  };
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

  console.log('🔄 Updating organization subscription:', {
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

  console.log('✅ Organization subscription updated successfully:', {
    organizationId,
    subscriptionStatus: updatedOrganization.subscriptionStatus,
    plan: newSubscription.plan
  });

  return { organization: updatedOrganization, subscription: newSubscription };
};

module.exports = {
  getSubscriptionPlans,
  getCurrentSubscription,
  initiateSubscriptionPurchase,
  processSuccessfulPayment,
  cancelSubscription,
  checkFeatureAccess,
  requireFeature,
  SUBSCRIPTION_PLANS,
  isSubscriptionActive,
  canAccessFeature
};