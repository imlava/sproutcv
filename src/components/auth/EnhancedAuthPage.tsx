
import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, CheckCircle, XCircle, Sprout } from 'lucide-react';
import ForgotPasswordForm from './ForgotPasswordForm';

const EnhancedAuthPage = () => {
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
    confirmPassword: ''
  });

  const getPasswordStrength = (password: string) => {
    const checks = [
      { label: 'At least 8 characters', valid: password.length >= 8 },
      { label: 'Contains uppercase letter', valid: /[A-Z]/.test(password) },
      { label: 'Contains lowercase letter', valid: /[a-z]/.test(password) },
      { label: 'Contains number', valid: /\d/.test(password) },
      { label: 'Contains special character', valid: /[!@#$%^&*(),.?":{}|<>]/.test(password) },
    ];
    return checks;
  };

  const passwordChecks = getPasswordStrength(formData.password);
  const isPasswordValid = passwordChecks.every(check => check.valid);
  const passwordsMatch = formData.password === formData.confirmPassword && formData.password.length > 0;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
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

        const { error } = await signUp(formData.email, formData.password, formData.fullName);
        if (error) throw error;

        toast({
          title: "Account created successfully!",
          description: "Welcome to SproutCV! You've received 5 free credits to get started.",
        });
      } else {
        const { error } = await signIn(formData.email, formData.password);
        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You've been signed in successfully.",
        });
      }
      
      navigate('/dashboard');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: isSignUp ? "Sign up failed" : "Sign in failed",
        description: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  if (showForgotPassword) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <ForgotPasswordForm onBack={() => setShowForgotPassword(false)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-lg">
              <Sprout className="h-6 w-6 text-green-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">SproutCV</h1>
          </div>
          <CardTitle>{isSignUp ? 'Create your account' : 'Welcome back'}</CardTitle>
          <CardDescription>
            {isSignUp ? 'Start optimizing your resume with AI' : 'Sign in to your account'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  type="text"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  placeholder="Enter your full name"
                  required
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="Enter your email"
                required
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={formData.password}
                  onChange={handleInputChange}
                  placeholder="Enter your password"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              
              {isSignUp && formData.password && (
                <div className="space-y-1 text-sm">
                  {passwordChecks.map((check, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      {check.valid ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span className={check.valid ? 'text-green-700' : 'text-red-700'}>
                        {check.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  placeholder="Confirm your password"
                  required
                />
                
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
            )}
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading || (isSignUp && (!isPasswordValid || !passwordsMatch))}
            >
              {loading ? (isSignUp ? "Creating account..." : "Signing in...") : (isSignUp ? "Create account" : "Sign in")}
            </Button>
          </form>
          
          {!isSignUp && (
            <div className="mt-4 text-center">
              <Button
                type="button"
                variant="link"
                onClick={() => setShowForgotPassword(true)}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Forgot your password?
              </Button>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isSignUp ? "Already have an account?" : "Don't have an account?"}
            </p>
            <Button
              type="button"
              variant="link"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setFormData({ email: '', password: '', fullName: '', confirmPassword: '' });
              }}
              className="text-blue-600 hover:text-blue-800"
            >
              {isSignUp ? "Sign in" : "Create account"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default EnhancedAuthPage;
