import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  CreditCard,
  Shield,
  Zap,
  DollarSign,
  Calendar,
  Hash,
  Mail,
  FileText,
  RefreshCw,
  AlertTriangle,
  Download,
  ExternalLink,
  History
} from 'lucide-react';

interface PaymentStatus {
  status: 'success' | 'failed' | 'pending' | 'cancelled' | 'processing' | 'disputed' | 'refunded' | 'expired' | 'timeout' | 'fallback';
  paymentId?: string;
  amount?: number;
  credits?: number;
  message?: string;
  timestamp?: string;
  error?: string;
  reason?: string;
}

interface PaymentRecord {
  id: string;
  payment_provider_id: string;
  amount: number;
  credits: number;
  status: string;
  created_at: string;
  metadata: any;
  payment_provider: string;
  user_id: string;
}

interface CreditTransaction {
  id: string;
  user_id: string;
  credits_before: number;
  credits_after: number;
  credits_changed: number;
  transaction_type: string;
  description: string;
  created_at: string;
  related_payment_id?: string;
}

const EnhancedPaymentsPage = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [processing, setProcessing] = useState(false);
  const [paymentHistory, setPaymentHistory] = useState<PaymentRecord[]>([]);
  const [creditHistory, setCreditHistory] = useState<CreditTransaction[]>([]);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Get payment parameters from URL
  const paymentId = searchParams.get('payment_id');
  const status = searchParams.get('status');
  const amount = searchParams.get('amount');
  const credits = searchParams.get('credits');
  const error = searchParams.get('error');
  const reason = searchParams.get('reason');

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (paymentId && status) {
      handlePaymentStatus(paymentId, status, amount, credits, error, reason);
    }

    if (user) {
      loadPaymentHistory();
      loadCreditHistory();
      loadCurrentCredits();
    }
  }, [loading, user, paymentId, status, amount, credits, error, reason, navigate]);

  const handlePaymentStatus = async (
    paymentId: string, 
    status: string, 
    amount?: string | null, 
    credits?: string | null,
    error?: string | null,
    reason?: string | null
  ) => {
    const paymentStatus: PaymentStatus = {
      status: status as PaymentStatus['status'],
      paymentId,
      amount: amount ? parseInt(amount) : undefined,
      credits: credits ? parseInt(credits) : undefined,
      timestamp: new Date().toISOString(),
      error: error || undefined,
      reason: reason || undefined
    };

    setPaymentStatus(paymentStatus);

    // Show appropriate notification
    switch (status) {
      case 'success':
        showSuccessNotification(paymentStatus);
        break;
      case 'failed':
        showFailureNotification(paymentStatus);
        break;
      case 'disputed':
        showDisputeNotification(paymentStatus);
        break;
      case 'timeout':
        showTimeoutNotification(paymentStatus);
        break;
      case 'fallback':
        showFallbackNotification(paymentStatus);
        break;
      case 'pending':
        startPaymentMonitoring(paymentId);
        break;
    }

    // If success, verify and add credits
    if (status === 'success') {
      await verifyAndProcessPayment(paymentId);
    }
  };

  const showSuccessNotification = (status: PaymentStatus) => {
    toast({
      title: "🎉 Payment Successful!",
      description: `${status.credits} credits have been added to your account. Thank you for your purchase!`,
      duration: 10000,
    });
  };

  const showFailureNotification = (status: PaymentStatus) => {
    const errorMessage = status.error || status.reason || "Your payment could not be processed.";
    toast({
      variant: "destructive",
      title: "❌ Payment Failed",
      description: `${errorMessage} Please try again or contact support.`,
      duration: 15000,
    });
  };

  const showDisputeNotification = (status: PaymentStatus) => {
    toast({
      variant: "destructive",
      title: "⚠️ Payment Disputed",
      description: "Your payment is under review. We'll contact you via email with updates.",
      duration: 20000,
    });
  };

  const showTimeoutNotification = (status: PaymentStatus) => {
    toast({
      variant: "destructive",
      title: "⏰ Payment Timeout",
      description: "Payment monitoring timed out. We'll email you once the payment is confirmed.",
      duration: 15000,
    });
  };

  const showFallbackNotification = (status: PaymentStatus) => {
    toast({
      title: "⚠️ Payment Processing",
      description: "Your payment is being processed. You'll receive an email confirmation shortly.",
      duration: 10000,
    });
  };

  const startPaymentMonitoring = async (paymentId: string) => {
    setProcessing(true);
    let attempts = 0;
    const maxAttempts = 30; // 5 minutes with 10-second intervals

    const monitor = setInterval(async () => {
      attempts++;
      
      try {
        const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-payment-status`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ paymentId })
        });

        const data = await response.json();
        
        if (data.status && data.status !== 'pending') {
          clearInterval(monitor);
          setProcessing(false);
          
          // Update URL with new status
          const newUrl = new URL(window.location.href);
          newUrl.searchParams.set('status', data.status);
          window.history.replaceState({}, '', newUrl.toString());
          
          handlePaymentStatus(paymentId, data.status, amount, credits);
          return;
        }
        
        if (attempts >= maxAttempts) {
          clearInterval(monitor);
          setProcessing(false);
          handlePaymentStatus(paymentId, 'timeout', amount, credits);
        }
      } catch (error) {
        console.error('Payment monitoring error:', error);
      }
    }, 10000);
  };

  const verifyAndProcessPayment = async (paymentId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/verify-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId })
      });

      const data = await response.json();
      
      if (data.success) {
        // Refresh credit balance and history
        await loadCurrentCredits();
        await loadCreditHistory();
        await loadPaymentHistory();
        
        // Send confirmation email
        await sendConfirmationEmail(paymentId);
      }
    } catch (error) {
      console.error('Payment verification error:', error);
    }
  };

  const sendConfirmationEmail = async (paymentId: string) => {
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-payment-confirmation`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId, userId: user?.id })
      });
    } catch (error) {
      console.error('Email confirmation error:', error);
    }
  };

  const loadPaymentHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setPaymentHistory(data || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
    }
  };

  const loadCreditHistory = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('credits_ledger')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setCreditHistory(data || []);
    } catch (error) {
      console.error('Error loading credit history:', error);
    } finally {
      setLoadingHistory(false);
    }
  };

  const loadCurrentCredits = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('credits')
        .eq('id', user.id)
        .single();

      if (error) throw error;
      setCurrentCredits(data?.credits || 0);
    } catch (error) {
      console.error('Error loading credits:', error);
    }
  };

  const retryPayment = () => {
    navigate('/dashboard');
  };

  const downloadReceipt = async (paymentId: string) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-receipt`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ paymentId })
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${paymentId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Could not download receipt. Please try again.",
      });
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'disputed':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'pending':
      case 'processing':
        return <Clock className="w-5 h-5 text-blue-500" />;
      case 'refunded':
        return <RefreshCw className="w-5 h-5 text-purple-500" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'success': 'default',
      'completed': 'default',
      'failed': 'destructive',
      'disputed': 'secondary',
      'pending': 'outline',
      'processing': 'outline',
      'refunded': 'secondary',
    };
    
    return (
      <Badge variant={variants[status] || 'outline'} className="capitalize">
        {status}
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Page Header */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Center</h1>
            <p className="text-gray-600">Manage your payments and credit balance</p>
          </div>

          {/* Current Status Card */}
          {paymentStatus && (
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getStatusIcon(paymentStatus.status)}
                  Payment Status
                  {processing && <Loader2 className="w-4 h-4 animate-spin" />}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">Status:</span>
                    {getStatusBadge(paymentStatus.status)}
                  </div>
                  
                  {paymentStatus.paymentId && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Payment ID:</span>
                      <code className="bg-gray-100 px-2 py-1 rounded text-sm">{paymentStatus.paymentId}</code>
                    </div>
                  )}
                  
                  {paymentStatus.amount && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Amount:</span>
                      <span className="font-mono">${(paymentStatus.amount / 100).toFixed(2)}</span>
                    </div>
                  )}
                  
                  {paymentStatus.credits && (
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">Credits:</span>
                      <span className="font-mono">{paymentStatus.credits}</span>
                    </div>
                  )}
                  
                  {(paymentStatus.error || paymentStatus.reason) && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-red-700">
                        <AlertCircle className="w-4 h-4" />
                        <span className="font-semibold">Error Details:</span>
                      </div>
                      <p className="text-red-600 mt-1 text-sm">
                        {paymentStatus.error || paymentStatus.reason}
                      </p>
                    </div>
                  )}
                  
                  <div className="flex gap-2 pt-4">
                    {paymentStatus.status === 'failed' && (
                      <Button onClick={retryPayment} className="flex items-center gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Try Again
                      </Button>
                    )}
                    
                    {paymentStatus.status === 'success' && paymentStatus.paymentId && (
                      <Button 
                        onClick={() => downloadReceipt(paymentStatus.paymentId!)}
                        variant="outline"
                        className="flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download Receipt
                      </Button>
                    )}
                    
                    <Button 
                      onClick={() => navigate('/dashboard')}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <ArrowRight className="w-4 h-4" />
                      Back to Dashboard
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Credits Balance */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Current Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-4xl font-bold text-blue-600 mb-2">{currentCredits}</div>
                <div className="text-gray-600">Credits Available</div>
              </div>
            </CardContent>
          </Card>

          {/* Payment History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" />
                Payment History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : paymentHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No payment history found
                </div>
              ) : (
                <div className="space-y-4">
                  {paymentHistory.map((payment) => (
                    <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        {getStatusIcon(payment.status)}
                        <div>
                          <div className="font-semibold">${(payment.amount / 100).toFixed(2)}</div>
                          <div className="text-sm text-gray-600">{payment.credits} credits</div>
                          <div className="text-xs text-gray-500">
                            {new Date(payment.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {getStatusBadge(payment.status)}
                        {payment.status === 'completed' && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => downloadReceipt(payment.payment_provider_id)}
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Credit History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Credit Transaction History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {creditHistory.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No credit transactions found
                </div>
              ) : (
                <div className="space-y-3">
                  {creditHistory.map((transaction) => (
                    <div key={transaction.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-gray-600">
                          {new Date(transaction.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`font-semibold ${
                          transaction.credits_changed > 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {transaction.credits_changed > 0 ? '+' : ''}{transaction.credits_changed}
                        </div>
                        <div className="text-sm text-gray-500">
                          Balance: {transaction.credits_after}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Need More Credits */}
          <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="text-center">
                <h3 className="text-xl font-bold mb-2">Need More Credits?</h3>
                <p className="mb-4 opacity-90">Purchase credits to continue analyzing your resumes</p>
                <Button 
                  onClick={() => navigate('/dashboard')}
                  variant="secondary"
                  className="bg-white text-blue-600 hover:bg-gray-100"
                >
                  Buy Credits
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default EnhancedPaymentsPage;
