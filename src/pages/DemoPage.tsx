
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import EnhancedAnimatedDemo from '@/components/EnhancedAnimatedDemo';
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
  Shield,
  Sparkles,
  Trophy,
  Rocket,
  Eye,
  Heart,
  Globe
} from 'lucide-react';

const DemoPage = () => {
  const navigate = useNavigate();

  const processSteps = [
    {
      step: 1,
      icon: Upload,
      title: "Smart Upload & Parse",
      description: "AI instantly understands your resume structure, content, and formatting preferences",
      gradient: "from-blue-500 to-cyan-500",
      features: ["Instant parsing", "Format detection", "Content extraction"]
    },
    {
      step: 2,
      icon: BarChart3,
      title: "Deep AI Analysis",
      description: "Advanced algorithms analyze keywords, ATS compatibility, and optimization opportunities",
      gradient: "from-purple-500 to-pink-500",
      features: ["Keyword analysis", "ATS scoring", "Gap identification"]
    },
    {
      step: 3,
      icon: Target,
      title: "Strategic Optimization",
      description: "AI applies proven strategies to enhance your resume's impact and effectiveness",
      gradient: "from-green-500 to-emerald-500",
      features: ["Content enhancement", "Keyword placement", "Impact optimization"]
    },
    {
      step: 4,
      icon: Download,
      title: "Professional Export",
      description: "Download your interview-ready, ATS-optimized resume in multiple formats",
      gradient: "from-orange-500 to-red-500",
      features: ["Multiple formats", "ATS compatible", "Interview ready"]
    }
  ];

  const achievements = [
    {
      icon: Users,
      title: "50,000+ Success Stories",
      description: "Professionals worldwide trust SproutCV",
      stat: "50k+",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      icon: TrendingUp,
      title: "400% More Interviews",
      description: "Average increase in interview requests",
      stat: "400%",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      icon: Target,
      title: "99% ATS Pass Rate",
      description: "Successfully passes major ATS systems",
      stat: "99%",
      gradient: "from-purple-500 to-pink-500"
    },
    {
      icon: Clock,
      title: "30 Second Analysis",
      description: "Lightning-fast resume optimization",
      stat: "30s",
      gradient: "from-orange-500 to-red-500"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Software Engineer at Google",
      image: "S",
      quote: "SproutCV transformed my resume from average to outstanding. I went from 0 responses to 8 interview invitations in just 2 weeks!",
      metrics: "Interview rate: +500%",
      gradient: "from-green-500 to-emerald-500"
    },
    {
      name: "Marcus Rodriguez",
      role: "Product Manager at Microsoft",
      image: "M", 
      quote: "The AI insights were incredible. It identified exactly what my resume was missing and helped me land my dream job at Microsoft.",
      metrics: "Resume score: 47% → 96%",
      gradient: "from-blue-500 to-cyan-500"
    },
    {
      name: "Emily Johnson",
      role: "Marketing Director at Spotify",
      image: "E",
      quote: "Finally, a tool that actually understands ATS systems. My resume now gets past the initial screening every time.",
      metrics: "Response rate: 3% → 42%",
      gradient: "from-purple-500 to-pink-500"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50">
      <Header />
      
      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="absolute inset-0 bg-grid-green-100 bg-[size:32px_32px] opacity-20" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="pt-24 pb-20 text-center">
            <div className="inline-flex items-center space-x-2 bg-white/80 backdrop-blur-sm px-6 py-3 rounded-full border border-green-200 shadow-lg mb-8">
              <Sparkles className="h-5 w-5 text-green-600" />
              <span className="text-green-700 font-semibold">Experience SproutCV Live Demo</span>
              <Eye className="h-5 w-5 text-green-600" />
            </div>
            
            <h1 className="text-6xl sm:text-7xl font-black text-gray-900 mb-8 leading-tight">
              See How SproutCV
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 block mt-2">
                Creates Magic
              </span>
            </h1>
            
            <p className="text-2xl text-gray-600 mb-12 max-w-4xl mx-auto leading-relaxed">
              Witness the complete transformation of a resume from ordinary to extraordinary. 
              Every step is real, every improvement is strategic, every result is measurable.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
              <Button 
                size="lg" 
                className="text-xl px-12 py-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105"
                onClick={() => navigate('/auth')}
              >
                <Rocket className="mr-3 h-6 w-6" />
                Start Your Transformation
              </Button>
              
              <div className="flex items-center space-x-3 text-gray-600">
                <div className="flex -space-x-2">
                  {['S', 'M', 'E', 'J', 'A'].map((letter, idx) => (
                    <div key={idx} className={`w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm border-2 border-white shadow-lg`}>
                      {letter}
                    </div>
                  ))}
                </div>
                <span className="font-medium">Join 50,000+ successful professionals</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Process Overview */}
        <div className="py-20">
          <div className="text-center mb-16">
            <Badge className="bg-blue-100 text-blue-800 px-6 py-3 text-lg font-semibold mb-6">
              <Zap className="h-5 w-5 mr-2" />
              The Complete Journey
            </Badge>
            <h2 className="text-5xl font-black text-gray-900 mb-8">
              From Upload to Success
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Experience every step of our proven optimization process that has helped 
              50,000+ professionals land their dream jobs
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 mb-16">
            {processSteps.map((step, index) => (
              <Card key={index} className="p-8 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 border-2 border-gray-100 group">
                <div className={`w-20 h-20 bg-gradient-to-r ${step.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                
                <div className="text-center">
                  <Badge className="bg-gray-100 text-gray-800 px-3 py-1 text-sm mb-4">
                    Step {step.step}
                  </Badge>
                  <h3 className="text-2xl font-bold text-gray-900 mb-4">{step.title}</h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">{step.description}</p>
                  
                  <div className="space-y-2">
                    {step.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-center space-x-2 text-green-700">
                        <CheckCircle className="h-4 w-4" />
                        <span className="text-sm font-medium">{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Main Demo Section */}
        <div className="py-20">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 text-lg font-semibold mb-6 shadow-lg">
              <Globe className="h-5 w-5 mr-2" />
              Live Interactive Experience
            </Badge>
            <h2 className="text-5xl font-black text-gray-900 mb-8">
              Real SproutCV Dashboard
            </h2>
            <p className="text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              This isn't just a demo—it's the actual SproutCV experience. 
              Scroll through each step and watch as AI transforms a real resume in real-time.
            </p>
          </div>

          <EnhancedAnimatedDemo />
        </div>

        {/* Achievement Stats */}
        <div className="py-20">
          <div className="text-center mb-16">
            <Badge className="bg-yellow-100 text-yellow-800 px-6 py-3 text-lg font-semibold mb-6">
              <Trophy className="h-5 w-5 mr-2" />
              Proven Results
            </Badge>
            <h2 className="text-5xl font-black text-gray-900 mb-8">
              Numbers Don't Lie
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Real data from real users who transformed their careers with SproutCV
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {achievements.map((achievement, index) => (
              <Card key={index} className="p-8 text-center bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className={`w-20 h-20 bg-gradient-to-r ${achievement.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl`}>
                  <achievement.icon className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl font-black text-gray-900 mb-2">{achievement.stat}</div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{achievement.title}</h3>
                <p className="text-gray-600 leading-relaxed">{achievement.description}</p>
              </Card>
            ))}
          </div>
        </div>

        {/* Testimonials */}
        <div className="py-20">
          <div className="text-center mb-16">
            <Badge className="bg-pink-100 text-pink-800 px-6 py-3 text-lg font-semibold mb-6">
              <Heart className="h-5 w-5 mr-2" />
              Success Stories
            </Badge>
            <h2 className="text-5xl font-black text-gray-900 mb-8">
              Real People, Real Results
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Hear from professionals who transformed their careers using SproutCV
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="p-8 bg-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${testimonial.gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg`}>
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed italic">"{testimonial.quote}"</p>
                
                <Badge className="bg-green-100 text-green-800 font-semibold">
                  {testimonial.metrics}
                </Badge>
                
                <div className="flex items-center mt-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                  ))}
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Security & Trust */}
        <div className="py-20">
          <Card className="p-16 bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 text-white text-center shadow-2xl">
            <Shield className="h-20 w-20 mx-auto mb-8 opacity-90" />
            <h2 className="text-4xl font-bold mb-8">Bank-Level Security</h2>
            <p className="text-xl text-blue-100 mb-10 max-w-4xl mx-auto leading-relaxed">
              Your privacy is our priority. All data is encrypted end-to-end, never stored permanently, 
              and automatically deleted after processing. Trusted by Fortune 500 companies.
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-lg">
              {[
                'End-to-End Encryption',
                'SOC 2 Compliant', 
                'GDPR Compliant',
                'Zero Data Retention',
                'ISO 27001 Certified'
              ].map((feature, idx) => (
                <div key={idx} className="flex items-center space-x-2">
                  <CheckCircle className="h-5 w-5" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Final CTA */}
        <div className="py-20 text-center">
          <Card className="p-20 bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 text-white border-0 shadow-2xl">
            <Sparkles className="h-20 w-20 mx-auto mb-8 opacity-90" />
            <h2 className="text-5xl font-black mb-8">
              Your Dream Job Awaits
            </h2>
            <p className="text-2xl mb-12 text-green-100 max-w-4xl mx-auto leading-relaxed">
              You've seen the transformation. You've witnessed the results. 
              Now it's time to experience the magic yourself and unlock your career potential.
            </p>
            
            <div className="flex flex-col lg:flex-row gap-8 justify-center items-center mb-12">
              <Button 
                size="lg" 
                className="bg-white text-green-600 hover:bg-gray-100 text-2xl px-16 py-8 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 font-bold"
                onClick={() => navigate('/auth')}
              >
                <Rocket className="mr-4 h-8 w-8" />
                Transform My Resume Now
              </Button>
              
              <Button 
                size="lg" 
                variant="outline"
                className="border-4 border-white text-white hover:bg-white hover:text-green-600 text-2xl px-16 py-8 transition-all duration-300 font-bold"
                onClick={() => navigate('/analyze')}
              >
                Try Free Analysis
                <ArrowRight className="ml-4 h-8 w-8" />
              </Button>
            </div>
            
            <div className="flex items-center justify-center space-x-8 text-green-100">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6" />
                <span className="text-lg">No Credit Card Required</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6" />
                <span className="text-lg">Instant Results</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-6 w-6" />
                <span className="text-lg">100% Secure</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default DemoPage;
