import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Check, Loader2, Zap, Shield, Clock, CreditCard, AlertCircle } from 'lucide-react';
import CouponSystem from '../CouponSystem';
import PaymentStatusManager from '@/components/payments/PaymentStatusManager';

interface DodoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

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

const EnhancedDodoPaymentModal: React.FC<DodoPaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [showStatusManager, setShowStatusManager] = useState(false);

  const plans = [
    {
      name: 'Starter Pack',
      credits: 5,
      price: 5,
      originalPrice: 7.5,
      popular: false,
      description: 'Perfect for getting started',
      features: ['AI Resume Analysis', 'ATS Optimization', 'Detailed Feedback', 'Export Options']
    },
    {
      name: 'Pro Pack',
      credits: 15,
      price: 15,
      originalPrice: 22.5,
      popular: true,
      description: 'Most popular choice',
      features: ['Everything in Starter', 'Priority Support', 'Advanced Analytics', 'Custom Templates']
    },
    {
      name: 'Premium Pack',
      credits: 30,
      price: 25,
      originalPrice: 45,
      popular: false,
      description: 'Best value for power users',
      features: ['Everything in Pro', 'Bulk Processing', 'API Access', 'White-label Options']
    },
    {
      name: 'Enterprise Pack',
      credits: 100,
      price: 75,
      originalPrice: 150,
      popular: false,
      description: 'For large teams and organizations',
      features: ['Everything in Premium', 'Team Management', 'Custom Integrations', 'Dedicated Support']
    }
  ];

  const calculateSavings = (originalPrice: number, currentPrice: number, discountPercent: number) => {
    const discountedPrice = currentPrice * (1 - discountPercent / 100);
    const savings = originalPrice - discountedPrice;
    return savings > 0 ? '0.00' : savings.toFixed(2);
  };

  const handlePurchase = async (credits: number, price: number) => {
    setLoading(true);

    try {
      const finalAmount = Math.round(price * 100 * (1 - discountPercent / 100));
      const planType = credits === 5 ? 'starter' : credits === 15 ? 'pro' : credits === 30 ? 'premium' : 'enterprise';
      
      console.log('🎯 Initiating enhanced payment:', {credits, price, discountPercent});
      console.log('💰 Payment details:', {credits, finalAmount, planType});

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Please sign in to purchase credits');
      }

      // Create payment with enhanced error handling
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/create-payment-dynamic`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          credits,
          amount: finalAmount,
          planType,
          test_mode: false, // Use production mode
          userId: user.id,
          userEmail: user.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Payment response:', data);

      // Enhanced response validation
      if (data?.url && data?.paymentId) {
        // Create payment status object
        const status: PaymentStatus = {
          id: data.paymentId,
          status: 'pending',
          amount: finalAmount,
          credits,
          planType,
          paymentId: data.paymentId,
          timestamp: new Date().toISOString(),
          checkoutUrl: data.url,
          retryable: true
        };

        setPaymentStatus(status);

        // Store payment details for monitoring
        const paymentData = {
          paymentId: data.paymentId,
          credits,
          amount: finalAmount,
          planType,
          timestamp: Date.now(),
          provider: 'dodo_payments',
          currency: 'USD',
          environment: data.environment || 'production',
          url: data.url,
          status: 'pending'
        };

        localStorage.setItem('pending_payment', JSON.stringify(paymentData));
        
        // Open Dodo Payments checkout
        const win = window.open(data.url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        
        if (!win) {
          throw new Error('Popup blocked. Please allow popups to complete payment.');
        }
        
        // Show status manager
        setShowStatusManager(true);
        onClose(); // Close payment modal

        // Monitor popup for completion
        const checkClosed = setInterval(() => {
          if (win.closed) {
            clearInterval(checkClosed);
            // Update status to processing
            setPaymentStatus(prev => prev ? {...prev, status: 'processing'} : null);
            
            // Check payment status after popup closes
            setTimeout(() => {
              checkPendingPayment(data.paymentId);
            }, 2000);
          }
        }, 1000);

        toast({
          title: "🚀 Payment Initiated",
          description: "Complete your payment in the new tab. We'll automatically verify your payment and add credits to your account.",
          duration: 10000,
        });
        
      } else {
        console.error('❌ Invalid payment response:', data);
        
        // Handle fallback mode
        if (data.fallback) {
          const status: PaymentStatus = {
            id: data.paymentId,
            status: 'failed',
            amount: finalAmount,
            credits,
            planType,
            paymentId: data.paymentId,
            timestamp: new Date().toISOString(),
            error: data.reason || 'Payment service temporarily unavailable',
            retryable: true
          };
          
          setPaymentStatus(status);
          setShowStatusManager(true);
          onClose();
          
          // Redirect to payments page with fallback info
          setTimeout(() => {
            window.location.href = data.url;
          }, 2000);
        } else {
          throw new Error("Invalid payment response - missing URL or payment ID");
        }
      }
    } catch (error: any) {
      console.error('💥 Payment error:', error);
      
      // Create error status
      const errorStatus: PaymentStatus = {
        id: `error_${Date.now()}`,
        status: 'failed',
        amount: Math.round(price * 100 * (1 - discountPercent / 100)),
        credits,
        planType: credits === 5 ? 'starter' : credits === 15 ? 'pro' : credits === 30 ? 'premium' : 'enterprise',
        paymentId: '',
        timestamp: new Date().toISOString(),
        error: error.message,
        retryable: true
      };
      
      setPaymentStatus(errorStatus);
      setShowStatusManager(true);
      onClose();
      
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
        duration: 10000,
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced payment status checking
  const checkPendingPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-payment-status`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId })
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.status && data.status !== 'pending') {
          // Update payment status
          setPaymentStatus(prev => prev ? {
            ...prev,
            status: data.status,
            error: data.error
          } : null);
          
          if (data.status === 'completed') {
            // Clear pending payment
            localStorage.removeItem('pending_payment');
            
            // Success notification
            toast({
              title: "🎉 Payment Successful!",
              description: `${data.credits || 0} credits have been added to your account.`,
              duration: 10000,
            });
            
            onSuccess();
          }
        }
      }
    } catch (error) {
      console.error('Payment status check error:', error);
    }
  };

  const handleRetryPayment = () => {
    if (paymentStatus) {
      handlePurchase(paymentStatus.credits, paymentStatus.amount / 100);
    }
  };

  const handleStatusManagerClose = () => {
    setShowStatusManager(false);
    setPaymentStatus(null);
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">Choose Your Credit Package</DialogTitle>
            <DialogDescription className="text-center text-gray-600">
              Select the perfect package for your resume analysis needs
            </DialogDescription>
          </DialogHeader>

          {/* Coupon System */}
          <div className="mb-6">
            <CouponSystem onCouponApplied={setDiscountPercent} />
          </div>

          {/* Payment Plans */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {plans.map((plan) => (
              <Card key={plan.name} className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-xs font-bold rounded-bl-lg">
                    POPULAR
                  </div>
                )}
                
                <div className="p-6">
                  <div className="text-center mb-4">
                    <h3 className="font-bold text-lg">{plan.name}</h3>
                    <div className="flex items-center justify-center gap-2 mt-2">
                      <Zap className="w-5 h-5 text-yellow-500" />
                      <span className="text-2xl font-bold">{plan.credits}</span>
                      <span className="text-gray-600">Credits</span>
                    </div>
                  </div>

                  <div className="text-center mb-4">
                    <div className="text-3xl font-bold text-blue-600">
                      ${(plan.price * (1 - discountPercent / 100)).toFixed(2)}
                    </div>
                    {(discountPercent > 0 || plan.originalPrice > plan.price) && (
                      <div className="text-sm text-gray-500 line-through">
                        ${plan.originalPrice.toFixed(2)}
                      </div>
                    )}
                    {discountPercent > 0 && (
                      <Badge variant="secondary" className="mt-1">
                        Save {discountPercent}%
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2 mb-6">
                    {plan.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2 text-sm">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={() => handlePurchase(plan.credits, plan.price)}
                    disabled={loading}
                    className="w-full"
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    ) : (
                      <CreditCard className="w-4 h-4 mr-2" />
                    )}
                    Purchase Credits
                  </Button>
                </div>
              </Card>
            ))}
          </div>

          {/* Security and Features */}
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex items-center justify-center gap-6 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-green-500" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-500" />
                <span>Instant Activation</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-purple-500" />
                <span>Multiple Payment Methods</span>
              </div>
            </div>
          </div>

          {/* Disclaimer */}
          <p className="text-xs text-gray-500 text-center">
            Credits never expire and can be used for any resume analysis feature. 
            Secure payment processing powered by Dodo Payments.
          </p>
        </DialogContent>
      </Dialog>

      {/* Payment Status Manager */}
      <PaymentStatusManager
        isOpen={showStatusManager}
        onClose={handleStatusManagerClose}
        paymentStatus={paymentStatus}
        onRetry={handleRetryPayment}
      />
    </>
  );
};

export default EnhancedDodoPaymentModal;
