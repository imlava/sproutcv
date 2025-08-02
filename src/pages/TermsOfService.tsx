
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, FileText, Scale, AlertCircle, CheckCircle } from 'lucide-react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const TermsOfService = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50">
      <Header />
      
      <div className="pt-20">
        {/* Hero Section */}
        <div className="bg-white border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <Scale className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Please read these terms carefully before using our services.
              </p>
              <p className="text-sm text-gray-500 mt-4">Last updated: {new Date().toLocaleDateString()}</p>
            </div>
          </div>
        </div>

        {/* Terms Content */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="prose prose-lg max-w-none">
            <div className="bg-white rounded-lg p-8 shadow-sm border">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <CheckCircle className="h-6 w-6 text-green-500 mr-2" />
                Acceptance of Terms
              </h2>
              <p className="mb-4">
                By accessing and using SproutCV's services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
              <p className="mb-6">
                These Terms of Service ("Terms") govern your use of our website located at sproutcv.app (the "Service") operated by SproutCV ("us", "we", or "our").
              </p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <FileText className="h-6 w-6 text-blue-500 mr-2" />
                Description of Service
              </h2>
              <p className="mb-4">SproutCV provides AI-powered resume analysis and optimization services including:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Resume analysis against job descriptions</li>
                <li>ATS (Applicant Tracking System) optimization</li>
                <li>Keyword matching and suggestions</li>
                <li>Resume scoring and improvement recommendations</li>
                <li>Resume formatting and enhancement</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">User Accounts</h2>
              <h3 className="text-xl font-semibold mb-3">Registration</h3>
              <p className="mb-4">To use certain features of our service, you must register for an account. You agree to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Provide accurate, complete, and up-to-date information</li>
                <li>Maintain the security of your password</li>
                <li>Accept responsibility for all activities under your account</li>
                <li>Notify us immediately of any unauthorized use</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Account Termination</h3>
              <p className="mb-4">We reserve the right to terminate or suspend accounts that violate these terms.</p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Acceptable Use</h2>
              <p className="mb-4">You agree not to use the service to:</p>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Upload malicious files or content that could harm our systems</li>
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on intellectual property rights</li>
                <li>Attempt to gain unauthorized access to our systems</li>
                <li>Use the service for any unlawful or prohibited purpose</li>
                <li>Share your account credentials with others</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Payment Terms</h2>
              <h3 className="text-xl font-semibold mb-3">Subscription Plans</h3>
              <p className="mb-4">Our service offers various subscription plans with different features and limits:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Free plan with limited analyses per month</li>
                <li>Premium plans with unlimited analyses and additional features</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Billing</h3>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>Subscription fees are billed in advance on a monthly or annual basis</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We reserve the right to change our pricing with 30 days notice</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Cancellation</h3>
              <p className="mb-4">You may cancel your subscription at any time. Your access will continue until the end of your current billing period.</p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Content and Data</h2>
              <h3 className="text-xl font-semibold mb-3">Your Content</h3>
              <p className="mb-4">You retain ownership of all content you upload, including resumes and job descriptions. By using our service, you grant us:</p>
              <ul className="list-disc pl-6 mb-4 space-y-2">
                <li>A license to process your content for analysis purposes</li>
                <li>The right to use anonymized, aggregated data to improve our services</li>
              </ul>

              <h3 className="text-xl font-semibold mb-3">Data Retention</h3>
              <ul className="list-disc pl-6 mb-6 space-y-2">
                <li>Resume content is automatically deleted after 30 days unless saved</li>
                <li>Account data is retained until you delete your account</li>
                <li>You can request data deletion at any time</li>
              </ul>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4 flex items-center">
                <AlertCircle className="h-6 w-6 text-yellow-500 mr-2" />
                Disclaimers and Limitations
              </h2>
              <h3 className="text-xl font-semibold mb-3">Service Availability</h3>
              <p className="mb-4">We strive for 99.9% uptime but cannot guarantee uninterrupted service. We may perform maintenance that temporarily affects availability.</p>

              <h3 className="text-xl font-semibold mb-3">Accuracy</h3>
              <p className="mb-4">While our AI provides valuable insights, we cannot guarantee that following our recommendations will result in job offers or interviews.</p>

              <h3 className="text-xl font-semibold mb-3">Limitation of Liability</h3>
              <p className="mb-4">Our total liability for any claims related to our service shall not exceed the amount you paid us in the 12 months preceding the claim.</p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Intellectual Property</h2>
              <p className="mb-4">The SproutCV service, including all content, features, and functionality, is owned by us and is protected by copyright, trademark, and other intellectual property laws.</p>
              <p className="mb-4">Our AI models, algorithms, and analysis techniques are proprietary and confidential.</p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Changes to Terms</h2>
              <p className="mb-4">We reserve the right to modify these terms at any time. We will notify users of significant changes via email or through our service.</p>
              <p className="mb-4">Continued use of the service after changes constitutes acceptance of the new terms.</p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Governing Law</h2>
              <p className="mb-4">These Terms shall be governed by and construed in accordance with the laws of India, without regard to its conflict of law provisions.</p>
            </div>

            <div className="bg-white rounded-lg p-8 shadow-sm border mt-8">
              <h2 className="text-2xl font-bold mb-4">Contact Information</h2>
              <p className="mb-4">If you have any questions about these Terms of Service, please contact us:</p>
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

export default TermsOfService;
