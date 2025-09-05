import React, { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Clock, 
  CreditCard,
  RefreshCw,
  ExternalLink
} from 'lucide-react';

interface PaymentStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'disputed' | 'refunded' | 'expired';
  amount: number;
  credits: number;
  planType: string;
  paymentId: string;
  timestamp: string;
  error?: string;
  retryable?: boolean;
  checkoutUrl?: string;
}

interface PaymentStatusManagerProps {
  isOpen: boolean;
  onClose: () => void;
  paymentStatus?: PaymentStatus;
  onRetry?: () => void;
}

export const PaymentStatusManager: React.FC<PaymentStatusManagerProps> = ({
  isOpen,
  onClose,
  paymentStatus,
  onRetry
}) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (paymentStatus?.status === 'pending' && isOpen) {
      startPaymentMonitoring();
    }
  }, [paymentStatus, isOpen]);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const startPaymentMonitoring = () => {
    setIsMonitoring(true);
    setCountdown(300); // 5 minutes
    
    const interval = setInterval(async () => {
      if (!paymentStatus?.paymentId) return;
      
      try {
        const { data, error } = await supabase.functions.invoke('enhanced-payment-status', {
          body: { paymentId: paymentStatus.paymentId }
        });

        if (error) {
          console.error('Payment monitoring error:', error);
          
          // Handle 404 or function not found errors
          if (error.message?.includes('404') || error.message?.includes('Not Found')) {
            clearInterval(interval);
            setIsMonitoring(false);
            // Show failure notification for function not found
            handlePaymentUpdate({
              ...paymentStatus,
              status: 'failed',
              error: 'Payment verification failed'
            });
          }
          return;
        }
        
        if (data?.status && data.status !== 'pending') {
          clearInterval(interval);
          setIsMonitoring(false);
          handlePaymentUpdate({
            ...paymentStatus,
            status: data.status,
            credits: data.credits || paymentStatus.credits
          });
        }
      } catch (error) {
        console.error('Payment monitoring error:', error);
      }
    }, 10000); // Check every 10 seconds

    // Auto-stop monitoring after 5 minutes
    setTimeout(() => {
      clearInterval(interval);
      setIsMonitoring(false);
      if (paymentStatus?.status === 'pending') {
        handlePaymentTimeout();
      }
    }, 300000);
  };

  const handlePaymentUpdate = (updatedStatus: PaymentStatus) => {
    switch (updatedStatus.status) {
      case 'completed':
        showSuccessNotification(updatedStatus);
        break;
      case 'failed':
        showFailureNotification(updatedStatus);
        break;
      case 'disputed':
        showDisputeNotification(updatedStatus);
        break;
      case 'expired':
        showExpiredNotification(updatedStatus);
        break;
    }
  };

  const showSuccessNotification = (status: PaymentStatus) => {
    toast({
      title: "🎉 Payment Successful!",
      description: `${status.credits} credits have been added to your account. Thank you for your purchase!`,
      duration: 10000,
    });
    
    // Redirect to dashboard after success
    setTimeout(() => {
      navigate('/dashboard?payment=success');
      onClose();
    }, 2000);
  };

  const showFailureNotification = (status: PaymentStatus) => {
    toast({
      variant: "destructive",
      title: "❌ Payment Failed",
      description: status.error || "Your payment could not be processed. Please try again.",
      duration: 15000,
    });
    
    // Redirect to payments page with error details
    navigate(`/payments?status=failed&payment_id=${status.paymentId}&error=${encodeURIComponent(status.error || 'Unknown error')}`);
  };

  const showDisputeNotification = (status: PaymentStatus) => {
    toast({
      variant: "destructive",
      title: "⚠️ Payment Disputed",
      description: "Your payment is under review. We'll contact you shortly.",
      duration: 20000,
    });
    
    navigate(`/payments?status=disputed&payment_id=${status.paymentId}`);
  };

  const showExpiredNotification = (status: PaymentStatus) => {
    toast({
      variant: "destructive",
      title: "⏰ Payment Expired",
      description: "The payment session has expired. Please start a new payment.",
      duration: 10000,
    });
  };

  const handlePaymentTimeout = () => {
    toast({
      variant: "destructive",
      title: "⏰ Payment Monitoring Timeout",
      description: "We're still processing your payment. You'll receive an email confirmation once completed.",
      duration: 15000,
    });
    
    navigate(`/payments?status=timeout&payment_id=${paymentStatus?.paymentId}`);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-8 h-8 text-green-500" />;
      case 'failed':
        return <XCircle className="w-8 h-8 text-red-500" />;
      case 'disputed':
        return <AlertCircle className="w-8 h-8 text-yellow-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-8 h-8 text-blue-500 animate-pulse" />;
      default:
        return <CreditCard className="w-8 h-8 text-gray-500" />;
    }
  };

  const getStatusMessage = (status: string) => {
    switch (status) {
      case 'completed':
        return {
          title: "Payment Successful! 🎉",
          message: "Your credits have been added to your account.",
          color: "text-green-600"
        };
      case 'failed':
        return {
          title: "Payment Failed ❌",
          message: "We couldn't process your payment. Please try again.",
          color: "text-red-600"
        };
      case 'disputed':
        return {
          title: "Payment Under Review ⚠️",
          message: "Your payment is being reviewed. We'll contact you soon.",
          color: "text-yellow-600"
        };
      case 'pending':
        return {
          title: "Processing Payment... ⏳",
          message: "Please wait while we process your payment.",
          color: "text-blue-600"
        };
      case 'processing':
        return {
          title: "Payment in Progress 🔄",
          message: "Your payment is being processed.",
          color: "text-blue-600"
        };
      case 'expired':
        return {
          title: "Payment Expired ⏰",
          message: "The payment session has expired.",
          color: "text-gray-600"
        };
      default:
        return {
          title: "Payment Status Unknown",
          message: "We're checking your payment status.",
          color: "text-gray-600"
        };
    }
  };

  if (!isOpen || !paymentStatus) return null;

  const statusInfo = getStatusMessage(paymentStatus.status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <div className="text-center">
          <div className="mb-4">
            {getStatusIcon(paymentStatus.status)}
          </div>
          
          <h2 className={`text-xl font-bold mb-2 ${statusInfo.color}`}>
            {statusInfo.title}
          </h2>
          
          <p className="text-gray-600 mb-4">
            {statusInfo.message}
          </p>
          
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="text-sm text-gray-600 space-y-1">
              <div><strong>Amount:</strong> ${(paymentStatus.amount / 100).toFixed(2)}</div>
              <div><strong>Credits:</strong> {paymentStatus.credits}</div>
              <div><strong>Plan:</strong> {paymentStatus.planType}</div>
              <div><strong>Payment ID:</strong> {paymentStatus.paymentId}</div>
            </div>
          </div>
          
          {isMonitoring && countdown > 0 && (
            <div className="mb-4">
              <div className="text-sm text-gray-500">
                Monitoring payment... {Math.floor(countdown / 60)}:{(countdown % 60).toString().padStart(2, '0')} remaining
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${((300 - countdown) / 300) * 100}%` }}
                ></div>
              </div>
            </div>
          )}
          
          <div className="flex gap-3 justify-center">
            {paymentStatus.status === 'failed' && paymentStatus.retryable && onRetry && (
              <Button 
                onClick={onRetry}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Retry Payment
              </Button>
            )}
            
            {paymentStatus.checkoutUrl && paymentStatus.status === 'pending' && (
              <Button 
                onClick={() => window.open(paymentStatus.checkoutUrl, '_blank')}
                variant="outline"
                className="flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Complete Payment
              </Button>
            )}
            
            <Button 
              onClick={() => navigate('/payments')}
              variant="outline"
            >
              View Payment History
            </Button>
            
            <Button onClick={onClose} variant="secondary">
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentStatusManager;
