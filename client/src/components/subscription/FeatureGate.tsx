import React from 'react';
import { Lock, ArrowUp, Crown, Users } from 'lucide-react';
import { SubscriptionFeatures, SubscriptionPlan } from '../../types/subscription.types';
import { useSubscription } from '../../hooks/useSubscription';
import { useSubscriptionModal } from '../../hooks/useSubscriptionModal';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';

interface FeatureGateProps {
  feature: keyof SubscriptionFeatures;
  fallback?: React.ReactNode;
  showUpgrade?: boolean;
  children: React.ReactNode;
  requiredPlan?: SubscriptionPlan;
  fallbackMessage?: string;
}

export const FeatureGate: React.FC<FeatureGateProps> = ({
  feature,
  fallback,
  showUpgrade = true,
  children,
  requiredPlan,
  fallbackMessage,
}) => {
  const { hasFeature, plan, recommendedUpgrade } = useSubscription();
  const { showUpgradeModal } = useSubscriptionModal();

  const hasAccess = hasFeature(feature);

  if (hasAccess) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const targetPlan = requiredPlan || recommendedUpgrade;

  const getFeatureDisplayName = (feature: keyof SubscriptionFeatures): string => {
    const featureNames: Record<string, string> = {
      biometricFingerprint: 'Fingerprint Authentication',
      biometricFacial: 'Facial Recognition',
      analyticsCharts: 'Advanced Analytics',
      dataExport: 'Data Export',
      geofencing: 'Geofencing',
      whiteLabelBranding: 'White-label Branding',
      apiAccess: 'API Access',
      customReports: 'Custom Reports',
      shiftScheduling: 'Shift Scheduling',
      leaveManagement: 'Leave Management',
      departmentManagement: 'Department Management',
      employeeManagement: 'Employee Management'
    };
    return featureNames[feature] || feature.toString();
  };

  const handleUpgradeClick = () => {
    showUpgradeModal({
      restrictedFeature: feature,
      requiredPlan: targetPlan,
      featureName: getFeatureDisplayName(feature)
    });
  };

  return (
    <Card className="relative overflow-hidden border-2 border-dashed border-neutral-300 dark:border-neutral-600">
      <CardContent className="p-8 text-center">
        <div className="mx-auto flex items-center justify-center w-12 h-12 rounded-full bg-neutral-100 dark:bg-neutral-800 mb-4">
          <Lock className="w-6 h-6 text-neutral-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-2">
          Premium Feature
        </h3>
        
        <p className="text-neutral-600 dark:text-neutral-300 mb-6">
          {fallbackMessage || `${getFeatureDisplayName(feature)} requires a ${targetPlan || 'higher'} plan subscription.`}
        </p>

        {showUpgrade && targetPlan && (
          <div className="space-y-3">
            <Button
              variant="primary"
              size="sm"
              className="inline-flex items-center gap-2"
              onClick={handleUpgradeClick}
            >
              <Crown className="w-4 h-4" />
              Upgrade to {targetPlan.charAt(0).toUpperCase() + targetPlan.slice(1)}
            </Button>
            
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Current plan: {plan?.charAt(0).toUpperCase() + plan?.slice(1)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface FeatureButtonProps {
  feature: keyof SubscriptionFeatures;
  onClick: () => void;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  requiredPlan?: SubscriptionPlan;
}

export const FeatureButton: React.FC<FeatureButtonProps> = ({
  feature,
  onClick,
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  requiredPlan,
}) => {
  const { hasFeature, recommendedUpgrade } = useSubscription();
  const { showUpgradeModal } = useSubscriptionModal();

  const hasAccess = hasFeature(feature);
  const targetPlan = requiredPlan || recommendedUpgrade;

  const getFeatureDisplayName = (feature: keyof SubscriptionFeatures): string => {
    const featureNames: Record<string, string> = {
      biometricFingerprint: 'Fingerprint Authentication',
      biometricFacial: 'Facial Recognition',
      analyticsCharts: 'Advanced Analytics',
      dataExport: 'Data Export',
      geofencing: 'Geofencing',
      whiteLabelBranding: 'White-label Branding',
      apiAccess: 'API Access',
      customReports: 'Custom Reports',
      shiftScheduling: 'Shift Scheduling',
      leaveManagement: 'Leave Management',
      departmentManagement: 'Department Management',
      employeeManagement: 'Employee Management'
    };
    return featureNames[feature] || feature.toString();
  };

  const handleClick = () => {
    if (hasAccess) {
      onClick();
    } else {
      // Show upgrade modal
      showUpgradeModal({
        restrictedFeature: feature,
        requiredPlan: targetPlan,
        featureName: getFeatureDisplayName(feature)
      });
    }
  };

  return (
    <Button
      variant={hasAccess ? variant : 'outline'}
      size={size}
      className={`${className} ${!hasAccess ? 'opacity-75' : ''}`}
      onClick={handleClick}
    >
      {!hasAccess && <Lock className="w-4 h-4 mr-2" />}
      {children}
      {!hasAccess && <ArrowUp className="w-4 h-4 ml-2" />}
    </Button>
  );
};

interface EmployeeLimitGateProps {
  currentCount: number;
  additionalCount?: number;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const EmployeeLimitGate: React.FC<EmployeeLimitGateProps> = ({
  currentCount,
  additionalCount = 1,
  children,
  fallback,
}) => {
  const { canAddEmployees, getMaxEmployees, plan, upgradeUrl, recommendedUpgrade } = useSubscription();

  const canAdd = canAddEmployees(currentCount, additionalCount);
  const maxEmployees = getMaxEmployees();

  if (canAdd) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  const targetPlan = recommendedUpgrade;
  const upgradeLink = targetPlan ? upgradeUrl(targetPlan) : '/contact';

  return (
    <Card className="border-2 border-dashed border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/10">
      <CardContent className="p-6 text-center">
        <div className="mx-auto flex items-center justify-center w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-3">
          <Users className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        
        <h4 className="text-base font-semibold text-amber-900 dark:text-amber-200 mb-2">
          Employee Limit Reached
        </h4>
        
        <p className="text-sm text-amber-700 dark:text-amber-300 mb-4">
          Your current {plan} plan supports up to {maxEmployees === -1 ? 'unlimited' : maxEmployees} employees. 
          You currently have {currentCount} employees.
        </p>

        {targetPlan && (
          <Button
            variant="outline"
            size="sm"
            className="border-amber-600 text-amber-700 hover:bg-amber-600 hover:text-white"
            onClick={() => window.open(upgradeLink, '_blank')}
          >
            <ArrowUp className="w-4 h-4 mr-2" />
            Upgrade Plan
          </Button>
        )}
      </CardContent>
    </Card>
  );
};

export default FeatureGate;