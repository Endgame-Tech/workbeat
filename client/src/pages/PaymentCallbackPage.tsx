import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, XCircle, Loader2, ArrowLeft } from 'lucide-react';
import { SubscriptionService } from '../services/subscriptionService';
import { useAuth } from '../components/context/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import Button from '../components/ui/Button';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import { toast } from 'react-hot-toast';

const PaymentCallbackPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refresh: refreshSubscription } = useSubscription();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');
  type PaymentDetails = {
    plan?: { name: string };
    amount?: number;
    billingCycle?: string;
    message?: string;
    reference?: string;
    [key: string]: unknown;
  };
  const [details, setDetails] = useState<PaymentDetails | null>(null);

  useEffect(() => {
    const processPayment = async () => {
      try {
        // Get payment reference from URL parameters
        const reference = searchParams.get('reference');
        const trxref = searchParams.get('trxref'); // Paystack also sends trxref
        
        const paymentReference = reference || trxref;
        
        if (!paymentReference) {
          setStatus('error');
          setMessage('Payment reference not found in URL parameters.');
          return;
        }

        // Verify payment with backend
        const result = await SubscriptionService.verifyPayment(paymentReference);
        
        if (result.success) {
          setStatus('success');
          setMessage('Payment successful! Your subscription has been activated.');
          // Map Subscription to PaymentDetails shape
          if (result.data) {
            const { plan, ...rest } = result.data;
            setDetails({
              ...rest,
              plan: plan
                ? { name: typeof plan === 'string' ? plan : (plan as { name: string }).name }
                : undefined
            });
          } else {
            setDetails(null);
          }
          
          toast.success('Subscription activated successfully!');
          refreshSubscription();
          
          // Wait a moment for data to propagate then refresh again
          setTimeout(() => {
            refreshSubscription();
          }, 1000);
          
          // Redirect to organization overview after 3 seconds
          setTimeout(() => {
            if (user?.organizationId) {
              navigate(`/organization/${user.organizationId}`); // This goes to the index route (OrganizationOverview)
            } else {
              navigate('/dashboard');
            }
          }, 3000);
        } else {
          setStatus('error');
          setMessage(result.message || 'Payment verification failed.');
          setDetails(result.details as PaymentDetails | null);
        }
      } catch (error: unknown) {
        console.error('❌ Payment callback error:', error);
        setStatus('error');
        if (error instanceof Error) {
          setMessage(error.message || 'An error occurred while processing your payment.');
        } else {
          setMessage('An error occurred while processing your payment.');
        }
        
        toast.error('Payment processing failed. Please contact support if your payment was deducted.');
      }
    };

    processPayment();
  }, [searchParams, navigate, user, refreshSubscription]);

  const handleRetryPayment = () => {
    // Navigate back to subscription page to retry
    if (user?.organizationId) {
      navigate(`/organization/${user.organizationId}/subscription`);
    } else {
      navigate('/subscription');
    }
  };

  const handleGoHome = () => {
    if (user?.organizationId) {
      navigate(`/organization/${user.organizationId}`); // This goes to the index route (OrganizationOverview)
    } else {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {status === 'loading' && (
              <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
            )}
            {status === 'success' && (
              <CheckCircle className="w-16 h-16 text-green-600" />
            )}
            {status === 'error' && (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {status === 'loading' && 'Processing Payment...'}
            {status === 'success' && 'Payment Successful!'}
            {status === 'error' && 'Payment Failed'}
          </h1>
        </CardHeader>

        <CardContent className="text-center space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            {message}
          </p>

          {details && status === 'success' && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Subscription Details
              </h3>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                {details.plan && (
                  <p><strong>Plan:</strong> {details.plan.name}</p>
                )}
                {details.amount && (
                  <p><strong>Amount:</strong> ₦{details.amount.toLocaleString()}</p>
                )}
                {details.billingCycle && (
                  <p><strong>Billing:</strong> {details.billingCycle}</p>
                )}
              </div>
            </div>
          )}

          {details && status === 'error' && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 text-left">
              <h3 className="font-semibold text-red-800 dark:text-red-200 mb-2">
                Error Details
              </h3>
              <div className="text-sm text-red-700 dark:text-red-300">
                <p>{details.message || 'Unknown error occurred'}</p>
                {details.reference && (
                  <p className="mt-2"><strong>Reference:</strong> {details.reference}</p>
                )}
              </div>
            </div>
          )}

          <div className="flex flex-col space-y-3 pt-4">
            {status === 'success' && (
              <>
                <Button
                  variant="primary"
                  onClick={handleGoHome}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Go to Dashboard
                </Button>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Redirecting automatically in 3 seconds...
                </p>
              </>
            )}

            {status === 'error' && (
              <div className="space-y-2">
                <Button
                  variant="primary"
                  onClick={handleRetryPayment}
                >
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={handleGoHome}
                  leftIcon={<ArrowLeft size={16} />}
                >
                  Go to Dashboard
                </Button>
              </div>
            )}

            {status === 'loading' && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Please wait while we verify your payment...
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentCallbackPage;