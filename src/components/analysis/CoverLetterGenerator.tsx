import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  MessageSquare, 
  Copy, 
  Download, 
  RefreshCw, 
  FileText, 
  Eye,
  Sparkles,
  CheckCircle,
  Edit3,
  Save
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { GeminiAIService, type CoverLetter } from '@/services/ai/GeminiAIService';

interface CoverLetterGeneratorProps {
  initialResumeText?: string;
  initialJobDescription?: string;
  initialJobTitle?: string;
  initialCompanyName?: string;
}

const CoverLetterGenerator: React.FC<CoverLetterGeneratorProps> = ({
  initialResumeText = '',
  initialJobDescription = '',
  initialJobTitle = '',
  initialCompanyName = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const geminiService = GeminiAIService.getInstance();

  // State management
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [companyName, setCompanyName] = useState(initialCompanyName);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [editableContent, setEditableContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [generationHistory, setGenerationHistory] = useState<CoverLetter[]>([]);

  const generateCoverLetter = async () => {
    if (!resumeText.trim() || !jobDescription.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both resume text and job description.",
        variant: "destructive"
      });
      return;
    }

    if (!user) {
      toast({
        title: "Authentication Required", 
        description: "Please sign in to generate cover letters.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('📝 Generating cover letter with Gemini AI');
      
      const result = await geminiService.generateCoverLetter(
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        user.id
      );

      setCoverLetter(result);
      setEditableContent(result.content);
      setGenerationHistory(prev => [result, ...prev.slice(0, 4)]); // Keep last 5 versions
      
      toast({
        title: "Cover Letter Generated! 📝",
        description: "Your personalized cover letter is ready.",
      });

    } catch (error) {
      console.error('Cover letter generation error:', error);
      toast({
        title: "Generation Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const regenerateCoverLetter = async () => {
    await generateCoverLetter();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Cover letter copied to clipboard."
    });
  };

  const downloadCoverLetter = () => {
    if (!coverLetter) return;

    const content = isEditing ? editableContent : coverLetter.content;
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cover-letter-${jobTitle || 'position'}-${companyName || 'company'}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Downloaded!",
      description: "Cover letter saved to your device."
    });
  };

  const saveEdits = () => {
    if (coverLetter) {
      setCoverLetter({
        ...coverLetter,
        content: editableContent
      });
      setIsEditing(false);
      toast({
        title: "Changes Saved",
        description: "Your edits have been applied to the cover letter."
      });
    }
  };

  const restoreVersion = (version: CoverLetter) => {
    setCoverLetter(version);
    setEditableContent(version.content);
    setIsEditing(false);
    toast({
      title: "Version Restored",
      description: "Cover letter restored to selected version."
    });
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <MessageSquare className="h-8 w-8 text-blue-600" />
          AI Cover Letter Generator
        </h1>
        <p className="text-muted-foreground">
          Create personalized, professional cover letters powered by Google Gemini AI
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Job & Resume Information
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="job-title">Job Title</Label>
              <Input
                id="job-title"
                placeholder="e.g., Senior Software Engineer"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="company">Company Name</Label>
              <Input
                id="company"
                placeholder="e.g., Google, Microsoft"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="resume">Resume Text</Label>
              <Textarea
                id="resume"
                placeholder="Paste your resume content here..."
                className="min-h-[200px] font-mono text-sm"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the job description here..."
                className="min-h-[200px] font-mono text-sm"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button onClick={generateCoverLetter} disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Sparkles className="h-4 w-4" />
              )}
              {loading ? 'Generating...' : 'Generate Cover Letter'}
            </Button>

            {coverLetter && (
              <Button 
                onClick={regenerateCoverLetter} 
                disabled={loading}
                variant="outline"
                className="flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cover Letter Display */}
      {coverLetter && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Cover Letter */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Your Cover Letter
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setIsEditing(!isEditing)}
                    >
                      <Edit3 className="h-4 w-4" />
                      {isEditing ? 'Preview' : 'Edit'}
                    </Button>
                    {isEditing && (
                      <Button size="sm" onClick={saveEdits}>
                        <Save className="h-4 w-4" />
                        Save
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => copyToClipboard(isEditing ? editableContent : coverLetter.content)}
                    >
                      <Copy className="h-4 w-4" />
                      Copy
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={downloadCoverLetter}
                    >
                      <Download className="h-4 w-4" />
                      Download
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isEditing ? (
                  <Textarea
                    value={editableContent}
                    onChange={(e) => setEditableContent(e.target.value)}
                    className="min-h-[400px] font-serif text-sm leading-relaxed"
                    placeholder="Edit your cover letter..."
                  />
                ) : (
                  <div className="bg-white p-6 rounded-lg border min-h-[400px]">
                    <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed">
                      {coverLetter.content}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar - Analysis & Tools */}
          <div className="space-y-4">
            {/* Cover Letter Sections */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Eye className="h-4 w-4" />
                  Letter Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <h4 className="font-medium text-sm mb-1">Opening</h4>
                  <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    {coverLetter.sections.opening}
                  </p>
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Body Paragraphs</h4>
                  {coverLetter.sections.body.map((paragraph, index) => (
                    <p key={index} className="text-xs text-muted-foreground bg-gray-50 p-2 rounded mb-2">
                      {paragraph}
                    </p>
                  ))}
                </div>
                
                <div>
                  <h4 className="font-medium text-sm mb-1">Closing</h4>
                  <p className="text-xs text-muted-foreground bg-gray-50 p-2 rounded">
                    {coverLetter.sections.closing}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Personalizations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <Sparkles className="h-4 w-4" />
                  Personalizations Applied
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {coverLetter.personalizations.map((personalization, index) => (
                    <li key={index} className="flex items-start gap-2 text-xs">
                      <CheckCircle className="h-3 w-3 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-muted-foreground">{personalization}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Version History */}
            {generationHistory.length > 1 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-sm">
                    <RefreshCw className="h-4 w-4" />
                    Version History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {generationHistory.map((version, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div>
                          <div className="text-xs font-medium">
                            Version {generationHistory.length - index}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {new Date(version.sections.opening.slice(0, 19)).toLocaleString()}
                          </div>
                        </div>
                        {index > 0 && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => restoreVersion(version)}
                            className="text-xs"
                          >
                            Restore
                          </Button>
                        )}
                        {index === 0 && (
                          <Badge variant="secondary" className="text-xs">Current</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tips */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm">
                  <MessageSquare className="h-4 w-4" />
                  Cover Letter Tips
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Alert>
                  <AlertTitle className="text-sm">Pro Tips</AlertTitle>
                  <AlertDescription className="text-xs space-y-1">
                    <p>• Customize the greeting with hiring manager's name if known</p>
                    <p>• Include specific company details and recent news</p>
                    <p>• Quantify your achievements with numbers and metrics</p>
                    <p>• Match the tone to the company culture</p>
                    <p>• Keep it concise - one page maximum</p>
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Empty State */}
      {!coverLetter && (
        <Card>
          <CardContent className="text-center py-12">
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-xl font-medium mb-2">Generate Your Cover Letter</h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              Provide your resume and the job description above, then click "Generate Cover Letter" 
              to create a personalized, professional cover letter using AI.
            </p>
            <div className="space-y-2 text-sm text-muted-foreground">
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Personalized content based on your experience
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Professional tone and structure
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Tailored to specific job requirements
              </div>
              <div className="flex items-center justify-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                Editable and downloadable
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CoverLetterGenerator;
