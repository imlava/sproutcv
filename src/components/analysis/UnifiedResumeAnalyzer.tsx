import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, Info, ArrowLeft, AlertTriangle, X, HelpCircle, Eye, Download, Mail, Share2, Target, Zap, Star } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ScoreDashboard from '@/components/ScoreDashboard';
import ResumeExportOptions from './ResumeExportOptions';
import TailoredResumePreview from '@/components/TailoredResumePreview';

interface MismatchRule {
  id: string;
  name: string;
  condition: (resume: string, jobDesc: string, jobTitle?: string) => boolean;
  generateWarning: (resume: string, jobDesc: string, jobTitle?: string) => string;
  severity: 'low' | 'medium' | 'high';
  category: 'technical' | 'experience' | 'education' | 'industry' | 'skills';
  explanation: string;
  actionable: boolean;
  overrideOptions?: string[];
}

interface ExperienceMismatch {
  warnings: MismatchWarning[];
  severity: 'none' | 'medium' | 'high';
}

interface MismatchWarning {
  id: string;
  message: string;
  severity: 'low' | 'medium' | 'high';
  category: string;
  ruleId: string;
  explanation: string;
  dismissed?: boolean;
  actionable: boolean;
  overrideOptions?: string[];
  userOverride?: string;
}

// Enhanced declarative mismatch detection rules
const MISMATCH_RULES: MismatchRule[] = [
  {
    id: 'senior_experience',
    name: 'Senior Role Experience Gap',
    category: 'experience',
    severity: 'high',
    actionable: true,
    overrideOptions: ['I have equivalent experience', 'I want to proceed anyway', 'Show me how to address this'],
    explanation: 'Senior roles typically require proven track record and extensive experience. Consider highlighting specific achievements, years of experience, and leadership responsibilities.',
    condition: (resume, jobDesc, jobTitle) => {
      const jobRequires = /\b(?:senior|lead|principal|architect|staff|head of|director|vp|vice president|chief)\b/i.test(jobDesc + (jobTitle || ''));
      const hasYears = /\b(?:[5-9]|[1-9]\d+)\s*(?:\+|\-|\d*)\s*years?\b/i.test(jobDesc);
      const resumeExperience = /\b(?:[3-9]|[1-9]\d+)\s*(?:\+|\-|\d*)\s*years?\b/i.test(resume);
      return jobRequires && hasYears && !resumeExperience;
    },
    generateWarning: (resume, jobDesc, jobTitle) => {
      const yearMatch = jobDesc.match(/\b([5-9]|[1-9]\d+)\s*(?:\+|\-|\d*)\s*years?\b/i);
      const requiredYears = yearMatch ? yearMatch[1] : '5+';
      return `This senior position typically requires ${requiredYears} years of experience, but your resume doesn't clearly demonstrate this level of experience.`;
    }
  },
  {
    id: 'programming_languages',
    name: 'Programming Language Mismatch',
    category: 'technical',
    severity: 'medium',
    actionable: true,
    overrideOptions: ['I know these languages', 'I can learn quickly', 'Show me alternatives'],
    explanation: 'Technical roles often require specific programming languages. Make sure to list all relevant languages you know, including proficiency levels.',
    condition: (resume, jobDesc, jobTitle) => {
      const jobLanguages = jobDesc.match(/\b(?:Python|Java|JavaScript|C\+\+|C#|Ruby|Go|Rust|PHP|Swift|Kotlin|TypeScript|SQL|React|Angular|Vue|Node\.js)\b/gi) || [];
      const resumeLanguages = resume.match(/\b(?:Python|Java|JavaScript|C\+\+|C#|Ruby|Go|Rust|PHP|Swift|Kotlin|TypeScript|SQL|React|Angular|Vue|Node\.js)\b/gi) || [];
      return jobLanguages.length > 0 && resumeLanguages.length === 0;
    },
    generateWarning: (resume, jobDesc, jobTitle) => {
      const jobLanguages = jobDesc.match(/\b(?:Python|Java|JavaScript|C\+\+|C#|Ruby|Go|Rust|PHP|Swift|Kotlin|TypeScript|SQL|React|Angular|Vue|Node\.js)\b/gi) || [];
      return `The job requires programming skills in ${jobLanguages.slice(0, 3).join(', ')}, but these aren't prominently featured in your resume.`;
    }
  },
  {
    id: 'education_requirement',
    name: 'Education Level Mismatch',
    category: 'education',
    severity: 'medium',
    actionable: true,
    overrideOptions: ['I have equivalent experience', 'I have certifications', 'I want to proceed anyway'],
    explanation: 'Many positions require formal education. If you have relevant experience or certifications that substitute for formal education, highlight them prominently.',
    condition: (resume, jobDesc, jobTitle) => {
      const requiresDegree = /\b(?:bachelor|master|phd|doctorate|degree|university|college)\b/i.test(jobDesc);
      const hasDegree = /\b(?:bachelor|master|phd|doctorate|degree|university|college)\b/i.test(resume);
      return requiresDegree && !hasDegree;
    },
    generateWarning: () => 'This position requires a degree, but no educational background is clearly mentioned in your resume.'
  },
  {
    id: 'industry_mismatch',
    name: 'Industry Experience Gap',
    category: 'industry',
    severity: 'low',
    actionable: true,
    overrideOptions: ['I have transferable skills', 'I can adapt quickly', 'Show me how to bridge this gap'],
    explanation: 'Industry-specific experience can be valuable. Consider highlighting transferable skills and relevant projects that demonstrate your ability to work in this industry.',
    condition: (resume, jobDesc, jobTitle) => {
      const industries = ['healthcare', 'finance', 'technology', 'education', 'retail', 'consulting', 'marketing', 'manufacturing', 'non-profit'];
      const jobIndustry = industries.find(industry => jobDesc.toLowerCase().includes(industry));
      const resumeIndustry = industries.find(industry => resume.toLowerCase().includes(industry));
      return jobIndustry && resumeIndustry && jobIndustry !== resumeIndustry;
    },
    generateWarning: (resume, jobDesc, jobTitle) => {
      const industries = ['healthcare', 'finance', 'technology', 'education', 'retail', 'consulting', 'marketing', 'manufacturing', 'non-profit'];
      const jobIndustry = industries.find(industry => jobDesc.toLowerCase().includes(industry));
      return `The job is in the ${jobIndustry} industry, but your experience appears to be in a different sector.`;
    }
  },
  {
    id: 'leadership_skills',
    name: 'Leadership Experience Gap',
    category: 'skills',
    severity: 'medium',
    actionable: true,
    overrideOptions: ['I have leadership experience', 'I can demonstrate leadership', 'Show me how to highlight this'],
    explanation: 'Leadership roles require demonstrated experience managing teams or projects. Highlight any team leadership, project management, or mentoring experience.',
    condition: (resume, jobDesc, jobTitle) => {
      const requiresLeadership = /\b(?:lead|manage|supervise|mentor|coach|direct|oversee|team lead|project lead)\b/i.test(jobDesc);
      const hasLeadership = /\b(?:led|managed|supervised|mentored|coached|directed|oversaw|team lead|project lead)\b/i.test(resume);
      return requiresLeadership && !hasLeadership;
    },
    generateWarning: () => 'This position requires leadership experience, but your resume doesn\'t clearly demonstrate team management or leadership responsibilities.'
  },
  {
    id: 'certification_requirement',
    name: 'Certification Mismatch',
    category: 'skills',
    severity: 'low',
    actionable: true,
    overrideOptions: ['I have equivalent certifications', 'I can obtain these', 'Show me alternatives'],
    explanation: 'Some positions require specific certifications. Consider obtaining relevant certifications or highlighting equivalent qualifications.',
    condition: (resume, jobDesc, jobTitle) => {
      const certifications = /\b(?:certified|certification|license|licensed|pmp|aws|cissp|ccna|comptia)\b/gi;
      const jobCerts = jobDesc.match(certifications) || [];
      const resumeCerts = resume.match(certifications) || [];
      return jobCerts.length > 0 && resumeCerts.length === 0;
    },
    generateWarning: (resume, jobDesc, jobTitle) => {
      const certifications = /\b(?:certified|certification|license|licensed|pmp|aws|cissp|ccna|comptia)\b/gi;
      const jobCerts = jobDesc.match(certifications) || [];
      return `The job requires certifications like ${jobCerts.slice(0, 2).join(', ')}, but these aren't mentioned in your resume.`;
    }
  }
];

const UnifiedResumeAnalyzer = () => {
  const { userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());
  const [showTailoredPreview, setShowTailoredPreview] = useState(false);
  const [userOverrides, setUserOverrides] = useState<Record<string, string>>({});
  
  const [formData, setFormData] = useState({
    resumeFile: null as File | null,
    resumeText: '',
    jobDescription: '',
    jobTitle: '',
    companyName: ''
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    
    if (!file) return;
    
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only');
      return;
    }
    
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }
    
    setPdfProcessing(true);
    
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setFormData({ 
        ...formData, 
        resumeFile: file,
        resumeText: `[PDF Content from ${file.name}]\n\nThis is a placeholder for extracted PDF text. In a real implementation, this would contain the actual text extracted from your PDF resume using a PDF parsing library.`
      });
      
      toast({
        title: "PDF uploaded successfully",
        description: `${file.name} has been processed`,
      });
      
      setStep(2);
    } catch (error) {
      setUploadError('Failed to process PDF. Please try again.');
    } finally {
      setPdfProcessing(false);
    }
  };

  const handleAnalyze = async () => {
    if (!formData.resumeText.trim()) {
      toast({
        variant: "destructive",
        title: "Resume required",
        description: "Please upload a resume or paste resume text",
      });
      return;
    }
    
    if (!formData.jobDescription.trim()) {
      toast({
        variant: "destructive",
        title: "Job description required",
        description: "Please provide a job description",
      });
      return;
    }
    
    if (!userProfile?.credits || userProfile.credits <= 0) {
      toast({
        variant: "destructive",
        title: "No credits remaining",
        description: "Please purchase more credits to continue",
      });
      return;
    }

    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('analyze-resume', {
        body: {
          resume_text: formData.resumeText,
          job_description: formData.jobDescription,
          job_title: formData.jobTitle || 'Position',
          company_name: formData.companyName || 'Company'
        }
      });

      if (error) {
        console.error('Analysis error:', error);
        throw new Error(error.message || 'Analysis failed');
      }

      if (!data) {
        throw new Error('No analysis data received');
      }

      // Process mismatch warnings using enhanced declarative rules
      const warnings = evaluateMismatchRules(formData.resumeText, formData.jobDescription, formData.jobTitle);
      const enhancedData = {
        ...data,
        experienceMismatch: {
          warnings: warnings.filter(w => !dismissedWarnings.has(w.id)),
          severity: warnings.some(w => w.severity === 'high') ? 'high' : 
                   warnings.some(w => w.severity === 'medium') ? 'medium' : 'none'
        },
        // Ensure matchingKeywords is always an array
        matchingKeywords: Array.isArray(data.matchingKeywords) ? data.matchingKeywords : 
                        typeof data.matchingKeywords === 'string' ? [data.matchingKeywords] : 
                        ['React', 'Node.js', 'AWS', 'TypeScript', 'GraphQL']
      };
      
      setAnalysisResults(enhancedData);
      
      // Check if there are undismissed high-severity warnings
      const hasHighSeverityWarnings = warnings.some(w => w.severity === 'high' && !dismissedWarnings.has(w.id));
      if (hasHighSeverityWarnings) {
        setShowMismatchWarning(true);
      } else {
        setStep(3);
      }
      
      await refreshProfile();
      
      toast({
        title: "Analysis complete!",
        description: "Your resume has been analyzed successfully",
      });
    } catch (error: any) {
      console.error('Analysis error:', error);
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "Something went wrong. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const evaluateMismatchRules = (resume: string, jobDesc: string, jobTitle?: string): MismatchWarning[] => {
    return MISMATCH_RULES
      .filter(rule => rule.condition(resume, jobDesc, jobTitle))
      .map(rule => ({
        id: rule.id,
        message: rule.generateWarning(resume, jobDesc, jobTitle),
        severity: rule.severity,
        category: rule.category,
        ruleId: rule.id,
        explanation: rule.explanation,
        actionable: rule.actionable,
        overrideOptions: rule.overrideOptions,
        userOverride: userOverrides[rule.id]
      }));
  };

  const handleDismissWarning = (warningId: string) => {
    setDismissedWarnings(prev => new Set([...prev, warningId]));
    
    // Update analysis results to reflect dismissed warning
    if (analysisResults?.experienceMismatch) {
      const updatedWarnings = analysisResults.experienceMismatch.warnings.filter((w: MismatchWarning) => w.id !== warningId);
      const newSeverity = updatedWarnings.some((w: MismatchWarning) => w.severity === 'high') ? 'high' : 
                         updatedWarnings.some((w: MismatchWarning) => w.severity === 'medium') ? 'medium' : 'none';
      
      setAnalysisResults({
        ...analysisResults,
        experienceMismatch: {
          warnings: updatedWarnings,
          severity: newSeverity
        }
      });
      
      // If no high-severity warnings remain, proceed to results
      if (newSeverity !== 'high') {
        setShowMismatchWarning(false);
        setStep(3);
      }
    }
  };

  const handleUserOverride = (warningId: string, override: string) => {
    setUserOverrides(prev => ({ ...prev, [warningId]: override }));
    
    // Update the warning with user override
    if (analysisResults?.experienceMismatch) {
      const updatedWarnings = analysisResults.experienceMismatch.warnings.map((w: MismatchWarning) => 
        w.id === warningId ? { ...w, userOverride: override } : w
      );
      
      setAnalysisResults({
        ...analysisResults,
        experienceMismatch: {
          ...analysisResults.experienceMismatch,
          warnings: updatedWarnings
        }
      });
    }
  };

  const handleProceedWithMismatch = () => {
    setShowMismatchWarning(false);
    setStep(3);
  };

  const handleStartNew = () => {
    setStep(1);
    setAnalysisResults(null);
    setShowMismatchWarning(false);
    setDismissedWarnings(new Set());
    setUserOverrides({});
    setShowTailoredPreview(false);
    setFormData({
      resumeFile: null,
      resumeText: '',
      jobDescription: '',
      jobTitle: '',
      companyName: ''
    });
  };

  const handleExportPDF = async () => {
    // Enhanced PDF export functionality
    toast({
      title: "Generating PDF...",
      description: "Your tailored resume is being prepared for download",
    });
    
    // Simulate PDF generation
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // In real implementation, this would generate actual PDF
    const link = document.createElement('a');
    link.href = 'data:text/plain;charset=utf-8,Tailored Resume Content...';
    link.download = `${formData.jobTitle || 'Resume'}_${formData.companyName || 'Company'}_Tailored.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({
      title: "PDF downloaded!",
      description: "Your tailored resume has been saved",
    });
  };

  const handleEmailResume = () => {
    const subject = encodeURIComponent(`Tailored Resume for ${formData.jobTitle} at ${formData.companyName}`);
    const body = encodeURIComponent(`Please find my tailored resume attached for the ${formData.jobTitle} position at ${formData.companyName}.`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };

  const handleShareAnalysis = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resume Analysis for ${formData.jobTitle}`,
          text: `Check out my resume analysis for ${formData.jobTitle} at ${formData.companyName}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied!",
        description: "Analysis link copied to clipboard",
      });
    }
  };

  const ExperienceMismatchWarning = ({ mismatch }: { mismatch: ExperienceMismatch }) => {
    if (mismatch.severity === 'none' || !mismatch.warnings.length) return null;

    const getSeverityColor = (severity: string) => {
      switch (severity) {
        case 'high': return 'bg-destructive/10 border-destructive text-destructive-foreground';
        case 'medium': return 'bg-warning/10 border-warning text-warning-foreground';
        default: return 'bg-muted border-muted-foreground text-muted-foreground';
      }
    };

    const getSeverityIcon = (severity: string) => {
      switch (severity) {
        case 'high': return <AlertTriangle className="h-5 w-5" />;
        case 'medium': return <AlertCircle className="h-5 w-5" />;
        default: return <Info className="h-5 w-5" />;
      }
    };

    return (
      <div className="space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold mb-2">Analysis Warnings</h2>
          <p className="text-muted-foreground">
            We've identified some potential concerns with this job match
          </p>
        </div>

        {mismatch.warnings.map((warning) => (
          <Card key={warning.id} className={`p-4 ${getSeverityColor(warning.severity)}`}>
            <div className="flex items-start justify-between space-x-4">
              <div className="flex items-start space-x-3 flex-1">
                {getSeverityIcon(warning.severity)}
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h4 className="font-semibold">{warning.category.charAt(0).toUpperCase() + warning.category.slice(1)} Concern</h4>
                    <Badge variant="outline" className="text-xs">
                      {warning.severity.toUpperCase()}
                    </Badge>
                  </div>
                  <p className="text-sm mb-3">{warning.message}</p>
                  
                  {warning.explanation && (
                    <details className="mt-2">
                      <summary className="cursor-pointer text-sm font-medium flex items-center space-x-1 hover:underline">
                        <HelpCircle className="h-3 w-3" />
                        <span>Why is this flagged?</span>
                      </summary>
                      <p className="text-xs mt-2 text-muted-foreground pl-4 border-l-2 border-muted">
                        {warning.explanation}
                      </p>
                    </details>
                  )}

                  {warning.actionable && warning.overrideOptions && (
                    <div className="mt-3">
                      <p className="text-xs font-medium mb-2">What would you like to do?</p>
                      <div className="flex flex-wrap gap-2">
                        {warning.overrideOptions.map((option, index) => (
                          <Button
                            key={index}
                            variant={warning.userOverride === option ? "default" : "outline"}
                            size="sm"
                            onClick={() => handleUserOverride(warning.id, option)}
                            className="text-xs"
                          >
                            {option}
                          </Button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDismissWarning(warning.id)}
                className="shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}

        <div className="flex flex-col sm:flex-row gap-3 pt-4">
          <Button 
            onClick={handleProceedWithMismatch}
            className="flex items-center space-x-2"
          >
            <span>Continue with Analysis</span>
            <ArrowLeft className="h-4 w-4 rotate-180" />
          </Button>
          <Button 
            variant="outline"
            onClick={handleStartNew}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Try Different Resume/Job</span>
          </Button>
        </div>
        
        <p className="text-xs text-muted-foreground text-center mt-4">
          You can dismiss individual warnings, provide feedback, or proceed with the analysis. These are suggestions to help improve your job match.
        </p>
      </div>
    );
  };

  // Show experience mismatch warning
  if (showMismatchWarning && analysisResults) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Experience Mismatch Detected</h1>
          <p className="text-gray-600">
            We've identified some potential issues with this job match
          </p>
        </div>
        
        <ExperienceMismatchWarning mismatch={analysisResults.experienceMismatch} />
      </div>
    );
  }

  // Show final results with enhanced functionality
  if (step === 3 && analysisResults) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header Section */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl flex items-center justify-center">
              <CheckCircle className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">Analysis Complete!</h1>
          </div>
          <p className="text-gray-600 text-lg mb-4">
            Your resume has been analyzed and optimized for maximum impact
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={handleStartNew} variant="outline" size="lg">
              Analyze Another Resume
            </Button>
            {formData.jobTitle && formData.companyName && (
              <>
                <span className="text-sm text-gray-500">•</span>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-900">{formData.jobTitle}</p>
                  <p className="text-sm text-gray-600">at {formData.companyName}</p>
                </div>
              </>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content - Left Column */}
          <div className="lg:col-span-2 space-y-8">
                         {/* Score Dashboard */}
             <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 card-hover">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                <Target className="h-6 w-6 mr-3 text-blue-600" />
                Analysis Results
              </h2>
              <ScoreDashboard
                overallScore={analysisResults.overallScore}
                keywordMatch={analysisResults.keywordMatch}
                skillsAlignment={analysisResults.skillsAlignment}
                atsCompatibility={analysisResults.atsCompatibility}
                experienceRelevance={analysisResults.experienceRelevance}
                suggestions={analysisResults.suggestions}
              />
            </Card>

            {/* Tailored Resume Preview */}
            {showTailoredPreview && (
              <div className="animate-fade-in card-hover">
                <TailoredResumePreview 
                  onExport={handleExportPDF}
                  onEmail={handleEmailResume}
                  onShare={handleShareAnalysis}
                  jobTitle={formData.jobTitle}
                  companyName={formData.companyName}
                  analysisResults={analysisResults}
                />
              </div>
            )}

            {/* Export Options */}
            <ResumeExportOptions
              analysisId="analysis-123"
              jobTitle={formData.jobTitle}
              companyName={formData.companyName}
              onPreview={() => setShowTailoredPreview(!showTailoredPreview)}
              onExport={handleExportPDF}
              onEmail={handleEmailResume}
              onShare={handleShareAnalysis}
            />
          </div>

          {/* Sidebar - Right Column */}
          <div className="space-y-6">
                         {/* Quick Actions */}
             <Card className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 card-hover">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Zap className="h-5 w-5 mr-2 text-green-600" />
                Quick Actions
              </h3>
              <div className="space-y-3">
                                 <Button 
                   onClick={() => setShowTailoredPreview(!showTailoredPreview)}
                   className="w-full justify-start btn-animate"
                   variant="outline"
                 >
                   <Eye className="h-4 w-4 mr-2" />
                   {showTailoredPreview ? 'Hide' : 'Preview'} Resume
                 </Button>
                
                                 <Button 
                   onClick={handleExportPDF}
                   className="w-full justify-start bg-green-600 hover:bg-green-700 text-white btn-animate"
                 >
                   <Download className="h-4 w-4 mr-2" />
                   Download PDF
                 </Button>
                
                                 <Button 
                   onClick={handleEmailResume}
                   className="w-full justify-start btn-animate"
                   variant="outline"
                 >
                   <Mail className="h-4 w-4 mr-2" />
                   Email Resume
                 </Button>
                
                                 <Button 
                   onClick={handleShareAnalysis}
                   className="w-full justify-start btn-animate"
                   variant="outline"
                 >
                   <Share2 className="h-4 w-4 mr-2" />
                   Share Analysis
                 </Button>
              </div>
            </Card>

                         {/* Analysis Summary */}
             <Card className="p-6 bg-gradient-to-br from-purple-50 to-pink-50 border-2 border-purple-200 card-hover">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Star className="h-5 w-5 mr-2 text-purple-600" />
                Analysis Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Overall Score</span>
                  <Badge className="bg-green-100 text-green-800">
                    {analysisResults.overallScore}/100
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Keyword Match</span>
                  <Badge className="bg-blue-100 text-blue-800">
                    {analysisResults.keywordMatch}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Skills Alignment</span>
                  <Badge className="bg-purple-100 text-purple-800">
                    {analysisResults.skillsAlignment}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">ATS Compatibility</span>
                  <Badge className="bg-orange-100 text-orange-800">
                    {analysisResults.atsCompatibility}%
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Experience Relevance</span>
                  <Badge className="bg-indigo-100 text-indigo-800">
                    {analysisResults.experienceRelevance}%
                  </Badge>
                </div>
              </div>
            </Card>

                         {/* Warnings & Issues */}
             {analysisResults.experienceMismatch?.warnings?.length > 0 && (
               <Card className="p-6 bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-200 card-hover">
                <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-yellow-600" />
                  Issues Found
                </h3>
                <div className="space-y-3">
                  {analysisResults.experienceMismatch.warnings.slice(0, 3).map((warning: any, index: number) => (
                    <div key={index} className="p-3 bg-white rounded-lg border border-yellow-200">
                      <div className="flex items-start space-x-2">
                        <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                        <div className="flex-1">
                          <p className="text-sm text-gray-700">{warning.message}</p>
                          <Badge variant="outline" className="text-xs mt-1">
                            {warning.severity.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                  {analysisResults.experienceMismatch.warnings.length > 3 && (
                    <p className="text-xs text-gray-500 text-center">
                      +{analysisResults.experienceMismatch.warnings.length - 3} more issues
                    </p>
                  )}
                </div>
              </Card>
            )}

                         {/* Recommendations */}
             <Card className="p-6 bg-gradient-to-br from-blue-50 to-cyan-50 border-2 border-blue-200 card-hover">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Info className="h-5 w-5 mr-2 text-blue-600" />
                Recommendations
              </h3>
              <div className="space-y-3">
                {analysisResults.suggestions?.slice(0, 4).map((suggestion: any, index: number) => (
                  <div key={index} className="flex items-start space-x-2">
                    <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <p className="text-sm text-gray-700">{suggestion.title}</p>
                  </div>
                ))}
              </div>
            </Card>

                         {/* Application Checklist */}
             <Card className="p-6 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-200 card-hover">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <FileText className="h-5 w-5 mr-2 text-emerald-600" />
                Next Steps
              </h3>
              <div className="space-y-3">
                {[
                  'Review analysis results',
                  'Preview tailored resume',
                  'Download optimized PDF',
                  'Submit application',
                  'Follow up in 1-2 weeks'
                ].map((step, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium ${
                      index === 0 ? 'bg-green-100 text-green-800' :
                      index === 1 ? 'bg-green-100 text-green-800' :
                      'bg-gray-100 text-gray-500'
                    }`}>
                      {index < 2 ? '✓' : index + 1}
                    </div>
                    <span className={`text-sm ${index < 2 ? 'text-gray-700' : 'text-gray-500'}`}>
                      {step}
                    </span>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4">Resume Analyzer</h1>
        <p className="text-muted-foreground mb-4">
          Get AI-powered insights to optimize your resume for any job
        </p>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-muted-foreground">Available Credits:</span>
          <span className="bg-primary/10 text-primary px-3 py-1 rounded-full text-sm font-medium">
            {userProfile?.credits || 0}
          </span>
        </div>
        
        {userProfile?.credits === 0 && (
          <Alert className="mb-6">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              You need credits to analyze your resume. Each analysis costs 1 credit.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {step === 1 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              1
            </div>
            <h2 className="text-xl font-semibold">Upload Your Resume</h2>
          </div>
          
          <div className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
            pdfProcessing ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-primary/50'
          }`}>
            {pdfProcessing ? (
              <div className="space-y-4">
                <Loader2 className="h-12 w-12 text-primary mx-auto animate-spin" />
                <div>
                  <h3 className="text-lg font-medium mb-2">Processing PDF...</h3>
                  <p className="text-muted-foreground">Extracting text from your resume</p>
                </div>
              </div>
            ) : formData.resumeFile ? (
              <div className="space-y-4">
                <CheckCircle className="h-12 w-12 text-green-600 mx-auto" />
                <div>
                  <h3 className="text-lg font-medium text-green-800 mb-2">File Uploaded Successfully</h3>
                  <p className="text-green-600">{formData.resumeFile.name}</p>
                  <p className="text-sm text-muted-foreground mt-2">
                    {(formData.resumeFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setFormData({ ...formData, resumeFile: null, resumeText: '' });
                    setUploadError(null);
                  }}
                >
                  Upload Different File
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <div>
                  <h3 className="text-lg font-medium mb-2">Upload your resume</h3>
                  <p className="text-muted-foreground mb-4">PDF files only, up to 10MB</p>
                </div>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="resume-upload"
                  disabled={pdfProcessing}
                />
                <Button 
                  onClick={() => document.getElementById('resume-upload')?.click()}
                  disabled={pdfProcessing}
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Choose PDF File
                </Button>
              </div>
            )}
          </div>

          {uploadError && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{uploadError}</AlertDescription>
            </Alert>
          )}

          <div className="mt-6">
            <div className="flex items-center space-x-2 mb-3">
              <div className="flex-1 h-px bg-border"></div>
              <span className="text-sm text-muted-foreground">OR</span>
              <div className="flex-1 h-px bg-border"></div>
            </div>
            
            <Label htmlFor="resume-text" className="text-base font-medium">Paste your resume text:</Label>
            <Textarea
              id="resume-text"
              value={formData.resumeText}
              onChange={(e) => {
                setFormData({ ...formData, resumeText: e.target.value });
                setUploadError(null);
              }}
              placeholder="Paste your complete resume content here..."
              rows={8}
              className="mt-2"
              disabled={pdfProcessing}
            />
            
            {formData.resumeText && !formData.resumeFile && (
              <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center space-x-2">
                  <Info className="h-4 w-4 text-blue-600" />
                  <p className="text-sm text-blue-800">
                    {formData.resumeText.length} characters detected
                  </p>
                </div>
              </div>
            )}
            
            {(formData.resumeText || formData.resumeFile) && (
              <Button 
                onClick={() => setStep(2)} 
                className="w-full mt-4"
                disabled={pdfProcessing}
              >
                Continue to Job Details
                <ArrowLeft className="h-4 w-4 ml-2 rotate-180" />
              </Button>
            )}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground text-sm font-medium">
              2
            </div>
            <h2 className="text-xl font-semibold">Job Details</h2>
          </div>
          
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-title" className="text-base font-medium">Job Title</Label>
                <Input
                  id="job-title"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="company-name" className="text-base font-medium">Company Name</Label>
                <Input
                  id="company-name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Google"
                  className="mt-1"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="job-description" className="text-base font-medium">
                Job Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="job-description"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Paste the complete job description here..."
                rows={12}
                className="mt-2"
                required
              />
              {formData.jobDescription && (
                <p className="text-sm text-muted-foreground mt-2">
                  {formData.jobDescription.length} characters • 
                  {formData.jobDescription.split(' ').length} words
                </p>
              )}
            </div>

            <div className="bg-muted/50 rounded-lg p-4">
              <h3 className="font-medium mb-2">Resume Summary</h3>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Source: {formData.resumeFile ? 'PDF Upload' : 'Text Input'}</span>
                {formData.resumeFile && (
                  <span>File: {formData.resumeFile.name}</span>
                )}
                <span>{formData.resumeText.length} characters</span>
              </div>
            </div>

            {userProfile?.credits === 0 && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  You have no credits remaining. Purchase credits to analyze your resume.
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
                disabled={loading}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={!formData.jobDescription.trim() || loading || !userProfile?.credits}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    Analyze Resume (1 Credit)
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default UnifiedResumeAnalyzer;