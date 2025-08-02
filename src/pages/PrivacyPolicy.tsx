
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Shield, Eye, Lock, Database } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />
      
      <div className="pt-20">
        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <Shield className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Your privacy is important to us. Learn how we collect, use, and protect your information.
              </p>
              <p className="text-sm text-gray-500 mt-4">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Privacy Policy Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-sm border">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Eye className="h-6 w-6 text-green-500 mr-2" />
                Information We Collect
              </h2>
              <p className="mb-4">We collect information you provide directly to us, such as when you:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Create an account or use our services</li>
                <li>Upload your resume for analysis</li>
                <li>Contact us for support</li>
                <li>Subscribe to our newsletter</li>
                <li>Make a payment for our services</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Personal Information</h3>
              <p className="mb-4">This may include:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1">
                <li>Name and email address</li>
                <li>Resume content and job descriptions</li>
                <li>Payment information (processed securely by our payment providers)</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Usage Data</h3>
              <p className="mb-6">We automatically collect certain information about your use of our services, including IP address, browser type, and usage patterns to improve our service.</p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Database className="h-6 w-6 text-blue-500 mr-2" />
                How We Use Your Information
              </h2>
              <p className="mb-4">We use the information we collect to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Provide, maintain, and improve our AI-powered resume analysis services</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments and questions</li>
                <li>Analyze usage patterns to improve our service</li>
                <li>Comply with legal obligations</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <Lock className="h-6 w-6 text-purple-500 mr-2" />
                Data Security & Protection
              </h2>
              <p className="mb-4">We take the security of your personal information seriously and use appropriate technical and organizational measures to protect it:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Encryption:</strong> All data is encrypted in transit and at rest</li>
                <li><strong>Access Controls:</strong> Strict access controls limit who can view your data</li>
                <li><strong>Regular Audits:</strong> We conduct regular security assessments</li>
                <li><strong>Secure Infrastructure:</strong> Our systems are hosted on secure, compliant platforms</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Resume Data</h3>
              <p className="mb-4">Your resume content is:</p>
              <ul className="list-disc pl-6 mb-6 space-y-1">
                <li>Processed only for analysis purposes</li>
                <li>Never shared with third parties</li>
                <li>Automatically deleted after 30 days unless you save it</li>
                <li>Accessible only to you through your secure account</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Information Sharing</h2>
              <p className="mb-4">We do not sell, trade, or otherwise transfer your personal information to third parties except:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li><strong>Service Providers:</strong> Trusted partners who help us operate our service (with strict confidentiality agreements)</li>
                <li><strong>Legal Requirements:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In the event of a merger or acquisition (with continued privacy protection)</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Your Rights</h2>
              <p className="mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Access your personal information</li>
                <li>Correct inaccurate information</li>
                <li>Delete your account and data</li>
                <li>Export your data</li>
                <li>Opt-out of marketing communications</li>
                <li>Object to certain processing activities</li>
              </ul>
              <p className="mb-4">To exercise these rights, please contact us at <a href="mailto:hello@sproutcv.app" className="text-green-600 hover:text-green-700">hello@sproutcv.app</a>.</p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Cookies & Tracking</h2>
              <p className="mb-4">We use cookies and similar technologies to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Remember your preferences and settings</li>
                <li>Analyze site traffic and usage patterns</li>
                <li>Improve our services</li>
              </ul>
              <p className="mb-4">You can control cookies through your browser settings.</p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Contact Us</h2>
              <p className="mb-4">If you have questions about this Privacy Policy, please contact us:</p>
              <ul className="list-none space-y-2">
                <li><strong>Email:</strong> <a href="mailto:hello@sproutcv.app" className="text-green-600 hover:text-green-700">hello@sproutcv.app</a></li>
                <li><strong>Address:</strong> Bangalore, India</li>
              </ul>
            </div>

            <div className="text-center mt-12">
              <Link to="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default PrivacyPolicy;
