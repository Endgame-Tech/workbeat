import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Import UI components
import Button from './ui/Button';
import Input from './ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';

interface LoginModalProps {
  onClose: () => void;
  isOpen: boolean;
}

interface ApiError {
  response?: {
    data?: {
      message?: string
    }
  }
}

const LoginModal: React.FC<LoginModalProps> = ({ onClose, isOpen }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { login, user, forgotPassword } = useAuth();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use the auth context login method
      await login(email, password);
      
      toast.success('Logged in successfully!');
      onClose(); // Close the modal
      
      // Force immediate navigation after successful login
      // Since the user state might not be updated yet in the context
      const userString = localStorage.getItem('user');
      if (userString) {
        const userData = JSON.parse(userString);
        
        // Navigate based on user role
        if (userData.role === 'admin') {
          // Get organization ID for admin navigation
          const orgId = userData.organizationId || userData.organization?.id;
          if (orgId) {
            navigate(`/organization/${orgId}`);
          } else {
            console.warn('Admin user without organizationId, redirecting to dashboard');
            navigate('/dashboard');
          }
        } else {
          // Employee navigation
          navigate('/employee');
        }
      }
    } catch (err) {
      console.error('Login error:', err);
      setError((err as ApiError).response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle navigation after successful login
  React.useEffect(() => {
    if (user && !isLoading) {
      // Navigate based on user role
      if (user.role === 'admin') {
        // Get organization ID for admin navigation
        const orgId = user.organizationId || user.organization?.id;
        if (orgId) {
          navigate(`/organization/${orgId}`);
        } else {
          console.warn('Admin user without organizationId, redirecting to dashboard');
          navigate('/dashboard');
        }
      } else {
        // Employee navigation
        navigate('/employee');
      }
    }
  }, [user, isLoading, navigate]);

  const handleForgotPassword = async () => {
    const emailForReset = prompt("Enter your email to reset password");
    if (emailForReset) {
      try {
        await forgotPassword(emailForReset);
        toast.success("If your email is registered, you will receive a password reset link");
      } catch (error) {
        console.error('Forgot password error:', error);
        toast.error("Failed to process request");
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="relative">
            <h2 className="text-2xl font-bold text-center text-gray-900 dark:text-white">
              Sign In to WorkBeat
            </h2>
            <button 
              onClick={onClose}
              className="absolute top-0 right-0 m-4 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              <X size={24} />
            </button>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />

              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />

              {error && (
                <div className="text-sm text-red-600 dark:text-red-500">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                variant="primary"
                className="w-full"
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </form>
            
          </CardContent>

          <CardFooter className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
              onClick={handleForgotPassword}
            >
              Forgot your password?
            </button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default LoginModal;