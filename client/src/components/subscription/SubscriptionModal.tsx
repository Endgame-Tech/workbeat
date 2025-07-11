import React, { useState } from 'react';
import { X, Crown, Check, ArrowRight, Zap, Shield, Users } from 'lucide-react';
import { SubscriptionPlan, SUBSCRIPTION_FEATURES, PLAN_NAMES, PLAN_PRICES } from '../../types/subscription.types';
import { useSubscription } from '../../hooks/useSubscription';
import { SubscriptionService } from '../../services/subscriptionService';
import Button from '../ui/Button';
import { Card, CardContent } from '../ui/Card';
import Badge from '../ui/Badge';
import { toast } from 'react-hot-toast';

interface SubscriptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  restrictedFeature?: string;
  requiredPlan?: SubscriptionPlan;
  featureName?: string;
}

const SubscriptionModal: React.FC<SubscriptionModalProps> = ({
  isOpen,
  onClose,
  restrictedFeature,
  requiredPlan = 'professional',
  featureName = 'this feature'
}) => {
  const { plan: currentPlan, subscription } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionPlan>(requiredPlan);
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen) return null;

  const currentFeatures = SUBSCRIPTION_FEATURES[currentPlan || 'free'];
  const selectedFeatures = SUBSCRIPTION_FEATURES[selectedPlan];

  const handleUpgrade = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Initiate purchase through backend
      const purchaseData = await SubscriptionService.initiatePurchase(selectedPlan, 'monthly');
      
      if (purchaseData.paymentSession?.paymentUrl) {
        // Redirect to payment gateway
        window.open(purchaseData.paymentSession.paymentUrl, '_blank');
        toast.success('Redirecting to payment...');
        onClose();
      } else {
        toast.error('Unable to initiate payment. Please try again.');
      }
    } catch (error) {
      console.error('Error initiating upgrade:', error);
      toast.error('Failed to start upgrade process. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getFeatureDisplayName = (feature: string) => {
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
      departmentManagement: 'Department Management'
    };
    return featureNames[feature] || feature;
  };

  const planOptions: SubscriptionPlan[] = ['starter', 'professional', 'enterprise'];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="relative min-h-screen flex items-center justify-center p-4">
        <div className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          {/* Header */}
          <div className="relative bg-gradient-to-r from-primary-600 to-accent-600 p-6 text-white">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-white/10 rounded-xl backdrop-blur-sm">
                <Crown className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">Upgrade Required</h2>
                <p className="text-primary-100">
                  {featureName} requires a higher subscription plan
                </p>
              </div>
            </div>

            {/* Current vs Required */}
            <div className="flex items-center justify-between bg-white/10 rounded-lg p-4 backdrop-blur-sm">
              <div className="text-center">
                <p className="text-sm text-primary-200 mb-1">Current Plan</p>
                <Badge variant="secondary" className="bg-white/20 text-white">
                  {PLAN_NAMES[currentPlan || 'free']}
                </Badge>
              </div>
              
              <ArrowRight className="w-6 h-6 text-primary-200" />
              
              <div className="text-center">
                <p className="text-sm text-primary-200 mb-1">Required Plan</p>
                <Badge variant="secondary" className="bg-accent-500 text-white">
                  {PLAN_NAMES[requiredPlan]} or Higher
                </Badge>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {/* Plan Selection */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                Choose Your Plan
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {planOptions.map((planOption) => {
                  const planFeatures = SUBSCRIPTION_FEATURES[planOption];
                  const price = PLAN_PRICES[planOption];
                  const isPopular = planOption === 'professional';
                  const isSelected = selectedPlan === planOption;
                  
                  return (
                    <Card 
                      key={planOption}
                      className={`relative cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'ring-2 ring-primary-500 border-primary-500' 
                          : 'hover:border-primary-300'
                      }`}
                      onClick={() => setSelectedPlan(planOption)}
                    >
                      {isPopular && (
                        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                          <Badge variant="primary" className="px-3 py-1">
                            Most Popular
                          </Badge>
                        </div>
                      )}
                      
                      <CardContent className="p-6">
                        <div className="text-center mb-4">
                          <div className="flex items-center justify-center w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-xl mb-3 mx-auto">
                            {planOption === 'starter' && <Zap className="w-6 h-6 text-primary-600" />}
                            {planOption === 'professional' && <Crown className="w-6 h-6 text-primary-600" />}
                            {planOption === 'enterprise' && <Shield className="w-6 h-6 text-primary-600" />}
                          </div>
                          
                          <h4 className="text-xl font-bold text-neutral-900 dark:text-white">
                            {PLAN_NAMES[planOption]}
                          </h4>
                          
                          <div className="mt-2">
                            <span className="text-3xl font-bold text-neutral-900 dark:text-white">
                              ₦{price.toLocaleString()}
                            </span>
                            <span className="text-sm text-neutral-600 dark:text-neutral-400">/month</span>
                          </div>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center text-sm">
                            <Users className="w-4 h-4 text-neutral-500 mr-2" />
                            <span className="text-neutral-600 dark:text-neutral-300">
                              {planFeatures.maxEmployees === -1 
                                ? 'Unlimited employees' 
                                : `Up to ${planFeatures.maxEmployees} employees`}
                            </span>
                          </div>
                          
                          {restrictedFeature && planFeatures[restrictedFeature as keyof typeof planFeatures] && (
                            <div className="flex items-center text-sm">
                              <Check className="w-4 h-4 text-green-600 mr-2" />
                              <span className="text-green-700 dark:text-green-400 font-medium">
                                {getFeatureDisplayName(restrictedFeature)}
                              </span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            {/* Feature Comparison */}
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-neutral-900 dark:text-white mb-4">
                What You'll Get with {PLAN_NAMES[selectedPlan]}
              </h3>
              
              <div className="bg-neutral-50 dark:bg-neutral-800 rounded-lg p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedFeatures).map(([feature, hasFeature]) => {
                    if (typeof hasFeature !== 'boolean' || !hasFeature) return null;
                    
                    const isNewFeature = !currentFeatures[feature as keyof typeof currentFeatures];
                    
                    return (
                      <div key={feature} className="flex items-center">
                        <Check className={`w-4 h-4 mr-3 ${
                          isNewFeature ? 'text-green-600' : 'text-neutral-500'
                        }`} />
                        <span className={`text-sm ${
                          isNewFeature 
                            ? 'text-green-700 dark:text-green-400 font-medium' 
                            : 'text-neutral-600 dark:text-neutral-300'
                        }`}>
                          {getFeatureDisplayName(feature)}
                          {isNewFeature && (
                            <Badge variant="success" size="sm" className="ml-2">
                              New
                            </Badge>
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Trial Info */}
            {subscription?.status === 'trial' && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-6">
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center mt-0.5">
                    <span className="text-white text-xs font-bold">!</span>
                  </div>
                  <div>
                    <p className="font-medium text-amber-800 dark:text-amber-200">
                      Trial Period Active
                    </p>
                    <p className="text-sm text-amber-700 dark:text-amber-300">
                      Upgrade now to continue using all features after your trial expires.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-neutral-200 dark:border-neutral-700 p-6">
            <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
              <div className="text-center sm:text-left">
                <p className="text-sm text-neutral-600 dark:text-neutral-400">
                  Upgrade to <strong>{PLAN_NAMES[selectedPlan]}</strong>
                </p>
                <p className="text-lg font-bold text-neutral-900 dark:text-white">
                  ₦{PLAN_PRICES[selectedPlan].toLocaleString()}/month
                </p>
              </div>
              
              <div className="flex gap-3">
                <Button variant="outline" onClick={onClose}>
                  Maybe Later
                </Button>
                <Button 
                  variant="primary" 
                  onClick={handleUpgrade} 
                  className="min-w-[140px]"
                  isLoading={isProcessing}
                  disabled={isProcessing}
                >
                  <Crown className="w-4 h-4 mr-2" />
                  {isProcessing ? 'Processing...' : 'Upgrade Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;