import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  AlertTriangle, 
  Shield, 
  CheckCircle, 
  XCircle, 
  CreditCard, 
  Loader2,
  ArrowLeft,
  Sprout,
  Sparkles,
  Zap,
  Crown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import Footer from '@/components/Footer';
import { toast } from 'sonner';

interface DodoPaymentResponse {
  success: boolean;
  verified: boolean;
  dodo_status: string;
  credits_added?: number;
  amount?: number;
  currency?: string;
  customer?: any;
  security_check: string;
  message?: string;
  error?: string;
}

export default function PaymentsPage() {
  const navigate = useNavigate();
  const { user, loading: authLoading, userProfile } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [verificationResult, setVerificationResult] = useState<DodoPaymentResponse | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Check for payment completion from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');
    const status = urlParams.get('status');

    // Security check for parameter injection
    const allParams = window.location.search;
    const statusCount = (allParams.match(/[?&]status=/g) || []).length;
    
    if (statusCount > 1) {
      setSecurityWarning(
        `Security Alert: Detected duplicate status parameters. Payment verification will use Dodo API only.`
      );
    }

    if (paymentId) {
      verifyPaymentWithDodo(paymentId);
    }
  }, []);

  // Verify payment with Dodo via Supabase Edge Function
  const verifyPaymentWithDodo = async (paymentId: string) => {
    setPaymentStatus('processing');
    
    try {
      const { data, error } = await supabase.functions.invoke('dodo-perfect-integration', {
        body: {
          action: 'verify_payment',
          payment_id: paymentId
        }
      });

      if (error) throw error;

      const result: DodoPaymentResponse = data;
      setVerificationResult(result);

      if (result.success && result.verified) {
        setPaymentStatus('success');
        toast.success('Payment verified!', {
          description: `${result.credits_added} credits have been added to your account.`
        });
        
        // Clean URL
        window.history.replaceState({}, '', '/payments');
      } else {
        setPaymentStatus('error');
        toast.error('Payment verification failed', {
          description: result.message || 'Please contact support if you believe this is an error.'
        });
      }

    } catch (error: any) {
      console.error('Payment verification error:', error);
      setPaymentStatus('error');
      setVerificationResult({
        success: false,
        verified: false,
        dodo_status: 'unknown',
        security_check: 'FAILED - Network error',
        error: error.message
      });
      toast.error('Verification failed', {
        description: 'Could not verify payment. Please try again or contact support.'
      });
    }
  };

  // Create Dodo Payment Link
  const createPaymentLink = async (productType: 'starter' | 'pro' | 'enterprise') => {
    if (!user) {
      toast.error('Please sign in to make a purchase');
      navigate('/auth');
      return;
    }

    setIsCreatingPayment(true);

    const productConfig = {
      starter: { 
        product_id: 'pdt_KaR1iE0tubQNWp', // Your actual Dodo product ID
        amount: 500,
        credits: 5 
      },
      pro: { 
        product_id: 'pdt_vYgslqfE9TbxZc', // Your actual Dodo product ID
        amount: 2000,
        credits: 25 
      },
      enterprise: { 
        product_id: 'pdt_pRK2dq4rKMnnR0', // Your actual Dodo product ID
        amount: 5000,
        credits: 60 
      }
    }[productType];

    try {
      const { data, error } = await supabase.functions.invoke('dodo-perfect-integration', {
        body: {
          action: 'create_payment_link',
          product_id: productConfig.product_id,
          customer: {
            email: user.email,
            name: userProfile?.full_name || user.email?.split('@')[0] || 'User',
          },
          billing: {
            city: 'San Francisco',
            country: 'US',
            state: 'CA',
            street: '123 Main St',
            zipcode: '94105'
          },
          metadata: {
            plan: productType,
            credits: productConfig.credits,
            user_id: user.id,
            source: 'sproutcv_app'
          },
          return_url: `${window.location.origin}/payments?plan=${productType}`
        }
      });

      if (error) throw error;

      if (data.success && data.checkout_url) {
        // Redirect to Dodo Payments checkout
        window.location.href = data.checkout_url;
      } else {
        throw new Error(data.error || 'Failed to create payment link');
      }

    } catch (error: any) {
      console.error('Payment link creation error:', error);
      toast.error('Failed to create payment', {
        description: error.message || 'Please try again later.'
      });
    } finally {
      setIsCreatingPayment(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <AuthenticatedHeader onBuyCredits={() => {}} />
      
      <div className="pt-4">
        {/* Hero Section */}
        <div className="bg-white border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl">
                  <CreditCard className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                Get More Credits
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Unlock unlimited resume analyses and AI-powered optimizations
              </p>
              
              {/* Current Credits Display */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-green-100 rounded-full">
                <Sparkles className="h-5 w-5 text-green-600" />
                <span className="font-semibold text-green-800">
                  Current Balance: {userProfile?.credits || 0} credits
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Security Warning */}
          {securityWarning && (
            <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <AlertTriangle className="h-5 w-5 text-red-400 mt-0.5 mr-3" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Security Alert</h3>
                  <p className="mt-1 text-sm text-red-700">{securityWarning}</p>
                </div>
              </div>
            </div>
          )}

          {/* Payment Verification Result */}
          {verificationResult && (
            <Card className={`mb-8 p-6 ${
              verificationResult.verified 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start">
                {verificationResult.verified ? (
                  <CheckCircle className="h-6 w-6 text-green-500 mr-3 mt-1" />
                ) : (
                  <XCircle className="h-6 w-6 text-red-500 mr-3 mt-1" />
                )}
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${
                    verificationResult.verified ? 'text-green-800' : 'text-red-800'
                  }`}>
                    {verificationResult.verified ? 'Payment Successful! 🎉' : 'Payment Verification Failed'}
                  </h3>
                  
                  <div className={`mt-2 text-sm space-y-1 ${
                    verificationResult.verified ? 'text-green-700' : 'text-red-700'
                  }`}>
                    {verificationResult.verified && (
                      <>
                        <p><strong>Credits Added:</strong> {verificationResult.credits_added}</p>
                        <p><strong>Amount:</strong> ${((verificationResult.amount || 0) / 100).toFixed(2)} {verificationResult.currency}</p>
                      </>
                    )}
                    <p><strong>Status:</strong> {verificationResult.dodo_status}</p>
                    {verificationResult.message && (
                      <p><strong>Message:</strong> {verificationResult.message}</p>
                    )}
                  </div>
                  
                  {verificationResult.verified && (
                    <Button 
                      className="mt-4" 
                      onClick={() => navigate('/analyze')}
                    >
                      Start Analyzing Resumes
                    </Button>
                  )}
                </div>
              </div>
            </Card>
          )}

          {/* Processing State */}
          {paymentStatus === 'processing' && (
            <div className="text-center py-12">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-green-600" />
              <p className="mt-4 text-lg text-gray-600">Verifying your payment...</p>
              <p className="text-sm text-gray-500">This may take a few seconds</p>
            </div>
          )}

          {/* Pricing Cards */}
          {paymentStatus === 'idle' && (
            <div className="grid md:grid-cols-3 gap-8">
              {/* Starter */}
              <Card className="p-8 border-2 border-gray-200 hover:border-green-300 transition-all hover:shadow-lg">
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-blue-100 rounded-xl mb-4">
                    <Zap className="h-8 w-8 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Starter</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">$5</span>
                  </div>
                  <p className="text-green-600 font-semibold mt-2">5 Credits</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {['5 resume analyses', 'AI-powered suggestions', 'ATS compatibility check', 'Keyword optimization', 'Email support'].map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => createPaymentLink('starter')}
                  disabled={isCreatingPayment}
                  className="w-full bg-gray-900 hover:bg-gray-800"
                  size="lg"
                >
                  {isCreatingPayment ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                  )}
                  Get Started
                </Button>
              </Card>

              {/* Pro - Most Popular */}
              <Card className="p-8 border-2 border-green-500 relative shadow-xl scale-105">
                <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-600 text-white px-4 py-1">
                  Most Popular
                </Badge>
                
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-green-100 rounded-xl mb-4">
                    <Sparkles className="h-8 w-8 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Pro</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">$20</span>
                  </div>
                  <p className="text-green-600 font-semibold mt-2">25 Credits</p>
                  <p className="text-xs text-gray-500 mt-1">Save 20%</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {['25 resume analyses', 'Priority AI processing', 'Advanced ATS optimization', 'Cover letter generation', 'Interview prep insights', 'Priority support'].map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => createPaymentLink('pro')}
                  disabled={isCreatingPayment}
                  className="w-full bg-green-600 hover:bg-green-700"
                  size="lg"
                >
                  {isCreatingPayment ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                  )}
                  Get Pro
                </Button>
              </Card>

              {/* Enterprise */}
              <Card className="p-8 border-2 border-gray-200 hover:border-purple-300 transition-all hover:shadow-lg">
                <div className="text-center mb-6">
                  <div className="inline-flex p-3 bg-purple-100 rounded-xl mb-4">
                    <Crown className="h-8 w-8 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Enterprise</h3>
                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">$50</span>
                  </div>
                  <p className="text-green-600 font-semibold mt-2">60 Credits</p>
                  <p className="text-xs text-gray-500 mt-1">Save 40%</p>
                </div>
                
                <ul className="space-y-3 mb-8">
                  {['60 resume analyses', 'Unlimited AI processing', 'Premium ATS optimization', 'Unlimited cover letters', 'Full interview prep suite', '24/7 priority support', 'Custom templates'].map((feature, i) => (
                    <li key={i} className="flex items-center text-gray-600">
                      <CheckCircle className="h-5 w-5 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                
                <Button 
                  onClick={() => createPaymentLink('enterprise')}
                  disabled={isCreatingPayment}
                  className="w-full bg-purple-600 hover:bg-purple-700"
                  size="lg"
                >
                  {isCreatingPayment ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : (
                    <CreditCard className="h-5 w-5 mr-2" />
                  )}
                  Get Enterprise
                </Button>
              </Card>
            </div>
          )}

          {/* Security Notice */}
          <Card className="mt-12 p-6 bg-blue-50 border-blue-200">
            <div className="flex items-start">
              <Shield className="h-6 w-6 text-blue-500 mt-0.5 mr-3" />
              <div>
                <h3 className="font-semibold text-blue-800">Secure Payments</h3>
                <p className="mt-1 text-sm text-blue-700">
                  All payments are processed securely through Dodo Payments. 
                  Your payment information is encrypted and never stored on our servers.
                </p>
              </div>
            </div>
          </Card>

          {/* FAQ */}
          <div className="mt-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Frequently Asked Questions</h2>
            <div className="grid md:grid-cols-2 gap-6 text-left max-w-4xl mx-auto">
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Do credits expire?</h3>
                <p className="text-gray-600 text-sm">No! Your credits never expire and can be used anytime.</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Can I get a refund?</h3>
                <p className="text-gray-600 text-sm">Yes, we offer a 30-day money-back guarantee if you're not satisfied.</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">How many analyses per credit?</h3>
                <p className="text-gray-600 text-sm">1 credit = 1 complete resume analysis with AI suggestions.</p>
              </Card>
              <Card className="p-6">
                <h3 className="font-semibold text-gray-900 mb-2">Need more credits?</h3>
                <p className="text-gray-600 text-sm">Contact us for custom enterprise plans with volume discounts.</p>
              </Card>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
