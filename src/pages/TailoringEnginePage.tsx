import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Upload, 
  FileText, 
  Target, 
  Edit3, 
  Download, 
  Brain, 
  Zap,
  TrendingUp,
  CheckCircle,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  Eye,
  Users,
  MessageSquare,
  BarChart3,
  Clock,
  Award,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BuildProfileStep from '@/components/tailoring/BuildProfileStep';
import TargetJobStep from '@/components/tailoring/TargetJobStep';
import TailorResumeStep from '@/components/tailoring/TailorResumeStep';
import ExportTrackStep from '@/components/tailoring/ExportTrackStep';
import InterviewPrepStep from '@/components/tailoring/InterviewPrepStep';
import TailoringEngineFeatures from '@/components/tailoring/TailoringEngineFeatures';
import AuthenticatedHeader from '@/components/AuthenticatedHeader';
import Footer from '@/components/Footer';
import DodoPaymentModal from '@/components/dashboard/DodoPaymentModal';

interface TailoringState {
  currentStep: number;
  profile: {
    resume: File | null;
    resumeText: string;
    template: string;
    personalInfo: any;
  };
  targetJob: {
    description: string;
    title: string;
    company: string;
    requirements: string[];
    keywords: string[];
    skillGaps: string[];
    analysis?: any;
    analyzed: boolean;
  };
  tailoring: {
    sections: any[];
    suggestions: any[];
    keywordMatches: any[];
    gapAnalysis: any[];
    rewriteHistory: any[];
    currentVersion: string;
  };
  export: {
    versions: any[];
    tracker: any[];
    downloadHistory: any[];
  };
  interview: {
    insights: any[];
    questions: any[];
    skillGaps: any[];
    prepMaterials: any[];
  };
  processing: boolean;
  progress: number;
}

const TailoringEnginePage = () => {
  const { user, userProfile, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  const [state, setState] = useState<TailoringState>({
    currentStep: 1,
    profile: {
      resume: null,
      resumeText: '',
      template: 'modern',
      personalInfo: {}
    },
    targetJob: {
      description: '',
      title: '',
      company: '',
      requirements: [],
      keywords: [],
      skillGaps: [],
      analysis: null,
      analyzed: false
    },
    tailoring: {
      sections: [],
      suggestions: [],
      keywordMatches: [],
      gapAnalysis: [],
      rewriteHistory: [],
      currentVersion: 'original'
    },
    export: {
      versions: [],
      tracker: [],
      downloadHistory: []
    },
    interview: {
      insights: [],
      questions: [],
      skillGaps: [],
      prepMaterials: []
    },
    processing: false,
    progress: 0
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  useEffect(() => {
    document.title = 'Resume Tailoring Engine | SproutCV';
    const metaDesc = document.querySelector('meta[name="description"]') || document.createElement('meta');
    metaDesc.setAttribute('name', 'description');
    metaDesc.setAttribute('content', 'AI-powered resume tailoring engine with keyword matching, gap analysis, and one-click rewriting for perfect job applications.');
    document.head.appendChild(metaDesc);
  }, []);

  const updateState = (updates: Partial<TailoringState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const nextStep = () => {
    if (state.currentStep < 5) {
      updateState({ currentStep: state.currentStep + 1 });
    }
  };

  const prevStep = () => {
    if (state.currentStep > 1) {
      updateState({ currentStep: state.currentStep - 1 });
    }
  };

  const steps = [
    {
      id: 1,
      title: 'Build Profile',
      description: 'Upload resume and choose template',
      icon: Upload,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      id: 2,
      title: 'Target Job',
      description: 'AI analyzes job requirements',
      icon: Target,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      id: 3,
      title: 'Tailor Resume',
      description: 'AI rewrites with live preview',
      icon: Edit3,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      id: 4,
      title: 'Export & Track',
      description: 'Download and track applications',
      icon: Download,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    },
    {
      id: 5,
      title: 'Interview Prep',
      description: 'Practice questions & insights',
      icon: Users,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-100'
    }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <AuthenticatedHeader onBuyCredits={() => setShowPaymentModal(true)} />
      
      <div className="pt-4">
        {/* Hero Section */}
        <div className="bg-white border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="text-center">
              <div className="flex items-center justify-center mb-6">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-600 rounded-2xl shadow-xl">
                  <Sparkles className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                AI Resume Tailoring Engine
              </h1>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
                Transform your resume for every job application with AI-powered keyword matching, gap analysis, and one-click rewriting
              </p>
              
              {/* Tailoring Engine Features */}
              <TailoringEngineFeatures />
            </div>
          </div>
        </div>

        {/* Step Progress */}
        <div className="bg-white border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-bold text-gray-900">Tailoring Process</h2>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-600 border-green-200">
                  Step {state.currentStep} of 5
                </Badge>
                <Progress value={(state.currentStep / 5) * 100} className="w-32" />
              </div>
            </div>
            
            {/* Step Navigation */}
            <div className="flex justify-between items-center mb-8">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isActive = state.currentStep === step.id;
                const isCompleted = state.currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex flex-col items-center">
                    <div 
                      className={`p-3 rounded-full border-2 mb-3 transition-all duration-200 ${
                        isActive 
                          ? `${step.bgColor} ${step.color} border-current shadow-lg scale-110` 
                          : isCompleted
                          ? 'bg-green-100 text-green-600 border-green-300'
                          : 'bg-gray-100 text-gray-400 border-gray-300'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-6 w-6" />
                      ) : (
                        <Icon className="h-6 w-6" />
                      )}
                    </div>
                    <div className="text-center">
                      <h3 className={`font-semibold ${isActive ? 'text-gray-900' : 'text-gray-600'}`}>
                        {step.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1 max-w-20">
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="bg-white rounded-2xl shadow-lg border border-green-100 p-8">
            {/* Processing Overlay */}
            {state.processing && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-50 flex items-center justify-center rounded-2xl">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-500 mx-auto mb-4"></div>
                  <p className="text-lg font-semibold text-gray-900">Processing...</p>
                  <Progress value={state.progress} className="w-64 mt-4" />
                </div>
              </div>
            )}

            {/* Step Content */}
            {state.currentStep === 1 && (
              <BuildProfileStep 
                state={state.profile}
                onUpdate={(profile) => updateState({ profile })}
                onNext={nextStep}
              />
            )}

            {state.currentStep === 2 && (
              <TargetJobStep
                state={state.targetJob}
                onUpdate={(targetJob) => updateState({ targetJob })}
                onNext={nextStep}
                onPrev={prevStep}
                resumeText={state.profile.resumeText}
              />
            )}

            {state.currentStep === 3 && (
              <TailorResumeStep
                state={state.tailoring}
                onUpdate={(tailoring) => updateState({ tailoring })}
                onNext={nextStep}
                onPrev={prevStep}
                profile={state.profile}
                targetJob={state.targetJob}
              />
            )}

            {state.currentStep === 4 && (
              <ExportTrackStep
                state={state.export}
                onUpdate={(exportData) => updateState({ export: exportData })}
                onNext={nextStep}
                onPrev={prevStep}
                profile={state.profile}
                targetJob={state.targetJob}
                tailoring={state.tailoring}
              />
            )}

            {state.currentStep === 5 && (
              <InterviewPrepStep
                state={state.interview}
                onUpdate={(interview) => updateState({ interview })}
                onPrev={prevStep}
                profile={state.profile}
                targetJob={state.targetJob}
                tailoring={state.tailoring}
              />
            )}
          </div>

          {/* Quick Actions */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <Brain className="h-8 w-8 text-blue-600 mb-4" />
              <h3 className="text-lg font-semibold text-blue-800 mb-2">AI Analysis</h3>
              <p className="text-blue-700 text-sm mb-4">
                Advanced keyword matching and gap analysis for perfect job fit
              </p>
              <Button variant="outline" className="border-blue-200 text-blue-600 hover:bg-blue-50">
                Learn More
              </Button>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
              <Zap className="h-8 w-8 text-green-600 mb-4" />
              <h3 className="text-lg font-semibold text-green-800 mb-2">One-Click Rewriting</h3>
              <p className="text-green-700 text-sm mb-4">
                Instantly improve sections with AI-powered content suggestions
              </p>
              <Button variant="outline" className="border-green-200 text-green-600 hover:bg-green-50">
                Try Now
              </Button>
            </Card>

            <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <TrendingUp className="h-8 w-8 text-purple-600 mb-4" />
              <h3 className="text-lg font-semibold text-purple-800 mb-2">Success Tracking</h3>
              <p className="text-purple-700 text-sm mb-4">
                Monitor application success and interview conversion rates
              </p>
              <Button variant="outline" className="border-purple-200 text-purple-600 hover:bg-purple-50">
                View Stats
              </Button>
            </Card>
          </div>
        </div>
      </div>

      <Footer />

      {/* Payment Modal */}
      <DodoPaymentModal 
        isOpen={showPaymentModal} 
        onClose={() => setShowPaymentModal(false)}
        onSuccess={refreshProfile}
      />
    </div>
  );
};

export default TailoringEnginePage;
