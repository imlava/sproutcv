
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Sprout, CheckCircle, Shield, Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';

interface AuthFormLayoutProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export const AuthFormLayout: React.FC<AuthFormLayoutProps> = ({ title, description, children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-gray-100 bg-[size:20px_20px] opacity-30" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      
      <div className="relative flex min-h-screen">
        {/* Left Side - Branding & Benefits */}
        <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-green-600 to-emerald-700 p-12 flex-col justify-between text-white relative">
          <div className="absolute inset-0 bg-black opacity-10"></div>
          
          <div className="relative z-10">
            <div className="flex items-center space-x-3 mb-12 cursor-pointer" onClick={() => navigate('/')}>
              <div className="flex items-center justify-center w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                <Sprout className="h-7 w-7 text-white" />
              </div>
              <h1 className="text-3xl font-bold text-white">SproutCV</h1>
            </div>

            <div className="space-y-8">
              <div>
                <h2 className="text-4xl font-bold mb-4 leading-tight">
                  Transform Your Career
                  <span className="block text-green-200">with AI-Powered Insights</span>
                </h2>
                <p className="text-xl text-green-100 leading-relaxed">
                  Join thousands of professionals who've accelerated their careers with our intelligent resume optimization platform.
                </p>
              </div>

              <div className="space-y-4">
                {[
                  { icon: CheckCircle, text: "99% ATS compatibility rate" },
                  { icon: Shield, text: "Enterprise-grade security" },
                  { icon: Clock, text: "30-second analysis time" }
                ].map((benefit, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="bg-white/20 p-2 rounded-lg">
                      <benefit.icon className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-green-100">{benefit.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="relative z-10">
            <Badge className="bg-white/20 text-white border-white/30 backdrop-blur-sm">
              Trusted by thousands of professionals
            </Badge>
          </div>
        </div>

        {/* Right Side - Auth Form */}
        <div className="flex-1 flex items-center justify-center p-4 lg:p-12">
          <div className="w-full max-w-md">
            {/* Mobile Header */}
            <div className="lg:hidden text-center mb-8">
              <div className="flex items-center justify-center space-x-2 mb-4 cursor-pointer" onClick={() => navigate('/')}>
                <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Sprout className="h-7 w-7 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                  SproutCV
                </h1>
              </div>
            </div>

            <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm">
              <CardHeader className="text-center pb-8 space-y-4">
                <CardTitle className="text-2xl lg:text-3xl font-bold text-gray-900 leading-tight">
                  {title}
                </CardTitle>
                <CardDescription className="text-gray-600 text-base leading-relaxed">
                  {description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 px-8 pb-8">
                {children}
              </CardContent>
            </Card>

            {/* Footer Links */}
            <div className="mt-8 text-center space-y-4">
              <div className="flex justify-center space-x-6 text-sm text-gray-600">
                <Button 
                  variant="link" 
                  className="text-gray-600 hover:text-green-600 p-0 h-auto"
                  onClick={() => navigate('/how-it-works')}
                >
                  How It Works
                </Button>
                <Button 
                  variant="link" 
                  className="text-gray-600 hover:text-green-600 p-0 h-auto"
                  onClick={() => navigate('https://sproutcv.app/#pricing')}
                >
                  Pricing
                </Button>
                <Button 
                  variant="link" 
                  className="text-gray-600 hover:text-green-600 p-0 h-auto"
                  onClick={() => navigate('/contact')}
                >
                  Support
                </Button>
              </div>
              
              <p className="text-xs text-gray-500">
                By signing up, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
