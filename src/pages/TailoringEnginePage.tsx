import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Upload, 
  Target, 
  Edit3, 
  Download, 
  CheckCircle,
  ArrowRight,
  Users,
  Sparkles
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import BuildProfileStep from '@/components/tailoring/BuildProfileStep';
import TargetJobStep from '@/components/tailoring/TargetJobStep';
import TailorResumeStep from '@/components/tailoring/TailorResumeStep';
import ExportTrackStep from '@/components/tailoring/ExportTrackStep';
import InterviewPrepStep from '@/components/tailoring/InterviewPrepStep';
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
        {/* Compact Header */}
        <div className="bg-white border-b border-green-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
                  <Sparkles className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    AI Resume Tailoring
                  </h1>
                  <p className="text-sm text-gray-600">
                    Transform your resume with AI-powered optimization
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="text-green-600 border-green-200 px-4 py-1">
                  Step {state.currentStep} of 5
                </Badge>
                <Progress value={(state.currentStep / 5) * 100} className="w-24" />
              </div>
            </div>
            
            {/* Compact Step Navigation */}
            <div className="flex justify-between items-center mt-6 pt-4 border-t border-green-100">
              {steps.map((step) => {
                const Icon = step.icon;
                const isActive = state.currentStep === step.id;
                const isCompleted = state.currentStep > step.id;
                
                return (
                  <div key={step.id} className="flex items-center space-x-2">
                    <div 
                      className={`p-2 rounded-full transition-all duration-200 ${
                        isActive 
                          ? `${step.bgColor} ${step.color} shadow-md` 
                          : isCompleted
                          ? 'bg-green-100 text-green-600'
                          : 'bg-gray-100 text-gray-400'
                      }`}
                    >
                      {isCompleted ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className={`text-sm font-medium hidden md:inline ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>
                      {step.title}
                    </span>
                    {step.id < 5 && <ArrowRight className="h-4 w-4 text-gray-300 hidden lg:inline" />}
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
