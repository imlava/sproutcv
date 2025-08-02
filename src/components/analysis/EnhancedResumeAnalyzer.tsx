
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, AlertCircle } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import ScoreDashboard from '@/components/ScoreDashboard';
import ExperienceMismatchWarning from './ExperienceMismatchWarning';
import ResumeExportOptions from './ResumeExportOptions';

const EnhancedResumeAnalyzer = () => {
  const { userProfile, refreshProfile } = useAuth();
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [analysisResults, setAnalysisResults] = useState<any>(null);
  const [showMismatchWarning, setShowMismatchWarning] = useState(false);
  
  const [formData, setFormData] = useState({
    resumeFile: null as File | null,
    resumeText: '',
    jobDescription: '',
    jobTitle: '',
    companyName: ''
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setFormData({ ...formData, resumeFile: file });
      // In a real implementation, you'd extract text from PDF
      setFormData(prev => ({ ...prev, resumeText: 'Extracted PDF text would go here...' }));
      setStep(2);
    } else {
      toast({
        variant: "destructive",
        title: "Invalid file",
        description: "Please upload a PDF file",
      });
    }
  };

  const handleAnalyze = async () => {
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
          job_title: formData.jobTitle,
          company_name: formData.companyName
        }
      });

      if (error) throw error;

      setAnalysisResults(data);
      
      // Check if there's an experience mismatch
      if (data.experienceMismatch && data.experienceMismatch.severity !== 'none') {
        setShowMismatchWarning(true);
      } else {
        setStep(3);
      }
      
      await refreshProfile(); // Refresh to update credits
      
      toast({
        title: "Analysis complete!",
        description: "Your resume has been analyzed successfully",
      });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Analysis failed",
        description: error.message || "Something went wrong",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProceedWithMismatch = () => {
    setShowMismatchWarning(false);
    setStep(3);
  };

  const handleViewBetterRoles = () => {
    // In a real implementation, this would navigate to a job suggestions page
    toast({
      title: "Feature coming soon!",
      description: "Better role matching feature will be available soon.",
    });
  };

  const handleStartNew = () => {
    setStep(1);
    setAnalysisResults(null);
    setShowMismatchWarning(false);
    setFormData({
      resumeFile: null,
      resumeText: '',
      jobDescription: '',
      jobTitle: '',
      companyName: ''
    });
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
        
        <ExperienceMismatchWarning
          warnings={analysisResults.experienceMismatch.warnings}
          severity={analysisResults.experienceMismatch.severity}
          recommendedRoles={analysisResults.recommendedRoles || []}
          onProceed={handleProceedWithMismatch}
          onViewBetterRoles={handleViewBetterRoles}
        />
      </div>
    );
  }

  // Show final results with export options
  if (step === 3 && analysisResults) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Resume Analysis Complete</h1>
          <p className="text-gray-600 mb-4">
            Here's how your resume matches the job description
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Button onClick={handleStartNew} variant="outline">
              Analyze Another Resume
            </Button>
            <span className="text-sm text-gray-500">•</span>
            <p className="text-sm text-gray-600">
              {formData.jobTitle} at {formData.companyName}
            </p>
          </div>
        </div>
        
        <div className="space-y-8">
          <ScoreDashboard
            overallScore={analysisResults.overallScore}
            keywordMatch={analysisResults.keywordMatch}
            skillsAlignment={analysisResults.skillsAlignment}
            atsCompatibility={analysisResults.atsCompatibility}
            experienceRelevance={analysisResults.experienceRelevance}
            suggestions={analysisResults.suggestions}
          />
          
          <ResumeExportOptions
            analysisId="analysis-123"
            jobTitle={formData.jobTitle}
            companyName={formData.companyName}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Resume Analyzer</h1>
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-sm text-gray-600">Available Credits:</span>
          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
            {userProfile?.credits || 0}
          </span>
        </div>
      </div>

      {step === 1 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Step 1: Upload Your Resume</h2>
          
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
            <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 mb-2">
              Upload your resume
            </h3>
            <p className="text-gray-500 mb-4">PDF files only, up to 10MB</p>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileUpload}
              className="hidden"
              id="resume-upload"
            />
            <Button onClick={() => document.getElementById('resume-upload')?.click()}>
              Choose File
            </Button>
          </div>

          <div className="mt-6">
            <Label htmlFor="resume-text">Or paste your resume text:</Label>
            <Textarea
              id="resume-text"
              value={formData.resumeText}
              onChange={(e) => setFormData({ ...formData, resumeText: e.target.value })}
              placeholder="Paste your resume content here..."
              rows={8}
              className="mt-2"
            />
            {formData.resumeText && (
              <Button 
                onClick={() => setStep(2)} 
                className="w-full mt-4"
              >
                Continue
              </Button>
            )}
          </div>
        </Card>
      )}

      {step === 2 && (
        <Card className="p-6">
          <h2 className="text-xl font-semibold mb-4">Step 2: Job Details</h2>
          
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job-title">Job Title</Label>
                <Input
                  id="job-title"
                  value={formData.jobTitle}
                  onChange={(e) => setFormData({ ...formData, jobTitle: e.target.value })}
                  placeholder="e.g. Senior Software Engineer"
                />
              </div>
              <div>
                <Label htmlFor="company-name">Company Name</Label>
                <Input
                  id="company-name"
                  value={formData.companyName}
                  onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                  placeholder="e.g. Google"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="job-description">Job Description *</Label>
              <Textarea
                id="job-description"
                value={formData.jobDescription}
                onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
                placeholder="Paste the complete job description here..."
                rows={10}
                className="mt-2"
                required
              />
            </div>

            {userProfile?.credits === 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 flex items-center">
                <AlertCircle className="h-5 w-5 text-orange-500 mr-3" />
                <div>
                  <p className="text-orange-800 font-medium">No credits remaining</p>
                  <p className="text-orange-600 text-sm">Please purchase more credits to analyze your resume</p>
                </div>
              </div>
            )}

            <div className="flex space-x-4">
              <Button 
                variant="outline" 
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                onClick={handleAnalyze}
                disabled={!formData.jobDescription || loading || !userProfile?.credits}
                className="flex-1"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Analyze Resume (1 Credit)
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default EnhancedResumeAnalyzer;
