
import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText, Loader2, AlertCircle, CheckCircle, Info, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pdfProcessing, setPdfProcessing] = useState(false);
  
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
    
    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file only');
      return;
    }
    
    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }
    
    setPdfProcessing(true);
    
    try {
      // Simulate PDF processing
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
    // Validation
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

            {/* Resume Summary */}
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
                    <FileText className="h-4 w-4 ml-2" />
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

export default EnhancedResumeAnalyzer;
