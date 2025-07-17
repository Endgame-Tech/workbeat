import { 
  Subscription, 
  SubscriptionPlan, 
  SubscriptionFeatures, 
  SUBSCRIPTION_FEATURES,
  PLAN_NAMES,
  PLAN_PRICES
} from '../types/subscription.types';
import { organizationService } from './organizationService';
import api from './api';

export class SubscriptionService {
  /**
   * Get subscription features for a given plan
   */
  static getFeatures(plan: SubscriptionPlan): SubscriptionFeatures {
    return SUBSCRIPTION_FEATURES[plan];
  }

  /**
   * Check if a specific feature is available for a plan
   */
  static hasFeature(plan: SubscriptionPlan, feature: keyof SubscriptionFeatures): boolean {
    return SUBSCRIPTION_FEATURES[plan][feature] as boolean;
  }

  /**
   * Check if employee count is within plan limits
   */
  static canAddEmployees(plan: SubscriptionPlan, currentCount: number, additionalCount: number = 1): boolean {
    const maxEmployees = SUBSCRIPTION_FEATURES[plan].maxEmployees;
    if (maxEmployees === -1) return true; // Unlimited
    return (currentCount + additionalCount) <= maxEmployees;
  }

  /**
   * Get the maximum number of employees allowed for a plan
   */
  static getMaxEmployees(plan: SubscriptionPlan): number {
    return SUBSCRIPTION_FEATURES[plan].maxEmployees;
  }

  /**
   * Get current subscription
   */
  static async getCurrentSubscription(): Promise<Subscription | null> {
    try {
      const response = await api.get('/api/subscription/current');
      
      if (response.data && response.data.success && response.data.data) {
        return response.data.data;
      } else {
        return null;
      }
    } catch (error: any) {
      // Only log non-network errors in development
      if (process.env.NODE_ENV === 'development' && error.code !== 'ERR_NETWORK' && error.code !== 'ERR_INSUFFICIENT_RESOURCES') {
        console.error('Error fetching subscription:', error);
      }
      return null;
    }
  }

  /**
   * Get subscription details from organization ID (legacy method)
   */
  static async getSubscription(): Promise<Subscription | null> {
    try {
      // Use the new current subscription endpoint
      return await this.getCurrentSubscription();
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching subscription:', error);
      }
      return null;
    }
  }

  /**
   * Get available subscription plans
   */
  static async getAvailablePlans(): Promise<{
    id: SubscriptionPlan;
    name: string;
    price: number;
    features: SubscriptionFeatures;
    description?: string;
  }[]> {
    try {
      const response = await api.get('/api/subscription/plans');
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error fetching plans:', error);
      }
      return [];
    }
  }

  /**
   * Initiate subscription purchase
   */
  static async initiatePurchase(planId: SubscriptionPlan, billingCycle: 'monthly' | 'yearly' = 'monthly'): Promise<{
    paymentUrl?: string;
    reference?: string;
    amount?: number;
    currency?: string;
  }> {
    try {
      const response = await api.post('/api/subscription/purchase', {
        planId,
        billingCycle
      });
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error initiating purchase:', error);
      }
      throw error;
    }
  }

  /**
   * Verify payment with reference
   */
  static async verifyPayment(reference: string): Promise<{
    success: boolean;
    data?: Subscription;
    message?: string;
    details?: unknown;
  }> {
    try {
      const response = await api.post('/api/subscription/payment-success', { reference });
      return {
        success: response.data.success,
        data: response.data.data,
        message: response.data.message
      };
    } catch (error: unknown) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error verifying payment:', error);
      }
      const apiError = error as { response?: { data?: { message?: string; details?: unknown } } };
      return {
        success: false,
        message: apiError.response?.data?.message || 'Payment verification failed',
        details: apiError.response?.data?.details
      };
    }
  }

  /**
   * Process successful payment (legacy method)
   */
  static async processPaymentSuccess(paymentData: { reference: string; [key: string]: unknown }): Promise<boolean> {
    try {
      const response = await api.post('/api/subscription/payment-success', paymentData);
      return response.data.success;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error processing payment:', error);
      }
      return false;
    }
  }

  /**
   * Cancel subscription
   */
  static async cancelSubscription(reason?: string): Promise<boolean> {
    try {
      const response = await api.post('/api/subscription/cancel', { reason });
      return response.data.success;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error cancelling subscription:', error);
      }
      return false;
    }
  }

  /**
   * Check feature access
   */
  static async checkFeatureAccess(feature: string): Promise<{ hasAccess: boolean; limit?: number; used?: number }> {
    try {
      const response = await api.get(`/api/subscription/feature/${feature}`);
      return response.data.data;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error checking feature access:', error);
      }
      return { hasAccess: false };
    }
  }

  /**
   * Update subscription plan (legacy method)
   */
  static async updateSubscription(organizationId: string, subscription: Partial<Subscription>): Promise<boolean> {
    try {
      await organizationService.updateSubscription(organizationId, subscription);
      return true;
    } catch (error) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Error updating subscription:', error);
      }
      return false;
    }
  }

  /**
   * Check if subscription is active and not expired
   */
  static isSubscriptionActive(subscription: Subscription): boolean {
    if (!subscription) return false;
    
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    
    return subscription.status === 'active' || 
           (subscription.status === 'trial' && now <= endDate);
  }

  /**
   * Get days remaining in subscription
   */
  static getDaysRemaining(subscription: Subscription): number {
    if (!subscription) return 0;
    
    const now = new Date();
    const endDate = new Date(subscription.endDate);
    const diffTime = endDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return Math.max(0, diffDays);
  }

  /**
   * Get plan display name
   */
  static getPlanName(plan: SubscriptionPlan): string {
    return PLAN_NAMES[plan];
  }

  /**
   * Get plan price
   */
  static getPlanPrice(plan: SubscriptionPlan): number {
    return PLAN_PRICES[plan];
  }

  /**
   * Get recommended upgrade plan
   */
  static getRecommendedUpgrade(currentPlan: SubscriptionPlan): SubscriptionPlan | null {
    const plans: SubscriptionPlan[] = ['free', 'starter', 'professional', 'enterprise'];
    const currentIndex = plans.indexOf(currentPlan);
    
    if (currentIndex === -1 || currentIndex === plans.length - 1) {
      return null; // Already on highest plan or invalid plan
    }
    
    return plans[currentIndex + 1];
  }

  /**
   * Create upgrade URL for billing system
   */
  static getUpgradeUrl(organizationId: string, targetPlan: SubscriptionPlan): string {
    // In a real implementation, this would integrate with your billing provider
    // For now, redirect to contact page for enterprise or a billing portal
    if (targetPlan === 'enterprise') {
      return '/contact';
    }
    
    // This would typically be a Stripe, Paystack, or other payment provider URL
    return `/billing/upgrade?org=${organizationId}&plan=${targetPlan}`;
  }

  /**
   * Format subscription status for display
   */
  static formatSubscriptionStatus(subscription: Subscription): string {
    if (!subscription) return 'No subscription';
    
    switch (subscription.status) {
      case 'trial': {
        const daysRemaining = this.getDaysRemaining(subscription);
        return `Trial (${daysRemaining} days remaining)`;
      }
      case 'active':
        return 'Active';
      case 'expired':
        return 'Expired';
      case 'cancelled':
        return 'Cancelled';
      case 'suspended':
        return 'Suspended';
      default:
        return subscription.status;
    }
  }

  /**
   * Get feature comparison between plans
   */
  static compareFeatures(planA: SubscriptionPlan, planB: SubscriptionPlan): {
    feature: keyof SubscriptionFeatures;
    planA: boolean | number;
    planB: boolean | number;
    difference: boolean;
  }[] {
    const featuresA = SUBSCRIPTION_FEATURES[planA];
    const featuresB = SUBSCRIPTION_FEATURES[planB];
    
    return Object.keys(featuresA).map(feature => {
      const key = feature as keyof SubscriptionFeatures;
      return {
        feature: key,
        planA: featuresA[key],
        planB: featuresB[key],
        difference: featuresA[key] !== featuresB[key]
      };
    });
  }
}

export default SubscriptionService;