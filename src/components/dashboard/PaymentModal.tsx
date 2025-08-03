import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Check, Loader2, Zap } from 'lucide-react';
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

  const plans = [
    {
      name: 'Starter',
      credits: 5,
      price: 5,
      originalPrice: 6.25,
      popular: false,
      description: 'Perfect for getting started'
    },
    {
      name: 'Pro Pack',
      credits: 15,
      price: 15,
      originalPrice: 18.75,
      popular: true,
      description: 'Most popular choice'
    }
  ];

  const handlePurchase = async (credits: number, amount: number) => {
    setLoading(true);

    try {
      // Payment gateway integration coming soon
      toast({
        title: "Payment Integration Coming Soon",
        description: "Dodo Payments integration is being finalized. Please contact support for manual credit top-up.",
      });
      onClose();
    } catch (error: any) {
      console.error('Payment error:', error);
      toast({
        variant: "destructive",
        title: "Payment failed",
        description: error.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Choose Your Credit Pack
          </DialogTitle>
          <p className="text-center text-gray-600 mt-2">
            Get more credits to analyze and optimize your resumes
          </p>
        </DialogHeader>

        {/* Coupon System */}
        <div className="max-w-md mx-auto mb-6">
          <CouponSystem onCouponApplied={setDiscountPercent} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6 max-w-3xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative p-6 ${plan.popular ? 'ring-2 ring-primary' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <div className="text-3xl font-bold text-gray-900">
                    ${discountPercent > 0 ? (plan.price * (1 - discountPercent / 100)).toFixed(2) : plan.price}
                  </div>
                  {(plan.originalPrice || discountPercent > 0) && (
                    <div className="text-lg text-gray-500 line-through">
                      ${plan.originalPrice || plan.price}
                    </div>
                  )}
                  {(plan.originalPrice || discountPercent > 0) && (
                    <div className="text-sm text-green-600 font-semibold">
                      Save ${discountPercent > 0 
                        ? (plan.price * (discountPercent / 100)).toFixed(2)
                        : (plan.originalPrice - plan.price).toFixed(2)
                      }
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
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">AI Resume Analysis</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">ATS Optimization</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Detailed Feedback</span>
                </div>
                <div className="flex items-center">
                  <Check className="h-4 w-4 text-green-500 mr-2" />
                  <span className="text-sm">Export Options</span>
                </div>
              </div>

              <Button 
                className={`w-full mt-6 ${plan.popular ? 'bg-primary hover:bg-primary/90' : ''}`}
                onClick={() => handlePurchase(plan.credits, plan.price)}
                disabled={loading}
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Purchase {plan.credits} Credits
              </Button>
            </Card>
          ))}
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>💳 Secure payment processing (Payment gateway integration coming soon)</p>
          <p>✨ Credits never expire • 🔒 Enterprise-grade security</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;