
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

  // Basic SEO for the analysis page
  useEffect(() => {
    document.title = 'AI Resume Analyzer | Tailor & Optimize';
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', 'AI Resume Analyzer: real-time analysis, tailored resume, cover letter, and actionable improvements.');
    document.head.appendChild(metaDesc);

    const linkCanonical = document.querySelector('link[rel="canonical"]') || document.createElement('link');
    linkCanonical.setAttribute('rel', 'canonical');
    linkCanonical.setAttribute('href', window.location.origin + '/analyze');
    document.head.appendChild(linkCanonical);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-label="Loading" />
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-accent/5">
      <header className="container mx-auto px-4 py-8">
        <h1 className="text-2xl font-semibold tracking-tight">AI Resume Analyzer</h1>
        <p className="text-muted-foreground mt-1">Analyze and tailor your resume for a specific role.</p>
      </header>
      <main className="container mx-auto px-4 pb-12">
        <UnifiedResumeAnalyzer />
      </main>
    </div>
  );
};

export default AnalyzePage;
