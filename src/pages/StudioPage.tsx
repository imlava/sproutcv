/**
 * Resume Studio Page
 * Full-featured resume editing workspace with export, versioning, and comparison
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ResumeStudio from '@/components/studio/ResumeStudio';
import { Button } from '@/components/ui/button';
import { ArrowLeft, LogIn } from 'lucide-react';
import { ResumeData } from '@/services/export/ResumeExportService';

const StudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, loading } = useAuth();
  const [initialData, setInitialData] = useState<ResumeData | undefined>(undefined);

  // Get resume ID from URL params or generate a new one
  const resumeId = searchParams.get('id') || `resume-${user?.id || 'guest'}-${Date.now()}`;

  // Load initial data if provided via URL params
  useEffect(() => {
    const dataParam = searchParams.get('data');
    if (dataParam) {
      try {
        const decoded = JSON.parse(atob(dataParam));
        setInitialData(decoded);
      } catch (e) {
        console.warn('Failed to parse initial data from URL');
      }
    }
  }, [searchParams]);

  // Handle save
  const handleSave = (data: ResumeData) => {
    console.log('Resume saved:', data);
    // In a real app, you'd save this to the backend
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation Bar */}
      <div className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>

          <div className="flex items-center gap-4">
            {!user && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth')}
                className="flex items-center gap-2"
              >
                <LogIn className="h-4 w-4" />
                Sign in to save
              </Button>
            )}
            {user && (
              <span className="text-sm text-gray-600">
                Signed in as {user.email}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Studio Component */}
      <ResumeStudio
        resumeId={resumeId}
        initialData={initialData}
        onSave={handleSave}
      />
    </div>
  );
};

export default StudioPage;
