/**
 * Resume Studio Page
 * Full-featured resume editing workspace with export, versioning, and comparison
 * Following SproutCV brand colors and design patterns
 */

import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import ResumeStudio from '@/components/studio/ResumeStudio';
import { Button } from '@/components/ui/button';
import { Sprout, LogIn } from 'lucide-react';
import { ResumeData } from '@/services/export/ResumeExportService';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import DodoPaymentModal from '@/components/dashboard/DodoPaymentModal';
import Footer from '@/components/Footer';

const StudioPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const [initialData, setInitialData] = useState<ResumeData | undefined>(undefined);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center animate-pulse">
            <Sprout className="h-6 w-6 text-white" />
          </div>
          <p className="text-green-600 font-medium">Loading Studio...</p>
        </div>
      </div>
    );
  }

  // Show guest header for non-authenticated users
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
        {/* Guest Navigation */}
        <nav className="bg-white/90 backdrop-blur-md border-b border-green-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-2 cursor-pointer" onClick={() => navigate('/')}>
                <div className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Sprout className="h-5 w-5 text-white" />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  SproutCV Studio
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/auth')}
                className="border-green-300 text-green-600 hover:bg-green-50"
              >
                <LogIn className="h-4 w-4 mr-2" />
                Sign in to save
              </Button>
            </div>
          </div>
        </nav>

        {/* Studio Component */}
        <div className="flex-1">
          <ResumeStudio
            resumeId={resumeId}
            initialData={initialData}
            onSave={handleSave}
          />
        </div>

        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex flex-col">
      <AuthenticatedHeader onBuyCredits={() => setShowPaymentModal(true)} />

      {/* Studio Component */}
      <div className="flex-1">
        <ResumeStudio
          resumeId={resumeId}
          initialData={initialData}
          onSave={handleSave}
        />
      </div>

      {/* Footer */}
      <Footer />

      {/* Payment Modal */}
      <DodoPaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        onSuccess={refreshProfile}
      />
    </div>
  );
};

export default StudioPage;
