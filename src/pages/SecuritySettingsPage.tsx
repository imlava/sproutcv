import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock, Key, Eye, Bell, Smartphone, History, AlertTriangle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import SecureProfileEditor from '@/components/security/SecureProfileEditor';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import DodoPaymentModal from '@/components/dashboard/DodoPaymentModal';
import Footer from '@/components/Footer';

const SecuritySettingsPage: React.FC = () => {
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

  const securityFeatures = [
    {
      icon: Lock,
      title: 'Password Security',
      description: 'Change your password and enable strong password requirements',
      status: 'active',
      color: 'green'
    },
    {
      icon: Smartphone,
      title: 'Two-Factor Auth',
      description: 'Add an extra layer of security to your account',
      status: 'coming-soon',
      color: 'gray'
    },
    {
      icon: History,
      title: 'Login History',
      description: 'Review recent account activity and sessions',
      status: 'active',
      color: 'green'
    },
    {
      icon: Bell,
      title: 'Security Alerts',
      description: 'Get notified about important security events',
      status: 'active',
      color: 'green'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <AuthenticatedHeader onBuyCredits={() => setShowPaymentModal(true)} />

      {/* Hero Section */}
      <div className="bg-white border-b border-green-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl">
                <Shield className="h-10 w-10 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
              Security Settings
            </h1>
            <p className="text-gray-600 max-w-xl mx-auto">
              Manage your account security, privacy preferences, and protect your personal information
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Security Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {securityFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-4 border-green-100 hover:border-green-200 transition-colors">
                <div className="flex items-start space-x-4">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
                    feature.status === 'active' 
                      ? 'bg-green-100' 
                      : 'bg-gray-100'
                  }`}>
                    <Icon className={`h-5 w-5 ${
                      feature.status === 'active' 
                        ? 'text-green-600' 
                        : 'text-gray-400'
                    }`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{feature.title}</h3>
                      {feature.status === 'coming-soon' && (
                        <Badge variant="secondary" className="bg-gray-100 text-gray-600 text-xs">
                          Coming Soon
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Security Alert */}
        <Card className="p-4 bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 mb-8">
          <div className="flex items-start space-x-3">
            <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-amber-800">Security Tip</h3>
              <p className="text-sm text-amber-700 mt-1">
                Use a unique, strong password for your SproutCV account. Never share your password or account credentials with anyone.
              </p>
            </div>
          </div>
        </Card>

        {/* Main Security Editor */}
        <Card className="p-6 border-green-100">
          <h2 className="text-xl font-semibold mb-6 flex items-center">
            <Key className="h-5 w-5 mr-2 text-green-600" />
            Account Security
          </h2>
          <SecureProfileEditor />
        </Card>

        {/* Data Privacy Section */}
        <Card className="p-6 border-green-100 mt-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center">
            <Eye className="h-5 w-5 mr-2 text-green-600" />
            Privacy & Data
          </h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Resume Data</p>
                <p className="text-sm text-gray-500">Your resumes are encrypted and securely stored</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Protected</Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-gray-100">
              <div>
                <p className="font-medium text-gray-900">Analysis History</p>
                <p className="text-sm text-gray-500">Only you can access your analysis results</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Private</Badge>
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium text-gray-900">Payment Information</p>
                <p className="text-sm text-gray-500">Processed securely through Dodo Payments</p>
              </div>
              <Badge className="bg-green-100 text-green-700">Encrypted</Badge>
            </div>
          </div>
        </Card>
      </div>

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

export default SecuritySettingsPage;
