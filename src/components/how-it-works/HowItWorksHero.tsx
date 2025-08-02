import React from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Brain, Sparkles, Target, Zap } from 'lucide-react';

const HowItWorksHero = () => {
  const navigate = useNavigate();

  return (
    <section className="relative pt-32 pb-20 overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/10" />
      
      {/* Animated Grid */}
      <div className="absolute inset-0 opacity-30">
        <div className="h-full w-full bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:60px_60px] animate-pulse" />
      </div>

      {/* Floating Elements */}
      <div className="absolute top-20 left-10 animate-bounce delay-300">
        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 flex items-center justify-center">
          <Brain className="w-8 h-8 text-primary" />
        </div>
      </div>
      
      <div className="absolute top-40 right-20 animate-bounce delay-700">
        <div className="w-12 h-12 rounded-full bg-gradient-to-r from-accent/30 to-muted/30 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-foreground" />
        </div>
      </div>

      <div className="absolute bottom-20 left-20 animate-bounce delay-1000">
        <div className="w-14 h-14 rounded-full bg-gradient-to-r from-secondary/25 to-primary/25 flex items-center justify-center">
          <Target className="w-7 h-7 text-primary" />
        </div>
      </div>

      <div className="container relative z-10 mx-auto px-6">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <Badge variant="outline" className="mb-6 px-4 py-2 text-sm border-primary/20 bg-primary/5">
            <Zap className="w-4 h-4 mr-2" />
            AI-Powered Resume Transformation
          </Badge>

          {/* Main Heading */}
          <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-primary via-foreground to-primary bg-clip-text text-transparent">
              How SproutCV
            </span>
            <br />
            <span className="text-foreground">
              Transforms Careers
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 leading-relaxed max-w-3xl mx-auto">
            Discover the science behind our AI technology that has helped{' '}
            <span className="text-foreground font-semibold">50,000+ professionals</span> land their dream jobs with 
            <span className="text-primary font-semibold"> 3x higher interview rates</span>
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button 
              size="lg" 
              className="px-8 py-6 text-lg font-semibold"
              onClick={() => navigate('/analyze')}
            >
              Start Free Analysis
            </Button>
            <Button 
              variant="outline" 
              size="lg" 
              className="px-8 py-6 text-lg font-semibold border-2"
              onClick={() => navigate('#process')}
            >
              Watch Process Video
            </Button>
          </div>

          {/* Trust Indicators */}
          <div className="flex flex-wrap justify-center items-center gap-8 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>No Credit Card Required</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Instant Results</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-primary" />
              <span>Enterprise Security</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksHero;