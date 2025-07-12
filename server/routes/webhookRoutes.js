const express = require('express');
const router = express.Router();
const { handlePaystackWebhook } = require('../controllers/webhookController');

// Paystack webhook endpoint
// Note: This should NOT have authentication middleware
router.post('/paystack', express.raw({ type: 'application/json' }), handlePaystackWebhook);

module.exports = router;