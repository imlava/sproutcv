
import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Loader2, Mail, User, Lock, CheckCircle, XCircle } from 'lucide-react';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';
import HCaptcha from '@hcaptcha/react-hcaptcha';

interface SignUpFormProps {
  onSwitchToSignIn: () => void;
}

export const SignUpForm: React.FC<SignUpFormProps> = ({ onSwitchToSignIn }) => {
  const { signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<HCaptcha>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });

  // Public overrides via query params: ?sitekey=...&hl=...
  const query = new URLSearchParams(window.location.search);
  const hcaptchaSitekey = query.get('sitekey') || '849a7ce6-a714-49c2-8cb8-b12002a4b76a';
  const hcaptchaLang = query.get('hl') || undefined;

  const getPasswordStrength = (password: string) => {
    const checks = [
      { valid: password.length >= 8 },
      { valid: /[A-Z]/.test(password) },
      { valid: /[a-z]/.test(password) },
      { valid: /\d/.test(password) },
      { valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
    return checks.every(check => check.valid);
  };

  const isPasswordValid = getPasswordStrength(formData.password);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isPasswordValid) {
      toast({
        variant: "destructive",
        title: "Invalid password",
        description: "Please meet all password requirements",
      });
      return;
    }

    if (!passwordsMatch) {
      toast({
        variant: "destructive",
        title: "Passwords don't match",
        description: "Please make sure both passwords are identical",
      });
      return;
    }

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
      console.log('Starting signup process for:', formData.email);
      
      const { error } = await signUp(formData.email, formData.password, formData.fullName, captchaToken);
      
      if (error) {
        console.error('Signup error:', error);
        throw error;
      }

      console.log('Signup successful, showing success message');
      
      toast({
        title: "Account created successfully!",
        description: "Please check your email to verify your account and get started with 5 free credits.",
      });
      
      // Don't navigate immediately - let user verify email first
      // navigate('/dashboard');
    } catch (error: any) {
      console.error('Signup exception:', error);
      
      // Reset captcha on error
      if (captchaRef.current) {
        captchaRef.current.resetCaptcha();
        setCaptchaToken(null);
      }
      
      let errorMessage = error.message || 'Sign up failed. Please try again.';
      
      // Handle specific error cases
      if (error.message?.includes('already registered')) {
        errorMessage = 'An account with this email already exists. Please sign in instead.';
      } else if (error.message?.includes('password')) {
        errorMessage = 'Please ensure your password meets all requirements.';
      } else if (error.message?.includes('email')) {
        errorMessage = 'Please enter a valid email address.';
      } else if (error.message?.includes('captcha')) {
        errorMessage = 'Captcha verification failed. Please try again.';
      }
      
      toast({
        variant: "destructive",
        title: "Sign up failed",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-gray-700 font-medium">Full Name</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            id="fullName"
            type="text"
            value={formData.fullName}
            onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
            placeholder="Enter your full name"
            className="pl-10"
            required
          />
        </div>
      </div>
      
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
      
      <div className="space-y-3">
        <Label htmlFor="password" className="text-gray-700 font-medium">Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <div className="pl-10">
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={(password) => setFormData({ ...formData, password })}
              placeholder="Create a strong password"
              required
            />
          </div>
        </div>
        <PasswordStrengthIndicator password={formData.password} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
          <div className="pl-10">
            <PasswordInput
              id="confirmPassword"
              value={formData.confirmPassword}
              onChange={(confirmPassword) => setFormData({ ...formData, confirmPassword })}
              placeholder="Confirm your password"
              required
            />
          </div>
        </div>
        
        {formData.confirmPassword && (
          <div className="flex items-center space-x-2 text-sm">
            {passwordsMatch ? (
              <>
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span className="text-green-700">Passwords match</span>
              </>
            ) : (
              <>
                <XCircle className="h-3 w-3 text-red-500" />
                <span className="text-red-700">Passwords don't match</span>
              </>
            )}
          </div>
        )}
      </div>
      
      <div className="space-y-4">
        <HCaptcha
          ref={captchaRef}
          sitekey={hcaptchaSitekey}
          languageOverride={hcaptchaLang}
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
      
      <Button 
        type="submit" 
        className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
        disabled={loading || !isPasswordValid || !passwordsMatch || !captchaToken}
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Creating account...
          </>
        ) : (
          'Create account'
        )}
      </Button>
      
      <div className="text-center pt-4">
        <p className="text-gray-600">
          Already have an account?{' '}
          <Button
            type="button"
            variant="link"
            onClick={onSwitchToSignIn}
            className="text-green-600 hover:text-green-700 font-medium p-0 h-auto"
          >
            Sign in
          </Button>
        </p>
      </div>
    </form>
  );
};
