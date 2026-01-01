
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, Lock } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { EmailVerificationResend } from './EmailVerificationResend';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface SignInFormProps {
  onForgotPassword: () => void;
  onSwitchToSignUp: () => void;
}

export const SignInForm: React.FC<SignInFormProps> = ({ onForgotPassword, onSwitchToSignUp }) => {
  const { signIn } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [showEmailVerification, setShowEmailVerification] = useState(false);
  const captchaRef = useRef<HCaptcha>(null);
  
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });

  // SECURITY: Hardcoded production sitekey - never allow URL override
  const HCAPTCHA_SITEKEY = '849a7ce6-a714-49c2-8cb8-b12002a4b76a';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!captchaToken) {
      toast({
        variant: "destructive",
        title: "Captcha verification required",
        description: "Please complete the captcha verification to continue.",
      });
      return;
    }
    
    setLoading(true);

    try {
      console.log('Starting signin process for:', formData.email);
      
      const { error } = await signIn(formData.email, formData.password, captchaToken);
      
      if (error) {
        console.error('Signin error:', error);
        throw error;
      }

      console.log('Signin successful');
      
      toast({
        title: "Welcome back!",
        description: "You've been signed in successfully.",
      });
      
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Signin exception:', error);
      
      // Reset captcha on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken(null);
      }
      
      let errorMessage = error.message || "Invalid email or password";
      
      // Handle specific error cases with better messaging
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials.';
      } else if (error.message?.includes('Email not confirmed') || error.message?.includes('email_not_confirmed')) {
        errorMessage = 'Please verify your email address first. Check your inbox for the verification link.';
        setShowEmailVerification(true);
      } else if (error.message?.includes('email link has expired')) {
        errorMessage = 'Your verification link has expired. Please request a new password reset.';
      } else if (error.message?.includes('Too many requests')) {
        errorMessage = 'Too many login attempts. Please try again later.';
      } else if (error.message?.includes('User not found')) {
        errorMessage = 'No account found with this email address.';
      } else if (error.message?.includes('captcha')) {
        errorMessage = 'Captcha verification failed. Please try again.';
      }
      
      toast({
        variant: "destructive",
        title: "Sign in failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="Enter your email"
            className="pl-10"
            required
          />
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <div className="pl-10">
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={(password) => setFormData({ ...formData, password })}
              placeholder="Enter your password"
              required
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <HCaptcha
          ref={captchaRef}
          sitekey={HCAPTCHA_SITEKEY}
          onVerify={(token) => {
            setCaptchaToken(token);
          }}
          onExpire={() => {
            setCaptchaToken(null);
          }}
          onError={() => {
            setCaptchaToken(null);
          }}
        />
      </div>
      
      {showEmailVerification && (
        <div className="space-y-3 pt-2">
          <div className="text-center text-sm text-gray-600">
            Need to verify your email?
          </div>
          <EmailVerificationResend 
            email={formData.email}
            showAsLink={false}
          />
        </div>
      )}
      
      <div className="text-right">
        <Button
          type="button"
          variant="link"
          onClick={onForgotPassword}
          className="text-sm text-green-600 hover:text-green-700 p-0 h-auto"
        >
          Forgot your password?
        </Button>
      </div>
      
      <Button
        type="submit" 
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
        disabled={loading}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Signing in...
          </>
        ) : (
          'Sign in'
        )}
      </Button>
      
      <div className="text-center pt-4">
        <p className="text-gray-600">
          Don't have an account?{' '}
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToSignUp}
            className="text-green-600 hover:text-green-700 font-medium p-0 h-auto"
          >
            Create account
          </Button>
        </p>
      </div>
    </form>
  );
};
