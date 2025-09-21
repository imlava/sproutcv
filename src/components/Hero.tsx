
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { CheckCircle, Zap, Target, FileCheck, TrendingUp, ArrowRight, Sprout, Shield, Clock, Star, Users, Award, BarChart3 } from 'lucide-react';
import { useInView } from '@/hooks/useInView';
import { useCountUp } from '@/hooks/useCountUp';

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
              className="text-lg px-10 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-xl hover:shadow-2xl transition-all duration-200 transform hover:scale-105 shimmer-effect"
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

        {/* Enhanced Features Section with Animations */}
        <EnhancedFeaturesSection />

        {/* Enhanced Pricing Section with Animations */}
        <EnhancedPricingSection navigate={navigate} />

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
              <Card key={index} className="p-8 text-center hover:shadow-xl transition-all duration-200 bg-white feature-card">
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
                className="bg-white text-green-600 hover:bg-gray-100 text-lg px-10 py-6 shadow-xl hover:shadow-2xl transition-all duration-200 shimmer-effect"
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

// Enhanced Features Section Component
const EnhancedFeaturesSection = () => {
  const { ref: featuresRef, isInView: featuresInView } = useInView({ threshold: 0.1 });
  const { ref: dashboardRef, isInView: dashboardInView } = useInView({ threshold: 0.3 });

  return (
    <div id="features" className="mb-20 relative overflow-hidden" ref={featuresRef}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50/30 via-transparent to-green-50/30 pointer-events-none" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gradient-to-br from-green-200/20 to-blue-200/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gradient-to-br from-purple-200/20 to-pink-200/20 rounded-full blur-3xl animate-pulse animation-delay-2000" />
      
      <div className="relative">
        <div className="text-center mb-20">
          <div className="inline-block mb-6">
            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 px-6 py-2 text-sm font-semibold border-0 shadow-lg">
              ✨ Powered by Advanced AI
            </Badge>
          </div>
          <h2 className="text-5xl sm:text-7xl font-black text-black mb-8 leading-tight">
            AI-Powered
            <span className="block text-transparent bg-clip-text" style={{backgroundImage: 'linear-gradient(to right, rgb(22, 164, 74), rgb(5, 150, 105))'}}>
              Resume Intelligence
            </span>
          </h2>
          <p className="text-xl sm:text-2xl text-gray-800 max-w-4xl mx-auto leading-relaxed">
            Our advanced AI analyzes your resume against job descriptions and provides 
            <span className="font-semibold text-green-700"> actionable insights</span> to maximize your interview potential.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="space-y-6">
            {[
              { 
                icon: Target, 
                title: "Smart Keyword Optimization", 
                desc: "AI identifies exact keywords recruiters are looking for in your industry",
                accent: "text-green-600",
                bgColor: "bg-green-50/80"
              },
              { 
                icon: FileCheck, 
                title: "ATS Compatibility Check", 
                desc: "Ensure your resume passes through applicant tracking systems",
                accent: "text-emerald-600", 
                bgColor: "bg-emerald-50/80"
              },
              { 
                icon: TrendingUp, 
                title: "Impact Quantification", 
                desc: "Transform bullet points into powerful, metrics-driven achievements",
                accent: "text-green-700",
                bgColor: "bg-green-50/80"
              },
              { 
                icon: Zap, 
                title: "Instant Analysis", 
                desc: "Get comprehensive feedback and optimization in under 30 seconds",
                accent: "text-emerald-700",
                bgColor: "bg-emerald-50/80"
              }
            ].map((feature, index) => (
              <div 
                key={index} 
                className={`group relative p-6 ${feature.bgColor} rounded-2xl border border-green-100/50 hover:border-green-200 hover:shadow-lg transition-all duration-300 hover:-translate-y-1 ${
                  featuresInView ? 'animate-fade-in-up' : 'animate-on-scroll'
                }`}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0 p-3 bg-white rounded-xl shadow-sm group-hover:shadow-md transition-shadow duration-300">
                    <feature.icon className={`h-6 w-6 ${feature.accent}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-green-800 transition-colors duration-300">
                      {feature.title}
                    </h4>
                    <p className="text-gray-600 leading-relaxed group-hover:text-gray-700 transition-colors duration-300">
                      {feature.desc}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Enhanced Dashboard Preview with Counting Animations */}
          <div className="relative" ref={dashboardRef}>
            {/* Floating elements */}
            <div className="absolute -top-8 -left-8 w-20 h-20 bg-gradient-to-br from-green-400/20 to-blue-400/20 rounded-full animate-bounce" />
            <div className="absolute -bottom-4 -right-4 w-16 h-16 bg-gradient-to-br from-purple-400/20 to-pink-400/20 rounded-full animate-bounce animation-delay-1000" />
            
            <Card className={`relative p-10 shadow-2xl border-0 bg-gradient-to-br from-white via-gray-50/50 to-green-50/80 backdrop-blur-sm transform hover:scale-105 transition-all duration-700 hover:rotate-1 overflow-hidden ${
              dashboardInView ? 'animate-fade-in-scale' : 'animate-on-scroll'
            }`}>
              {/* Animated background pattern */}
              
              {/* Main score display */}
              <div className="relative text-center mb-8">
                <div className="relative inline-block mb-6">
                  <div className="inline-flex items-center justify-center w-24 h-24 bg-green-600 rounded-full shadow-lg">
                    <span className="text-3xl font-bold text-white">
                      {dashboardInView ? <AnimatedCounter end={94} /> : '0'}
                    </span>
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Resume Score</h3>
                <p className="text-gray-600">Optimized for maximum impact</p>
                
                {/* Achievement badges */}
                <div className="flex flex-wrap justify-center gap-2 mt-4">
                  <Badge className="bg-green-100 text-green-800 px-3 py-1">ATS Ready</Badge>
                  <Badge className="bg-emerald-100 text-emerald-800 px-3 py-1">Interview Ready</Badge>
                  <Badge className="bg-green-100 text-green-700 px-3 py-1">HR Approved</Badge>
                </div>
              </div>
              
              {/* Simplified metrics */}
              <div className="space-y-4">
                {[
                  { name: "Keyword Match", score: 96, color: "bg-green-500", icon: "🎯" },
                  { name: "ATS Compatibility", score: 94, color: "bg-emerald-500", icon: "✓" },
                  { name: "Skills Alignment", score: 92, color: "bg-green-600", icon: "⚡" },
                  { name: "Experience Match", score: 89, color: "bg-emerald-600", icon: "📈" }
                ].map((metric, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">{metric.icon}</span>
                        <span className="text-sm font-medium text-gray-700">{metric.name}</span>
                      </div>
                      <span className="text-sm font-semibold text-gray-900">
                        {dashboardInView ? <AnimatedCounter end={metric.score} delay={index * 100} /> : '0'}%
                      </span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${metric.color} h-2 rounded-full transition-all duration-1000 ease-out ${
                          dashboardInView ? 'w-full' : 'w-0'
                        }`}
                        style={{ 
                          transitionDelay: `${index * 100}ms`,
                          width: dashboardInView ? `${metric.score}%` : '0%'
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* AI Insights preview */}
              <div className="mt-6 p-4 bg-green-50 rounded-xl border border-green-100">
                <div className="flex items-center space-x-2 mb-2">
                  <div className="w-6 h-6 bg-green-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">AI</span>
                  </div>
                  <span className="font-medium text-gray-800 text-sm">Latest AI Insight</span>
                </div>
                <p className="text-xs text-gray-600">"Add 3 more technical skills to increase ATS compatibility by 12%"</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Pricing Section Component
const EnhancedPricingSection = ({ navigate }: { navigate: (path: string) => void }) => {
  const { ref: pricingRef, isInView: pricingInView } = useInView({ threshold: 0.1 });

  return (
    <div id="pricing" className="mb-20 relative overflow-hidden" ref={pricingRef}>
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-green-50/30 via-transparent to-emerald-50/30 pointer-events-none" />
      <div className="absolute top-1/4 right-1/3 w-96 h-96 bg-gradient-to-br from-green-200/20 to-emerald-200/20 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-gradient-to-br from-emerald-200/15 to-green-200/15 rounded-full blur-2xl animate-pulse animation-delay-2000" />
      
      <div className="relative">
        {/* Enhanced Header */}
        <div className="text-center mb-20">
          <div className="inline-block mb-8">
            <Badge className="bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 hover:from-green-200 hover:to-emerald-200 px-8 py-3 text-base font-semibold border-0 shadow-xl rounded-full">
              💰 Affordable Excellence
            </Badge>
          </div>
          <h2 className="text-5xl sm:text-6xl font-black text-gray-900 mb-8 leading-tight">
            Simple, Transparent
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600 mt-2">
              Pricing
            </span>
          </h2>
          <p className="text-xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
            Pay only for what you need. No subscriptions, no hidden fees. 
            <span className="font-semibold text-green-700"> Start free and scale</span> as you grow your career.
          </p>
          
          {/* Pricing Benefits */}
          <div className="flex flex-wrap justify-center items-center gap-6 text-sm text-gray-600">
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-green-100">
              <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
              No Hidden Fees
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-green-100">
              <Shield className="h-5 w-5 text-green-500 mr-2" />
              Secure Payments
            </div>
            <div className="flex items-center bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full shadow-lg border border-green-100">
              <Clock className="h-5 w-5 text-green-500 mr-2" />
              Instant Access
            </div>
          </div>
        </div>
      </div>
      
      {/* Improved Pricing Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
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
          <div key={index} className={`relative group h-full ${
            pricingInView ? 'animate-fade-in-up' : 'animate-on-scroll'
          }`} style={{ animationDelay: `${index * 150}ms` }}>
            
            <Card className={`relative h-full flex flex-col text-center transition-all duration-300 hover:-translate-y-2 rounded-2xl overflow-hidden border-2 pricing-card ${
              plan.popular 
                ? 'bg-gradient-to-br from-white via-green-50/80 to-emerald-50/90 shadow-xl border-green-500 hover:border-green-600 hover:shadow-2xl' 
                : 'bg-white shadow-lg border-gray-200 hover:border-green-400 hover:shadow-xl'
            }`}>
              
              {/* Embedded "Most Popular" Badge - Part of the card border */}
              {plan.popular && (
                <div className="absolute top-0 right-0 z-10">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white font-bold text-sm px-4 py-2 rounded-bl-2xl border-l-2 border-b-2 border-green-600 shadow-lg">
                    🚀 Most Popular
                  </div>
                </div>
              )}
              
              {/* Card Content with Improved Spacing */}
              <div className={`relative flex flex-col h-full ${plan.popular ? 'pt-12 p-6' : 'p-6'}`}>
                
                {/* Header Section - Improved Typography and Hierarchy */}
                <div className="mb-6 min-h-[140px] flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-gray-800 transition-colors duration-300">
                      {plan.name}
                    </h3>
                    <div className="mb-3">
                      <div className={`text-4xl font-black mb-2 ${
                        plan.popular 
                          ? 'text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-600' 
                          : 'text-gray-900 group-hover:text-green-700'
                      } transition-colors duration-300`}>
                        {plan.price}
                      </div>
                      {plan.originalPrice && (
                        <>
                          <div className="text-base text-gray-500 line-through mb-1">{plan.originalPrice}</div>
                          <div className="text-xs text-green-600 font-semibold bg-green-100 px-2 py-1 rounded-full inline-block">
                            🎉 20% Launch Discount
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-600 group-hover:text-gray-700 transition-colors duration-300 font-medium leading-relaxed">
                    {plan.description}
                  </p>
                </div>
                
                {/* Features Section - Improved Readability */}
                <div className="flex-1 mb-6">
                  <ul className="space-y-3 text-sm text-gray-600 text-left min-h-[200px]">
                    {plan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-start group-hover:text-gray-700 transition-colors duration-300">
                        <div className="relative mr-3 flex-shrink-0 mt-0.5">
                          <CheckCircle className="h-4 w-4 text-green-500 group-hover:text-green-600 transition-colors duration-300" />
                        </div>
                        <span className="font-medium leading-relaxed">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                
                {/* CTA Button - Enhanced with Shimmer Effect */}
                <div className="mt-auto">
                  <Button 
                    className={`w-full relative overflow-hidden group/btn shimmer-effect ${
                      plan.popular 
                        ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg hover:shadow-xl transform hover:scale-105' 
                        : 'bg-white border-2 border-green-200 text-gray-900 hover:border-green-400 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 hover:text-green-700'
                    } transition-all duration-300 py-3 font-semibold text-base rounded-xl`}
                    onClick={() => navigate('/auth')}
                  >
                    <span className="relative z-10">{plan.cta}</span>
                  </Button>
                </div>
              </div>
              
              {/* Subtle Hover Effects - Floating Elements */}
              <div className="absolute top-4 right-4 w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping transition-opacity duration-300" />
              <div className="absolute bottom-6 left-4 w-1.5 h-1.5 bg-gradient-to-r from-emerald-400 to-green-400 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping animation-delay-700 transition-opacity duration-300" />
            </Card>
          </div>
        ))}
      </div>
    </div>
  );
};

// Animated Counter Component
const AnimatedCounter = ({ end, delay = 0 }: { end: number; delay?: number }) => {
  const count = useCountUp({ end, duration: 2000, delay, enabled: true });
  return <span className="metric-counter">{count}</span>;
};

export default Hero;
