
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Lock, CheckCircle, XCircle } from 'lucide-react';
import { AuthFormLayout } from './AuthFormLayout';
import { PasswordInput } from './PasswordInput';
import { PasswordStrengthIndicator } from './PasswordStrengthIndicator';

const ResetPasswordForm = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      console.log("No token found, redirecting to auth");
      navigate('/auth');
    } else {
      console.log("Token found:", token.substring(0, 10) + "...");
    }
  }, [token, navigate]);

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

  const isPasswordValid = getPasswordStrength(newPassword);
  const passwordsMatch = newPassword === confirmPassword && newPassword.length > 0;

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

    setLoading(true);

    try {
      console.log("Submitting password reset request");
      
      const { data, error } = await supabase.functions.invoke('reset-password', {
        body: { 
          token: token,
          newPassword: newPassword
        }
      });

      console.log("Password reset response:", { data, error });

      if (error) {
        console.error("Password reset error:", error);
        throw error;
      }

      toast({
        title: "Password reset successful",
        description: "Your password has been updated. You can now sign in.",
      });

      console.log("Password reset successful, redirecting to auth");
      navigate('/auth');
    } catch (error: any) {
      console.error("Password reset failed:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to reset password. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return null;
  }

  return (
    <AuthFormLayout 
      title="Set new password" 
      description="Enter your new password below"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="space-y-3">
          <Label htmlFor="password" className="text-gray-700 font-medium">New Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <div className="pl-10">
              <PasswordInput
                id="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password"
                required
              />
            </div>
          </div>
          <PasswordStrengthIndicator password={newPassword} />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword" className="text-gray-700 font-medium">Confirm Password</Label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
            <div className="pl-10">
              <PasswordInput
                id="confirmPassword"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
                required
              />
            </div>
          </div>
          
          {confirmPassword && (
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
        
        <Button 
          type="submit" 
          className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white font-medium py-3 rounded-lg shadow-lg transition-all duration-200 transform hover:scale-[1.02]" 
          disabled={loading || !isPasswordValid || !passwordsMatch}
        >
          {loading ? "Updating..." : "Update password"}
        </Button>
      </form>
    </AuthFormLayout>
  );
};

export default ResetPasswordForm;
