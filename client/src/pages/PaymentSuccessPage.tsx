import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader } from '../components/ui/Card';
import Button from '../components/ui/Button';
import { SubscriptionService } from '../services/subscriptionService';
import { useSubscription } from '../hooks/useSubscription';
import { useOrganization } from '../hooks/useOrganization';

const PaymentSuccessPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { forceRefresh } = useSubscription();
  const { organizationId } = useOrganization();
  
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying');
  const [verificationResult, setVerificationResult] = useState<{
    plan?: { name: string };
    amount?: number;
    billingCycle?: string;
    reference?: string;
  } | null>(null);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const verifyPayment = async () => {
      const reference = searchParams.get('reference');
      const trxref = searchParams.get('trxref');
      
      // Use reference or trxref (Paystack sends both)
      const paymentReference = reference || trxref;
      
      if (!paymentReference) {
        setStatus('error');
        setError('No payment reference found in URL');
        return;
      }

      try {
        
        // Verify payment with our backend
        const result = await SubscriptionService.verifyPayment(paymentReference);
        
        if (result.success) {
          setStatus('success');
          setVerificationResult(result.data ? {
            plan: { name: typeof result.data.plan === 'string' ? result.data.plan : (result.data.plan as { name?: string })?.name || 'Unknown Plan' },
            amount: (result.data as { amount?: number }).amount || 0,
            billingCycle: (result.data as { billingCycle?: string }).billingCycle,
            reference: (result.data as { reference?: string }).reference
          } : null);
          await forceRefresh();
          
          toast.success('Payment successful! Your subscription has been activated.');
        } else {
          setStatus('error');
          setError(result.message || 'Payment verification failed');
          toast.error('Payment verification failed: ' + (result.message || 'Unknown error'));
        }
      } catch (err: unknown) {
        console.error('❌ Payment verification error:', err);
        setStatus('error');
        setError(err instanceof Error ? err.message : 'Failed to verify payment');
        toast.error('Failed to verify payment');
      }
    };

    verifyPayment();
  }, [searchParams, forceRefresh]);

  const handleContinue = () => {
    if (organizationId) {
      navigate(`/organization/${organizationId}`);
    } else {
      navigate('/dashboard');
    }
  };

  const handleRetry = () => {
    navigate('/subscription/plans');
  };

  if (status === 'verifying') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Loader2 className="w-16 h-16 text-blue-500 animate-spin" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Verifying Payment
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              Please wait while we confirm your payment...
            </p>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <XCircle className="w-16 h-16 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Payment Verification Failed
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              {error}
            </p>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button
              variant="primary"
              onClick={handleRetry}
              className="w-full"
            >
              Try Again
            </Button>
            <Button
              variant="ghost"
              onClick={handleContinue}
              className="w-full"
            >
              Continue to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Payment Successful!
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Your subscription has been activated successfully.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {verificationResult && (
            <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2">
                Subscription Details:
              </h3>
              <div className="text-sm text-green-700 dark:text-green-300 space-y-1">
                <div>Plan: {verificationResult.plan?.name}</div>
                <div>Amount: ₦{verificationResult.amount?.toLocaleString()}</div>
                <div>Billing: {verificationResult.billingCycle}</div>
                <div>Reference: {verificationResult.reference}</div>
              </div>
            </div>
          )}
          
          <Button
            variant="primary"
            onClick={handleContinue}
            className="w-full"
          >
            Continue to Dashboard
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccessPage;
