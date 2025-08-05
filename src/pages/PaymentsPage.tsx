import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  CreditCard,
  Shield,
  Zap
} from 'lucide-react';

interface PaymentStatus {
  status: 'success' | 'failed' | 'pending' | 'cancelled' | 'processing';
  paymentId?: string;
  amount?: number;
  credits?: number;
  message?: string;
  timestamp?: string;
}

const PaymentsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [processing, setProcessing] = useState(false);

  // Get payment parameters from URL
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const amount = searchParams.get('amount');
  const credits = searchParams.get('credits');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    // Handle payment status from URL parameters
    if (paymentId && status) {
      handlePaymentStatus(paymentId, status, amount, credits);
    }

    // Check for pending payment in localStorage
    const pendingPayment = localStorage.getItem('pending_payment');
    if (pendingPayment && !paymentId) {
      const paymentData = JSON.parse(pendingPayment);
      checkPaymentStatus(paymentData.paymentId);
    }
  }, [loading, user, paymentId, status, amount, credits, navigate]);

  const handlePaymentStatus = async (
    paymentId: string, 
    status: string, 
    amount?: string | null, 
    credits?: string | null
  ) => {
    setProcessing(true);

    try {
      console.log('Processing payment status:', { paymentId, status, amount, credits });

      // Verify payment with backend
      const { data, error } = await supabase.functions.invoke('verify-payment', {
        body: {
          paymentId,
          status,
          amount: amount ? parseInt(amount) : undefined,
          credits: credits ? parseInt(credits) : undefined
        }
      });

      if (error) {
        console.error('Payment verification error:', error);
        setPaymentStatus({
          status: 'failed',
          paymentId,
          message: 'Payment verification failed'
        });
        return;
      }

      // Set payment status based on response
      const paymentStatus: PaymentStatus = {
        status: data.status || 'failed',
        paymentId,
        amount: data.amount,
        credits: data.credits,
        message: data.message,
        timestamp: new Date().toISOString()
      };

      setPaymentStatus(paymentStatus);

      // Clear pending payment from localStorage
      localStorage.removeItem('pending_payment');

      // Show appropriate toast
      if (paymentStatus.status === 'success') {
        toast({
          title: "Payment Successful!",
          description: `${paymentStatus.credits} credits have been added to your account.`,
        });
      } else if (paymentStatus.status === 'failed') {
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: paymentStatus.message || "Your payment could not be processed.",
        });
      } else if (paymentStatus.status === 'cancelled') {
        toast({
          title: "Payment Cancelled",
          description: "Your payment was cancelled. You can try again anytime.",
        });
      }

    } catch (error) {
      console.error('Payment status handling error:', error);
      setPaymentStatus({
        status: 'failed',
        paymentId,
        message: 'An error occurred while processing your payment'
      });
    } finally {
      setProcessing(false);
    }
  };

  const checkPaymentStatus = async (paymentId: string) => {
    setProcessing(true);

    try {
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId }
      });

      if (error) {
        console.error('Payment status check error:', error);
        return;
      }

      if (data.status === 'completed') {
        setPaymentStatus({
          status: 'success',
          paymentId,
          amount: data.amount,
          credits: data.credits,
          message: 'Payment completed successfully',
          timestamp: new Date().toISOString()
        });

        localStorage.removeItem('pending_payment');
        
        toast({
          title: "Payment Successful!",
          description: `${data.credits} credits have been added to your account.`,
        });
      }
    } catch (error) {
      console.error('Payment status check error:', error);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-12 w-12 text-green-500" />;
      case 'failed':
        return <XCircle className="h-12 w-12 text-red-500" />;
      case 'cancelled':
        return <XCircle className="h-12 w-12 text-yellow-500" />;
      case 'pending':
        return <Clock className="h-12 w-12 text-blue-500" />;
      default:
        return <AlertCircle className="h-12 w-12 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusTitle = (status: string) => {
    switch (status) {
      case 'success':
        return 'Payment Successful!';
      case 'failed':
        return 'Payment Failed';
      case 'cancelled':
        return 'Payment Cancelled';
      case 'pending':
        return 'Payment Processing';
      default:
        return 'Payment Status';
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'success':
        return 'Your payment has been processed successfully and credits have been added to your account.';
      case 'failed':
        return 'Your payment could not be processed. Please try again or contact support if the issue persists.';
      case 'cancelled':
        return 'Your payment was cancelled. You can try again anytime.';
      case 'pending':
        return 'Your payment is being processed. This may take a few moments.';
      default:
        return 'We are processing your payment status.';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Status</h1>
          <p className="text-gray-600">Track your payment and credit status</p>
        </div>

        {processing && (
          <div className="flex items-center justify-center mb-8">
            <Loader2 className="h-8 w-8 animate-spin text-green-600 mr-3" />
            <span className="text-lg text-gray-700">Processing payment status...</span>
          </div>
        )}

        {paymentStatus ? (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                {getStatusIcon(paymentStatus.status)}
              </div>
              <CardTitle className="text-2xl font-bold">
                {getStatusTitle(paymentStatus.status)}
              </CardTitle>
              <Badge className={`inline-block ${getStatusColor(paymentStatus.status)}`}>
                {paymentStatus.status.toUpperCase()}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-600">
                {getStatusDescription(paymentStatus.status)}
              </p>

              {paymentStatus.paymentId && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-700">Payment ID:</span>
                      <p className="text-gray-600 font-mono">{paymentStatus.paymentId}</p>
                    </div>
                    {paymentStatus.amount && (
                      <div>
                        <span className="font-medium text-gray-700">Amount:</span>
                        <p className="text-gray-600">${(paymentStatus.amount / 100).toFixed(2)}</p>
                      </div>
                    )}
                    {paymentStatus.credits && (
                      <div>
                        <span className="font-medium text-gray-700">Credits:</span>
                        <p className="text-gray-600">{paymentStatus.credits} credits</p>
                      </div>
                    )}
                    {paymentStatus.timestamp && (
                      <div>
                        <span className="font-medium text-gray-700">Time:</span>
                        <p className="text-gray-600">
                          {new Date(paymentStatus.timestamp).toLocaleString()}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {paymentStatus.message && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <p className="text-blue-800 text-sm">{paymentStatus.message}</p>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                
                {paymentStatus.status === 'failed' && (
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/dashboard')}
                  >
                    Try Again
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="max-w-2xl mx-auto">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CreditCard className="h-12 w-12 text-gray-400" />
              </div>
              <CardTitle className="text-2xl font-bold">Payment Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <p className="text-center text-gray-600">
                This page handles payment processing and status updates. If you're here without a payment, 
                you can return to your dashboard to make a purchase.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Shield className="h-8 w-8 text-green-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-green-800">Secure Payments</h3>
                  <p className="text-sm text-green-600">Enterprise-grade security</p>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Zap className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-blue-800">Instant Credits</h3>
                  <p className="text-sm text-blue-600">Credits added immediately</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <CheckCircle className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                  <h3 className="font-semibold text-purple-800">24/7 Support</h3>
                  <p className="text-sm text-purple-600">Always here to help</p>
                </div>
              </div>

              <div className="flex justify-center">
                <Button 
                  onClick={() => navigate('/dashboard')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Go to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PaymentsPage; 