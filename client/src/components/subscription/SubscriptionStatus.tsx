import React from 'react';
import { AlertTriangle, Crown, Calendar, Users, XCircle } from 'lucide-react';
import { useSubscription } from '../../hooks/useSubscription';
import { SubscriptionService } from '../../services/subscriptionService';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';

interface SubscriptionStatusProps {
  showDetails?: boolean;
  compact?: boolean;
}

export const SubscriptionStatus: React.FC<SubscriptionStatusProps> = ({
  showDetails = true,
  compact = false
}) => {
  const { 
    subscription, 
    plan, 
    isActive, 
    daysRemaining, 
    upgradeUrl, 
    recommendedUpgrade,
    isLoading 
  } = useSubscription();

  if (isLoading) {
    return (
      <Card className={compact ? 'p-3' : undefined}>
        <CardContent className={compact ? 'p-0' : 'p-4'}>
          <div className="animate-pulse">
            <div className="h-4 bg-neutral-200 dark:bg-neutral-700 rounded mb-2"></div>
            <div className="h-3 bg-neutral-200 dark:bg-neutral-700 rounded w-3/4"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!subscription) {
    return (
      <Card className="border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            <div>
              <p className="font-medium text-red-900 dark:text-red-100">No Subscription</p>
              <p className="text-sm text-red-700 dark:text-red-300">Contact support to set up your subscription</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const planName = SubscriptionService.getPlanName(plan || 'free');
  const planPrice = SubscriptionService.getPlanPrice(plan || 'free');
  const statusText = SubscriptionService.formatSubscriptionStatus(subscription);
  const maxEmployees = SubscriptionService.getMaxEmployees(plan || 'free');

  const getStatusColor = () => {
    if (!isActive) return 'red';
    if (subscription.status === 'trial' && daysRemaining <= 7) return 'amber';
    return 'green';
  };

  const statusColor = getStatusColor();

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <Badge 
          type={statusColor === 'green' ? 'success' : statusColor === 'amber' ? 'warning' : 'danger'}
          text={planName}
        />
        
        {subscription.status === 'trial' && daysRemaining <= 7 && (
          <div className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span className="text-sm font-medium">{daysRemaining} days left</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <Card className={`border-2 ${
      statusColor === 'green' 
        ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10' 
        : statusColor === 'amber'
        ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/10'
        : 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/10'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${
              statusColor === 'green' 
                ? 'bg-green-100 dark:bg-green-900/30' 
                : statusColor === 'amber'
                ? 'bg-amber-100 dark:bg-amber-900/30'
                : 'bg-red-100 dark:bg-red-900/30'
            }`}>
              <Crown className={`w-5 h-5 ${
                statusColor === 'green' 
                  ? 'text-green-600 dark:text-green-400' 
                  : statusColor === 'amber'
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-red-600 dark:text-red-400'
              }`} />
            </div>
            <div>
              <h3 className={`text-lg font-semibold ${
                statusColor === 'green' 
                  ? 'text-green-900 dark:text-green-100' 
                  : statusColor === 'amber'
                  ? 'text-amber-900 dark:text-amber-100'
                  : 'text-red-900 dark:text-red-100'
              }`}>
                {planName} Plan
              </h3>
              <p className={`text-sm ${
                statusColor === 'green' 
                  ? 'text-green-700 dark:text-green-300' 
                  : statusColor === 'amber'
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {statusText}
              </p>
            </div>
          </div>

          <Badge 
            type={statusColor === 'green' ? 'success' : statusColor === 'amber' ? 'warning' : 'danger'}
            text={isActive ? 'Active' : 'Inactive'}
          />
        </div>

        {showDetails && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-neutral-500" />
                <span className="text-sm text-neutral-600 dark:text-neutral-300">
                  {maxEmployees === -1 ? 'Unlimited employees' : `Up to ${maxEmployees} employees`}
                </span>
              </div>
              
              {planPrice > 0 && (
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-neutral-500" />
                  <span className="text-sm text-neutral-600 dark:text-neutral-300">
                    ₦{planPrice.toLocaleString()}/month
                  </span>
                </div>
              )}
            </div>

            {subscription.status === 'trial' && (
              <div className={`p-3 rounded-lg border ${
                daysRemaining <= 7 
                  ? 'border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20'
                  : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className={`w-4 h-4 ${
                    daysRemaining <= 7 
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-blue-600 dark:text-blue-400'
                  }`} />
                  <span className={`text-sm font-medium ${
                    daysRemaining <= 7 
                      ? 'text-amber-800 dark:text-amber-200'
                      : 'text-blue-800 dark:text-blue-200'
                  }`}>
                    Trial Period: {daysRemaining} days remaining
                  </span>
                </div>
                
                {daysRemaining <= 7 && (
                  <p className="text-xs text-amber-700 dark:text-amber-300">
                    Your trial expires soon. Upgrade now to continue using all features.
                  </p>
                )}
              </div>
            )}

            {!isActive && (
              <div className="p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20">
                <div className="flex items-center gap-2 mb-2">
                  <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Subscription Inactive
                  </span>
                </div>
                <p className="text-xs text-red-700 dark:text-red-300">
                  Renew your subscription to restore access to all features.
                </p>
              </div>
            )}

            {(subscription.status === 'trial' || !isActive || recommendedUpgrade) && (
              <div className="flex gap-3 pt-3 border-t border-neutral-200 dark:border-neutral-700">
                {recommendedUpgrade && (
                  <Button
                    variant="primary"
                    size="sm"
                    className="flex-1"
                    onClick={() => window.open(upgradeUrl(recommendedUpgrade), '_blank')}
                  >
                    Upgrade to {SubscriptionService.getPlanName(recommendedUpgrade)}
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.location.href = '/billing'}
                >
                  Manage Billing
                </Button>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SubscriptionStatus;