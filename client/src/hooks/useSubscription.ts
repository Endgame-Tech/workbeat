import { useState, useEffect, useCallback } from 'react';
import { Subscription, SubscriptionPlan, SubscriptionFeatures } from '../types/subscription.types';
import { SubscriptionService } from '../services/subscriptionService';
import { useOrganization } from './useOrganization';

interface UseSubscriptionReturn {
  subscription: Subscription | null;
  features: SubscriptionFeatures | null;
  plan: SubscriptionPlan | null;
  isLoading: boolean;
  error: string | null;
  isActive: boolean;
  daysRemaining: number;
  hasFeature: (feature: keyof SubscriptionFeatures) => boolean;
  canAddEmployees: (currentCount: number, additionalCount?: number) => boolean;
  getMaxEmployees: () => number;
  refresh: () => void;
  forceRefresh: () => Promise<void>;
  upgradeUrl: (targetPlan: SubscriptionPlan) => string;
  recommendedUpgrade: SubscriptionPlan | null;
}

export const useSubscription = (): UseSubscriptionReturn => {
  const { organizationId } = useOrganization();
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadSubscription = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      setError('No organization ID available');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const subscriptionData = await SubscriptionService.getSubscription();
      setSubscription(subscriptionData);
    } catch (err) {
      console.error('❌ Error loading subscription:', err);
      setError('Failed to load subscription data');
    } finally {
      setIsLoading(false);
    }
  }, [organizationId]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // Enhanced plan determination with better fallback logic
  const plan = subscription?.plan || 'free';
  
  // Additional safety check - if subscription exists but has no plan, log warning and refresh
  if (subscription && !subscription.plan) {
    console.warn('⚠️ Subscription object exists but has no plan:', subscription);
    console.warn('⚠️ Full subscription object:', subscription);
    // Force a refresh to get updated subscription data
    setTimeout(() => {
      loadSubscription();
    }, 1000);
  }
  

  const features = SubscriptionService.getFeatures(plan);
  const isActive = subscription ? SubscriptionService.isSubscriptionActive(subscription) : false;
  const daysRemaining = subscription ? SubscriptionService.getDaysRemaining(subscription) : 0;
  const recommendedUpgrade = SubscriptionService.getRecommendedUpgrade(plan);



  const hasFeature = useCallback((feature: keyof SubscriptionFeatures): boolean => {
    console.log('🔍 Checking feature access:', {
      feature,
      plan,
      isActive,
      subscription: subscription ? {
        plan: subscription.plan,
        status: subscription.status,
        endDate: subscription.endDate
      } : null
    });
    
    if (!isActive) {
      // Only allow basic features if subscription is not active
      const basicFeatures: (keyof SubscriptionFeatures)[] = [
        'basicAttendance',
        'employeeManagement',
        'emailSupport'
      ];
      const hasBasicFeature = basicFeatures.includes(feature);
      return hasBasicFeature;
    }
    
    const hasFeatureResult = SubscriptionService.hasFeature(plan, feature);
    
    return hasFeatureResult;
  }, [plan, isActive, subscription]);

  const canAddEmployees = useCallback((currentCount: number, additionalCount: number = 1): boolean => {
    if (!isActive) return false;
    return SubscriptionService.canAddEmployees(plan, currentCount, additionalCount);
  }, [plan, isActive]);

  const getMaxEmployees = useCallback((): number => {
    return SubscriptionService.getMaxEmployees(plan);
  }, [plan]);

  const upgradeUrl = useCallback((targetPlan: SubscriptionPlan): string => {
    if (!organizationId) return '/contact';
    return SubscriptionService.getUpgradeUrl(organizationId, targetPlan);
  }, [organizationId]);

  // Force refresh subscription data (useful after payment completion)
  const forceRefresh = useCallback(async () => {
    setSubscription(null); // Clear current subscription
    await loadSubscription();
  }, [loadSubscription]);

  // Auto-refresh if subscription changes to active status
  useEffect(() => {
    const interval = setInterval(() => {
      // Only auto-refresh if subscription is pending payment or being processed
      if (subscription && (subscription.status === 'pending_payment' || subscription.status === 'pending')) {
        loadSubscription();
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [subscription, loadSubscription]);

  return {
    subscription,
    features,
    plan,
    isLoading,
    error,
    isActive,
    daysRemaining,
    hasFeature,
    canAddEmployees,
    getMaxEmployees,
    refresh: loadSubscription,
    upgradeUrl,
    recommendedUpgrade,
    forceRefresh,
  };
};

export default useSubscription;