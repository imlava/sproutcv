
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft, Search, Sprout, FileX, HelpCircle } from 'lucide-react';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-gray-100 bg-[size:20px_20px] opacity-30" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      
      <div className="max-w-2xl mx-auto text-center relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center space-x-3 mb-8">
          <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl">
            <Sprout className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
            SproutCV
          </h1>
        </div>

        <Card className="p-12 bg-white/95 backdrop-blur-sm shadow-2xl border-0">
          {/* 404 Icon */}
          <div className="flex items-center justify-center w-24 h-24 bg-gradient-to-r from-red-100 to-orange-100 rounded-full mx-auto mb-8">
            <FileX className="h-12 w-12 text-red-500" />
          </div>

          {/* Main Message */}
          <div className="mb-8">
            <h2 className="text-6xl font-black text-gray-900 mb-4">404</h2>
            <h3 className="text-3xl font-bold text-gray-800 mb-4">Page Not Found</h3>
            <p className="text-lg text-gray-600 leading-relaxed max-w-lg mx-auto">
              Oops! It looks like the page you're looking for doesn't exist or has been moved. 
              Don't worry, we'll help you get back on track.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button 
              size="lg"
              onClick={() => navigate('/')}
              className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
            >
              <Home className="mr-2 h-5 w-5" />
              Go Home
            </Button>
            
            <Button 
              size="lg"
              variant="outline"
              onClick={() => navigate(-1)}
              className="border-2 border-gray-300 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
            >
              <ArrowLeft className="mr-2 h-5 w-5" />
              Go Back
            </Button>
          </div>

          {/* Quick Links */}
          <div className="border-t border-gray-200 pt-8">
            <h4 className="text-lg font-semibold text-gray-900 mb-6">
              Or try one of these popular pages:
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-left">
              {[
                {
                  icon: Search,
                  title: "Resume Analysis",
                  description: "Get AI-powered insights on your resume",
                  path: "/analyze",
                  color: "bg-blue-100 text-blue-600"
                },
                {
                  icon: Sprout,
                  title: "How It Works",
                  description: "Learn about our optimization process",
                  path: "/how-it-works",
                  color: "bg-green-100 text-green-600"
                },
                {
                  icon: HelpCircle,
                  title: "Support Center",
                  description: "Get help and find answers",
                  path: "/contactus",
                  color: "bg-purple-100 text-purple-600"
                },
                {
                  icon: Home,
                  title: "Dashboard",
                  description: "Access your account dashboard",
                  path: "/dashboard",
                  color: "bg-orange-100 text-orange-600"
                }
              ].map((link, index) => (
                <button
                  key={index}
                  onClick={() => navigate(link.path)}
                  className="flex items-start space-x-3 p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-all duration-200 text-left group"
                >
                  <div className={`p-2 rounded-lg ${link.color} group-hover:scale-110 transition-transform duration-200`}>
                    <link.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-gray-900 group-hover:text-green-600 transition-colors duration-200">
                      {link.title}
                    </h5>
                    <p className="text-sm text-gray-600">{link.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Contact Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Still can't find what you're looking for?{' '}
              <button 
                onClick={() => navigate('/contactus')}
                className="text-green-600 hover:text-green-700 font-medium underline"
              >
                Contact our support team
              </button>
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default NotFound;
