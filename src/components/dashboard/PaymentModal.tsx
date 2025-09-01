import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Check, Loader2, Zap, AlertCircle } from 'lucide-react';
import CouponSystem from '../CouponSystem';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);

  const plans = [
    {
      id: 1,
      name: 'Starter',
      credits: 5,
      price: 5,
      originalPrice: 6.25,
      popular: false,
      description: 'Perfect for getting started',
      features: ['AI Resume Analysis', 'ATS Optimization', 'Detailed Feedback', 'Export Options']
    },
    {
      id: 2,
      name: 'Pro Pack',
      credits: 15,
      price: 15,
      originalPrice: 18.75,
      popular: true,
      description: 'Most popular choice',
      features: ['AI Resume Analysis', 'ATS Optimization', 'Detailed Feedback', 'Export Options', 'Priority Support']
    }
  ];

  const handlePurchase = async (credits: number, amount: number) => {
    setLoading(true);

    try {
      console.log('Initiating payment for:', { credits, amount, discountPercent });

      // Apply discount if any
      const finalAmount = discountPercent > 0 
        ? Math.round(amount * (1 - discountPercent / 100) * 100) // Convert to cents
        : amount * 100; // Convert to cents

      console.log('Final amount (cents):', finalAmount);

      // Create payment with Dodo Payments (FINAL FIXED VERSION)
      console.log('Creating payment...');
      const { data, error } = await supabase.functions.invoke('create-payment-dynamic', {
        body: { 
          credits,
          amount: finalAmount,
          planType: 'standard'
        }
      });

      console.log('Payment response:', { data, error });

      if (error) {
        console.error('Payment creation error:', error);
        throw new Error(error.message || 'Failed to create payment');
      }

      console.log('Payment created:', data);

      if (data?.url) {
        // Store payment info for tracking
        localStorage.setItem('pending_payment', JSON.stringify({
          paymentId: data.paymentId,
          credits,
          amount: finalAmount,
          timestamp: Date.now(),
          discountPercent
        }));
        
        // Open Dodo Payments checkout in a new tab
        const paymentWindow = window.open(data.url, '_blank');
        
        if (!paymentWindow) {
          throw new Error('Please allow popups to complete your payment');
        }
        
        toast({
          title: "Payment Initiated",
          description: "Complete your payment in the new tab to add credits to your account.",
          duration: 5000,
        });
        
        // Close modal
        onClose();
        
        // Set up polling to check payment status
        const checkPaymentStatus = async () => {
          try {
            const { data: user } = await supabase.auth.getUser();
            if (user.user) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('credits')
                .eq('id', user.user.id)
                .single();
              
              if (profile) {
                const pendingPayment = localStorage.getItem('pending_payment');
                if (pendingPayment) {
                  const paymentData = JSON.parse(pendingPayment);
                  // If credits increased, payment was successful
                  if (profile.credits >= paymentData.credits) {
                    localStorage.removeItem('pending_payment');
                    toast({
                      title: "Payment Successful!",
                      description: `${credits} credits have been added to your account.`,
                    });
                    onSuccess();
                  }
                }
              }
            }
          } catch (error) {
            console.error('Payment status check error:', error);
          }
        };

        // Check payment status every 5 seconds for 2 minutes
        const interval = setInterval(checkPaymentStatus, 5000);
        setTimeout(() => clearInterval(interval), 120000);
        
      } else {
        throw new Error("No payment URL received");
      }
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment Failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const getDiscountedPrice = (price: number) => {
    return discountPercent > 0 ? (price * (1 - discountPercent / 100)).toFixed(2) : price;
  };

  const getSavings = (price: number, originalPrice: number) => {
    if (discountPercent > 0) {
      return (price * (discountPercent / 100)).toFixed(2);
    }
    return (originalPrice - price).toFixed(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Choose Your Credit Pack
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600 mt-2">
            Get more credits to analyze and optimize your resumes
          </DialogDescription>
        </DialogHeader>

        {/* Coupon System */}
        <div className="max-w-md mx-auto mb-6">
          <CouponSystem onCouponApplied={setDiscountPercent} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`relative p-6 cursor-pointer transition-all duration-200 ${
                plan.popular ? 'ring-2 ring-primary shadow-lg' : 'hover:shadow-md'
              } ${selectedPlan === plan.id ? 'ring-2 ring-blue-500' : ''}`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-900">
                    ${getDiscountedPrice(plan.price)}
                  </div>
                  {(plan.originalPrice || discountPercent > 0) && (
                    <div className="text-lg text-gray-500 line-through">
                      ${plan.originalPrice || plan.price}
                    </div>
                  )}
                  {(plan.originalPrice || discountPercent > 0) && (
                    <div className="text-sm text-green-600 font-semibold">
                      Save ${getSavings(plan.price, plan.originalPrice || plan.price)}
                    </div>
                  )}
                </div>
                <div className="flex items-center justify-center mt-2">
                  <Zap className="h-4 w-4 text-primary mr-1" />
                  <span className="text-lg font-semibold text-primary">{plan.credits} Credits</span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
              </div>

              <div className="mt-6 space-y-3">
                {plan.features.map((feature, index) => (
                  <div key={index} className="flex items-center">
                    <Check className="h-4 w-4 text-green-500 mr-2" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <Button 
                className={`w-full mt-6 ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  handlePurchase(plan.credits, plan.price);
                }}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Purchase {plan.credits} Credits
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center space-y-4">
          <div className="flex items-center justify-center space-x-4 text-sm text-gray-600">
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-1" />
              <span>Secure payment processing</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-1" />
              <span>Credits never expire</span>
            </div>
            <div className="flex items-center">
              <Check className="h-4 w-4 text-green-500 mr-1" />
              <span>Enterprise-grade security</span>
            </div>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-600 mr-2 mt-0.5" />
              <div className="text-left">
                <p className="text-sm font-medium text-blue-900">Payment Processing</p>
                <p className="text-xs text-blue-700 mt-1">
                  Your payment will be processed securely by Dodo Payments. You'll be redirected to complete your payment in a new tab.
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;