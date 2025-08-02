
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Check, Loader2, Zap } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const plans = [
    {
      name: 'Starter Pack',
      credits: 5,
      price: 4.99,
      popular: false,
      description: 'Perfect for a few job applications'
    },
    {
      name: 'Professional Pack',
      credits: 15,
      price: 12.99,
      popular: true,
      description: 'Great for active job seekers'
    },
    {
      name: 'Power Pack',
      credits: 30,
      price: 24.99,
      popular: false,
      description: 'For comprehensive job search'
    }
  ];

  const handlePurchase = async (credits: number, amount: number) => {
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-payment', {
        body: {
          credits,
          amount: Math.round(amount * 100) // Convert to cents
        }
      });

      if (error) throw error;

      if (data?.url) {
        // Open Stripe checkout in a new tab
        window.open(data.url, '_blank');
        onClose();
        toast({
          title: "Redirecting to payment...",
          description: "Complete your purchase in the new tab",
        });
      }
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {plans.map((plan) => (
            <Card key={plan.name} className={`relative p-6 ${plan.popular ? 'ring-2 ring-blue-500' : ''}`}>
              {plan.popular && (
                <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-blue-500">
                  Most Popular
                </Badge>
              )}
              
              <div className="text-center">
                <h3 className="text-lg font-semibold text-gray-900">{plan.name}</h3>
                <div className="mt-4">
                  <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                </div>
                <div className="flex items-center justify-center mt-2">
                  <Zap className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-lg font-semibold text-blue-600">{plan.credits} Credits</span>
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
                className={`w-full mt-6 ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
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
          <p>💳 Secure payment powered by Stripe</p>
          <p>✨ Credits never expire</p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;
