
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Target, FileCheck, TrendingUp, ArrowRight, Sprout, Shield, Clock, Star } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50">
      {/* Hero Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
        <div className="text-center">
          <div className="flex items-center justify-center mb-4">
            <div className="flex items-center justify-center w-12 h-12 bg-green-100 rounded-xl mr-3">
              <Sprout className="h-7 w-7 text-green-600" />
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200">
              🌱 AI-Powered Resume Growth
            </Badge>
          </div>
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Grow Your Career with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600"> SproutCV</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
            Get instant AI-powered analysis, ATS optimization, and personalized suggestions 
            to land more interviews. Watch your career sprout with every optimized resume.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-8 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              onClick={() => navigate('/auth')}
            >
              Start Growing Free
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
              10,000+ Resumes Grown
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

        {/* Features Section */}
        <div id="features" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-20">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">
              Watch Your Resume Score Grow
            </h2>
            <p className="text-lg text-gray-600 mb-8">
              Our AI nurtures your resume against job descriptions and provides 
              actionable insights to help your career flourish.
            </p>
            <div className="space-y-4">
              {[
                { icon: Target, title: "Smart Keyword Growth", desc: "Match job requirements perfectly" },
                { icon: FileCheck, title: "ATS Compatibility", desc: "Pass automated screening systems" },
                { icon: TrendingUp, title: "Impact Cultivation", desc: "Quantify your achievements" },
                { icon: Zap, title: "Instant Growth", desc: "Get results in under 30 seconds" }
              ].map((feature, index) => (
                <div key={index} className="flex items-start space-x-3">
                  <div className="bg-green-100 p-2 rounded-lg">
                    <feature.icon className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-gray-900">{feature.title}</h4>
                    <p className="text-gray-600">{feature.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <Card className="p-8 shadow-2xl border-0 bg-gradient-to-br from-white to-green-50">
            <div className="text-center mb-6">
              <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-4">
                <span className="text-2xl font-bold text-green-600">87</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Overall Growth Score</h3>
              <p className="text-gray-600">Your resume is flourishing!</p>
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
                        className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" 
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
        <div id="pricing" className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Simple Growth Pricing</h2>
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
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>Get Started</Button>
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
              <Button className="w-full" onClick={() => navigate('/auth')}>Buy Credits</Button>
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
              <Button variant="outline" className="w-full" onClick={() => navigate('/auth')}>Buy Credits</Button>
            </Card>
          </div>
        </div>

        {/* About Section */}
        <div id="about" className="mb-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why Choose SproutCV?</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              We're committed to helping professionals like you achieve career success through cutting-edge AI technology and proven strategies.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Card className="p-6 text-center">
              <Shield className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Secure & Private</h3>
              <p className="text-gray-600">
                Your data is encrypted and never shared. We maintain the highest security standards to protect your information.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <Clock className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Lightning Fast</h3>
              <p className="text-gray-600">
                Get comprehensive resume analysis and optimization suggestions in under 30 seconds with our advanced AI.
              </p>
            </Card>
            
            <Card className="p-6 text-center">
              <Star className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 mb-3">Proven Results</h3>
              <p className="text-gray-600">
                Join thousands of successful professionals who've increased their interview rates by 3x using SproutCV.
              </p>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="p-12 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
            <h2 className="text-3xl font-bold mb-4">Ready to Sprout Your Dream Career?</h2>
            <p className="text-xl mb-8 text-green-100">
              Join thousands of professionals who've grown their interview rates with SproutCV
            </p>
            <Button 
              size="lg" 
              className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-6"
              onClick={() => navigate('/auth')}
            >
              Start Your Growth Journey
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Hero;
