import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Mail, RefreshCw } from 'lucide-react';

interface EmailVerificationResendProps {
  email?: string;
  showAsLink?: boolean;
  className?: string;
}

export const EmailVerificationResend: React.FC<EmailVerificationResendProps> = ({ 
  email, 
  showAsLink = false,
  className = ""
}) => {
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const { toast } = useToast();

  const handleResendVerification = async () => {
    if (!email) {
      toast({
        variant: "destructive",
        title: "Email required",
        description: "Please enter your email address first.",
      });
      return;
    }

    if (cooldown > 0) {
      toast({
        variant: "destructive",
        title: "Please wait",
        description: `You can request another verification email in ${cooldown} seconds.`,
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('resend-verification-email', {
        body: { email }
      });

      if (error) {
        throw error;
      }

      if (data.alreadyVerified) {
        toast({
          title: "Email already verified",
          description: "Your email address is already verified. You can sign in now.",
        });
      } else {
        toast({
          title: "Verification email sent!",
          description: "Please check your inbox and spam folder for the verification link.",
        });

        // Start cooldown timer (60 seconds)
        setCooldown(60);
        const timer = setInterval(() => {
          setCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(timer);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      }
    } catch (error: any) {
      console.error('Resend verification error:', error);
      
      let errorMessage = 'Failed to resend verification email. Please try again.';
      
      if (error.message?.includes('No account found')) {
        errorMessage = 'No account found with this email address.';
      } else if (error.message?.includes('Too many')) {
        errorMessage = 'Too many verification emails sent. Please wait before requesting another.';
      } else if (error.message?.includes('Invalid email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      toast({
        variant: "destructive",
        title: "Failed to resend",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  if (showAsLink) {
    return (
      <Button
        type="button"
        variant="link"
        onClick={handleResendVerification}
        disabled={loading || cooldown > 0}
        className={`text-sm text-green-600 hover:text-green-700 p-0 h-auto ${className}`}
      >
        {loading ? (
          <>
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
            Sending...
          </>
        ) : cooldown > 0 ? (
          <>
            <RefreshCw className="mr-1 h-3 w-3" />
            Resend in {cooldown}s
          </>
        ) : (
          <>
            <Mail className="mr-1 h-3 w-3" />
            Resend verification email
          </>
        )}
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handleResendVerification}
      disabled={loading || cooldown > 0}
      className={`w-full ${className}`}
    >
      {loading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Sending verification email...
        </>
      ) : cooldown > 0 ? (
        <>
          <RefreshCw className="mr-2 h-4 w-4" />
          Resend in {cooldown} seconds
        </>
      ) : (
        <>
          <Mail className="mr-2 h-4 w-4" />
          Resend verification email
        </>
      )}
    </Button>
  );
};