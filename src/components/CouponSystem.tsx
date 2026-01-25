import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Check, X, Percent } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface CouponSystemProps {
  onCouponApplied: (discount: number) => void;
  className?: string;
}

const CouponSystem: React.FC<CouponSystemProps> = ({ onCouponApplied, className = '' }) => {
  const { toast } = useToast();
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [isValidating, setIsValidating] = useState(false);

  const validCoupons = {
    'LAUNCH20': {
      discount: 20,
      description: '20% Launch Discount',
      maxUses: 1,
      validUntil: '2026-12-31'
    },
    'SPROUT10': {
      discount: 10,
      description: '10% Off Your First Purchase',
      maxUses: 1,
      validUntil: '2026-12-31'
    },
    'PREMIUM30': {
      discount: 30,
      description: '30% Off Premium Plans',
      maxUses: 1,
      validUntil: '2026-06-30'
    }
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;

    setIsValidating(true);
    
    // Simulate API validation delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    const coupon = validCoupons[couponCode.toUpperCase() as keyof typeof validCoupons];
    
    if (coupon) {
      if (appliedCoupon) {
        toast({
          variant: "destructive",
          title: "Coupon already applied",
          description: "You can only use one coupon per purchase.",
        });
      } else {
        setAppliedCoupon(couponCode.toUpperCase());
        onCouponApplied(coupon.discount);
        toast({
          title: "Coupon applied!",
          description: `${coupon.description} has been applied to your order.`,
        });
      }
    } else {
      toast({
        variant: "destructive",
        title: "Invalid coupon",
        description: "The coupon code you entered is not valid or has expired.",
      });
    }
    
    setIsValidating(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    onCouponApplied(0);
    toast({
      title: "Coupon removed",
      description: "The discount has been removed from your order.",
    });
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {!appliedCoupon ? (
        <div className="flex gap-2">
          <Input
            placeholder="Enter coupon code"
            value={couponCode}
            onChange={(e) => setCouponCode(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && validateCoupon()}
            className="flex-1"
          />
          <Button 
            onClick={validateCoupon}
            disabled={!couponCode.trim() || isValidating}
            variant="outline"
          >
            {isValidating ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
            ) : (
              <>
                <Percent className="h-4 w-4 mr-2" />
                Apply
              </>
            )}
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center gap-2">
            <Check className="h-4 w-4 text-green-600" />
            <span className="font-medium text-green-800">{appliedCoupon}</span>
            <Badge variant="secondary" className="bg-green-100 text-green-800">
              {validCoupons[appliedCoupon as keyof typeof validCoupons]?.discount}% OFF
            </Badge>
          </div>
          <Button 
            onClick={removeCoupon}
            variant="ghost" 
            size="sm"
            className="text-green-600 hover:text-green-700"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
      
      {/* Coupon suggestion */}
      {!appliedCoupon && !couponCode && (
        <div className="text-center p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            💡 Try code <button 
              onClick={() => setCouponCode('LAUNCH20')}
              className="font-semibold underline hover:no-underline"
            >
              LAUNCH20
            </button> for 20% off!
          </p>
        </div>
      )}
    </div>
  );
};

export default CouponSystem;