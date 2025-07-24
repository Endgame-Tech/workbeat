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
  const [retryCount, setRetryCount] = useState(0);

  const loadSubscription = useCallback(async () => {
    if (!organizationId) {
      setIsLoading(false);
      setError('No organization ID available');
      return;
    }

    // Prevent too many retries
    if (retryCount >= 3) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('Subscription fetch retry limit reached, using fallback');
      }
      setSubscription(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const subscriptionData = await SubscriptionService.getSubscription();
      setSubscription(subscriptionData);
      setError(null);
      setRetryCount(0); // Reset retry count on success
    } catch (err: unknown) {
      // For network errors, silently fail and use default free plan
      const error = err as { code?: string; response?: { status?: number } };
      if (error.code === 'ERR_NETWORK' || error.code === 'ERR_INSUFFICIENT_RESOURCES' || (error.response?.status && error.response.status >= 500)) {
        setSubscription(null);
        setError(null);
        setRetryCount(prev => prev + 1);
      } else {
        setError('Failed to load subscription data');
      }
    } finally {
      setIsLoading(false);
    }
  }, [organizationId, retryCount]);

  useEffect(() => {
    loadSubscription();
  }, [loadSubscription]);

  // Enhanced plan determination with better fallback logic
  const plan = subscription?.plan || 'free';
  
  // Additional safety check - if subscription exists but has no plan, refresh data
  if (subscription && !subscription.plan) {
    if (process.env.NODE_ENV === 'development') {
      console.warn('Subscription object exists but has no plan:', subscription);
    }
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
    if (!isActive) {
      // Only allow basic features if subscription is not active
      const basicFeatures: (keyof SubscriptionFeatures)[] = [
        'basicAttendance',
        'employeeManagement',
        'emailSupport'
      ];
      return basicFeatures.includes(feature);
    }
    
    return SubscriptionService.hasFeature(plan, feature);
  }, [plan, isActive]);

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
    // Only set up interval if we have a subscription and it's in a pending state
    if (!subscription || retryCount >= 3) return;
    
    const interval = setInterval(() => {
      // Only auto-refresh if subscription is pending payment or being processed
      if (subscription && (subscription.status === 'pending_payment' || subscription.status === 'pending')) {
        loadSubscription();
      }
    }, 30000); // Check every 30 seconds instead of 10

    return () => clearInterval(interval);
  }, [subscription, loadSubscription, retryCount]);

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