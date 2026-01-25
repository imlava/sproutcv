import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import DetailedAnalysisView from '@/components/analysis/DetailedAnalysisView';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import DodoPaymentModal from '@/components/dashboard/DodoPaymentModal';
import Footer from '@/components/Footer';

const AnalysisDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const { user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user || !id) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <AuthenticatedHeader onBuyCredits={() => setShowPaymentModal(true)} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DetailedAnalysisView 
          analysisId={id} 
          onBack={() => navigate('/dashboard')}
        />
      </main>

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

export default AnalysisDetailPage;