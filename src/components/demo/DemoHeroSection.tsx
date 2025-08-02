
import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Rocket, 
  Eye, 
  TrendingUp,
  Zap,
  ArrowDown
} from 'lucide-react';

const DemoHeroSection = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:40px_40px] opacity-30" />
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-40 w-96 h-96 bg-primary/15 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-primary/20 rounded-full blur-3xl animate-pulse delay-2000" />
        <div className="absolute inset-0 bg-primary/5 opacity-50"></div>
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-gradient-to-r from-primary to-primary/60 rotate-45 animate-spin-slow opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-gradient-to-r from-primary to-primary/80 rounded-full animate-bounce opacity-40" />
        <div className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-gradient-to-r from-primary to-primary/70 animate-pulse opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Premium badge */}
          <div className="inline-flex items-center space-x-3 bg-background/80 backdrop-blur-xl border border-primary/20 px-8 py-4 rounded-full mb-8 shadow-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <span className="text-foreground font-medium">Live Experience</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">Interactive Demo</span>
            </div>
            <div className="w-px h-4 bg-border" />
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-primary" />
              <span className="text-foreground font-medium">Real-Time AI</span>
            </div>
          </div>
          
          {/* Main headline */}
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black mb-8 leading-none tracking-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground">
              Experience
            </span>
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-primary to-primary/80">
              Pure Magic
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-2xl sm:text-3xl text-muted-foreground mb-16 max-w-5xl mx-auto leading-relaxed font-light">
            Watch AI transform an ordinary resume into an interview-generating masterpiece.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/80 font-medium">
              Every step is real. Every improvement is strategic.
            </span>
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Button 
              size="lg" 
              className="group relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-primary/25 transition-all duration-500 transform hover:scale-105 border-0"
              onClick={() => navigate('/auth')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Rocket className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Transform My Resume</span>
            </Button>
            
            <div className="flex items-center space-x-4 text-muted-foreground">
              <div className="flex -space-x-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="w-12 h-12 bg-gradient-to-r from-primary to-primary/80 rounded-full border-2 border-background flex items-center justify-center text-primary-foreground font-bold shadow-xl">
                    {String.fromCharCode(65 + idx)}
                  </div>
                ))}
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-primary" />
                  <span className="font-semibold text-foreground">50,000+ transformed</span>
                </div>
                <span className="text-sm">Join the success stories</span>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="animate-bounce">
            <ArrowDown className="h-8 w-8 text-muted-foreground mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoHeroSection;
