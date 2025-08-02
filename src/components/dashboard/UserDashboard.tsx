
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { CreditCard, FileText, History, LogOut, Plus, Sprout } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useNavigate } from 'react-router-dom';
import PaymentModal from './PaymentModal';

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

  useEffect(() => {
    fetchAnalyses();
  }, []);

  const fetchAnalyses = async () => {
    if (!user) return;

    const { data, error } = await supabase
      .from('resume_analyses')
      .select('id, job_title, company_name, overall_score, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to fetch analysis history",
      });
    } else {
      setAnalyses(data || []);
    }
    setLoading(false);
  };

  const handleSignOut = async () => {
    await signOut();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully",
    });
  };

  const handleStartNewAnalysis = () => {
    navigate('/analyze');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                <Sprout className="h-5 w-5 text-green-600" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">SproutCV</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <CreditCard className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">
                  {userProfile?.credits || 0} credits
                </span>
              </div>
              <Button variant="outline" size="sm" onClick={() => setShowPaymentModal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Buy Credits
              </Button>
              <Button variant="outline" size="sm" onClick={handleSignOut}>
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
            <Card className="p-6 mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">
                Welcome back, {userProfile?.full_name || user?.email}!
              </h2>
              <p className="text-gray-600 mb-4">
                Ready to grow your resume for your next dream job?
              </p>
              <Button className="w-full sm:w-auto" onClick={handleStartNewAnalysis}>
                <FileText className="h-4 w-4 mr-2" />
                Start New Analysis
              </Button>
            </Card>

            {/* Recent Analyses */}
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Recent Analyses</h3>
                <History className="h-5 w-5 text-gray-400" />
              </div>
              
              {analyses.length === 0 ? (
                <div className="text-center py-8">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No analyses yet. Create your first one!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {analyses.map((analysis) => (
                    <div key={analysis.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div>
                        <h4 className="font-medium text-gray-900">
                          {analysis.job_title || 'Untitled Analysis'}
                        </h4>
                        {analysis.company_name && (
                          <p className="text-sm text-gray-600">{analysis.company_name}</p>
                        )}
                        <p className="text-xs text-gray-500">
                          {new Date(analysis.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge variant={analysis.overall_score >= 80 ? "default" : analysis.overall_score >= 60 ? "secondary" : "destructive"}>
                        {analysis.overall_score}%
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Stats Sidebar */}
          <div className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Your Stats</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Analyses</span>
                  <span className="font-semibold">{analyses.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Available Credits</span>
                  <span className="font-semibold text-blue-600">{userProfile?.credits || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Average Score</span>
                  <span className="font-semibold">
                    {analyses.length > 0 
                      ? Math.round(analyses.reduce((sum, a) => sum + a.overall_score, 0) / analyses.length)
                      : 0}%
                  </span>
                </div>
              </div>
            </Card>

            <Card className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start" onClick={handleStartNewAnalysis}>
                  <FileText className="h-4 w-4 mr-2" />
                  New Analysis
                </Button>
                <Button variant="outline" className="w-full justify-start" onClick={() => setShowPaymentModal(true)}>
                  <CreditCard className="h-4 w-4 mr-2" />
                  Purchase Credits
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </main>

      <PaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        onSuccess={refreshProfile}
      />
    </div>
  );
};

export default UserDashboard;
