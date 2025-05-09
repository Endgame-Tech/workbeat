import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { Card, CardHeader, CardContent, CardFooter } from '../ui/Card';
import Input from '../ui/Input';
import Button from '../ui/Button';
import Select from '../ui/Select';
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
    confirmPassword: ''
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
  
  const handleChange = (field: string, value: any) => {
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
    }
  };
  
  const prevStep = () => {
    setStep(1);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 2 && validateStep2()) {
      setIsLoading(true);
      
      try {
        const response = await api.post('/api/organization/register', formData);
        
        // Store auth token and user info
        localStorage.setItem('token', response.data.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.data.admin));
        localStorage.setItem('organization', JSON.stringify(response.data.data.organization));
        
        toast.success('Organization registered successfully!');
        navigate('/dashboard');
      } catch (error) {
        console.error('Registration error:', error);
        toast.error(error.response?.data?.message || 'Registration failed');
      } finally {
        setIsLoading(false);
      }
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
            {step === 1 ? 'Register Your Organization' : 'Create Admin Account'}
          </h2>
          <p className="text-center text-gray-600 dark:text-gray-400 mt-2">
            {step === 1 
              ? 'Enter your organization details to get started' 
              : 'Set up an admin account to manage your organization'}
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
            ) : (
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
            )}
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
                Register
              </Button>
            </>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};

export default OrganizationRegistration;