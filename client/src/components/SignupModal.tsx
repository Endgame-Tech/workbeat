import React, { useState } from 'react';
import { X, Building2, User, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

// Import UI components
import Button from './ui/Button';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';
import { useSubscriptionModal } from '../hooks/useSubscriptionModal';

interface SignupModalProps {
  onClose: () => void;
  isOpen: boolean;
  onSwitchToLogin?: () => void;
}

interface SignupFormData {
  organizationName: string;
  adminName: string;
  adminEmail: string;
  password: string;
  confirmPassword: string;
}

const SignupModal: React.FC<SignupModalProps> = ({ onClose, isOpen, onSwitchToLogin }) => {
  const navigate = useNavigate();
  const { showUpgradeModal } = useSubscriptionModal();
  const [formData, setFormData] = useState<SignupFormData>({
    organizationName: '',
    adminName: '',
    adminEmail: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (error) setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.organizationName.trim()) {
      setError('Organization name is required');
      return false;
    }
    if (!formData.adminName.trim()) {
      setError('Admin name is required');
      return false;
    }
    if (!formData.adminEmail.trim()) {
      setError('Email is required');
      return false;
    }
    if (!/\S+@\S+\.\S+/.test(formData.adminEmail)) {
      setError('Please enter a valid email address');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      // API call to register organization and admin
      const response = await fetch(`${import.meta.env.VITE_APP_API_URL}/api/organizations/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          name: formData.organizationName,
          industry: 'technology', // Default industry for quick signup
          contactEmail: formData.adminEmail, // Use admin email as contact email for quick signup
          contactPhone: '1234567890', // Default phone for quick signup  
          adminName: formData.adminName,
          adminEmail: formData.adminEmail,
          adminPassword: formData.password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      // Store auth data
      localStorage.setItem('token', data.data.token);
      localStorage.setItem('user', JSON.stringify(data.data.admin));
      localStorage.setItem('organization', JSON.stringify(data.data.organization));
      
      toast.success('Registration successful!');
      onClose();
      
      // Show subscription modal
      showUpgradeModal({
        featureName: 'Complete Setup',
        requiredPlan: 'starter'
      });
      
      // Navigate to organization dashboard
      const organizationId = data.data.organization.id;
      if (organizationId) {
        navigate(`/organization/${organizationId}`);
      } else {
        navigate('/dashboard');
      }

    } catch (error: unknown) {
      console.error('Registration error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : typeof error === 'string'
          ? error
          : 'Registration failed. Please try again.';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-md max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div>
            <h2 className="text-2xl font-bold text-neutral-900 dark:text-white">
              Create Account
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-1">
              Set up your organization and admin account
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="rounded-full w-8 h-8 p-0"
          >
            <X size={16} />
          </Button>
        </CardHeader>

        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {/* Organization Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Organization Name
              </label>
              <div className="relative">
                <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                <input
                  type="text"
                  name="organizationName"
                  value={formData.organizationName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Enter your organization name"
                  required
                />
              </div>
            </div>

            {/* Admin Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Admin Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                <input
                  type="text"
                  name="adminName"
                  value={formData.adminName}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Enter admin full name"
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                <input
                  type="email"
                  name="adminEmail"
                  value={formData.adminEmail}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-3 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Enter admin email address"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Enter password (min. 6 characters)"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-neutral-700 dark:text-neutral-300">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-neutral-400" size={16} />
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  className="w-full pl-10 pr-10 py-2 border border-neutral-300 dark:border-neutral-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-neutral-800 text-neutral-900 dark:text-white"
                  placeholder="Confirm your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? 'Creating Account...' : 'Create Account'}
            </Button>

            <div className="text-center">
              <p className="text-sm text-neutral-600 dark:text-neutral-400">
                Already have an account?{' '}
                <button
                  type="button"
                  onClick={onSwitchToLogin}
                  className="text-primary-600 hover:text-primary-700 font-medium"
                >
                  Sign in
                </button>
              </p>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
};

export default SignupModal;
