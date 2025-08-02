
import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Upload, 
  FileText, 
  Briefcase, 
  Sparkles, 
  Target, 
  Zap, 
  FileCheck, 
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  Play,
  RotateCcw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

const DemoPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [animatedScores, setAnimatedScores] = useState({
    overall: 0,
    keyword: 0,
    skills: 0,
    ats: 0,
    experience: 0
  });

  const finalScores = {
    overall: 87,
    keyword: 92,
    skills: 85,
    ats: 89,
    experience: 82
  };

  const mockSuggestions = [
    {
      type: 'keyword',
      priority: 'high' as const,
      title: 'Add Missing Keywords',
      description: 'Include "React", "Node.js", and "AWS" in your technical skills section to better match the job requirements.',
      action: 'Add these 3 keywords to your skills section'
    },
    {
      type: 'format',
      priority: 'medium' as const,
      title: 'Improve ATS Formatting',
      description: 'Use standard section headers like "Work Experience" instead of creative titles for better ATS parsing.',
      action: 'Update section headers to standard format'
    },
    {
      type: 'content',
      priority: 'low' as const,
      title: 'Quantify Achievements',
      description: 'Add specific numbers and metrics to showcase your impact in previous roles.',
      action: 'Include 2-3 quantified achievements per role'
    }
  ];

  const steps = [
    {
      title: 'Upload Your Resume',
      description: 'Start by uploading your PDF resume',
      icon: Upload,
      component: 'upload'
    },
    {
      title: 'Add Job Description',
      description: 'Paste the job posting you\'re interested in',
      icon: Briefcase,
      component: 'job'
    },
    {
      title: 'AI Analysis',
      description: 'Our AI analyzes your match score',
      icon: Sparkles,
      component: 'analysis'
    },
    {
      title: 'Get Results',
      description: 'Review detailed insights and suggestions',
      icon: FileCheck,
      component: 'results'
    }
  ];

  const animateScores = () => {
    setIsAnimating(true);
    const duration = 2000;
    const steps = 50;
    const interval = duration / steps;

    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setAnimatedScores({
        overall: Math.floor(finalScores.overall * progress),
        keyword: Math.floor(finalScores.keyword * progress),
        skills: Math.floor(finalScores.skills * progress),
        ats: Math.floor(finalScores.ats * progress),
        experience: Math.floor(finalScores.experience * progress)
      });

      if (currentStep >= steps) {
        clearInterval(timer);
        setIsAnimating(false);
        setShowResults(true);
      }
    }, interval);
  };

  const startDemo = () => {
    setCurrentStep(1);
    setTimeout(() => setCurrentStep(2), 2000);
    setTimeout(() => setCurrentStep(3), 4000);
    setTimeout(() => {
      setCurrentStep(4);
      animateScores();
    }, 6000);
  };

  const resetDemo = () => {
    setCurrentStep(0);
    setShowResults(false);
    setAnimatedScores({
      overall: 0,
      keyword: 0,
      skills: 0,
      ats: 0,
      experience: 0
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-green-100 border-green-200';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-green-50 via-white to-emerald-50 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            See How SproutCV Works
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Watch our AI analyze a sample resume and job description in real-time
          </p>
          
          {currentStep === 0 && (
            <div className="space-y-6">
              <Button 
                onClick={startDemo}
                size="lg"
                className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 py-4 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Demo
              </Button>
              <p className="text-sm text-gray-500">
                This interactive demo shows you exactly how our resume analysis works
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Progress Steps */}
      {currentStep > 0 && (
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center mb-12">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = currentStep >= index + 1;
              const isCompleted = currentStep > index + 1;
              
              return (
                <div key={index} className="flex items-center">
                  <div className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-500 ${
                    isActive ? 'bg-green-100 border border-green-200' : 'bg-gray-100'
                  }`}>
                    <div className={`p-2 rounded-full transition-colors ${
                      isCompleted ? 'bg-green-600' : isActive ? 'bg-green-500' : 'bg-gray-400'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-white" />
                      ) : (
                        <StepIcon className="h-5 w-5 text-white" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-medium transition-colors ${
                        isActive ? 'text-green-800' : 'text-gray-600'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm transition-colors ${
                        isActive ? 'text-green-600' : 'text-gray-500'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-6 w-6 text-gray-400 mx-4" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="space-y-8">
            {/* Step 1: Upload Resume */}
            {currentStep >= 1 && (
              <Card className={`p-6 transition-all duration-500 ${
                currentStep === 1 ? 'animate-fade-in border-2 border-green-200' : 'opacity-70'
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  <Upload className="h-5 w-5 text-green-600" />
                  <h2 className="text-xl font-semibold">Step 1: Resume Upload</h2>
                </div>
                
                <div className="bg-green-50 border border-green-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                    <div>
                      <p className="font-medium text-green-800">Sample Resume Uploaded</p>
                      <p className="text-sm text-green-600">john_doe_software_engineer.pdf</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 2: Job Description */}
            {currentStep >= 2 && (
              <Card className={`p-6 transition-all duration-500 ${
                currentStep === 2 ? 'animate-fade-in border-2 border-green-200' : 'opacity-70'
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  <Briefcase className="h-5 w-5 text-blue-600" />
                  <h2 className="text-xl font-semibold">Step 2: Job Description Analysis</h2>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <h3 className="font-medium text-blue-800 mb-2">Senior Software Engineer - Tech Corp</h3>
                  <p className="text-sm text-blue-600 mb-4">
                    We're looking for a Senior Software Engineer with expertise in React, Node.js, 
                    and AWS to join our growing team...
                  </p>
                  <div className="flex items-center text-sm text-blue-600">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Job requirements extracted and analyzed
                  </div>
                </div>
              </Card>
            )}

            {/* Step 3: AI Analysis */}
            {currentStep >= 3 && (
              <Card className={`p-6 transition-all duration-500 ${
                currentStep === 3 ? 'animate-fade-in border-2 border-green-200' : 'opacity-70'
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  <Sparkles className="h-5 w-5 text-purple-600" />
                  <h2 className="text-xl font-semibold">Step 3: AI Analysis in Progress</h2>
                </div>
                
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-6">
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                      <span className="text-purple-800">Analyzing resume content...</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                      <span className="text-purple-800">Matching keywords and skills...</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="animate-spin rounded-full h-6 w-6 border-2 border-purple-600 border-t-transparent"></div>
                      <span className="text-purple-800">Checking ATS compatibility...</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 4: Results */}
            {currentStep >= 4 && (
              <div className="space-y-8 animate-fade-in">
                {/* Overall Score */}
                <Card className={`p-8 ${getScoreBgColor(animatedScores.overall)} border-2`}>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-32 h-32 bg-white rounded-full shadow-lg mb-6 border-4 border-white">
                      <div className="text-center">
                        <span className={`text-4xl font-bold ${getScoreColor(animatedScores.overall)}`}>
                          {animatedScores.overall}
                        </span>
                        <div className="text-lg font-medium text-gray-600">/ 100</div>
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-gray-900 mb-3">Overall Match Score</h2>
                    <p className="text-lg text-gray-700 max-w-2xl mx-auto">
                      {animatedScores.overall >= 80 
                        ? '🎉 Excellent match! Your resume is well-optimized for this position.' 
                        : animatedScores.overall >= 60 
                        ? '👍 Good match with room for improvement. Follow the suggestions below.' 
                        : '🔧 Needs significant improvements. Your resume has potential - let\'s optimize it!'}
                    </p>
                  </div>
                </Card>

                {/* Detailed Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {[
                    { name: 'Keyword Match', score: animatedScores.keyword, icon: Target, description: 'How well your resume matches job keywords' },
                    { name: 'Skills Alignment', score: animatedScores.skills, icon: Zap, description: 'Relevance of your skills to requirements' },
                    { name: 'ATS Compatibility', score: animatedScores.ats, icon: FileCheck, description: 'How well ATS systems will parse your resume' },
                    { name: 'Experience Relevance', score: animatedScores.experience, icon: TrendingUp, description: 'How your experience aligns with the role' }
                  ].map((metric, index) => {
                    const IconComponent = metric.icon;
                    return (
                      <Card key={index} className="p-6 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-start space-x-4">
                          <div className={`p-3 rounded-lg ${metric.score >= 80 ? 'bg-green-100' : metric.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                            <IconComponent className={`h-6 w-6 ${metric.score >= 80 ? 'text-green-600' : metric.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-gray-900 text-lg">{metric.name}</h3>
                              <span className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                                {metric.score}%
                              </span>
                            </div>
                            <Progress value={metric.score} className="mb-3 h-3" />
                            <p className="text-sm text-gray-600 leading-relaxed">{metric.description}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Suggestions */}
                {showResults && (
                  <Card className="p-6 animate-fade-in">
                    <div className="flex items-center space-x-2 mb-6">
                      <AlertTriangle className="h-6 w-6 text-orange-500" />
                      <h3 className="text-xl font-semibold text-gray-900">Improvement Suggestions</h3>
                    </div>
                    
                    <div className="space-y-4">
                      {mockSuggestions.map((suggestion, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow">
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <Badge className={getPriorityColor(suggestion.priority)}>
                                {suggestion.priority.toUpperCase()}
                              </Badge>
                              <h4 className="font-semibold text-gray-900">{suggestion.title}</h4>
                            </div>
                          </div>
                          <p className="text-gray-700 mb-3 leading-relaxed">{suggestion.description}</p>
                          <div className="flex items-center text-sm text-blue-600">
                            <CheckCircle className="h-4 w-4 mr-2" />
                            <span className="font-medium">Action: {suggestion.action}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Call to Action */}
                {showResults && (
                  <div className="text-center space-y-6 animate-fade-in">
                    <Card className="p-8 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200">
                      <h3 className="text-2xl font-bold text-gray-900 mb-4">Ready to Optimize Your Resume?</h3>
                      <p className="text-gray-700 mb-6 text-lg">
                        Get personalized analysis for your actual resume and job applications
                      </p>
                      <div className="space-x-4">
                        <Button 
                          onClick={() => navigate('/auth')}
                          size="lg"
                          className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                        >
                          Start Your Analysis
                        </Button>
                        <Button 
                          onClick={resetDemo}
                          variant="outline"
                          size="lg"
                        >
                          <RotateCcw className="mr-2 h-5 w-5" />
                          Replay Demo
                        </Button>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default DemoPage;
