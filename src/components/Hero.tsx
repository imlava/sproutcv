
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Target, FileCheck, TrendingUp, ArrowRight, Sprout, Shield, Clock, Star, Users, Award, BarChart3 } from 'lucide-react';

const Hero = () => {
  const navigate = useNavigate();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-grid-gray-100 bg-[size:20px_20px] opacity-30" />
      <div className="absolute top-0 -right-4 w-72 h-72 bg-green-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob" />
      <div className="absolute top-0 -left-4 w-72 h-72 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        {/* Hero Section */}
        <div className="pt-20 pb-16 text-center">
          <div className="flex items-center justify-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl mr-4">
              <Sprout className="h-8 w-8 text-white" />
            </div>
            <Badge className="bg-green-100 text-green-800 hover:bg-green-200 px-4 py-2 text-sm font-semibold">
              🚀 AI-Powered Career Growth
            </Badge>
          </div>
          
          <h1 className="text-5xl sm:text-7xl font-black text-gray-900 mb-6 leading-tight tracking-tight">
            Grow Your Career with
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 block mt-2">
              SproutCV
            </span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-gray-600 mb-8 max-w-4xl mx-auto leading-relaxed font-light">
            Transform your resume with AI-powered analysis, ATS optimization, and personalized insights. 
            <span className="font-semibold text-green-700"> Join thousands of professionals</span> who've accelerated their careers.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="text-lg px-10 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105"
              onClick={() => navigate('/auth')}
            >
              Start Growing Free
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="text-lg px-10 py-6 border-2 border-gray-300 hover:border-green-300 hover:bg-green-50 transition-all duration-200"
              onClick={() => navigate('/how-it-works')}
            >
              See How It Works
            </Button>
          </div>
          
          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-gray-600 mb-20">
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
              <Users className="h-4 w-4 text-green-500 mr-2" />
              Thousands of Users
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
              <Award className="h-4 w-4 text-blue-500 mr-2" />
              95% ATS Compatible
            </div>
            <div className="flex items-center bg-white px-4 py-2 rounded-full shadow-sm">
              <BarChart3 className="h-4 w-4 text-purple-500 mr-2" />
              4x More Interviews
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div id="features" className="mb-20">
          {/* Achievement Badges */}
          <div className="flex flex-wrap justify-center items-center gap-6 mb-16">
            <div className="flex items-center bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 px-6 py-3 rounded-full">
              <Award className="h-5 w-5 text-emerald-600 mr-2" />
              <div className="text-center">
                <div className="text-sm font-bold text-emerald-700">Product of the Month</div>
                <div className="text-xs text-emerald-600">PRODUCT HUNT</div>
              </div>
            </div>
            <div className="flex items-center bg-gradient-to-r from-blue-50 to-cyan-50 border border-blue-200 px-6 py-3 rounded-full">
              <Star className="h-5 w-5 text-blue-600 mr-2" />
              <div className="text-center">
                <div className="text-sm font-bold text-blue-700">Featured by</div>
                <div className="text-xs text-blue-600">TOP PICK</div>
              </div>
            </div>
          </div>

          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-6xl font-black text-gray-900 mb-6 leading-tight">
              No More Solo Resume Building
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-emerald-500 to-teal-500 mt-2">
                DO IT WITH AI COPILOT
              </span>
            </h2>
            <p className="text-xl sm:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Our AI makes landing job interviews <span className="font-bold text-emerald-600">dramatically easier and faster!</span> - 
              get optimized keywords, ATS compatibility, and insider insights in less than 1 min!
            </p>
          </div>

          {/* Interactive Dashboard Preview */}
          <div className="max-w-7xl mx-auto mb-20">
            <div className="relative bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 rounded-3xl p-8 border border-emerald-100 shadow-2xl">
              {/* Dashboard Header */}
              <div className="flex items-center justify-between mb-8 p-6 bg-white rounded-2xl shadow-lg">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-xl flex items-center justify-center">
                    <Sprout className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">SproutCV Dashboard</h3>
                    <p className="text-gray-600">AI-Powered Resume Analysis</p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <div className="flex items-center bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm font-semibold">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></div>
                    Recommended
                  </div>
                  <div className="flex items-center bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                    Applied: 23
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Job Match Card */}
                <div className="lg:col-span-2 bg-white rounded-2xl p-6 shadow-lg">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-xl flex items-center justify-center text-white font-bold">
                        G
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-gray-900">Senior Software Engineer</h4>
                        <p className="text-gray-600">Google • San Francisco, CA • Full Time</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-500 text-white hover:bg-emerald-600">APPLY NOW</Badge>
                  </div>
                  
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <Target className="h-4 w-4 mr-1" />
                      $120k/yr - $180k/yr
                    </div>
                    <div className="flex items-center text-sm text-gray-600">
                      <Clock className="h-4 w-4 mr-1" />
                      1 hour ago
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-xl mb-4">
                    <div className="flex items-center mb-2">
                      <Zap className="h-4 w-4 text-emerald-600 mr-2" />
                      <span className="text-sm font-semibold text-emerald-700">Why This Job Is A Match</span>
                    </div>
                    <p className="text-sm text-gray-700">Your React and TypeScript skills align perfectly with their tech stack. Strong experience in cloud platforms matches their requirements.</p>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">Less than 25 applicants</div>
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm">ASK ORION</Button>
                      <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">Quick Guide</Button>
                    </div>
                  </div>
                </div>

                {/* Score Card */}
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <div className="text-center mb-6">
                    <div className="relative w-32 h-32 mx-auto mb-4">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                        <span className="text-3xl font-black text-white">97%</span>
                      </div>
                      <div className="absolute -inset-2 bg-gradient-to-br from-emerald-200 to-teal-200 rounded-full opacity-20 animate-pulse"></div>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">STRONG MATCH</h3>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">✓ H1B Sponsorship</span>
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">✓ Actively Hiring</span>
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">✓ Career Opportunities</span>
                      <CheckCircle className="h-4 w-4 text-emerald-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* AI Copilot Chat */}
              <div className="mt-8 bg-white rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold text-sm">AI</span>
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">Orion</h4>
                      <p className="text-xs text-gray-600">Your AI Copilot</p>
                    </div>
                    <Badge variant="outline" className="text-xs">PRO</Badge>
                  </div>
                  <Button size="sm" variant="outline">Quick Guide</Button>
                </div>
                
                <div className="bg-emerald-50 p-4 rounded-xl">
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>Hi, I'm Orion, your AI Copilot to navigate you through the job universe.</strong>
                  </p>
                  <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600 text-white">
                    Show me Connections for potential referral
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { 
                icon: Target, 
                title: "Smart Job Matching", 
                desc: "AI identifies perfect role matches based on your skills and experience",
                color: "from-emerald-500 to-teal-500",
                bgColor: "from-emerald-50 to-teal-50"
              },
              { 
                icon: FileCheck, 
                title: "ATS Optimization", 
                desc: "Ensure your resume passes through all applicant tracking systems",
                color: "from-blue-500 to-cyan-500",
                bgColor: "from-blue-50 to-cyan-50"
              },
              { 
                icon: Users, 
                title: "Insider Connections", 
                desc: "Get recommended connections at your target companies for referrals",
                color: "from-purple-500 to-pink-500",
                bgColor: "from-purple-50 to-pink-50"
              },
              { 
                icon: Zap, 
                title: "Instant Analysis", 
                desc: "Get comprehensive feedback and optimization in under 30 seconds",
                color: "from-orange-500 to-red-500",
                bgColor: "from-orange-50 to-red-50"
              }
            ].map((feature, index) => (
              <Card key={index} className={`p-8 text-center border-0 bg-gradient-to-br ${feature.bgColor} hover:shadow-xl transition-all duration-300 transform hover:-translate-y-2 group`}>
                <div className={`inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br ${feature.color} rounded-2xl mb-6 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-gray-900 mb-4">{feature.title}</h4>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Pay only for what you need. No subscriptions, no hidden fees. 
              Start free and scale as you grow your career.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 max-w-6xl mx-auto">
            {[
              {
                name: "Free Trial",
                price: "$0",
                description: "Perfect for getting started",
                features: [
                  "1 Resume Analysis",
                  "Basic ATS Check",
                  "Score Overview",
                  "Email Support"
                ],
                popular: false,
                cta: "Start Free"
              },
              {
                name: "Starter",
                price: "$5",
                originalPrice: "$6.25",
                description: "For active job seekers",
                features: [
                  "5 Resume Analyses",
                  "Detailed Suggestions",
                  "ATS Optimization",
                  "PDF Export",
                  "Priority Support"
                ],
                popular: false,
                cta: "Get Started"
              },
              {
                name: "Pro",
                price: "$15",
                originalPrice: "$18.75",
                description: "Most popular choice",
                features: [
                  "15 Resume Analyses",
                  "Advanced AI Insights",
                  "Cover Letter Tips",
                  "Interview Prep",
                  "LinkedIn Optimization",
                  "1-on-1 Support"
                ],
                popular: true,
                cta: "Go Pro"
              },
              {
                name: "Expert Services",
                price: "Contact Us",
                description: "For customized solutions",
                features: [
                  "Unlimited Analyses",
                  "Personal Career Coach",
                  "Custom Templates",
                  "Priority Review",
                  "Dedicated Support"
                ],
                popular: false,
                cta: "Contact Us"
              }
            ].map((plan, index) => (
              <Card key={index} className={`p-8 text-center relative ${
                plan.popular 
                  ? 'border-2 border-green-500 shadow-2xl scale-105 bg-gradient-to-br from-white to-green-50' 
                  : 'border border-gray-200 shadow-lg hover:shadow-xl'
              } transition-all duration-200`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500 text-white">
                    Most Popular
                  </Badge>
                )}
                <h3 className="text-2xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                <div className="mb-2">
                  <div className="text-4xl font-black text-gray-900">{plan.price}</div>
                  {plan.originalPrice && (
                    <div className="text-lg text-gray-500 line-through">{plan.originalPrice}</div>
                  )}
                  {plan.originalPrice && (
                    <div className="text-sm text-green-600 font-semibold">20% Launch Discount</div>
                  )}
                </div>
                <p className="text-gray-600 mb-6">{plan.description}</p>
                <ul className="space-y-3 text-sm text-gray-600 mb-8 text-left">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-3 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className={`w-full ${
                    plan.popular 
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg' 
                      : 'bg-white border-2 border-gray-200 text-gray-900 hover:border-green-300 hover:bg-green-50'
                  } transition-all duration-200`}
                  onClick={() => navigate('/auth')}
                >
                  {plan.cta}
                </Button>
              </Card>
            ))}
          </div>
        </div>

        {/* About Section */}
        <div id="about" className="mb-20">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-6">
              Why Choose SproutCV?
            </h2>
            <p className="text-xl text-gray-600 max-w-4xl mx-auto">
              We're on a mission to democratize career success through cutting-edge AI technology 
              and proven optimization strategies.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                icon: Shield,
                title: "Enterprise-Grade Security",
                description: "Your data is encrypted at rest and in transit. We're SOC 2 compliant and never share your information with third parties.",
                color: "bg-blue-100 text-blue-600"
              },
              {
                icon: Clock,
                title: "Lightning-Fast Analysis",
                description: "Get comprehensive resume analysis and optimization suggestions in under 30 seconds with our advanced AI algorithms.",
                color: "bg-green-100 text-green-600"
              },
              {
                icon: Star,
                title: "Proven Success Stories",
                description: "Join thousands of professionals who've accelerated their careers with AI-powered resume optimization.",
                color: "bg-purple-100 text-purple-600"
              }
            ].map((benefit, index) => (
              <Card key={index} className="p-8 text-center hover:shadow-xl transition-all duration-200 bg-white">
                <div className={`inline-flex items-center justify-center w-16 h-16 ${benefit.color} rounded-2xl mb-6`}>
                  <benefit.icon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">{benefit.title}</h3>
                <p className="text-gray-600 leading-relaxed">{benefit.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center mb-20">
          <Card className="p-16 bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0 shadow-2xl">
            <h2 className="text-4xl sm:text-5xl font-bold mb-6">
              Ready to Accelerate Your Career?
            </h2>
            <p className="text-xl mb-10 text-green-100 max-w-3xl mx-auto">
              Join thousands of professionals who've transformed their careers with SproutCV. 
              Your dream job is just one optimized resume away.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-200"
                onClick={() => navigate('/auth')}
              >
                Start Your Growth Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-2 border-white text-white bg-transparent hover:bg-white hover:text-green-600 text-lg px-10 py-6 transition-all duration-200 shadow-lg hover:shadow-xl"
                onClick={() => navigate('/how-it-works')}
              >
                Watch Demo
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Hero;
