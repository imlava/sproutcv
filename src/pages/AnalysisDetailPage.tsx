import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect } from 'react';
import DetailedAnalysisView from '@/components/analysis/DetailedAnalysisView';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sprout } from 'lucide-react';

const AnalysisDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user || !id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="flex items-center justify-center w-8 h-8 bg-primary/10 rounded-lg">
                  <Sprout className="h-5 w-5 text-primary" />
                </div>
                <h1 className="text-xl font-bold">SproutCV</h1>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DetailedAnalysisView 
          analysisId={id} 
          onBack={() => navigate('/dashboard')}
        />
      </main>
    </div>
  );
};

export default AnalysisDetailPage;