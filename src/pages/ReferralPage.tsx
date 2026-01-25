import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import ReferralSystem from '@/components/ReferralSystem';
import { Button } from '@/components/ui/button';
import { Gift, Users, TrendingUp, Star, Zap, Shield } from 'lucide-react';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import DodoPaymentModal from '@/components/dashboard/DodoPaymentModal';
import Footer from '@/components/Footer';

const ReferralPage = () => {
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

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <AuthenticatedHeader onBuyCredits={() => setShowPaymentModal(true)} />

      {/* Hero Section */}
      <div className="bg-white border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl">
                <Gift className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Referral Program
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Share SproutCV with friends and earn credits together! You and your friend both get 3 credits when they make their first purchase.
            </p>
            
            {/* Benefits Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <div className="bg-green-50 rounded-lg p-6 border border-green-200">
                <Users className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-green-800 mb-2">Invite Friends</h3>
                <p className="text-green-700 text-sm">Share your unique referral link</p>
              </div>
              <div className="bg-emerald-50 rounded-lg p-6 border border-emerald-200">
                <TrendingUp className="h-8 w-8 text-emerald-600 mx-auto mb-3" />
                <h3 className="font-semibold text-emerald-800 mb-2">They Sign Up</h3>
                <p className="text-emerald-700 text-sm">Friend creates account and upgrades</p>
              </div>
              <div className="bg-teal-50 rounded-lg p-6 border border-teal-200">
                <Star className="h-8 w-8 text-teal-600 mx-auto mb-3" />
                <h3 className="font-semibold text-teal-800 mb-2">Both Get Credits</h3>
                <p className="text-teal-700 text-sm">3 credits each, automatically added</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <ReferralSystem />
        
        {/* How It Works Section */}
        <div className="mt-16 bg-white rounded-2xl p-8 shadow-lg border border-green-100">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            How It Works
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">1</span>
              </div>
              <h3 className="font-semibold mb-2">Share Your Link</h3>
              <p className="text-gray-600 text-sm">Copy your unique referral link and share it with friends, family, or colleagues</p>
            </div>
            
            <div className="text-center">
              <div className="bg-emerald-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-emerald-600">2</span>
              </div>
              <h3 className="font-semibold mb-2">Friend Signs Up</h3>
              <p className="text-gray-600 text-sm">Your friend creates a SproutCV account using your referral link</p>
            </div>
            
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">3</span>
              </div>
              <h3 className="font-semibold mb-2">They Upgrade</h3>
              <p className="text-gray-600 text-sm">Your friend makes their first purchase or upgrades to a premium plan</p>
            </div>
            
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">4</span>
              </div>
              <h3 className="font-semibold mb-2">Both Get Rewarded</h3>
              <p className="text-gray-600 text-sm">You both receive 3 credits automatically added to your accounts</p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-16 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl p-8 border border-green-200">
          <h2 className="text-2xl font-bold text-center mb-8 text-green-800">Frequently Asked Questions</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-semibold text-green-700 mb-2">How many people can I refer?</h3>
              <p className="text-green-600 text-sm mb-4">There's no limit! Refer as many friends as you want and earn credits for each successful referral.</p>
              
              <h3 className="font-semibold text-green-700 mb-2">When do I get my credits?</h3>
              <p className="text-green-600 text-sm mb-4">Credits are automatically added within 24 hours after your friend makes their first purchase.</p>
            </div>
            
            <div>
              <h3 className="font-semibold text-green-700 mb-2">Do credits expire?</h3>
              <p className="text-green-600 text-sm mb-4">No! Your earned credits never expire and can be used anytime for resume analyses.</p>
              
              <h3 className="font-semibold text-green-700 mb-2">Can I refer existing users?</h3>
              <p className="text-green-600 text-sm">Only new users who haven't had a SproutCV account before are eligible for the referral program.</p>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="mt-16 bg-gradient-to-r from-green-600 to-emerald-600 rounded-2xl p-8 text-white text-center">
          <Zap className="h-12 w-12 mx-auto mb-4" />
          <h2 className="text-3xl font-bold mb-4">Start Earning Today!</h2>
          <p className="text-xl mb-6 opacity-90">
            Help your friends improve their careers while earning free credits
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              onClick={() => document.getElementById('referral-link')?.scrollIntoView({ behavior: 'smooth' })}
              className="bg-white text-green-600 hover:bg-gray-100 shadow-lg"
            >
              <Gift className="h-5 w-5 mr-2" />
              Get My Referral Link
            </Button>
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate('/analyze')}
              className="border-white text-white hover:bg-white/10"
            >
              <Shield className="h-5 w-5 mr-2" />
              Try Resume Analysis
            </Button>
          </div>
        </div>
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

export default ReferralPage;