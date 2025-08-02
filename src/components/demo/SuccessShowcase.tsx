
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Trophy,
  Star,
  TrendingUp,
  Users,
  Target,
  Rocket,
  ArrowRight,
  Quote,
  LinkedinIcon,
  Mail,
  Building2,
  Award
} from 'lucide-react';

const SuccessShowcase = () => {
  const navigate = useNavigate();
  const [activeTestimonial, setActiveTestimonial] = useState(0);

  const achievements = [
    {
      icon: Users,
      value: "50k+",
      label: "Careers Transformed",
      description: "Professionals worldwide trust SproutCV",
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      icon: TrendingUp,
      value: "340%",
      label: "Interview Rate Boost",
      description: "Average increase in interview invitations",
      gradient: "from-emerald-600 to-teal-600"
    },
    {
      icon: Target,
      value: "97%",
      label: "ATS Success Rate",
      description: "Pass rate through major ATS systems",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      icon: Award,
      value: "15s",
      label: "Processing Time",
      description: "Lightning-fast AI optimization",
      gradient: "from-orange-600 to-red-600"
    }
  ];

  const testimonials = [
    {
      name: "Sarah Chen",
      role: "Senior Software Engineer",
      company: "Google",
      image: "SC",
      quote: "SproutCV didn't just optimize my resume—it revolutionized my entire career trajectory. From 2 months of silence to 12 interview invitations in 3 weeks.",
      metrics: { before: "0 responses", after: "12 interviews", improvement: "+500%" },
      gradient: "from-green-600 to-emerald-600",
      linkedin: "linkedin.com/in/sarachen"
    },
    {
      name: "Marcus Rodriguez",
      role: "Product Manager",
      company: "Microsoft",
      image: "MR", 
      quote: "The AI insights were phenomenal. It identified gaps I never knew existed and transformed my resume into a conversation starter with hiring managers.",
      metrics: { before: "3% response rate", after: "67% response rate", improvement: "+2100%" },
      gradient: "from-blue-600 to-cyan-600",
      linkedin: "linkedin.com/in/marcusr"
    },
    {
      name: "Emily Johnson",
      role: "Marketing Director",
      company: "Stripe",
      image: "EJ",
      quote: "Finally, a tool that understands both human recruiters and ATS systems. My resume now opens doors I never thought possible.",
      metrics: { before: "47% ATS score", after: "96% ATS score", improvement: "+104%" },
      gradient: "from-purple-600 to-pink-600",
      linkedin: "linkedin.com/in/emilyjohnson"
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-gray-50 to-blue-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        
        {/* Achievement Stats */}
        <div className="text-center mb-20">
          <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-8 py-3 text-lg font-semibold mb-6 shadow-xl">
            <Trophy className="h-5 w-5 mr-2" />
            Proven Excellence
          </Badge>
          <h2 className="text-6xl font-black text-gray-900 mb-8">
            Numbers That
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-500 to-orange-500 block">
              Speak Volumes
            </span>
          </h2>
          <p className="text-2xl text-gray-600 max-w-4xl mx-auto mb-16 leading-relaxed">
            Real metrics from real professionals who transformed their careers
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            {achievements.map((achievement, index) => (
              <Card key={index} className="group relative overflow-hidden p-8 bg-white shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:scale-105 border border-gray-100">
                {/* Background gradient on hover */}
                <div className={`absolute inset-0 bg-gradient-to-r ${achievement.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-500`} />
                
                <div className="relative z-10 text-center">
                  <div className={`w-20 h-20 bg-gradient-to-r ${achievement.gradient} rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl group-hover:scale-110 transition-transform duration-300`}>
                    <achievement.icon className="h-10 w-10 text-white" />
                  </div>
                  <div className="text-5xl font-black text-gray-900 mb-3">{achievement.value}</div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">{achievement.label}</h3>
                  <p className="text-gray-600 leading-relaxed">{achievement.description}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Success Stories */}
        <div className="mb-20">
          <div className="text-center mb-16">
            <Badge className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-8 py-3 text-lg font-semibold mb-6 shadow-xl">
              <Quote className="h-5 w-5 mr-2" />
              Success Stories
            </Badge>
            <h2 className="text-6xl font-black text-gray-900 mb-8">
              Real People,
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-rose-500 block">
                Real Results
              </span>
            </h2>
          </div>

          {/* Featured Testimonial */}
          <Card className="p-12 bg-gradient-to-r from-gray-900 via-purple-900 to-blue-900 text-white shadow-2xl rounded-3xl mb-12 overflow-hidden relative">
            <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-blue-500/10" />
            <div className="relative z-10">
              <div className="flex flex-col lg:flex-row items-center space-y-8 lg:space-y-0 lg:space-x-12">
                <div className="flex-shrink-0">
                  <div className={`w-32 h-32 bg-gradient-to-r ${testimonials[activeTestimonial].gradient} rounded-3xl flex items-center justify-center text-white font-black text-4xl shadow-2xl`}>
                    {testimonials[activeTestimonial].image}
                  </div>
                </div>
                <div className="flex-1 text-center lg:text-left">
                  <Quote className="h-12 w-12 text-purple-300 mb-6 mx-auto lg:mx-0" />
                  <p className="text-2xl leading-relaxed mb-8 italic">
                    "{testimonials[activeTestimonial].quote}"
                  </p>
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                    <div className="mb-6 lg:mb-0">
                      <h4 className="text-2xl font-bold">{testimonials[activeTestimonial].name}</h4>
                      <p className="text-xl text-purple-200">{testimonials[activeTestimonial].role}</p>
                      <div className="flex items-center space-x-2 mt-2">
                        <Building2 className="h-5 w-5 text-blue-300" />
                        <span className="text-blue-300 font-medium">{testimonials[activeTestimonial].company}</span>
                      </div>
                    </div>
                    <div className="bg-white/10 backdrop-blur-sm p-6 rounded-2xl">
                      <div className="text-center">
                        <div className="text-3xl font-black text-emerald-400 mb-1">
                          {testimonials[activeTestimonial].metrics.improvement}
                        </div>
                        <div className="text-sm text-gray-300">
                          {testimonials[activeTestimonial].metrics.before} → {testimonials[activeTestimonial].metrics.after}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          {/* Testimonial Navigation */}
          <div className="flex justify-center space-x-4 mb-16">
            {testimonials.map((_, index) => (
              <button
                key={index}
                className={`w-4 h-4 rounded-full transition-all duration-300 ${
                  index === activeTestimonial 
                    ? 'bg-purple-600 scale-125 shadow-lg' 
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                onClick={() => setActiveTestimonial(index)}
              />
            ))}
          </div>

          {/* Additional Testimonials Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-20">
            {testimonials.map((testimonial, index) => (
              <Card 
                key={index} 
                className={`p-8 transition-all duration-300 cursor-pointer transform hover:scale-105 ${
                  index === activeTestimonial 
                    ? 'shadow-2xl border-2 border-purple-200 bg-gradient-to-br from-white to-purple-50' 
                    : 'shadow-lg hover:shadow-xl bg-white'
                }`}
                onClick={() => setActiveTestimonial(index)}
              >
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 bg-gradient-to-r ${testimonial.gradient} rounded-2xl flex items-center justify-center text-white font-bold text-xl mr-4 shadow-lg`}>
                    {testimonial.image}
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{testimonial.name}</h4>
                    <p className="text-gray-600">{testimonial.role}</p>
                    <p className="text-sm text-gray-500 flex items-center mt-1">
                      <Building2 className="h-3 w-3 mr-1" />
                      {testimonial.company}
                    </p>
                  </div>
                </div>
                
                <p className="text-gray-700 mb-6 leading-relaxed italic text-lg">
                  "{testimonial.quote.substring(0, 120)}..."
                </p>
                
                <div className="flex items-center justify-between">
                  <Badge className={`bg-gradient-to-r ${testimonial.gradient} text-white font-semibold px-3 py-2`}>
                    {testimonial.metrics.improvement}
                  </Badge>
                  
                  <div className="flex items-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Final CTA */}
          <div className="text-center">
            <Card className="inline-block p-16 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 text-white shadow-2xl rounded-3xl border-0 transform hover:scale-105 transition-transform duration-300">
              <Rocket className="h-20 w-20 mx-auto mb-8 opacity-90" />
              <h2 className="text-5xl font-black mb-6">
                Ready to Join Them?
              </h2>
              <p className="text-2xl mb-10 text-emerald-100 max-w-3xl mx-auto leading-relaxed">
                Experience the same transformation that launched 50,000+ careers
              </p>
              
              <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
                <Button 
                  size="lg" 
                  className="bg-white text-emerald-600 hover:bg-gray-100 text-2xl px-12 py-6 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105 font-bold rounded-2xl"
                  onClick={() => navigate('/auth')}
                >
                  <Rocket className="mr-4 h-8 w-8" />
                  Start My Transformation
                </Button>
                
                <Button 
                  size="lg" 
                  variant="outline"
                  className="border-4 border-white text-white hover:bg-white hover:text-emerald-600 text-2xl px-12 py-6 transition-all duration-300 font-bold rounded-2xl"
                  onClick={() => navigate('/analyze')}
                >
                  Try Free Analysis
                  <ArrowRight className="ml-4 h-8 w-8" />
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SuccessShowcase;
