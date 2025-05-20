import React, { useState } from 'react';
import { X } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService'; // Import authService

// Import UI components
import Button from './ui/Button';
import Input from './ui/Input';
import { Card, CardHeader, CardContent, CardFooter } from './ui/Card';

interface LoginModalProps {
  onLogin: (email: string, password: string) => Promise<void>;
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

const LoginModal: React.FC<LoginModalProps> = ({ onLogin, onClose, isOpen }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      // Use the authService.login method instead of direct API call
      const userData = await authService.login(email, password);
      
      console.log('Login successful, user data:', userData);
      
      // Debug check for organizationId
      if (userData.organizationId) {
        console.log('organizationId found in response:', userData.organizationId);
        
        // Double-check localStorage to make sure it was saved
        setTimeout(() => {
          try {
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            console.log('User data in localStorage:', storedUser);
            if (storedUser.organizationId) {
              console.log('organizationId found in localStorage:', storedUser.organizationId);
            } else {
              console.warn('organizationId missing from localStorage');
            }
          } catch (err) {
            console.error('Error checking localStorage:', err);
          }
        }, 100);
      } else {
        console.warn('organizationId missing from login response');
      }
      
      // Call the parent's onLogin handler if needed
      // Note: this might not be necessary if authService.login already does everything needed
      try {
        await onLogin(email, password);
      } catch (err) {
        console.error('Error in parent onLogin handler:', err);
      }
      
      toast.success('Logged in successfully!');
      navigate('/dashboard');
    } catch (err) {
      console.error('Login error:', err);
      setError((err as ApiError).response?.data?.message || 'Invalid email or password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const emailForReset = prompt("Enter your email to reset password");
    if (emailForReset) {
      try {
        await authService.forgotPassword(emailForReset);
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