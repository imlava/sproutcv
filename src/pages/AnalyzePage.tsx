
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import UnifiedResumeAnalyzer from '@/components/analysis/UnifiedResumeAnalyzer';

const AnalyzePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <div className="bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              AI-Powered Resume Analysis
            </h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Get comprehensive insights powered by Google Gemini AI. Every analysis is designed to maximize your job application success rate.
            </p>
          </div>
        </div>
      </div>
      <UnifiedResumeAnalyzer />
    </div>
  );
};

export default AnalyzePage;
