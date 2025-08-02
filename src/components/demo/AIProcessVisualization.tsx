
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Brain,
  Zap,
  Target,
  CheckCircle,
  Upload,
  BarChart3,
  Download,
  Sparkles,
  Clock,
  TrendingUp,
  FileText,
  Settings2
} from 'lucide-react';

const AIProcessVisualization = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const processSteps = [
    {
      icon: Upload,
      title: "Neural Document Parsing",
      description: "Advanced AI instantly deconstructs and understands your resume's DNA",
      details: "Extracting 247 data points, analyzing structure patterns, identifying optimization opportunities",
      color: "from-blue-600 to-cyan-600",
      duration: 0.8
    },
    {
      icon: Brain,
      title: "Deep Learning Analysis",
      description: "Quantum-speed analysis of keywords, ATS compatibility, and market alignment",
      details: "Processing against 10M+ job postings, analyzing semantic meaning, predicting success rates",
      color: "from-purple-600 to-pink-600",
      duration: 1.2
    },
    {
      icon: Target,
      title: "Strategic Enhancement",
      description: "AI applies proven optimization patterns used by Fortune 500 recruiters",
      details: "Enhancing impact statements, optimizing keyword density, improving readability scores",
      color: "from-emerald-600 to-teal-600",
      duration: 1.5
    },
    {
      icon: Sparkles,
      title: "Excellence Calibration",
      description: "Final quality assurance and interview-readiness validation",
      details: "ATS compatibility check, human readability test, success probability calculation",
      color: "from-orange-600 to-red-600",
      duration: 0.9
    }
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveStep((prev) => (prev + 1) % processSteps.length);
      setProgress(0);
      setIsProcessing(true);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (isProcessing) {
      let currentProgress = 0;
      const step = processSteps[activeStep];
      const increment = 100 / (step.duration * 50);
      
      const progressInterval = setInterval(() => {
        currentProgress += increment;
        if (currentProgress >= 100) {
          currentProgress = 100;
          setIsProcessing(false);
          clearInterval(progressInterval);
        }
        setProgress(currentProgress);
      }, 20);

      return () => clearInterval(progressInterval);
    }
  }, [activeStep, isProcessing]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-800 py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <Badge className="bg-gradient-to-r from-emerald-500 to-cyan-500 text-white px-8 py-3 text-lg font-semibold mb-6 shadow-xl">
            <Brain className="h-5 w-5 mr-2" />
            AI Processing Engine
          </Badge>
          <h2 className="text-6xl font-black text-white mb-8">
            Watch AI
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400 block">
              Work Magic
            </span>
          </h2>
          <p className="text-2xl text-white/70 max-w-4xl mx-auto leading-relaxed">
            Experience our revolutionary AI processing your resume in real-time
          </p>
        </div>

        {/* Main Process Visualization */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          {/* Process Steps */}
          <div className="lg:col-span-2">
            <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <div className="space-y-6">
                {processSteps.map((step, index) => (
                  <div 
                    key={index} 
                    className={`flex items-start space-x-6 p-6 rounded-2xl transition-all duration-500 ${
                      activeStep === index 
                        ? 'bg-white/10 border border-white/20 shadow-xl' 
                        : 'bg-white/5 hover:bg-white/8'
                    }`}
                  >
                    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg transition-transform duration-300 ${
                      activeStep === index ? 'scale-110' : ''
                    }`}>
                      <step.icon className="h-8 w-8 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-xl font-bold text-white">{step.title}</h3>
                        {activeStep === index && (
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                            <span className="text-emerald-400 font-medium text-sm">PROCESSING</span>
                          </div>
                        )}
                      </div>
                      <p className="text-white/70 text-lg mb-3">{step.description}</p>
                      <p className="text-white/50 text-sm">{step.details}</p>
                      
                      {activeStep === index && (
                        <div className="mt-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-white/70 font-medium">Processing...</span>
                            <span className="text-emerald-400 font-bold">{Math.round(progress)}%</span>
                          </div>
                          <Progress value={progress} className="h-2 bg-white/10" />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Live Stats */}
          <div className="space-y-6">
            <Card className="p-6 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
              <h3 className="text-xl font-bold text-white mb-6 flex items-center">
                <BarChart3 className="h-5 w-5 mr-2 text-emerald-400" />
                Real-Time Analytics
              </h3>
              
              <div className="space-y-4">
                {[
                  { label: "Keywords Analyzed", value: 1247, max: 1500 },
                  { label: "Patterns Matched", value: 89, max: 100 },
                  { label: "ATS Score", value: 97, max: 100 },
                  { label: "Impact Level", value: 94, max: 100 }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white/5 p-4 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-white/80 font-medium">{stat.label}</span>
                      <span className="text-emerald-400 font-bold">{stat.value}</span>
                    </div>
                    <Progress value={(stat.value / stat.max) * 100} className="h-2 bg-white/10" />
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 backdrop-blur-xl border border-emerald-400/20 shadow-2xl">
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
                  <TrendingUp className="h-10 w-10 text-white" />
                </div>
                <div className="text-4xl font-black text-white mb-2">+340%</div>
                <div className="text-emerald-400 font-semibold mb-2">Interview Rate Boost</div>
                <p className="text-white/60 text-sm">Average improvement after AI optimization</p>
              </div>
            </Card>
          </div>
        </div>

        {/* Processing Timeline */}
        <Card className="p-8 bg-white/5 backdrop-blur-xl border border-white/10 shadow-2xl">
          <h3 className="text-2xl font-bold text-white mb-6 text-center flex items-center justify-center">
            <Clock className="h-6 w-6 mr-3 text-cyan-400" />
            Complete Transformation Timeline
          </h3>
          
          <div className="flex items-center justify-between">
            {processSteps.map((step, index) => (
              <div key={index} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${step.color} flex items-center justify-center shadow-lg transition-all duration-300 ${
                    index <= activeStep ? 'scale-110' : 'scale-75 opacity-50'
                  }`}>
                    {index < activeStep ? (
                      <CheckCircle className="h-6 w-6 text-white" />
                    ) : index === activeStep ? (
                      <div className="animate-spin">
                        <Settings2 className="h-6 w-6 text-white" />
                      </div>
                    ) : (
                      <step.icon className="h-6 w-6 text-white" />
                    )}
                  </div>
                  <div className="mt-4 text-center">
                    <div className="text-white font-semibold text-sm">{step.title.split(' ')[0]}</div>
                    <div className="text-white/60 text-xs">{step.duration}s</div>
                  </div>
                </div>
                
                {index < processSteps.length - 1 && (
                  <div className={`absolute top-6 left-1/2 w-full h-px bg-gradient-to-r from-transparent via-white/30 to-transparent transform translate-x-1/2 ${
                    index < activeStep ? 'via-emerald-400' : ''
                  }`} />
                )}
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default AIProcessVisualization;
