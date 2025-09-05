import React, { useState, useEffect } from 'react';
import { AlertTriangle, Shield, CheckCircle, XCircle, CreditCard, Loader } from 'lucide-react';

interface PaymentPageProps {
  // Props if needed
}

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
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [verificationResult, setVerificationResult] = useState<DodoPaymentResponse | null>(null);
  const [securityWarning, setSecurityWarning] = useState<string | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);

  useEffect(() => {
    // 🔒 STEP 1: Check for payment completion from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const paymentId = urlParams.get('payment_id');
    const status = urlParams.get('status');

    // 🚨 SECURITY CHECK: Detect parameter injection attacks
    const allParams = window.location.search;
    const statusCount = (allParams.match(/[?&]status=/g) || []).length;
    
    if (statusCount > 1) {
      setSecurityWarning(
        `🚨 SECURITY ALERT: Detected duplicate status parameters (${statusCount} found). ` +
        `This may be a parameter injection attack. Payment verification will use Dodo API only.`
      );
    }

    if (paymentId) {
      verifyPaymentWithDodo(paymentId);
    }
  }, []);

  // 🛡️ VERIFY PAYMENT WITH 100% DODO API TRUST
  const verifyPaymentWithDodo = async (paymentId: string) => {
    setPaymentStatus('processing');
    
    try {
      console.log(`🔍 Verifying payment ${paymentId} with Dodo API...`);

      const response = await fetch('/api/functions/dodo-perfect-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'verify_payment',
          payment_id: paymentId
        })
      });

      const result: DodoPaymentResponse = await response.json();
      
      console.log('🎯 Dodo verification result:', result);
      setVerificationResult(result);

      if (result.success && result.verified) {
        setPaymentStatus('success');
        
        // 🎉 Show success message with Dodo-verified data
        showSuccessMessage(result);
      } else {
        setPaymentStatus('error');
        
        // 🚨 Show security message for failed verification
        showSecurityMessage(result);
      }

    } catch (error) {
      console.error('❌ Payment verification error:', error);
      setPaymentStatus('error');
      setVerificationResult({
        success: false,
        verified: false,
        dodo_status: 'unknown',
        security_check: 'FAILED - Network error',
        error: error.message
      });
    }
  };

  // 💳 CREATE DODO PAYMENT LINK
  const createPaymentLink = async (productType: 'starter' | 'pro' | 'enterprise') => {
    setIsCreatingPayment(true);

    try {
      const productConfig = {
        starter: { 
          product_id: 'pdt_starter_123', // Replace with your actual Dodo product ID
          amount: 500, // $5
          credits: 5 
        },
        pro: { 
          product_id: 'pdt_pro_456', // Replace with your actual Dodo product ID
          amount: 2000, // $20
          credits: 25 
        },
        enterprise: { 
          product_id: 'pdt_enterprise_789', // Replace with your actual Dodo product ID
          amount: 5000, // $50
          credits: 60 
        }
      }[productType];

      console.log(`💳 Creating ${productType} payment link...`);

      const response = await fetch('/api/functions/dodo-perfect-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'create_payment_link',
          product_id: productConfig.product_id,
          customer: {
            email: 'user@example.com', // Get from user context
            name: 'User Name', // Get from user context
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
            source: 'sproutcv_app'
          },
          return_url: `${window.location.origin}/payments?plan=${productType}`
        })
      });

      const result = await response.json();

      if (result.success) {
        console.log('🎯 Payment link created:', result.checkout_url);
        
        // Redirect to Dodo Payments checkout
        window.location.href = result.checkout_url;
      } else {
        throw new Error(result.error || 'Failed to create payment link');
      }

    } catch (error) {
      console.error('❌ Payment link creation error:', error);
      alert(`Failed to create payment link: ${error.message}`);
    } finally {
      setIsCreatingPayment(false);
    }
  };

  // 🎉 SHOW SUCCESS MESSAGE
  const showSuccessMessage = (result: DodoPaymentResponse) => {
    const message = `
      🎉 Payment Successful!
      
      ✅ Verified by Dodo Payments API
      💰 Amount: ${(result.amount / 100).toFixed(2)} ${result.currency}
      🪙 Credits Added: ${result.credits_added}
      🔒 Security: ${result.security_check}
    `;
    
    console.log(message);
  };

  // 🚨 SHOW SECURITY MESSAGE
  const showSecurityMessage = (result: DodoPaymentResponse) => {
    const message = `
      🚨 Payment Security Alert
      
      ❌ Payment NOT confirmed by Dodo Payments
      📊 Dodo Status: ${result.dodo_status}
      🛡️ Security Check: ${result.security_check}
      📝 Message: ${result.message}
    `;
    
    console.log(message);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">SproutCV Payments</h1>
          <p className="mt-2 text-gray-600">Secure payments powered by Dodo Payments</p>
        </div>

        {/* 🚨 SECURITY WARNING */}
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

        {/* 💳 PAYMENT VERIFICATION RESULT */}
        {verificationResult && (
          <div className={`mb-8 rounded-lg p-6 border ${
            verificationResult.verified 
              ? 'bg-green-50 border-green-200' 
              : 'bg-red-50 border-red-200'
          }`}>
            <div className="flex items-start">
              {verificationResult.verified ? (
                <CheckCircle className="h-6 w-6 text-green-400 mr-3 mt-1" />
              ) : (
                <XCircle className="h-6 w-6 text-red-400 mr-3 mt-1" />
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-medium ${
                  verificationResult.verified ? 'text-green-800' : 'text-red-800'
                }`}>
                  {verificationResult.verified ? 'Payment Verified ✅' : 'Payment Verification Failed ❌'}
                </h3>
                
                <div className={`mt-2 text-sm ${
                  verificationResult.verified ? 'text-green-700' : 'text-red-700'
                }`}>
                  <p><strong>Dodo Status:</strong> {verificationResult.dodo_status}</p>
                  <p><strong>Security Check:</strong> {verificationResult.security_check}</p>
                  
                  {verificationResult.verified && (
                    <>
                      <p><strong>Credits Added:</strong> {verificationResult.credits_added}</p>
                      <p><strong>Amount:</strong> ${(verificationResult.amount / 100).toFixed(2)} {verificationResult.currency}</p>
                    </>
                  )}
                  
                  {verificationResult.message && (
                    <p><strong>Message:</strong> {verificationResult.message}</p>
                  )}
                  
                  {verificationResult.error && (
                    <p><strong>Error:</strong> {verificationResult.error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 🔄 PROCESSING STATE */}
        {paymentStatus === 'processing' && (
          <div className="text-center py-8">
            <Loader className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <p className="mt-2 text-gray-600">Verifying payment with Dodo Payments API...</p>
          </div>
        )}

        {/* 💳 PRICING CARDS */}
        {paymentStatus === 'idle' && (
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <PricingCard
              title="Starter"
              price="$5"
              credits="5 Credits"
              features={['Basic CV analysis', 'Email support', '5 CV reviews']}
              onPurchase={() => createPaymentLink('starter')}
              isLoading={isCreatingPayment}
            />
            
            <PricingCard
              title="Pro"
              price="$20"
              credits="25 Credits"
              features={['Advanced CV analysis', 'Priority support', '25 CV reviews', 'AI suggestions']}
              onPurchase={() => createPaymentLink('pro')}
              isLoading={isCreatingPayment}
              popular={true}
            />
            
            <PricingCard
              title="Enterprise"
              price="$50"
              credits="60 Credits"
              features={['Premium CV analysis', '24/7 support', '60 CV reviews', 'Advanced AI', 'Custom templates']}
              onPurchase={() => createPaymentLink('enterprise')}
              isLoading={isCreatingPayment}
            />
          </div>
        )}

        {/* 🛡️ SECURITY NOTICE */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start">
            <Shield className="h-5 w-5 text-blue-400 mt-0.5 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-blue-800">Security Notice</h3>
              <p className="mt-1 text-sm text-blue-700">
                All payments are verified directly with Dodo Payments API. 
                We never trust frontend data or URL parameters for payment confirmation.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// 💳 PRICING CARD COMPONENT
interface PricingCardProps {
  title: string;
  price: string;
  credits: string;
  features: string[];
  onPurchase: () => void;
  isLoading: boolean;
  popular?: boolean;
}

function PricingCard({ title, price, credits, features, onPurchase, isLoading, popular }: PricingCardProps) {
  return (
    <div className={`relative rounded-lg border ${
      popular ? 'border-blue-500 ring-2 ring-blue-500' : 'border-gray-200'
    } bg-white p-6 shadow-sm`}>
      {popular && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
          <span className="bg-blue-500 text-white px-3 py-1 text-xs font-semibold rounded-full">
            Most Popular
          </span>
        </div>
      )}
      
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
        <p className="mt-1 text-3xl font-bold text-gray-900">{price}</p>
        <p className="mt-1 text-sm text-gray-600">{credits}</p>
      </div>
      
      <ul className="mt-6 space-y-3">
        {features.map((feature, index) => (
          <li key={index} className="flex items-center text-sm text-gray-600">
            <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
            {feature}
          </li>
        ))}
      </ul>
      
      <button
        onClick={onPurchase}
        disabled={isLoading}
        className={`mt-8 w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md text-sm font-medium text-white ${
          popular 
            ? 'bg-blue-600 hover:bg-blue-700' 
            : 'bg-gray-800 hover:bg-gray-900'
        } disabled:opacity-50 disabled:cursor-not-allowed transition-colors`}
      >
        {isLoading ? (
          <>
            <Loader className="h-4 w-4 animate-spin mr-2" />
            Creating Payment...
          </>
        ) : (
          <>
            <CreditCard className="h-4 w-4 mr-2" />
            Purchase {title}
          </>
        )}
      </button>
    </div>
  );
}
