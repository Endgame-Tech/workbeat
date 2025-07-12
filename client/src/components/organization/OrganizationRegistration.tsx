import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
import { Check, Users } from 'lucide-react';
import { SubscriptionPlan, PLAN_NAMES, PLAN_PRICES, SUBSCRIPTION_FEATURES } from '../../types/subscription.types';
import { SubscriptionService } from '../../services/subscriptionService';
import api from '../../services/api';

const industryOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'education', label: 'Education' },
  { value: 'finance', label: 'Finance' },
  { value: 'retail', label: 'Retail' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'others', label: 'Others' }
];

const OrganizationRegistration: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    industry: '',
    contactEmail: '',
    contactPhone: '',
    address: {
      street: '',
      city: '',
      state: '',
      country: '',
      postalCode: ''
    },
    adminName: '',
    adminEmail: '',
    adminPassword: '',
    confirmPassword: '',
    selectedPlan: 'free' as SubscriptionPlan,
    billingCycle: 'monthly' as 'monthly' | 'yearly'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState(1);
  
  const validateStep1 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name) newErrors.name = 'Organization name is required';
    if (!formData.industry) newErrors.industry = 'Industry is required';
    if (!formData.contactEmail) newErrors.contactEmail = 'Contact email is required';
    if (!formData.contactPhone) newErrors.contactPhone = 'Contact phone is required';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const validateStep2 = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.adminName) newErrors.adminName = 'Admin name is required';
    if (!formData.adminEmail) newErrors.adminEmail = 'Admin email is required';
    if (!formData.adminPassword) newErrors.adminPassword = 'Password is required';
    if (formData.adminPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleChange = (field: string, value: string) => {
    setFormData((prev) => {
      // Handle nested address fields
      if (field.startsWith('address.')) {
        const addressField = field.split('.')[1];
        return {
          ...prev,
          address: {
            ...prev.address,
            [addressField]: value
          }
        };
      }
      
      // Handle regular fields
      return {
        ...prev,
        [field]: value
      };
    });
    
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: ''
      }));
    }
  };
  
  const nextStep = () => {
    if (step === 1 && validateStep1()) {
      setStep(2);
    } else if (step === 2) {
      setStep(3); // Plan selection step
    }
  };
  
  const prevStep = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 2 && validateStep2()) {
      // Move to plan selection step
      setStep(3);
    } else if (step === 3) {
      // Handle registration with selected plan
      await handleRegistration();
    }
  };

  const handleRegistration = async () => {
    setIsLoading(true);
    
    try {
      // If paid plan selected, initiate payment flow
      if (formData.selectedPlan !== 'free') {
        await handlePaidPlanRegistration();
      } else {
        // Free plan registration
        await handleFreePlanRegistration();
      }
    } catch (error) {
      console.error('Registration error:', error);
      if (typeof error === 'object' && error !== null && 'response' in error) {
        const err = error as { response?: { data?: { message?: string } } };
        toast.error(err.response?.data?.message || 'Registration failed');
      } else {
        toast.error('Registration failed');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreePlanRegistration = async () => {
    const registrationData = {
      ...formData,
      selectedPlan: 'free'
    };
    
    const response = await api.post('/api/organizations/register', registrationData);
    
    // Store auth token and user info
    localStorage.setItem('token', response.data.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.data.admin));
    localStorage.setItem('organization', JSON.stringify(response.data.data.organization));
    
    toast.success('Organization registered successfully!');
    
    // Navigate to the organization dashboard
    const organizationId = response.data.data.organization.id;
    if (organizationId) {
      navigate(`/organization/${organizationId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handlePaidPlanRegistration = async () => {
    // First create the organization account
    const registrationData = {
      ...formData,
      selectedPlan: formData.selectedPlan,
      skipSubscriptionSetup: true // Flag to create org without setting up subscription yet
    };
    
    const response = await api.post('/api/organizations/register', registrationData);
    
    // Store auth token and user info
    localStorage.setItem('token', response.data.data.token);
    localStorage.setItem('user', JSON.stringify(response.data.data.admin));
    localStorage.setItem('organization', JSON.stringify(response.data.data.organization));
    
    // Now initiate payment for the selected plan
    const paymentData = await SubscriptionService.initiatePurchase(
      formData.selectedPlan, 
      formData.billingCycle
    );
    
    toast.success('Account created! Redirecting to payment...');
    
    // Redirect to Paystack payment page
    window.location.href = paymentData.paymentUrl!;
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {step === 1 && 'Register Your Organization'}
            {step === 2 && 'Create Admin Account'}
            {step === 3 && 'Choose Your Plan'}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
            {step === 1 && 'Enter your organization details to get started'}
            {step === 2 && 'Set up an admin account to manage your organization'}
            {step === 3 && 'Select a subscription plan that fits your needs'}
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit}>
            {step === 1 ? (
              <div className="space-y-4">
                <Input
                  label="Organization Name"
                  value={formData.name}
                  onChange={(e) => handleChange('name', e.target.value)}
                  error={errors.name}
                  required
                />
                
                <Select
                  label="Industry"
                  options={industryOptions}
                  value={formData.industry}
                  onChange={(value) => handleChange('industry', value)}
                  error={errors.industry}
                  required
                />
                
                <Input
                  label="Contact Email"
                  type="email"
                  value={formData.contactEmail}
                  onChange={(e) => handleChange('contactEmail', e.target.value)}
                  error={errors.contactEmail}
                  required
                />
                
                <Input
                  label="Contact Phone"
                  value={formData.contactPhone}
                  onChange={(e) => handleChange('contactPhone', e.target.value)}
                  error={errors.contactPhone}
                  required
                />
                
                <div className="space-y-2">
                  <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">Address</h3>
                  
                  <Input
                    label="Street Address"
                    value={formData.address.street}
                    onChange={(e) => handleChange('address.street', e.target.value)}
                  />
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="City"
                      value={formData.address.city}
                      onChange={(e) => handleChange('address.city', e.target.value)}
                    />
                    
                    <Input
                      label="State/Province"
                      value={formData.address.state}
                      onChange={(e) => handleChange('address.state', e.target.value)}
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Country"
                      value={formData.address.country}
                      onChange={(e) => handleChange('address.country', e.target.value)}
                    />
                    
                    <Input
                      label="Postal Code"
                      value={formData.address.postalCode}
                      onChange={(e) => handleChange('address.postalCode', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ) : step === 2 ? (
              <div className="space-y-4">
                <Input
                  label="Admin Name"
                  value={formData.adminName}
                  onChange={(e) => handleChange('adminName', e.target.value)}
                  error={errors.adminName}
                  required
                />
                
                <Input
                  label="Admin Email"
                  type="email"
                  value={formData.adminEmail}
                  onChange={(e) => handleChange('adminEmail', e.target.value)}
                  error={errors.adminEmail}
                  required
                />
                
                <Input
                  label="Password"
                  type="password"
                  value={formData.adminPassword}
                  onChange={(e) => handleChange('adminPassword', e.target.value)}
                  error={errors.adminPassword}
                  required
                />
                
                <Input
                  label="Confirm Password"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={(e) => handleChange('confirmPassword', e.target.value)}
                  error={errors.confirmPassword}
                  required
                />
              </div>
            ) : step === 3 ? (
              // Plan Selection Step
              <div className="space-y-6">
                <div className="grid gap-4">
                  {(['free', 'starter', 'professional', 'enterprise'] as SubscriptionPlan[]).map((plan) => {
                    const features = SUBSCRIPTION_FEATURES[plan];
                    const price = PLAN_PRICES[plan];
                    const isSelected = formData.selectedPlan === plan;
                    
                    return (
                      <div
                        key={plan}
                        className={`border-2 rounded-lg p-4 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }`}
                        onClick={() => handleChange('selectedPlan', plan)}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`w-4 h-4 rounded-full border-2 ${
                              isSelected 
                                ? 'bg-primary-500 border-primary-500' 
                                : 'border-gray-300 dark:border-gray-600'
                            }`}>
                              {isSelected && <Check className="w-2 h-2 text-white ml-0.5 mt-0.5" />}
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {PLAN_NAMES[plan]}
                              </h3>
                              {plan !== 'free' && (
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                  ₦{price.toLocaleString()}
                                  <span className="text-sm font-normal text-gray-500">/month</span>
                                </p>
                              )}
                              {plan === 'free' && (
                                <p className="text-xl font-bold text-green-600">Free for 30 days</p>
                              )}
                            </div>
                          </div>
                          {plan === 'professional' && (
                            <div className="bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 px-2 py-1 rounded text-xs font-medium">
                              Most Popular
                            </div>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                            <Users className="w-4 h-4 mr-2" />
                            <span>
                              {features.maxEmployees === -1 ? 'Unlimited' : features.maxEmployees} employees
                            </span>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {features.basicAttendance && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200">
                                <Check className="w-3 h-3 mr-1" />
                                Basic Attendance
                              </span>
                            )}
                            {features.analyticsCharts && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                                <Check className="w-3 h-3 mr-1" />
                                Analytics
                              </span>
                            )}
                            {features.biometricFingerprint && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                                <Check className="w-3 h-3 mr-1" />
                                Biometric
                              </span>
                            )}
                            {features.dataExport && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200">
                                <Check className="w-3 h-3 mr-1" />
                                Data Export
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {formData.selectedPlan !== 'free' && (
                  <div className="space-y-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Billing Cycle
                    </label>
                    <div className="flex space-x-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="billingCycle"
                          value="monthly"
                          checked={formData.billingCycle === 'monthly'}
                          onChange={(e) => handleChange('billingCycle', e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">Monthly</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="billingCycle"
                          value="yearly"
                          checked={formData.billingCycle === 'yearly'}
                          onChange={(e) => handleChange('billingCycle', e.target.value)}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          Yearly (10% discount)
                        </span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </form>
        </CardContent>
        
        <CardFooter className="flex justify-between">
          {step === 1 ? (
            <>
              <Button
                variant="ghost"
                onClick={() => navigate('/')}
              >
                Cancel
              </Button>
              
              <Button
                variant="primary"
                onClick={nextStep}
              >
                Next
              </Button>
            </>
          ) : step === 2 ? (
            <>
              <Button
                variant="ghost"
                onClick={prevStep}
              >
                Back
              </Button>
              
              <Button
                variant="primary"
                onClick={nextStep}
              >
                Next
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={prevStep}
              >
                Back
              </Button>
              
              <Button
                variant="primary"
                onClick={handleSubmit}
                isLoading={isLoading}
              >
                {formData.selectedPlan === 'free' ? 'Complete Registration' : 'Proceed to Payment'}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrganizationRegistration;