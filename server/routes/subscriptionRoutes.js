const express = require('express');
const router = express.Router();
const {
  getSubscriptionPlans,
  getCurrentSubscription,
  initiateSubscriptionPurchase,
  processSuccessfulPayment,
  cancelSubscription,
  checkFeatureAccess
} = require('../controllers/subscriptionController');
const { protect } = require('../middleware/authMiddleware');

// Public routes
router.get('/plans', getSubscriptionPlans);

// Protected routes (require authentication)
router.use(protect);

// Current subscription management
router.get('/current', getCurrentSubscription);

// Debug endpoints for troubleshooting (admin only)
router.get('/debug', async (req, res) => {
  try {
    const organizationId = req.user.organizationId;
    
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { prisma } = require('../config/db');
    
    // Get organization data
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        subscription: true,
        subscriptionStatus: true,
        updatedAt: true
      }
    });
    
    let parsedSubscription = null;
    try {
      parsedSubscription = organization?.subscription ? JSON.parse(organization.subscription) : null;
    } catch (error) {
      parsedSubscription = { error: error.message };
    }
    
    // Get recent payment sessions
    const paymentSessions = await prisma.paymentSession.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take: 5
    });
    
    res.json({
      success: true,
      debug: {
        organization,
        parsedSubscription,
        paymentSessions,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Force refresh subscription
router.post('/force-refresh', async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin privileges required.'
      });
    }
    
    const { getCurrentSubscription } = require('../controllers/subscriptionController');
    
    // Just call getCurrentSubscription to trigger any auto-fixes
    await getCurrentSubscription(req, res);
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Subscription purchase flow
router.post('/purchase', initiateSubscriptionPurchase);
router.post('/payment-success', processSuccessfulPayment);

// Subscription management
router.post('/cancel', cancelSubscription);

// Feature access checking
router.get('/feature/:feature', checkFeatureAccess);

module.exports = router;