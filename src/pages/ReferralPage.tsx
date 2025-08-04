import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import ReferralSystem from '@/components/ReferralSystem';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Sprout } from 'lucide-react';

const ReferralPage = () => {
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="bg-card shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" onClick={() => navigate('/dashboard')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <div className="flex items-center space-x-2">
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
          <p className="text-muted-foreground">
            Earn credits by referring friends. You and your friend both get 3 credits when they make their first purchase!
          </p>
        </div>
        
        <ReferralSystem />
      </main>
    </div>
  );
};

export default ReferralPage;