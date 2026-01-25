import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, FileText, History, LogOut, Plus, Sprout, TrendingUp, Target, Zap, Gift, Brain, Home, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import DodoPaymentModal from './DodoPaymentModal';
import Footer from '@/components/Footer';

interface Analysis {
  id: string;
  job_title?: string;
  company_name?: string;
  overall_score: number;
  created_at: string;
}

const UserDashboard = () => {
  const { user, userProfile, signOut, refreshProfile } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [pendingPayment, setPendingPayment] = useState<string | null>(null);
  
  // Use refs to avoid stale closure issues with timers
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    fetchAnalyses();
    const cleanupPaymentMonitoring = setupPaymentMonitoring();
    
    return () => {
      // Cleanup subscription when component unmounts or effect re-runs
      if (cleanupPaymentMonitoring) {
        cleanupPaymentMonitoring();
      }
    };
  }, [user?.id]);

  useEffect(() => {
    return () => {
      // Cleanup polling timers on unmount
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
      }
    };
  }, []);

  const fetchAnalyses = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('id, job_title, company_name, overall_score, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching analyses:', error);
        
        // Retry logic for temporary failures
        if (retryCount < 2) {
          setRetryCount(prev => prev + 1);
          setTimeout(() => fetchAnalyses(), 1000 * (retryCount + 1));
          return;
        }
        
        toast({
          variant: "destructive",
          title: "Error loading analyses",
          description: "Unable to load your analysis history. Please refresh the page.",
        });
      } else {
        setAnalyses(data || []);
        setRetryCount(0);
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      toast({
        variant: "destructive",
        title: "Unexpected error",
        description: "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast({
        title: "Signed out",
        description: "You have been signed out successfully",
      });
    } catch (error) {
      console.error('Sign out error:', error);
      toast({
        variant: "destructive",
        title: "Sign out failed",
        description: "Please try again",
      });
    }
  };

  const handleStartNewAnalysis = () => {
    navigate('/analyze');
  };

  const handleAIResumeAnalyzer = () => {
    navigate('/analyze'); // Consolidated to single route
  };

  const setupPaymentMonitoring = () => {
    // Check for pending payments in sessionStorage (secure approach)
    const storedRef = sessionStorage.getItem('_pref');
    if (storedRef) {
      try {
        const paymentData = JSON.parse(atob(storedRef));
        setPendingPayment(paymentData.id);
        startPaymentPolling(paymentData.id, paymentData.cr);
      } catch (error) {
        console.error('Error parsing stored payment reference:', error);
        sessionStorage.removeItem('_pref');
      }
    }

    // Early return if no user ID available
    if (!user?.id) {
      console.log('No user ID available, skipping subscription setup');
      return () => {}; // Return empty cleanup function
    }

    // Set up real-time subscription for profile changes
    const subscription = supabase
      .channel('profile-changes')
      .on('postgres_changes', 
        { 
          event: 'UPDATE', 
          schema: 'public', 
          table: 'profiles',
          filter: `id=eq.${user.id}`
        }, 
        (payload) => {
          console.log('🔄 Profile updated:', payload.new);
          // Refresh profile data
          refreshProfile();
        }
      )
      .subscribe();

    // Return cleanup function to unsubscribe
    return () => subscription.unsubscribe();
  };

  const startPaymentPolling = (paymentId: string, expectedCredits: number) => {
    console.log(`🔄 Starting payment polling for: ${paymentId}`);
    
    // Polling configuration
    const maxFailures = 5;
    const baseDelay = 3000; // 3 seconds
    const maxDelay = 30000; // 30 seconds max
    const maxPollingTime = 5 * 60 * 1000; // 5 minutes
    
    let failureCount = 0;
    let currentDelay = baseDelay;
    let pollStartTime = Date.now();
    
    // Helper function to clean up all timers and reset state
    const cleanupPolling = () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
      if (pollingTimeoutRef.current) {
        clearTimeout(pollingTimeoutRef.current);
        pollingTimeoutRef.current = null;
      }
      setPendingPayment(null);
      sessionStorage.removeItem('_pref');
    };
    
    const scheduleNextPoll = (delay: number) => {
      pollingTimeoutRef.current = setTimeout(() => {
        // Check if we've exceeded max polling time
        if (Date.now() - pollStartTime > maxPollingTime) {
          cleanupPolling();
          toast({
            variant: "destructive",
            title: "⏰ Payment Check Timeout",
            description: "Payment verification timed out. Please check your account or try a new payment.",
            action: (
              <Button
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                New Payment
              </Button>
            ),
            duration: 12000,
          });
          return;
        }
        
        pollPayment();
      }, delay);
    };
    
    const pollPayment = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('enhanced-payment-status', {
          body: { paymentId }
        });

        if (error) {
          console.error('❌ Payment status check error:', error);
          
          // Handle specific error types
          if (error.message?.includes('404') || error.message?.includes('Not Found')) {
            // 404 means function doesn't exist or payment not found
            cleanupPolling();
            toast({
              variant: "destructive",
              title: "❌ Payment Check Failed",
              description: "Unable to verify payment status. Please try making a new payment.",
              action: (
                <Button
                  size="sm"
                  onClick={() => setShowPaymentModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Retry Payment
                </Button>
              ),
              duration: 10000,
            });
            return;
          }
          
          // Treat other API errors as temporary failures for backoff logic
          handlePollingFailure(new Error(`API Error: ${error.message || 'Unknown error'}`));
          return;
        }

        // Success! Reset failure tracking
        failureCount = 0;
        currentDelay = baseDelay;
        
        console.log(`📊 Payment status:`, data);

        if (data?.status === 'completed') {
          // Payment completed successfully
          cleanupPolling();

          // Refresh profile to get updated credits
          await refreshProfile();
          
          toast({
            title: "🎉 Payment Completed!",
            description: `${expectedCredits} credits have been added to your account.`,
            duration: 5000,
          });
        } else if (data?.status === 'failed' || data?.status === 'expired') {
          // Payment failed or expired
          cleanupPolling();

          toast({
            variant: "destructive",
            title: "❌ Payment Failed",
            description: `Your payment ${data.status}. Please try again.`,
            action: (
              <Button
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Try Again
              </Button>
            ),
            duration: 5000,
          });
        } else {
          // Payment still pending, schedule next poll with normal delay
          scheduleNextPoll(currentDelay);
        }
      } catch (error) {
        console.error('Payment polling network error:', error);
        
        // Check if it's a 404 or function not found error
        if (error instanceof Error && 
            (error.message?.includes('404') || 
             error.message?.includes('Not Found') || 
             error.message?.includes('FunctionsHttpError'))) {
          cleanupPolling();
          toast({
            variant: "destructive",
            title: "❌ Payment System Error",
            description: "Payment verification service is temporarily unavailable.",
            action: (
              <Button
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Retry Payment
              </Button>
            ),
            duration: 10000,
          });
          return;
        }
        
        handlePollingFailure(error as Error);
      }
    };
    
    const handlePollingFailure = (error: Error) => {
      failureCount++;
      console.error(`❌ Polling failure ${failureCount}/${maxFailures}:`, error.message);
      
      if (failureCount >= maxFailures) {
        cleanupPolling();
        toast({
          variant: "destructive",
          title: "🚫 Payment Check Failed",
          description: "Unable to check payment status after multiple attempts. Please try making a new payment.",
          action: (
            <Button
              size="sm"
              onClick={() => setShowPaymentModal(true)}
              className="bg-blue-600 hover:bg-blue-700"
            >
              New Payment
            </Button>
          ),
          duration: 15000,
        });
        return;
      }
      
      // Implement exponential backoff: double the delay up to maxDelay
      currentDelay = Math.min(currentDelay * 2, maxDelay);
      console.log(`⏳ Retrying in ${currentDelay / 1000}s (attempt ${failureCount + 1}/${maxFailures})`);
      
      scheduleNextPoll(currentDelay);
    };

    // Clean up any existing timers before starting new ones
    cleanupPolling();

    // Start with initial poll
    pollPayment();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <nav className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-green-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center space-x-2">
                <Skeleton className="w-10 h-10 rounded-xl" />
                <Skeleton className="w-24 h-6" />
              </div>
              <div className="flex items-center space-x-4">
                <Skeleton className="w-20 h-8" />
                <Skeleton className="w-24 h-8" />
                <Skeleton className="w-20 h-8" />
              </div>
            </div>
          </div>
        </nav>
        
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="p-6">
                <Skeleton className="w-64 h-8 mb-2" />
                <Skeleton className="w-48 h-5 mb-4" />
                <Skeleton className="w-40 h-10" />
              </Card>
              <Card className="p-6">
                <Skeleton className="w-40 h-6 mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                      <div className="space-y-2">
                        <Skeleton className="w-48 h-5" />
                        <Skeleton className="w-32 h-4" />
                        <Skeleton className="w-24 h-3" />
                      </div>
                      <Skeleton className="w-12 h-6 rounded-full" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
            <div className="space-y-6">
              <Card className="p-6">
                <Skeleton className="w-24 h-6 mb-4" />
                <div className="space-y-4">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex justify-between">
                      <Skeleton className="w-20 h-4" />
                      <Skeleton className="w-8 h-4" />
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </main>
      </div>
    );
  }

  const averageScore = analyses.length > 0 
    ? Math.round(analyses.reduce((sum, a) => sum + a.overall_score, 0) / analyses.length)
    : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-emerald-600';
    return 'text-red-600';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Enhanced Header */}
      <nav className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-green-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
              <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                <Sprout className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  SproutCV
                </h1>
                <p className="text-xs text-green-600/70">Dashboard</p>
              </div>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center space-x-4">
              {/* Credits Display */}
              <div className="flex items-center space-x-2 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  {userProfile?.credits || 0} credits
                </span>
              </div>

              {/* Navigation Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/analyze')}
                className="text-green-600 hover:text-green-700 hover:bg-green-50"
              >
                <Shield className="h-4 w-4 mr-2" />
                Analyzer
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="border-green-200 text-green-600 hover:bg-green-50"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Welcome Card */}
            <div className="lg:col-span-2">
              <Card className="p-6 mb-6 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h2 className="text-2xl font-bold mb-2 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                      Welcome back, {userProfile?.full_name || user?.email?.split('@')[0]}!
                    </h2>
                    <p className="text-green-700/80 mb-4">
                      Ready to grow your resume for your next dream job?
                    </p>
                    <div className="flex items-center space-x-4 mb-4">
                      {analyses.length > 0 && (
                        <>
                          <div className="flex items-center space-x-2">
                            <Target className="h-4 w-4 text-green-600" />
                            <span className="text-sm text-green-700">
                              {analyses.length} analysis{analyses.length !== 1 ? 'es' : ''} completed
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <TrendingUp className={`h-4 w-4 ${getScoreColor(averageScore)}`} />
                            <span className="text-sm text-green-700">
                              {averageScore}% average score
                            </span>
                          </div>
                        </>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <Button 
                        className="flex-1 sm:flex-initial bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white" 
                        onClick={handleStartNewAnalysis}
                        disabled={!userProfile?.credits || userProfile.credits <= 0}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        {userProfile?.credits && userProfile.credits > 0 
                          ? 'Start New Analysis' 
                          : 'Buy Credits to Start'
                        }
                      </Button>
                      <Button 
                        variant="outline"
                        className="flex-1 sm:flex-initial border-green-200 text-green-600 hover:bg-green-50" 
                        onClick={handleAIResumeAnalyzer}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        AI Resume Analyzer
                      </Button>
                    </div>
                  </div>
                  <div className="hidden sm:block">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                      <Zap className="h-8 w-8 text-green-600" />
                    </div>
                  </div>
                </div>
              </Card>

              {/* Recent Analyses */}
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">Recent Analyses</h3>
                  <History className="h-5 w-5 text-muted-foreground" />
                </div>
                
                {analyses.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                      <FileText className="h-8 w-8 text-muted-foreground" />
                    </div>
                    <h4 className="font-medium mb-2">No analyses yet</h4>
                    <p className="text-muted-foreground text-sm mb-4">
                      Start your first resume analysis to see results here
                    </p>
                    <Button 
                      variant="outline" 
                      onClick={handleStartNewAnalysis}
                      disabled={!userProfile?.credits || userProfile.credits <= 0}
                      className="border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <FileText className="h-4 w-4 mr-2" />
                      Create Your First Analysis
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {analyses.map((analysis) => (
                      <div 
                        key={analysis.id} 
                        className="flex items-center justify-between p-4 bg-muted/50 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                        onClick={() => navigate(`/analysis/${analysis.id}`)}
                      >
                        <div className="flex-1">
                          <h4 className="font-medium">
                            {analysis.job_title || 'Untitled Analysis'}
                          </h4>
                          {analysis.company_name && (
                            <p className="text-sm text-muted-foreground">{analysis.company_name}</p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {new Date(analysis.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })} • Available for 30 days
                          </p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className={`text-lg font-bold ${getScoreColor(analysis.overall_score)}`}>
                              {analysis.overall_score}%
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {analysis.overall_score >= 80 ? 'Excellent' : 
                               analysis.overall_score >= 60 ? 'Good' : 'Needs Work'}
                            </p>
                          </div>
                          <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50">
                            View Details
                          </Button>
                        </div>
                      </div>
                    ))}
                    {analyses.length >= 10 && (
                      <div className="text-center pt-2">
                        <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50">
                          View All Analyses
                        </Button>
                      </div>
                    )}
                  </div>
                )}
              </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <FileText className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-muted-foreground">Total Analyses</span>
                  </div>
                  <span className="font-semibold text-lg">{analyses.length}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                      <CreditCard className="h-4 w-4 text-emerald-600" />
                    </div>
                    <span className="text-muted-foreground">Available Credits</span>
                  </div>
                  <span className="font-semibold text-lg text-emerald-600">{userProfile?.credits || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                      <TrendingUp className="h-4 w-4 text-green-600" />
                    </div>
                    <span className="text-muted-foreground">Average Score</span>
                  </div>
                  <span className={`font-semibold text-lg ${getScoreColor(averageScore)}`}>
                    {averageScore}%
                  </span>
                </div>
                {userProfile?.credits === 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 mt-4">
                    <p className="text-orange-800 text-sm font-medium">No credits remaining</p>
                    <p className="text-orange-600 text-xs">Purchase credits to continue analyzing</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button 
                  variant="outline" 
                  className="w-full justify-start border-green-200 text-green-600 hover:bg-green-50" 
                  onClick={handleStartNewAnalysis}
                  disabled={!userProfile?.credits || userProfile.credits <= 0}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  New Analysis
                  {userProfile?.credits && userProfile.credits > 0 && (
                    <Badge variant="secondary" className="ml-auto text-xs bg-green-100 text-green-700">
                      {userProfile.credits} left
                    </Badge>
                  )}
                </Button>
                <Button variant="outline" className="w-full justify-start border-green-200 text-green-600 hover:bg-green-50" onClick={() => setShowPaymentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Purchase Credits
                </Button>
                <Button variant="outline" className="w-full justify-start border-green-200 text-green-600 hover:bg-green-50" onClick={() => navigate('/referrals')}>
                  <Gift className="h-4 w-4 mr-2" />
                  Refer Friends
                </Button>
              </div>
            </Card>

            {/* Performance Insights */}
            {analyses.length > 0 && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Performance Insights</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Best Score</span>
                    <span className="font-medium text-green-600">
                      {Math.max(...analyses.map(a => a.overall_score))}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Recent Improvement</span>
                    <span className="font-medium">
                      {analyses.length >= 2 
                        ? `${analyses[0].overall_score - analyses[1].overall_score > 0 ? '+' : ''}${analyses[0].overall_score - analyses[1].overall_score}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">This Month</span>
                    <span className="font-medium">
                      {analyses.filter(a => 
                        new Date(a.created_at).getMonth() === new Date().getMonth()
                      ).length} analyses
                    </span>
                  </div>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />

      <DodoPaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        onSuccess={refreshProfile}
      />
    </div>
  );
};

export default UserDashboard;
