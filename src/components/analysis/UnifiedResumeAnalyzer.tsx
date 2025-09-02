import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Upload, 
  FileText, 
  Loader2, 
  AlertTriangle, 
  CheckCircle, 
  Info, 
  ArrowLeft, 
  ArrowRight,
  X, 
  Brain,
  Target,
  Zap,
  Shield,
  Eye,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { ResumeMatchValidator } from '@/services/validation/ResumeMatchValidator';
import { Warning, ValidationResult } from '@/types/validation';
import { WarningDisplay } from '@/components/analysis/WarningDisplay';
import ContextualHelp from '@/components/help/ContextualHelp';
import ScoreDashboard from '@/components/ScoreDashboard';

interface AnalysisState {
  step: 'upload' | 'job' | 'validation' | 'analysis' | 'results';
  resumeFile: File | null;
  resumeText: string;
  jobDescription: string;
  jobTitle: string;
  companyName: string;
  processing: boolean;
  progress: number;
  currentStep: string;
  validationResult: ValidationResult | null;
  warnings: Warning[];
  analysisResult: any;
}

const UnifiedResumeAnalyzer: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  const [state, setState] = useState<AnalysisState>({
    step: 'upload',
    resumeFile: null,
    resumeText: '',
    jobDescription: '',
    jobTitle: '',
    companyName: '',
    processing: false,
    progress: 0,
    currentStep: '',
    validationResult: null,
    warnings: [],
    analysisResult: null
  });

  const updateState = (updates: Partial<AnalysisState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateProgress = async (progress: number, step: string) => {
    updateState({ progress, currentStep: step });
    await new Promise(resolve => setTimeout(resolve, 500));
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = reader.result as string;
        resolve(text);
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf' && !file.type.includes('text')) {
      toast({
        title: "Unsupported File Type",
        description: "Please upload a PDF or text file.",
        variant: "destructive",
      });
      return;
    }

    try {
      const text = await extractTextFromFile(file);
      updateState({ 
        resumeFile: file, 
        resumeText: text 
      });
      
      toast({
        title: "Resume Uploaded",
        description: `Successfully uploaded ${file.name}`,
      });
    } catch (error) {
      toast({
        title: "Upload Failed", 
        description: "Failed to process the file",
        variant: "destructive",
      });
    }
  };

  // Simplified validation method
  const handleValidation = async () => {
    if (!state.resumeText?.trim() || !state.jobDescription?.trim()) {
      toast({
        title: "Missing Information",
        description: "Please upload a resume and provide a job description.",
        variant: "destructive",
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze your resume.",
        variant: "destructive",
      });
      return;
    }

    updateState({ processing: true, step: 'validation' });
    
    try {
      await updateProgress(20, 'Preparing validation...');
      
      // Simple validation checks instead of complex analysis
      const hasEmail = state.resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
      const hasKeywords = state.jobDescription.toLowerCase().split(/\s+/)
        .some(word => word.length > 3 && state.resumeText.toLowerCase().includes(word));
      
      await updateProgress(60, 'Checking compatibility...');
      
      const warnings: Warning[] = [];
      
      // Only show warnings for serious issues
      if (!hasEmail) {
        warnings.push({
          id: 'no_email',
          type: 'ats_incompatible',
          severity: 'HIGH',
          title: 'Missing Contact Information',
          description: 'No email address found in resume',
          explanation: 'ATS systems require contact information to process applications',
          importance: 'High - Essential for job applications',
          actions: [
            { id: 'add_email', label: 'Add Email', type: 'primary' },
            { id: 'dismiss', label: 'Dismiss', type: 'destructive' }
          ],
          solutions: ['Add your email address to the resume header'],
          examples: [{
            before: 'John Smith\nSoftware Engineer',
            after: 'John Smith\njohn.smith@email.com\nSoftware Engineer'
          }],
          dismissible: true,
          criticalityScore: 0.9
        });
      }

      // Check for obvious formatting issues
      if (state.resumeText.includes('│') || state.resumeText.includes('─')) {
        warnings.push({
          id: 'formatting_issues',
          type: 'ats_incompatible',
          severity: 'MEDIUM',
          title: 'Formatting Issues Detected',
          description: 'Complex table formatting may cause ATS parsing problems',
          explanation: 'Simple text formatting works better with ATS systems',
          importance: 'Medium - May affect initial screening',
          actions: [
            { id: 'fix_format', label: 'Fix Formatting', type: 'primary' },
            { id: 'dismiss', label: 'Dismiss', type: 'destructive' }
          ],
          solutions: ['Use simple bullet points instead of tables', 'Remove complex formatting'],
          examples: [],
          dismissible: true,
          criticalityScore: 0.6
        });
      }

      await updateProgress(80, 'Processing results...');
      
      if (warnings.length > 0) {
        updateState({ 
          warnings,
          processing: false,
          step: 'validation',
          progress: 100,
          currentStep: 'Validation complete - issues found'
        });
        
        toast({
          title: "Resume Issues Detected",
          description: `Found ${warnings.length} issues that should be addressed.`,
          variant: "destructive",
        });
      } else {
        // Proceed to analysis if no serious issues
        await handleAnalysis();
      }
      
    } catch (error) {
      console.error('Validation error:', error);
      updateState({ processing: false, step: 'job' });
      toast({
        title: "Validation Failed",
        description: "Please try again or proceed with analysis",
        variant: "destructive",
      });
    }
  };

  const handleAnalysis = async () => {
    updateState({ processing: true, step: 'analysis' });
    
    try {
      await updateProgress(20, 'Preparing analysis...');
      await updateProgress(40, 'Running AI analysis...');
      
      const { data, error } = await supabase.functions.invoke('gemini-resume-analyzer', {
        body: {
          resumeText: state.resumeText,
          jobDescription: state.jobDescription,
          jobTitle: state.jobTitle,
          companyName: state.companyName,
          userId: user?.id,
          analysisType: 'comprehensive',
          includeInteractive: true,
          includeCoverLetter: false
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Analysis failed');
      }

      if (!data?.success) {
        throw new Error(data?.error || 'No analysis results returned');
      }

      await updateProgress(90, 'Finalizing results...');
      
      updateState({ 
        analysisResult: data.data,
        step: 'results',
        processing: false,
        progress: 100,
        currentStep: 'Complete!'
      });
      
      toast({
        title: "Analysis Complete!",
        description: "Your resume has been successfully analyzed.",
      });

    } catch (error) {
      console.error('Analysis error:', error);
      updateState({ 
        processing: false,
        step: 'job' // Return to job input step on error
      });
      
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? 
          error.message : 
          "Failed to analyze resume. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleWarningAction = async (warningId: string, action: string) => {
    switch (action) {
      case 'SHOW_KEYWORDS':
      case 'SHOW_SKILLS':
      case 'SHOW_EXAMPLES':
        toast({
          title: "Detailed Information",
          description: "Detailed breakdown available in the expanded warning.",
        });
        break;
      
      case 'AI_OPTIMIZE':
        toast({
          title: "AI Optimization",
          description: "AI optimization tools coming soon!",
        });
        break;
      
      case 'DISMISS':
        updateState({
          warnings: state.warnings.filter(w => w.id !== warningId)
        });
        break;
      
      case 'PROCEED_ANYWAY':
        await handleAnalysis();
        break;
      
      case 'FIX_ISSUES':
        updateState({ step: 'job' });
        break;
    }
  };

  const renderStepIndicator = () => {
    const steps = [
      { id: 'upload', label: 'Upload Resume', icon: Upload },
      { id: 'job', label: 'Job Details', icon: Target },
      { id: 'validation', label: 'Validation', icon: Shield },
      { id: 'analysis', label: 'Analysis', icon: Brain },
      { id: 'results', label: 'Results', icon: CheckCircle }
    ];

    const getCurrentStepIndex = () => {
      switch (state.step) {
        case 'upload': return 0;
        case 'job': return 1;
        case 'validation': return 2;
        case 'analysis': return 3;
        case 'results': return 4;
        default: return 0;
      }
    };

    const currentIndex = getCurrentStepIndex();

    return (
      <div className="w-full max-w-4xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => {
            const Icon = step.icon;
            const isActive = index === currentIndex;
            const isCompleted = index < currentIndex;
            const isDisabled = index > currentIndex;

            return (
              <React.Fragment key={step.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted 
                      ? 'bg-success border-success text-success-foreground' 
                      : isActive 
                        ? 'bg-primary border-primary text-primary-foreground shadow-lg scale-110' 
                        : 'bg-muted border-muted-foreground text-muted-foreground'
                  }`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span className={`text-sm font-medium mt-2 transition-colors ${
                    isActive ? 'text-primary' : isCompleted ? 'text-success' : 'text-muted-foreground'
                  }`}>
                    {step.label}
                  </span>
                </div>
                {index < steps.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-4 transition-colors ${
                    index < currentIndex ? 'bg-success' : 'bg-muted'
                  }`} />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  };

  const renderUploadStep = () => (
    <Card className="max-w-2xl mx-auto p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Upload className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Upload Your Resume</h2>
        <p className="text-muted-foreground">
          Upload your resume to get started with AI-powered analysis
        </p>
      </div>

      <div className="space-y-6">
        <div>
          <Label htmlFor="resume-upload" className="text-base font-medium">
            Resume File *
          </Label>
          <div className="mt-2">
            <div className="flex items-center justify-center w-full">
              <label
                htmlFor="resume-upload"
                className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-muted-foreground rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <FileText className="w-8 h-8 mb-2 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">PDF or TXT files only</p>
                </div>
                <input
                  id="resume-upload"
                  type="file"
                  className="hidden"
                  accept=".pdf,.txt"
                  onChange={handleFileUpload}
                />
              </label>
            </div>
          </div>
        </div>

        {state.resumeFile && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Successfully uploaded: {state.resumeFile.name}
            </AlertDescription>
          </Alert>
        )}

        <div className="flex justify-end">
          <Button
            onClick={() => updateState({ step: 'job' })}
            disabled={!state.resumeFile}
            className="flex items-center gap-2"
          >
            Next: Job Details
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderJobStep = () => (
    <Card className="max-w-3xl mx-auto p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
          <Target className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Job Details</h2>
        <p className="text-muted-foreground">
          Provide the job details to get targeted analysis and recommendations
        </p>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="job-title" className="text-base font-medium">
              Job Title *
            </Label>
            <Input
              id="job-title"
              value={state.jobTitle}
              onChange={(e) => updateState({ jobTitle: e.target.value })}
              placeholder="e.g. Senior Software Engineer"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="company-name" className="text-base font-medium">
              Company Name
            </Label>
            <Input
              id="company-name"
              value={state.companyName}
              onChange={(e) => updateState({ companyName: e.target.value })}
              placeholder="e.g. Google"
              className="mt-1"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="job-description" className="text-base font-medium">
            Job Description *
          </Label>
          <Textarea
            id="job-description"
            value={state.jobDescription}
            onChange={(e) => updateState({ jobDescription: e.target.value })}
            placeholder="Paste the complete job description here. Include requirements, responsibilities, and qualifications for best results..."
            rows={12}
            className="mt-2 resize-none"
          />
          {state.jobDescription && (
            <div className="flex items-center justify-between text-sm mt-2">
              <span className="text-muted-foreground">
                {state.jobDescription.length} characters • {state.jobDescription.split(' ').length} words
              </span>
              <div className="flex gap-2">
                {state.jobDescription.length > 500 && (
                  <Badge variant="outline" className="text-success border-success">
                    ✓ Good length
                  </Badge>
                )}
                {state.jobDescription.includes('requirements') && (
                  <Badge variant="outline" className="text-primary border-primary">
                    ✓ Requirements found
                  </Badge>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => updateState({ step: 'upload' })}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <Button
            onClick={handleValidation}
            disabled={!state.jobDescription.trim() || state.processing}
            className="flex items-center gap-2"
          >
            {state.processing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                Start Analysis
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </Card>
  );

  const renderValidationStep = () => (
    <div className="max-w-5xl mx-auto">
      <Card className="p-8 bg-gradient-to-br from-warning/5 to-destructive/5 border-warning/20">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-warning to-destructive rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>
          <h2 className="text-3xl font-bold text-foreground mb-3">Resume Issues Detected</h2>
          <p className="text-lg text-muted-foreground mb-4">
            We've identified some issues that could impact your application success
          </p>
          <div className="flex items-center justify-center gap-4 text-sm">
            <Badge variant="destructive" className="text-base px-4 py-2">
              {state.warnings.length} Issues Found
            </Badge>
          </div>
        </div>

        <div className="bg-background/80 backdrop-blur-sm rounded-xl p-6 mb-8 border">
          <WarningDisplay
            warnings={state.warnings}
            onDismiss={(warningId) => handleWarningAction(warningId, 'DISMISS')}
            onAction={handleWarningAction}
          />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="outline"
            onClick={() => updateState({ step: 'job' })}
            className="flex items-center gap-2 min-w-[200px]"
            size="lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Fix Issues First
          </Button>
          
          <Button
            onClick={() => handleWarningAction('', 'PROCEED_ANYWAY')}
            className="flex items-center gap-2 min-w-[200px]"
            size="lg"
          >
            Proceed Anyway
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <Alert className="mt-6 bg-primary/5 border-primary/20">
          <Info className="h-4 w-4" />
          <AlertDescription className="text-sm">
            <strong>Recommendation:</strong> Addressing these issues can improve your chances of getting interviews. 
            However, you can proceed with the analysis to see detailed insights and get specific improvement suggestions.
          </AlertDescription>
        </Alert>
      </Card>
    </div>
  );

  const renderAnalysisStep = () => (
    <div className="max-w-2xl mx-auto">
      <Card className="p-8 text-center">
        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <Brain className="w-10 h-10 text-primary animate-pulse" />
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-4">AI Analysis in Progress</h2>
        <p className="text-muted-foreground mb-6">
          Our advanced AI is analyzing your resume against the job requirements
        </p>
        
        <div className="space-y-4">
          <Progress value={state.progress} className="w-full" />
          <p className="text-sm text-muted-foreground">{state.currentStep}</p>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-muted/30 rounded-lg">
              <Zap className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="font-medium">AI Matching</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <Eye className="w-5 h-5 mx-auto mb-2 text-primary" />
              <p className="font-medium">ATS Analysis</p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );

  const renderResultsStep = () => (
    <div className="max-w-6xl mx-auto">
      <div className="text-center mb-8">
        <div className="w-20 h-20 bg-gradient-to-br from-success to-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-foreground mb-3">Analysis Complete!</h2>
        <p className="text-lg text-muted-foreground">
          Your resume has been analyzed and optimized for maximum impact
        </p>
      </div>

      {state.analysisResult && (
        <ScoreDashboard
          overallScore={state.analysisResult.overallScore || 75}
          keywordMatch={state.analysisResult.keywordMatch || 70}
          skillsAlignment={state.analysisResult.skillsAlignment || 80}
          atsCompatibility={state.analysisResult.atsCompatibility || 85}
          experienceRelevance={state.analysisResult.experienceRelevance || 75}
          suggestions={state.analysisResult.suggestions || []}
        />
      )}

      <div className="flex justify-center mt-8">
        <Button
          onClick={() => updateState({ 
            step: 'upload', 
            resumeFile: null, 
            resumeText: '', 
            jobDescription: '', 
            jobTitle: '', 
            companyName: '',
            validationResult: null,
            warnings: [],
            analysisResult: null
          })}
          variant="outline"
          size="lg"
          className="flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Analyze Another Resume
        </Button>
      </div>
    </div>
  );

  if (state.processing && state.step !== 'validation') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
        <div className="container mx-auto px-4 py-8">
          {renderStepIndicator()}
          {renderAnalysisStep()}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-4">
            AI Resume Analyzer
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Get AI-powered insights to optimize your resume for any job opportunity
          </p>
        </div>

        {renderStepIndicator()}

        <div className="space-y-8">
          {state.step === 'upload' && renderUploadStep()}
          {state.step === 'job' && renderJobStep()}
          {state.step === 'validation' && renderValidationStep()}
          {state.step === 'results' && renderResultsStep()}
        </div>
      </div>
    </div>
  );
};

export default UnifiedResumeAnalyzer;