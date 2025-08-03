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
  RotateCcw,
  Download,
  Star,
  Users,
  Clock,
  DollarSign
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import TailoredResumePreview from '@/components/TailoredResumePreview';

const HowItWorksPage = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [showTailoredResume, setShowTailoredResume] = useState(false);
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
      title: 'Get Tailored Resume',
      description: 'Download your optimized, job-ready resume',
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
        setTimeout(() => setShowTailoredResume(true), 1500);
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
    setShowTailoredResume(false);
    setAnimatedScores({
      overall: 0,
      keyword: 0,
      skills: 0,
      ats: 0,
      experience: 0
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-primary';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-primary/10 border-primary/20';
    if (score >= 60) return 'bg-yellow-100 border-yellow-200';
    return 'bg-red-100 border-red-200';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-primary/5 via-background to-primary/10 py-16">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            How SproutCV Works
          </h1>
          <p className="text-xl text-muted-foreground mb-6">
            Watch our AI transform your resume into a job-winning, tailored document in real-time
          </p>
          
          {/* Social Proof */}
          <div className="flex items-center justify-center space-x-8 mb-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4" />
              <span>10,000+ users</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span>Highly rated</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4" />
              <span>2 minutes</span>
            </div>
          </div>
          
          {currentStep === 0 && (
            <div className="space-y-6">
              <Button 
                onClick={startDemo}
                size="lg"
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-4 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                See How It Works
              </Button>
              <p className="text-sm text-muted-foreground">
                This interactive demo shows you exactly how our AI tailors your resume for any job
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
                    isActive ? 'bg-primary/10 border border-primary/20' : 'bg-muted'
                  }`}>
                    <div className={`p-2 rounded-full transition-colors ${
                      isCompleted ? 'bg-primary' : isActive ? 'bg-primary' : 'bg-muted-foreground'
                    }`}>
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5 text-primary-foreground" />
                      ) : (
                        <StepIcon className="h-5 w-5 text-primary-foreground" />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-medium transition-colors ${
                        isActive ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </h3>
                      <p className={`text-sm transition-colors ${
                        isActive ? 'text-primary/80' : 'text-muted-foreground'
                      }`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <ArrowRight className="h-6 w-6 text-muted-foreground mx-4" />
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
                currentStep === 1 ? 'animate-fade-in border-2 border-primary/20' : 'opacity-70'
              }`}>
                <div className="flex items-center space-x-2 mb-4">
                  <Upload className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Step 1: Resume Upload</h2>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-6">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-6 w-6 text-primary" />
                    <div>
                      <p className="font-medium text-primary">Sample Resume Uploaded</p>
                      <p className="text-sm text-primary/80">john_doe_software_engineer.pdf</p>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 2: Job Description */}
            {currentStep >= 2 && (
              <Card className={`p-6 transition-all duration-500 ${
                currentStep === 2 ? 'animate-fade-in border-2 border-primary/20' : 'opacity-70'
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
                currentStep === 3 ? 'animate-fade-in border-2 border-primary/20' : 'opacity-70'
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
                      <span className="text-purple-800">Creating tailored version...</span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Step 4: Results */}
            {currentStep >= 4 && (
              <div className="space-y-8 animate-fade-in">
                {/* Tailored Resume Output */}
                {showTailoredResume && (
                  <div className="animate-fade-in">
                    <TailoredResumePreview />
                  </div>
                )}

                {/* Overall Score */}
                <Card className={`p-8 ${getScoreBgColor(animatedScores.overall)} border-2`}>
                  <div className="text-center">
                    <div className="inline-flex items-center justify-center w-32 h-32 bg-background rounded-full shadow-lg mb-6 border-4 border-background">
                      <div className="text-center">
                        <span className={`text-4xl font-bold ${getScoreColor(animatedScores.overall)}`}>
                          {animatedScores.overall}
                        </span>
                        <div className="text-lg font-medium text-muted-foreground">/ 100</div>
                      </div>
                    </div>
                    <h2 className="text-3xl font-bold text-foreground mb-3">Match Score Analysis</h2>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                      {animatedScores.overall >= 80 
                        ? '🎉 Your tailored resume is now perfectly optimized for this position!' 
                        : animatedScores.overall >= 60 
                        ? '👍 Great improvement! Your resume is now much more competitive.' 
                        : '🔧 Significant improvements made. Your resume is now job-ready!'}
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
                          <div className={`p-3 rounded-lg ${metric.score >= 80 ? 'bg-primary/10' : metric.score >= 60 ? 'bg-yellow-100' : 'bg-red-100'}`}>
                            <IconComponent className={`h-6 w-6 ${metric.score >= 80 ? 'text-primary' : metric.score >= 60 ? 'text-yellow-600' : 'text-red-600'}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="font-semibold text-foreground text-lg">{metric.name}</h3>
                              <span className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                                {metric.score}%
                              </span>
                            </div>
                            <Progress value={metric.score} className="mb-3 h-3" />
                            <p className="text-sm text-muted-foreground leading-relaxed">{metric.description}</p>
                          </div>
                        </div>
                      </Card>
                    );
                  })}
                </div>

                {/* Call to Action */}
                {showResults && (
                  <div className="text-center space-y-6 animate-fade-in">
                    <Card className="p-8 bg-primary/5 border-2 border-primary/20">
                      <h3 className="text-2xl font-bold text-foreground mb-4">
                        Ready to Create Your Own Tailored Resume?
                      </h3>
                      <p className="text-muted-foreground mb-6 text-lg">
                        Get personalized analysis and tailored resumes for every job application
                      </p>
                      
                      {/* Pricing Teaser */}
                      <div className="bg-background p-6 rounded-lg border border-primary/20 mb-6 max-w-md mx-auto">
                        <div className="flex items-center justify-center space-x-2 mb-4">
                          <DollarSign className="h-5 w-5 text-primary" />
                          <span className="text-lg font-semibold text-foreground">Starting at just $2 per analysis</span>
                        </div>
                        <div className="space-y-2 text-sm text-muted-foreground">
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span>Instant AI analysis</span>
                          </div>
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span>Tailored resume download</span>
                          </div>
                          <div className="flex items-center justify-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-primary" />
                            <span>ATS optimization</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-x-4">
                        <Button 
                          onClick={() => navigate('/auth')}
                          size="lg"
                          className="bg-primary hover:bg-primary/90"
                        >
                          Start Optimizing Now
                        </Button>
                        <Button 
                          onClick={resetDemo}
                          variant="outline"
                          size="lg"
                        >
                          <RotateCcw className="mr-2 h-5 w-5" />
                          Watch Again
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

export default HowItWorksPage;