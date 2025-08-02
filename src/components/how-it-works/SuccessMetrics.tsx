import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  Award, 
  Building, 
  Star,
  ArrowRight,
  Sparkles
} from 'lucide-react';

const SuccessMetrics = () => {
  const navigate = useNavigate();

  const mainMetrics = [
    {
      icon: Users,
      value: "50,000+",
      label: "Resumes Transformed",
      description: "Professionals who've improved their career prospects"
    },
    {
      icon: TrendingUp,
      value: "3x",
      label: "Higher Interview Rate",
      description: "Compared to non-optimized resumes"
    },
    {
      icon: Clock,
      value: "< 30s",
      label: "Average Processing",
      description: "From upload to optimized resume"
    },
    {
      icon: Award,
      value: "99.7%",
      label: "ATS Pass Rate",
      description: "Successfully parsed by tracking systems"
    }
  ];

  const industryStats = [
    { industry: "Technology", success: "94%", interviews: "4.2x" },
    { industry: "Healthcare", success: "91%", interviews: "3.8x" },
    { industry: "Finance", success: "96%", interviews: "4.1x" },
    { industry: "Marketing", success: "89%", interviews: "3.5x" },
    { industry: "Engineering", success: "97%", interviews: "4.5x" },
    { industry: "Sales", success: "88%", interviews: "3.2x" }
  ];

  const testimonialData = [
    {
      quote: "Got 3 interview calls in the first week after using SproutCV. The transformation was incredible!",
      author: "Sarah Chen",
      role: "Software Engineer",
      company: "Google"
    },
    {
      quote: "My resume score jumped from 45% to 94%. I landed my dream job within 2 weeks.",
      author: "Michael Rodriguez",
      role: "Marketing Manager",
      company: "Spotify"
    },
    {
      quote: "The AI understood exactly what recruiters in my industry were looking for. Amazing technology!",
      author: "Emily Watson",
      role: "Data Scientist",
      company: "Tesla"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-6">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <Badge variant="outline" className="mb-4 px-4 py-2">
            <Star className="w-4 h-4 mr-2" />
            Success Stories
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">
            Proven{' '}
            <span className="bg-gradient-to-r from-primary to-foreground bg-clip-text text-transparent">
              Results
            </span>
          </h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of professionals who've accelerated their careers with SproutCV
          </p>
        </div>

        {/* Main Metrics Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {mainMetrics.map((metric, index) => {
            const Icon = metric.icon;
            
            return (
              <Card key={index} className="text-center border-2 border-border hover:border-primary/30 transition-all duration-300 group">
                <CardContent className="p-6">
                  <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300">
                    <Icon className="w-7 h-7 text-primary" />
                  </div>
                  
                  <div className="text-3xl font-bold text-foreground mb-2">
                    {metric.value}
                  </div>
                  
                  <h3 className="font-semibold text-foreground mb-2">
                    {metric.label}
                  </h3>
                  
                  <p className="text-sm text-muted-foreground">
                    {metric.description}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Industry Success Rates */}
        <Card className="mb-16 bg-gradient-to-r from-secondary/20 to-primary/10 border-2 border-primary/20">
          <CardContent className="p-8">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-2">
                Industry Success Rates
              </h3>
              <p className="text-muted-foreground">
                High performance across all major industries
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {industryStats.map((stat, index) => (
                <div key={index} className="bg-background/50 rounded-lg p-4 border border-border">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-foreground">{stat.industry}</h4>
                    <Building className="w-5 h-5 text-primary" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-2xl font-bold text-primary">{stat.success}</div>
                      <div className="text-muted-foreground">Success Rate</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-primary">{stat.interviews}</div>
                      <div className="text-muted-foreground">Interview Boost</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Testimonials */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {testimonialData.map((testimonial, index) => (
            <Card key={index} className="border-2 border-border hover:border-primary/30 transition-all duration-300">
              <CardContent className="p-6">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                
                <blockquote className="text-muted-foreground mb-4 italic">
                  "{testimonial.quote}"
                </blockquote>
                
                <div>
                  <div className="font-semibold text-foreground">{testimonial.author}</div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.role} at {testimonial.company}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Final CTA */}
        <Card className="bg-gradient-to-r from-primary to-foreground text-primary-foreground">
          <CardContent className="p-12 text-center">
            <div className="max-w-3xl mx-auto">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8" />
              </div>
              
              <h3 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to Transform Your Career?
              </h3>
              
              <p className="text-lg mb-8 opacity-90">
                Join 50,000+ professionals who've accelerated their careers with AI-optimized resumes. 
                Start your free analysis now and see results in under 30 seconds.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  variant="secondary"
                  className="px-8 py-6 text-lg font-semibold"
                  onClick={() => navigate('/analyze')}
                >
                  Start Free Analysis
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="px-8 py-6 text-lg font-semibold border-white/20 text-white hover:bg-white/10"
                  onClick={() => navigate('/dashboard')}
                >
                  View Pricing
                </Button>
              </div>
              
              <div className="flex justify-center items-center gap-6 mt-8 text-sm opacity-80">
                <span>✓ No Credit Card Required</span>
                <span>✓ Instant Results</span>
                <span>✓ 100% Secure</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default SuccessMetrics;