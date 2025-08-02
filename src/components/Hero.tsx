
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Target, FileCheck, TrendingUp, ArrowRight } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-200">
            🚀 AI-Powered Resume Optimization
          </Badge>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Transform Your Resume with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600"> AI</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Get instant AI-powered analysis, ATS optimization, and personalized suggestions 
            to land more interviews. Tailor your resume for every job in seconds.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              onClick={() => navigate('/auth')}
            >
              Start Free Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-8 py-6 border-2"
              onClick={() => navigate('/auth')}
            >
              View Sample Report
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 mb-16">
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              10,000+ Resumes Analyzed
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              95% ATS Compatibility
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
              3x More Interviews
            </div>
          </div>
        </div>

        {/* Feature Preview */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Get Your Resume Score in Seconds
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Our AI analyzes your resume against job descriptions and provides 
              actionable insights to improve your chances of landing interviews.
            </p>
            <div className="space-y-4">
              {[
                { icon: Target, title: "Keyword Optimization", desc: "Match job requirements perfectly" },
                { icon: FileCheck, title: "ATS Compatibility", desc: "Pass automated screening systems" },
                { icon: TrendingUp, title: "Impact Scoring", desc: "Quantify your achievements" },
                { icon: Zap, title: "Instant Feedback", desc: "Get results in under 30 seconds" }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="bg-blue-100 p-2 rounded-lg">
                    <feature.icon className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Card className="p-8 shadow-2xl border-0 bg-gradient-to-br from-white to-blue-50">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-green-600">87</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Overall Match Score</h3>
              <p className="text-gray-600">Your resume is well-optimized!</p>
            </div>
            
            <div className="space-y-4">
              {[
                { name: "Keyword Match", score: 92 },
                { name: "ATS Compatibility", score: 85 },
                { name: "Skills Alignment", score: 89 },
                { name: "Experience Fit", score: 82 }
              ].map((metric, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                  <div className="flex items-center space-x-2">
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full" 
                        style={{ width: `${metric.score}%` }}
                      ></div>
                    </div>
                    <span className="text-sm font-bold text-gray-900 w-8">{metric.score}%</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Pricing Section */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple, Affordable Pricing</h2>
          <p className="text-lg text-gray-600 mb-12">
            Start free, pay only for what you need. No recurring subscriptions.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <Card className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Free Trial</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">$0</div>
              <p className="text-gray-600 mb-6">Try it risk-free</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ 1 Free Analysis</li>
                <li>✓ Basic Score Report</li>
                <li>✓ ATS Compatibility Check</li>
              </ul>
              <Button variant="outline" className="w-full">Get Started</Button>
            </Card>
            
            <Card className="p-6 text-center border-2 border-blue-500 relative">
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500">
                Most Popular
              </Badge>
              <h3 className="text-xl font-bold text-gray-900 mb-2">Credit Pack</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">$12.99</div>
              <p className="text-gray-600 mb-6">15 Analyses</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ Everything in Free</li>
                <li>✓ Detailed Suggestions</li>
                <li>✓ Export Reports</li>
                <li>✓ No Expiration</li>
              </ul>
              <Button className="w-full">Buy Credits</Button>
            </Card>
            
            <Card className="p-6 text-center">
              <h3 className="text-xl font-bold text-gray-900 mb-2">Power Pack</h3>
              <div className="text-3xl font-bold text-gray-900 mb-4">$24.99</div>
              <p className="text-gray-600 mb-6">30 Analyses</p>
              <ul className="space-y-2 text-sm text-gray-600 mb-6">
                <li>✓ Everything in Credit Pack</li>
                <li>✓ Priority Support</li>
                <li>✓ Advanced Analytics</li>
                <li>✓ Bulk Analysis</li>
              </ul>
              <Button variant="outline" className="w-full">Buy Credits</Button>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="p-12 bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
            <h2 className="text-3xl font-bold mb-4">Ready to Land Your Dream Job?</h2>
            <p className="text-xl mb-8 text-blue-100">
              Join thousands of job seekers who've improved their interview rates with ResumeTailor
            </p>
            <Button 
              size="lg" 
              className="bg-white text-blue-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              Start Your Free Analysis
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Hero;
