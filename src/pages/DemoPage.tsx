
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { 
  ArrowRight, 
  Upload, 
  FileText, 
  BarChart3, 
  Download, 
  CheckCircle, 
  Target, 
  Zap, 
  Users,
  Clock,
  Star,
  TrendingUp,
  Shield
} from 'lucide-react';

const DemoPage = () => {
  const navigate = useNavigate();

  const steps = [
    {
      step: 1,
      icon: Upload,
      title: "Upload Your Resume",
      description: "Simply drag and drop your resume (PDF, DOC, DOCX) or paste the content directly",
      color: "bg-blue-100 text-blue-600"
    },
    {
      step: 2,
      icon: FileText,
      title: "Add Job Description",
      description: "Paste the job description you're targeting to get personalized optimization",
      color: "bg-green-100 text-green-600"
    },
    {
      step: 3,
      icon: BarChart3,
      title: "AI Analysis & Scoring",
      description: "Our AI analyzes your resume against the job requirements and provides detailed insights",
      color: "bg-purple-100 text-purple-600"
    },
    {
      step: 4,
      icon: Download,
      title: "Export Optimized Resume",
      description: "Download your tailored, ATS-friendly resume and land more interviews",
      color: "bg-orange-100 text-orange-600"
    }
  ];

  const features = [
    {
      icon: Target,
      title: "99% ATS Compatibility",
      description: "Ensure your resume passes through all major applicant tracking systems",
      stat: "99%"
    },
    {
      icon: TrendingUp,
      title: "4x More Interviews",
      description: "Our users see a 400% increase in interview requests on average",
      stat: "4x"
    },
    {
      icon: Clock,
      title: "30-Second Analysis",
      description: "Get comprehensive feedback faster than you can read through your resume",
      stat: "30s"
    },
    {
      icon: Users,
      title: "25,000+ Success Stories",
      description: "Join thousands of professionals who've accelerated their careers",
      stat: "25k+"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-gray-100 bg-[size:20px_20px] opacity-30" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          {/* Hero Section */}
          <div className="pt-20 pb-16 text-center">
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2 text-sm font-semibold mb-6">
              🚀 See SproutCV In Action
            </Badge>
            
            <h1 className="text-5xl sm:text-6xl font-black text-gray-900 mb-6 leading-tight">
              How SproutCV
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 block mt-2">
                Transforms Resumes
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Watch how our AI-powered platform analyzes, optimizes, and transforms your resume 
              into an interview-generating machine in just 4 simple steps.
            </p>
            
            <Button 
              size="lg" 
              className="text-lg px-10 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 mb-12"
              onClick={() => navigate('/auth')}
            >
              Try It Free Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* How It Works Steps */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                4 Steps to Career Success
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Our streamlined process makes resume optimization effortless and effective
              </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                {steps.map((step, index) => (
                  <div key={index} className="flex items-start space-x-6 p-6 bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-200">
                    <div className={`flex-shrink-0 w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center shadow-lg`}>
                      <step.icon className="h-8 w-8" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center mb-3">
                        <span className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm font-bold px-3 py-1 rounded-full mr-3">
                          Step {step.step}
                        </span>
                        <h3 className="text-xl font-bold text-gray-900">{step.title}</h3>
                      </div>
                      <p className="text-gray-600 leading-relaxed">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Demo Video/Image Placeholder */}
              <Card className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
                    <BarChart3 className="h-10 w-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold mb-4">Live Demo</h3>
                  <p className="text-gray-300 mb-6">
                    See a real resume transformation in action
                  </p>
                </div>
                
                {/* Simulated Demo Interface */}
                <div className="bg-gray-800 rounded-lg p-6 mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm text-gray-400">Resume Score</span>
                    <span className="text-2xl font-bold text-green-400">87%</span>
                  </div>
                  <div className="space-y-3">
                    {['ATS Compatibility: 94%', 'Keyword Match: 89%', 'Format Score: 92%'].map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center text-sm">
                        <span className="text-gray-300">{item.split(':')[0]}</span>
                        <span className="text-white font-semibold">{item.split(':')[1]}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Button 
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                  onClick={() => navigate('/auth')}
                >
                  Start Your Analysis
                </Button>
              </Card>
            </div>
          </div>

          {/* Features Grid */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Why 25,000+ Professionals Choose SproutCV
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Real results, backed by data and trusted by professionals worldwide
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => (
                <Card key={index} className="p-6 text-center hover:shadow-xl transition-all duration-200 bg-white">
                  <div className="bg-gradient-to-r from-green-100 to-emerald-100 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6">
                    <feature.icon className="h-8 w-8 text-green-600" />
                  </div>
                  <div className="text-3xl font-black text-gray-900 mb-2">{feature.stat}</div>
                  <h3 className="text-lg font-bold text-gray-900 mb-3">{feature.title}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Success Stories */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold text-gray-900 mb-6">
                Real Success Stories
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                See how SproutCV has transformed careers across industries
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Chen",
                  role: "Software Engineer at Google",
                  quote: "SproutCV helped me identify exactly what keywords I was missing. Landed 5 interviews in 2 weeks!",
                  improvement: "Interview rate increased by 500%"
                },
                {
                  name: "Michael Rodriguez",
                  role: "Product Manager at Microsoft",
                  quote: "The AI suggestions were spot-on. My resume went from generic to compelling in minutes.",
                  improvement: "Resume score: 45% → 94%"
                },
                {
                  name: "Emily Johnson",
                  role: "Marketing Director at Spotify",
                  quote: "Finally, a tool that understands ATS systems. No more black hole applications!",
                  improvement: "Response rate: 2% → 35%"
                }
              ].map((story, index) => (
                <Card key={index} className="p-8 bg-white hover:shadow-xl transition-all duration-200">
                  <div className="flex items-center mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-lg mr-4">
                      {story.name[0]}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{story.name}</h4>
                      <p className="text-sm text-gray-600">{story.role}</p>
                    </div>
                  </div>
                  <p className="text-gray-700 mb-4 italic">"{story.quote}"</p>
                  <Badge className="bg-green-100 text-green-800 text-xs">
                    {story.improvement}
                  </Badge>
                </Card>
              ))}
            </div>
          </div>

          {/* Security & Trust */}
          <div className="mb-20">
            <Card className="p-12 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center">
              <Shield className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-3xl font-bold mb-6">Enterprise-Grade Security</h2>
              <p className="text-xl text-blue-100 mb-8 max-w-3xl mx-auto">
                Your privacy is our priority. All data is encrypted, never shared, and automatically deleted 
                after processing. We're SOC 2 compliant and trusted by Fortune 500 companies.
              </p>
              <div className="flex flex-wrap justify-center gap-8 text-sm">
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  End-to-End Encryption
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  SOC 2 Compliant
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  GDPR Compliant
                </div>
                <div className="flex items-center">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Zero Data Retention
                </div>
              </div>
            </Card>
          </div>

          {/* Final CTA */}
          <div className="text-center mb-20">
            <Card className="p-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-2xl">
              <Star className="h-16 w-16 mx-auto mb-6 opacity-90" />
              <h2 className="text-4xl font-bold mb-6">
                Ready to Transform Your Career?
              </h2>
              <p className="text-xl mb-10 text-green-100 max-w-3xl mx-auto">
                Join 25,000+ professionals who've accelerated their careers with SproutCV. 
                Your next opportunity is just one optimized resume away.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-200"
                  onClick={() => navigate('/auth')}
                >
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-2 border-white text-white hover:bg-white hover:text-green-600 text-lg px-10 py-6 transition-all duration-200"
                  onClick={() => navigate('/analyze')}
                >
                  See Live Demo
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default DemoPage;
