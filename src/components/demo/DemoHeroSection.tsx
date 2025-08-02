
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
    <div className="relative min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute top-40 right-40 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute bottom-40 left-1/3 w-80 h-80 bg-emerald-500/20 rounded-full blur-3xl animate-pulse delay-2000" />
        
        {/* Floating geometric shapes */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-gradient-to-r from-purple-400 to-pink-400 rotate-45 animate-spin-slow opacity-60" />
        <div className="absolute top-1/3 right-1/3 w-6 h-6 bg-gradient-to-r from-blue-400 to-cyan-400 rounded-full animate-bounce opacity-40" />
        <div className="absolute bottom-1/3 left-1/5 w-3 h-3 bg-gradient-to-r from-emerald-400 to-teal-400 animate-pulse opacity-50" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">
        <div className="text-center">
          {/* Premium badge */}
          <div className="inline-flex items-center space-x-3 bg-white/5 backdrop-blur-xl border border-white/10 px-8 py-4 rounded-full mb-8 shadow-2xl">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-white/90 font-medium">Live Experience</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center space-x-2">
              <Eye className="h-4 w-4 text-purple-400" />
              <span className="text-white/90 font-medium">Interactive Demo</span>
            </div>
            <div className="w-px h-4 bg-white/20" />
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-blue-400" />
              <span className="text-white/90 font-medium">Real-Time AI</span>
            </div>
          </div>
          
          {/* Main headline */}
          <h1 className="text-7xl sm:text-8xl lg:text-9xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-purple-200 to-blue-200 mb-8 leading-none tracking-tight">
            Experience
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-400">
              Pure Magic
            </span>
          </h1>
          
          {/* Subheading */}
          <p className="text-2xl sm:text-3xl text-white/70 mb-16 max-w-5xl mx-auto leading-relaxed font-light">
            Watch AI transform an ordinary resume into an interview-generating masterpiece.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-300 to-pink-300 font-medium">
              Every step is real. Every improvement is strategic.
            </span>
          </p>
          
          {/* Action buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20">
            <Button 
              size="lg" 
              className="group relative overflow-hidden bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 hover:from-emerald-500 hover:via-green-500 hover:to-teal-500 text-white text-xl px-12 py-6 rounded-2xl shadow-2xl hover:shadow-emerald-500/25 transition-all duration-500 transform hover:scale-105 border-0"
              onClick={() => navigate('/auth')}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <Rocket className="mr-3 h-6 w-6 group-hover:rotate-12 transition-transform duration-300" />
              <span className="relative z-10">Transform My Resume</span>
            </Button>
            
            <div className="flex items-center space-x-4 text-white/60">
              <div className="flex -space-x-3">
                {Array.from({ length: 5 }).map((_, idx) => (
                  <div key={idx} className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full border-2 border-white/20 flex items-center justify-center text-white font-bold shadow-xl">
                    {String.fromCharCode(65 + idx)}
                  </div>
                ))}
              </div>
              <div className="flex flex-col text-left">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-emerald-400" />
                  <span className="font-semibold text-white/90">50,000+ transformed</span>
                </div>
                <span className="text-sm">Join the success stories</span>
              </div>
            </div>
          </div>
          
          {/* Scroll indicator */}
          <div className="animate-bounce">
            <ArrowDown className="h-8 w-8 text-white/40 mx-auto" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DemoHeroSection;
