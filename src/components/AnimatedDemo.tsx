
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Upload, 
  FileText, 
  BarChart3, 
  Download, 
  CheckCircle, 
  Target,
  Zap,
  TrendingUp,
  Clock
} from 'lucide-react';

const AnimatedDemo = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(true);

  const demoSteps = [
    {
      id: 'upload',
      title: 'Upload Resume',
      description: 'User uploads their resume',
      icon: Upload,
      color: 'from-blue-500 to-cyan-500',
      content: (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-8 text-center bg-blue-50">
            <Upload className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <p className="text-blue-700 font-semibold">Drag & drop your resume here</p>
            <p className="text-sm text-blue-600">PDF, DOC, DOCX supported</p>
          </div>
          <div className="animate-pulse bg-blue-100 rounded p-2 text-center text-blue-700">
            📄 resume.pdf uploading...
          </div>
        </div>
      )
    },
    {
      id: 'job-description',
      title: 'Add Job Description',
      description: 'Paste the target job description',
      icon: FileText,
      color: 'from-green-500 to-emerald-500',
      content: (
        <div className="space-y-4">
          <div className="bg-white rounded-lg border p-4">
            <h4 className="font-semibold text-gray-900 mb-2">Senior Software Engineer - Tech Corp</h4>
            <div className="text-sm text-gray-600 space-y-2">
              <p>We're looking for a Senior Software Engineer with expertise in:</p>
              <div className="flex flex-wrap gap-2">
                {['React', 'Node.js', 'AWS', 'TypeScript', 'GraphQL'].map((skill, idx) => (
                  <Badge key={idx} className="bg-green-100 text-green-800 animate-fade-in" style={{ animationDelay: `${idx * 0.2}s` }}>
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
          <div className="animate-pulse bg-green-100 rounded p-2 text-center text-green-700">
            🎯 Analyzing job requirements...
          </div>
        </div>
      )
    },
    {
      id: 'analysis',
      title: 'AI Analysis',
      description: 'AI analyzes and scores the resume',
      icon: BarChart3,
      color: 'from-purple-500 to-pink-500',
      content: (
        <div className="space-y-6">
          <div className="text-center mb-4">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full mb-4 animate-pulse">
              <BarChart3 className="h-10 w-10 text-white" />
            </div>
            <p className="text-purple-700 font-semibold">AI Analysis in Progress...</p>
          </div>
          
          {[
            { name: "Keyword Match", score: 0, target: 96, color: "from-green-500 to-emerald-500" },
            { name: "ATS Compatibility", score: 0, target: 94, color: "from-blue-500 to-cyan-500" },
            { name: "Skills Alignment", score: 0, target: 92, color: "from-purple-500 to-pink-500" },
            { name: "Experience Match", score: 0, target: 89, color: "from-orange-500 to-red-500" }
          ].map((metric, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-gray-700">{metric.name}</span>
                <span className="text-sm font-bold text-gray-900">{metric.target}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className={`bg-gradient-to-r ${metric.color} h-3 rounded-full transition-all duration-2000 ease-out animate-[scale-in_0.5s_ease-out_${index * 0.3}s_both]`}
                  style={{ 
                    width: `${metric.target}%`,
                    animationDelay: `${index * 0.5}s`
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )
    },
    {
      id: 'results',
      title: 'Optimization Results',
      description: 'View suggestions and improvements',
      icon: Target,
      color: 'from-orange-500 to-red-500',
      content: (
        <div className="space-y-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center space-x-3 mb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-2xl flex items-center justify-center shadow-lg animate-scale-in">
                <CheckCircle className="h-8 w-8 text-white" />
              </div>
              <div className="text-left">
                <h4 className="text-2xl font-bold text-gray-900">Resume Optimized! 🎉</h4>
                <p className="text-green-700 font-medium">Score improved from 67% to 94%</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {[
              { icon: Target, text: 'Keywords strategically placed', color: 'text-blue-600' },
              { icon: CheckCircle, text: 'ATS compatibility verified', color: 'text-green-600' },
              { icon: Zap, text: 'Achievements quantified', color: 'text-purple-600' },
              { icon: TrendingUp, text: 'Professional summary enhanced', color: 'text-orange-600' }
            ].map((improvement, idx) => (
              <div key={idx} className="flex items-center space-x-3 bg-white p-3 rounded-lg border shadow-sm animate-fade-in" style={{ animationDelay: `${idx * 0.2}s` }}>
                <div className="bg-gradient-to-r from-green-100 to-emerald-100 p-2 rounded-lg">
                  <improvement.icon className={`h-4 w-4 ${improvement.color}`} />
                </div>
                <span className="text-sm font-medium text-gray-700">{improvement.text}</span>
              </div>
            ))}
          </div>

          <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border-2 border-green-200">
            <h5 className="font-semibold text-gray-900 mb-2 flex items-center">
              <Target className="h-4 w-4 mr-2 text-green-600" />
              Added Keywords
            </h5>
            <div className="flex flex-wrap gap-2">
              {['React', 'Node.js', 'AWS', 'TypeScript', 'GraphQL'].map((keyword, idx) => (
                <Badge key={idx} className="bg-green-100 text-green-800 border border-green-300 animate-fade-in" style={{ animationDelay: `${idx * 0.3}s` }}>
                  +{keyword}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )
    },
    {
      id: 'export',
      title: 'Export Resume',
      description: 'Download optimized resume',
      icon: Download,
      color: 'from-emerald-500 to-teal-500',
      content: (
        <div className="space-y-6 text-center">
          <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-8">
            <div className="w-20 h-20 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-xl animate-bounce">
              <Download className="h-10 w-10 text-white" />
            </div>
            <h4 className="text-2xl font-bold text-gray-900 mb-2">Ready to Export!</h4>
            <p className="text-gray-600 mb-6">Your optimized resume is ready for download</p>
            
            <div className="space-y-3">
              <Button className="w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 animate-pulse">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
              <div className="text-sm text-gray-500">
                ✅ ATS-friendly format<br/>
                ✅ Optimized for job matching<br/>
                ✅ Professional layout
              </div>
            </div>
          </div>
          
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center justify-center space-x-2 text-blue-700">
              <Clock className="h-4 w-4" />
              <span className="text-sm font-medium">Total time: 45 seconds</span>
            </div>
          </div>
        </div>
      )
    }
  ];

  useEffect(() => {
    if (!isAnimating) return;

    const interval = setInterval(() => {
      setCurrentStep((prev) => (prev + 1) % demoSteps.length);
    }, 4000); // Change step every 4 seconds

    return () => clearInterval(interval);
  }, [isAnimating, demoSteps.length]);

  const currentStepData = demoSteps[currentStep];

  return (
    <Card className="p-8 bg-gradient-to-br from-gray-900 to-gray-800 text-white shadow-2xl overflow-hidden relative">
      {/* Background Animation */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10 animate-pulse" />
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-8">
          <div className="text-center flex-1">
            <div className={`w-20 h-20 bg-gradient-to-r ${currentStepData.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl animate-scale-in`}>
              <currentStepData.icon className="h-10 w-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold mb-2">{currentStepData.title}</h3>
            <p className="text-gray-300 mb-6">{currentStepData.description}</p>
          </div>
          
          <Button 
            variant="outline" 
            size="sm" 
            className="ml-4 border-white/30 text-white hover:bg-white/10"
            onClick={() => setIsAnimating(!isAnimating)}
          >
            {isAnimating ? '⏸️ Pause' : '▶️ Play'}
          </Button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex justify-center space-x-2 mb-8">
          {demoSteps.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentStep 
                  ? 'bg-white scale-125' 
                  : index < currentStep 
                    ? 'bg-green-400' 
                    : 'bg-white/30'
              }`}
              onClick={() => {
                setCurrentStep(index);
                setIsAnimating(false);
              }}
            />
          ))}
        </div>

        {/* Demo Content */}
        <div className="min-h-[400px] bg-white rounded-2xl p-6 text-gray-900 animate-fade-in">
          {currentStepData.content}
        </div>

        {/* Auto-play indicator */}
        {isAnimating && (
          <div className="mt-6 flex justify-center">
            <div className="bg-white/10 px-4 py-2 rounded-full flex items-center space-x-2">
              <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              <span className="text-sm text-white/80">Auto-playing demo</span>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};

export default AnimatedDemo;
