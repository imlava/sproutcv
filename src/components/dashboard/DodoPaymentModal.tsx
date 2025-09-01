import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Check, Loader2, Zap, Shield, Clock, CreditCard } from 'lucide-react';
import CouponSystem from '../CouponSystem';

interface DodoPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const DodoPaymentModal: React.FC<DodoPaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);

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
      features: ['Everything in Pro', 'Unlimited Exports', 'Personal Branding', '30-Day Analysis History']
    }
  ];

  const calculateFinalPrice = (price: number) => {
    return discountPercent > 0 ? (price * (1 - discountPercent / 100)).toFixed(2) : price.toString();
  };

  const calculateSavings = (plan: any) => {
    if (discountPercent > 0) {
      return (plan.price * (discountPercent / 100)).toFixed(2);
    }
    return plan.originalPrice ? (plan.originalPrice - plan.price).toFixed(2) : '0.00';
  };

  const handlePurchase = async (credits: number, price: number) => {
    setLoading(true);

    try {
      console.log('🎯 Initiating enhanced payment:', { credits, price, discountPercent });

      // Apply discount if any
      const finalAmount = discountPercent > 0 
        ? Math.round(price * (1 - discountPercent / 100) * 100) // Convert to cents
        : price * 100; // Convert to cents

      // Determine plan type for better tracking
      const planType = credits === 5 ? 'starter' : credits === 15 ? 'pro' : credits === 30 ? 'premium' : 'custom';

      console.log('💰 Payment details:', { credits, finalAmount, planType });

      // Enhanced payment creation with Dodo Payments (FINAL FIXED VERSION)
      const { data, error } = await supabase.functions.invoke('create-payment-dynamic', {
        body: { 
          credits,
          amount: finalAmount,
          planType,
          test_mode: false // Set to true for testing
        }
      });

      if (error) {
        console.error('❌ Payment creation error:', error);
        throw new Error(error.message);
      }

      console.log('✅ Payment response:', data);

      if (data?.url && data?.paymentId) {
        // Enhanced payment tracking
        const paymentData = {
          paymentId: data.paymentId,
          credits,
          amount: finalAmount,
          planType,
          timestamp: Date.now(),
          provider: 'dodo_payments',
          currency: data.currency || 'USD',
          environment: data.environment || 'production',
          recordId: data.recordId
        };

        // Store for tracking
        localStorage.setItem('pending_payment', JSON.stringify(paymentData));
        
        // Open Dodo Payments checkout
        const win = window.open(data.url, '_blank', 'width=800,height=600,scrollbars=yes,resizable=yes');
        
        if (!win) {
          throw new Error('Popup blocked. Please allow popups to complete payment.');
        }
        
        // Monitor popup for completion
        const checkClosed = setInterval(() => {
          if (win.closed) {
            clearInterval(checkClosed);
            // Check payment status after popup closes
            setTimeout(() => {
              checkPendingPayment(data.paymentId);
            }, 2000);
          }
        }, 1000);

        toast({
          title: "🚀 Payment Initiated",
          description: "Complete your payment in the new tab. We'll automatically verify your payment.",
          duration: 7000,
        });
        
        onClose();
      } else {
        console.error('❌ Invalid payment response:', data);
        throw new Error("Invalid payment response - missing URL or payment ID");
      }
    } catch (error: any) {
      console.error('💥 Payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced payment status checking
  const checkPendingPayment = async (paymentId: string) => {
    try {
      console.log('🔍 Checking payment status:', paymentId);
      
      const { data, error } = await supabase.functions.invoke('check-payment-status', {
        body: { paymentId }
      });

      if (error) {
        console.error('❌ Status check error:', error);
        return;
      }

      console.log('📊 Payment status:', data);

      if (data?.status === 'completed') {
        localStorage.removeItem('pending_payment');
        
        toast({
          title: "🎉 Payment Successful!",
          description: `${data.credits} credits have been added to your account.`,
        });
        
        onSuccess(); // Refresh the parent component
      } else if (data?.status === 'failed') {
        localStorage.removeItem('pending_payment');
        
        toast({
          variant: "destructive",
          title: "Payment Failed",
          description: "Your payment could not be processed. Please try again.",
        });
      } else if (data?.status === 'cancelled') {
        localStorage.removeItem('pending_payment');
        
        toast({
          title: "Payment Cancelled",
          description: "Your payment was cancelled. You can try again anytime.",
        });
      }
    } catch (error) {
      console.error('💥 Status check error:', error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-3xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            Choose Your Credit Pack
          </DialogTitle>
          <DialogDescription className="text-center text-muted-foreground mt-2">
            Unlock the full potential of AI-powered resume optimization
          </DialogDescription>
        </DialogHeader>

        {/* Trust Indicators */}
        <div className="flex justify-center gap-6 py-4 border-y bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Shield className="h-4 w-4 text-green-600" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4 text-blue-600" />
            <span>Instant Access</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <CreditCard className="h-4 w-4 text-purple-600" />
            <span>Powered by Dodo Payments</span>
          </div>
        </div>

        {/* Coupon System */}
        <div className="max-w-md mx-auto mb-6">
          <CouponSystem onCouponApplied={setDiscountPercent} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative p-6 transition-all duration-300 hover:shadow-lg ${
              plan.popular 
                ? 'ring-2 ring-primary shadow-lg scale-105' 
                : 'hover:scale-102'
            }`}>
              {plan.popular && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-primary to-purple-600 text-white px-4 py-1">
                  🚀 Most Popular
                </Badge>
              )}
              
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground mb-2">{plan.name}</h3>
                
                <div className="mb-4">
                  <div className="text-4xl font-bold text-foreground">
                    ${calculateFinalPrice(plan.price)}
                  </div>
                  {(plan.originalPrice || discountPercent > 0) && (
                    <div className="text-lg text-muted-foreground line-through">
                      ${plan.originalPrice || plan.price}
                    </div>
                  )}
                  {(plan.originalPrice || discountPercent > 0) && (
                    <div className="text-sm text-green-600 font-semibold">
                      Save ${calculateSavings(plan)}!
                    </div>
                  )}
                </div>
                
                <div className="flex items-center justify-center mb-3">
                  <Zap className="h-5 w-5 text-yellow-500 mr-2" />
                  <span className="text-2xl font-bold text-primary">{plan.credits} Credits</span>
                </div>
                
                <p className="text-muted-foreground text-sm mb-4">{plan.description}</p>
              </div>

              <div className="space-y-3 mb-6">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                    <span className="text-sm text-muted-foreground">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className={`w-full ${
                  plan.popular 
                    ? 'bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90' 
                    : ''
                }`}
                onClick={() => handlePurchase(plan.credits, plan.price)}
                disabled={loading}
                size="lg"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Get {plan.credits} Credits
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center space-y-2">
          <div className="flex justify-center items-center gap-4 text-sm text-muted-foreground">
            <span>💳 Secure payment processing powered by Dodo Payments</span>
            <span>✨ Credits never expire</span>
            <span>🔒 Enterprise-grade security</span>
          </div>
          <p className="text-xs text-muted-foreground">
            Your payment will be processed securely through Dodo Payments. Credits will be added to your account immediately after successful payment.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DodoPaymentModal;