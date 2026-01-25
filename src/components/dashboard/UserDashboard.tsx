import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  CreditCard, FileText, History, LogOut, Plus, Sprout, TrendingUp, 
  Target, Zap, Gift, Brain, Shield, Palette, Settings, HelpCircle,
  ChevronRight, Star, Sparkles, LayoutDashboard, Users, ExternalLink
} from 'lucide-react';
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
      if (cleanupPaymentMonitoring) {
        cleanupPaymentMonitoring();
      }
    };
  }, [user?.id]);

  useEffect(() => {
    return () => {
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
    if (!userProfile?.credits || userProfile.credits <= 0) {
      toast({
        variant: "destructive",
        title: "No credits available",
        description: "Please purchase credits to start an analysis.",
      });
      setShowPaymentModal(true);
      return;
    }
    navigate('/analyze');
  };

  const handleOpenStudio = () => {
    navigate('/studio');
  };

  const setupPaymentMonitoring = () => {
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

    if (!user?.id) {
      console.log('No user ID available, skipping subscription setup');
      return () => {};
    }

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
          refreshProfile();
        }
      )
      .subscribe();

    return () => subscription.unsubscribe();
  };

  const startPaymentPolling = (paymentId: string, expectedCredits: number) => {
    console.log(`🔄 Starting payment polling for: ${paymentId}`);
    
    const maxFailures = 5;
    const baseDelay = 3000;
    const maxDelay = 30000;
    const maxPollingTime = 5 * 60 * 1000;
    
    let failureCount = 0;
    let currentDelay = baseDelay;
    let pollStartTime = Date.now();
    
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
        if (Date.now() - pollStartTime > maxPollingTime) {
          cleanupPolling();
          toast({
            variant: "destructive",
            title: "⏰ Payment Check Timeout",
            description: "Payment verification timed out. Please check your account or try a new payment.",
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
          
          if (error.message?.includes('404') || error.message?.includes('Not Found')) {
            cleanupPolling();
            toast({
              variant: "destructive",
              title: "❌ Payment Check Failed",
              description: "Unable to verify payment status. Please try making a new payment.",
              duration: 10000,
            });
            return;
          }
          
          handlePollingFailure(new Error(`API Error: ${error.message || 'Unknown error'}`));
          return;
        }

        failureCount = 0;
        currentDelay = baseDelay;
        
        console.log(`📊 Payment status:`, data);

        if (data?.status === 'completed') {
          cleanupPolling();
          await refreshProfile();
          
          toast({
            title: "🎉 Payment Completed!",
            description: `${expectedCredits} credits have been added to your account.`,
            duration: 5000,
          });
        } else if (data?.status === 'failed' || data?.status === 'expired') {
          cleanupPolling();

          toast({
            variant: "destructive",
            title: "❌ Payment Failed",
            description: `Your payment ${data.status}. Please try again.`,
            duration: 5000,
          });
        } else {
          scheduleNextPoll(currentDelay);
        }
      } catch (error) {
        console.error('Payment polling network error:', error);
        
        if (error instanceof Error && 
            (error.message?.includes('404') || 
             error.message?.includes('Not Found') || 
             error.message?.includes('FunctionsHttpError'))) {
          cleanupPolling();
          toast({
            variant: "destructive",
            title: "❌ Payment System Error",
            description: "Payment verification service is temporarily unavailable.",
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
          description: "Unable to check payment status after multiple attempts.",
          duration: 15000,
        });
        return;
      }
      
      currentDelay = Math.min(currentDelay * 2, maxDelay);
      console.log(`⏳ Retrying in ${currentDelay / 1000}s (attempt ${failureCount + 1}/${maxFailures})`);
      
      scheduleNextPoll(currentDelay);
    };

    cleanupPolling();
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
    return 'text-orange-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-100';
    if (score >= 60) return 'bg-emerald-100';
    return 'bg-orange-100';
  };

  // Quick action items for the dashboard
  const quickActions = [
    {
      id: 'fast-mode',
      title: 'Fast Mode',
      description: 'Optimize resume in under 3 minutes',
      icon: Zap,
      onClick: () => navigate('/fast-mode'),
      color: 'amber',
      badge: '< 3 min',
      disabled: !userProfile?.credits || userProfile.credits <= 0,
      featured: true,
    },
    {
      id: 'analyze',
      title: 'AI Resume Analyzer',
      description: 'Get instant feedback on your resume',
      icon: Brain,
      onClick: handleStartNewAnalysis,
      color: 'green',
      badge: userProfile?.credits && userProfile.credits > 0 ? `${userProfile.credits} credits` : null,
      disabled: !userProfile?.credits || userProfile.credits <= 0,
    },
    {
      id: 'studio',
      title: 'Resume Studio',
      description: 'Edit, export & manage versions',
      icon: Palette,
      onClick: handleOpenStudio,
      color: 'emerald',
      badge: 'New',
      disabled: false,
    },
    {
      id: 'tailor',
      title: 'Tailor Resume',
      description: 'Customize for specific jobs',
      icon: Target,
      onClick: () => navigate('/analyze'),
      color: 'teal',
      badge: null,
      disabled: !userProfile?.credits || userProfile.credits <= 0,
    },
    {
      id: 'referrals',
      title: 'Refer Friends',
      description: 'Earn free credits',
      icon: Gift,
      onClick: () => navigate('/referrals'),
      color: 'green',
      badge: '+3 credits',
      disabled: false,
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      {/* Enhanced Header */}
      <nav className="bg-white/90 backdrop-blur-md shadow-lg border-b border-green-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
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
            <div className="flex items-center space-x-3">
              {/* Credits Display */}
              <div className="flex items-center space-x-2 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 px-4 py-2 rounded-full">
                <CreditCard className="h-4 w-4 text-green-600" />
                <span className="text-sm font-semibold text-green-700">
                  {userProfile?.credits || 0} credits
                </span>
              </div>

              {/* Navigation Buttons */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/studio')}
                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 hidden sm:flex"
              >
                <Palette className="h-4 w-4 mr-2" />
                Studio
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/analyze')}
                className="text-green-600 hover:text-green-700 hover:bg-green-50 hidden sm:flex"
              >
                <Brain className="h-4 w-4 mr-2" />
                Analyze
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPaymentModal(true)}
                className="border-green-300 text-green-600 hover:bg-green-50 bg-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Welcome Card */}
            <Card className="p-6 bg-gradient-to-r from-green-500 to-emerald-600 border-0 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative z-10">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge className="bg-white/20 text-white border-0 mb-3">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Welcome back
                    </Badge>
                    <h2 className="text-2xl font-bold mb-2">
                      {userProfile?.full_name || user?.email?.split('@')[0]}! 👋
                    </h2>
                    <p className="text-green-100 mb-4">
                      Ready to grow your resume for your next dream job?
                    </p>
                    
                    {analyses.length > 0 && (
                      <div className="flex items-center space-x-4 mb-4">
                        <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                          <Target className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {analyses.length} analysis{analyses.length !== 1 ? 'es' : ''}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white/20 px-3 py-1 rounded-full">
                          <TrendingUp className="h-4 w-4" />
                          <span className="text-sm font-medium">
                            {averageScore}% avg score
                          </span>
                        </div>
                      </div>
                    )}
                    
                    <div className="flex flex-wrap gap-3">
                      <Button 
                        className="bg-white text-green-600 hover:bg-green-50 font-semibold shadow-lg" 
                        onClick={handleStartNewAnalysis}
                      >
                        <Brain className="h-4 w-4 mr-2" />
                        Start Analysis
                      </Button>
                      <Button 
                        variant="outline"
                        className="border-white/50 text-white hover:bg-white/20 bg-transparent" 
                        onClick={handleOpenStudio}
                      >
                        <Palette className="h-4 w-4 mr-2" />
                        Open Studio
                      </Button>
                    </div>
                  </div>
                  
                  <div className="hidden md:block">
                    <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center">
                      <Zap className="h-10 w-10 text-white" />
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {quickActions.map((action) => {
                const Icon = action.icon;
                const isFeatured = (action as any).featured;
                return (
                  <Card 
                    key={action.id}
                    className={`p-4 cursor-pointer transition-all duration-200 hover:shadow-lg hover:-translate-y-1 ${
                      isFeatured 
                        ? 'border-2 border-amber-400 bg-gradient-to-r from-amber-50 to-orange-50 ring-2 ring-amber-200/50' 
                        : 'border-green-100'
                    } ${action.disabled ? 'opacity-60' : ''}`}
                    onClick={action.disabled ? undefined : action.onClick}
                  >
                    <div className="flex items-start space-x-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isFeatured 
                          ? 'bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-amber-200' 
                          : `bg-gradient-to-br from-${action.color}-100 to-${action.color}-200`
                      }`}>
                        <Icon className={`h-6 w-6 ${isFeatured ? 'text-white' : `text-${action.color}-600`}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2">
                          <h3 className={`font-semibold truncate ${isFeatured ? 'text-amber-900' : 'text-gray-900'}`}>
                            {action.title}
                          </h3>
                          {action.badge && (
                            <Badge 
                              variant="secondary" 
                              className={isFeatured 
                                ? "bg-amber-500 text-white text-xs font-semibold animate-pulse" 
                                : "bg-green-100 text-green-700 text-xs"
                              }
                            >
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                        <p className={`text-sm mt-0.5 ${isFeatured ? 'text-amber-700' : 'text-gray-500'}`}>
                          {action.description}
                        </p>
                      </div>
                      <ChevronRight className={`h-5 w-5 flex-shrink-0 ${isFeatured ? 'text-amber-500' : 'text-gray-400'}`} />
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Recent Analyses */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <History className="h-5 w-5 text-green-600" />
                  <h3 className="text-lg font-semibold">Recent Analyses</h3>
                </div>
                {analyses.length > 0 && (
                  <Button variant="ghost" size="sm" className="text-green-600 hover:bg-green-50">
                    View All
                  </Button>
                )}
              </div>
              
              {analyses.length === 0 ? (
                <div className="text-center py-12 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <FileText className="h-8 w-8 text-green-600" />
                  </div>
                  <h4 className="font-semibold text-gray-900 mb-2">No analyses yet</h4>
                  <p className="text-gray-500 text-sm mb-4 max-w-sm mx-auto">
                    Upload your resume and get AI-powered feedback to improve your chances
                  </p>
                  <Button 
                    onClick={handleStartNewAnalysis}
                    className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white"
                  >
                    <Sparkles className="h-4 w-4 mr-2" />
                    Create Your First Analysis
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  {analyses.map((analysis) => (
                    <div 
                      key={analysis.id} 
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-green-50 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/analysis/${analysis.id}`)}
                    >
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-gray-900 truncate">
                          {analysis.job_title || 'Untitled Analysis'}
                        </h4>
                        {analysis.company_name && (
                          <p className="text-sm text-gray-500 truncate">{analysis.company_name}</p>
                        )}
                        <p className="text-xs text-gray-400 mt-1">
                          {new Date(analysis.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric'
                          })}
                        </p>
                      </div>
                      <div className="flex items-center space-x-3 ml-4">
                        <div className={`px-3 py-1 rounded-full ${getScoreBg(analysis.overall_score)}`}>
                          <span className={`text-lg font-bold ${getScoreColor(analysis.overall_score)}`}>
                            {analysis.overall_score}%
                          </span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-green-600 transition-colors" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Stats Card */}
            <Card className="p-6 bg-white border-green-100">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <LayoutDashboard className="h-5 w-5 mr-2 text-green-600" />
                Your Stats
              </h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <FileText className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-gray-600">Total Analyses</span>
                  </div>
                  <span className="font-bold text-xl text-gray-900">{analyses.length}</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                      <CreditCard className="h-5 w-5 text-emerald-600" />
                    </div>
                    <span className="text-gray-600">Credits</span>
                  </div>
                  <span className="font-bold text-xl text-emerald-600">{userProfile?.credits || 0}</span>
                </div>
                <div className="flex items-center justify-between py-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                    </div>
                    <span className="text-gray-600">Avg Score</span>
                  </div>
                  <span className={`font-bold text-xl ${getScoreColor(averageScore)}`}>
                    {averageScore}%
                  </span>
                </div>
              </div>
              
              {userProfile?.credits === 0 && (
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 mt-4">
                  <p className="text-orange-800 font-medium text-sm">No credits remaining</p>
                  <p className="text-orange-600 text-xs mt-1">Purchase credits to continue</p>
                  <Button 
                    size="sm" 
                    onClick={() => setShowPaymentModal(true)}
                    className="mt-3 w-full bg-orange-500 hover:bg-orange-600 text-white"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Buy Credits
                  </Button>
                </div>
              )}
            </Card>

            {/* Quick Links */}
            <Card className="p-6 bg-white border-green-100">
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <div className="space-y-2">
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-700 hover:text-green-700 hover:bg-green-50" 
                  onClick={() => navigate('/how-it-works')}
                >
                  <HelpCircle className="h-4 w-4 mr-3 text-green-600" />
                  How It Works
                  <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-700 hover:text-green-700 hover:bg-green-50" 
                  onClick={() => navigate('/referrals')}
                >
                  <Users className="h-4 w-4 mr-3 text-green-600" />
                  Referral Program
                  <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 text-xs">
                    +3 credits
                  </Badge>
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-700 hover:text-green-700 hover:bg-green-50" 
                  onClick={() => navigate('/help')}
                >
                  <Shield className="h-4 w-4 mr-3 text-green-600" />
                  Help Center
                  <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                </Button>
                <Button 
                  variant="ghost" 
                  className="w-full justify-start text-gray-700 hover:text-green-700 hover:bg-green-50" 
                  onClick={() => navigate('/contact')}
                >
                  <Settings className="h-4 w-4 mr-3 text-green-600" />
                  Contact Support
                  <ExternalLink className="h-3 w-3 ml-auto text-gray-400" />
                </Button>
              </div>
            </Card>

            {/* Performance Insights */}
            {analyses.length > 0 && (
              <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Star className="h-5 w-5 mr-2 text-green-600" />
                  Performance
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Best Score</span>
                    <span className="font-bold text-green-600">
                      {Math.max(...analyses.map(a => a.overall_score))}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">Improvement</span>
                    <span className={`font-bold ${
                      analyses.length >= 2 && analyses[0].overall_score - analyses[1].overall_score > 0 
                        ? 'text-green-600' 
                        : 'text-gray-600'
                    }`}>
                      {analyses.length >= 2 
                        ? `${analyses[0].overall_score - analyses[1].overall_score > 0 ? '+' : ''}${analyses[0].overall_score - analyses[1].overall_score}%`
                        : 'N/A'
                      }
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 text-sm">This Month</span>
                    <span className="font-bold text-gray-900">
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
