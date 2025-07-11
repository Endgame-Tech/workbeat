const https = require('https');

class PaystackService {
  constructor() {
    this.secretKey = process.env.PAYSTACK_SECRET_KEY;
    this.publicKey = process.env.PAYSTACK_PUBLIC_KEY;
    this.baseUrl = 'https://api.paystack.co';
  }

  /**
   * Make HTTP request to Paystack API
   * @param {string} method - HTTP method
   * @param {string} path - API path
   * @param {Object} data - Request data
   * @returns {Promise<Object>} API response
   */
  async makeRequest(method, path, data = null) {
    return new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.paystack.co',
        port: 443,
        path,
        method: method.toUpperCase(),
        headers: {
          'Authorization': `Bearer ${this.secretKey}`,
          'Content-Type': 'application/json'
        }
      };

      const req = https.request(options, (res) => {
        let responseData = '';

        res.on('data', (chunk) => {
          responseData += chunk;
        });

        res.on('end', () => {
          try {
            const jsonResponse = JSON.parse(responseData);
            if (res.statusCode >= 200 && res.statusCode < 300) {
              resolve(jsonResponse);
            } else {
              reject(new Error(jsonResponse.message || `HTTP ${res.statusCode}`));
            }
          } catch (error) {
            reject(new Error('Invalid JSON response'));
          }
        });
      });

      req.on('error', (error) => {
        reject(error);
      });

      if (data) {
        req.write(JSON.stringify(data));
      }

      req.end();
    });
  }

  /**
   * Initialize a payment transaction
   * @param {Object} paymentData - Payment initialization data
   * @returns {Object} Payment initialization response
   */
  async initializePayment(paymentData) {
    try {
      const {
        email,
        amount,
        currency = 'NGN',
        reference,
        callback_url,
        metadata = {},
        channels = ['card', 'bank', 'ussd', 'qr', 'mobile_money', 'bank_transfer']
      } = paymentData;

      console.log('💳 Initializing Paystack payment:', {
        email,
        amount,
        currency,
        reference,
        callback_url
      });

      const requestData = {
        email,
        amount: amount * 100, // Convert to kobo
        currency,
        reference,
        callback_url,
        metadata: {
          ...metadata,
          custom_fields: [
            {
              display_name: 'Payment Type',
              variable_name: 'payment_type',
              value: metadata.payment_type || 'subscription'
            },
            {
              display_name: 'Plan',
              variable_name: 'plan',
              value: metadata.plan || 'unknown'
            },
            {
              display_name: 'Organization ID',
              variable_name: 'organization_id',
              value: metadata.organization_id || ''
            }
          ]
        },
        channels
      };

      const response = await this.makeRequest('POST', '/transaction/initialize', requestData);

      console.log('✅ Paystack payment initialized:', {
        status: response.status,
        reference: response.data?.reference,
        authorization_url: response.data?.authorization_url
      });

      return {
        success: response.status,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Paystack payment initialization failed:', error);
      throw new Error(`Payment initialization failed: ${error.message}`);
    }
  }

  /**
   * Verify a payment transaction
   * @param {string} reference - Payment reference
   * @returns {Object} Payment verification response
   */
  async verifyPayment(reference) {
    try {
      console.log('🔍 Verifying Paystack payment:', reference);

      const response = await this.makeRequest('GET', `/transaction/verify/${reference}`);

      console.log('✅ Paystack payment verification:', {
        status: response.status,
        reference: response.data?.reference,
        transaction_status: response.data?.status,
        amount: response.data?.amount,
        customer_email: response.data?.customer?.email
      });

      return {
        success: response.status,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Paystack payment verification failed:', error);
      throw new Error(`Payment verification failed: ${error.message}`);
    }
  }

  /**
   * Create a customer on Paystack
   * @param {Object} customerData - Customer data
   * @returns {Object} Customer creation response
   */
  async createCustomer(customerData) {
    try {
      const { email, first_name, last_name, phone, metadata = {} } = customerData;

      console.log('👤 Creating Paystack customer:', email);

      const requestData = {
        email,
        first_name,
        last_name,
        phone,
        metadata
      };

      const response = await this.makeRequest('POST', '/customer', requestData);

      console.log('✅ Paystack customer created:', {
        status: response.status,
        customer_code: response.data?.customer_code,
        email: response.data?.email
      });

      return {
        success: response.status,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Paystack customer creation failed:', error);
      // Don't throw error if customer already exists
      if (error.message.includes('Customer already exists')) {
        return await this.getCustomer(customerData.email);
      }
      throw new Error(`Customer creation failed: ${error.message}`);
    }
  }

  /**
   * Get customer by email
   * @param {string} email - Customer email
   * @returns {Object} Customer data
   */
  async getCustomer(email) {
    try {
      console.log('👤 Fetching Paystack customer:', email);

      const response = await this.makeRequest('GET', `/customer/${email}`);

      return {
        success: response.status,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Paystack customer fetch failed:', error);
      throw new Error(`Customer fetch failed: ${error.message}`);
    }
  }

  /**
   * Create a subscription plan
   * @param {Object} planData - Plan data
   * @returns {Object} Plan creation response
   */
  async createPlan(planData) {
    try {
      const {
        name,
        amount,
        interval = 'monthly',
        description,
        currency = 'NGN'
      } = planData;

      console.log('📋 Creating Paystack plan:', name);

      const response = await this.paystack.plan.create({
        name,
        amount: amount * 100, // Convert to kobo
        interval,
        description,
        currency
      });

      console.log('✅ Paystack plan created:', {
        status: response.status,
        plan_code: response.data?.plan_code,
        name: response.data?.name
      });

      return {
        success: response.status,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Paystack plan creation failed:', error);
      throw new Error(`Plan creation failed: ${error.message}`);
    }
  }

  /**
   * Create a subscription
   * @param {Object} subscriptionData - Subscription data
   * @returns {Object} Subscription creation response
   */
  async createSubscription(subscriptionData) {
    try {
      const { customer, plan, authorization } = subscriptionData;

      console.log('🔄 Creating Paystack subscription:', {
        customer,
        plan
      });

      const response = await this.paystack.subscription.create({
        customer,
        plan,
        authorization
      });

      console.log('✅ Paystack subscription created:', {
        status: response.status,
        subscription_code: response.data?.subscription_code,
        status: response.data?.status
      });

      return {
        success: response.status,
        data: response.data,
        message: response.message
      };
    } catch (error) {
      console.error('❌ Paystack subscription creation failed:', error);
      throw new Error(`Subscription creation failed: ${error.message}`);
    }
  }

  /**
   * Generate payment reference
   * @param {string} prefix - Reference prefix
   * @returns {string} Payment reference
   */
  generateReference(prefix = 'wb') {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    return `${prefix}_${timestamp}_${random}`;
  }

  /**
   * Get Paystack public key
   * @returns {string} Public key
   */
  getPublicKey() {
    return this.publicKey;
  }

  /**
   * Webhook signature verification
   * @param {string} rawBody - Raw request body
   * @param {string} signature - Paystack signature
   * @returns {boolean} Verification result
   */
  verifyWebhookSignature(rawBody, signature) {
    try {
      const crypto = require('crypto');
      const hash = crypto
        .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
        .update(rawBody, 'utf8')
        .digest('hex');

      const expectedSignature = `sha512=${hash}`;
      
      console.log('🔐 Verifying webhook signature:', {
        expected: expectedSignature.substring(0, 20) + '...',
        received: signature.substring(0, 20) + '...'
      });

      return expectedSignature === signature;
    } catch (error) {
      console.error('❌ Webhook signature verification failed:', error);
      return false;
    }
  }
}

module.exports = new PaystackService();