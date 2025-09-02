import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { 
  Brain, 
  Target, 
  Zap, 
  TrendingUp, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Lightbulb,
  BarChart3,
  Sparkles,
  Download,
  Copy,
  RefreshCw,
  Eye,
  MessageSquare
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { GeminiAIService, type GeminiAnalysisResult, type CoverLetter } from '@/services/ai/GeminiAIService';

interface InteractiveResumeAnalyzerProps {
  initialResumeText?: string;
  initialJobDescription?: string;
}

const InteractiveResumeAnalyzer: React.FC<InteractiveResumeAnalyzerProps> = ({
  initialResumeText = '',
  initialJobDescription = ''
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const geminiService = GeminiAIService.getInstance();

  // State management
  const [resumeText, setResumeText] = useState(initialResumeText);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [analysisResult, setAnalysisResult] = useState<GeminiAnalysisResult | null>(null);
  const [coverLetter, setCoverLetter] = useState<CoverLetter | null>(null);
  const [loading, setLoading] = useState(false);
  const [realTimeFeedback, setRealTimeFeedback] = useState<{
    skills: any;
    experience: any;
    summary: any;
  }>({
    skills: null,
    experience: null,
    summary: null
  });
  const [activeTab, setActiveTab] = useState('overview');
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'quick' | 'ats_focus' | 'skills_gap'>('comprehensive');

  // Real-time feedback for resume editing
  useEffect(() => {
    if (resumeText.length > 100) {
      const timeoutId = setTimeout(() => {
        updateRealTimeFeedback();
      }, 2000); // Debounce for 2 seconds

      return () => clearTimeout(timeoutId);
    }
  }, [resumeText]);

  const updateRealTimeFeedback = useCallback(async () => {
    if (!resumeText.trim()) return;

    try {
      const [skillsFeedback, experienceFeedback, summaryFeedback] = await Promise.all([
        geminiService.getInstantFeedback(resumeText, 'skills'),
        geminiService.getInstantFeedback(resumeText, 'experience'),
        geminiService.getInstantFeedback(resumeText, 'summary')
      ]);

      setRealTimeFeedback({
        skills: skillsFeedback,
        experience: experienceFeedback,
        summary: summaryFeedback
      });
    } catch (error) {
      console.error('Real-time feedback error:', error);
    }
  }, [resumeText]);

  const runAnalysis = async () => {
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
        description: "Please sign in to access AI analysis.",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      console.log('🚀 Starting interactive analysis');
      
      const result = await geminiService.analyzeResumeInteractive({
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        analysisType,
        includeInteractive: true,
        includeCoverLetter: true
      }, user.id);

      setAnalysisResult(result);
      setCoverLetter(result.coverLetter || null);
      setActiveTab('overview');

      toast({
        title: "Analysis Complete! 🎉",
        description: `Your resume scored ${result.overallScore}/100 with ${result.confidenceScore}% confidence.`
      });

    } catch (error) {
      console.error('Analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

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
      const result = await geminiService.generateCoverLetter(
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        user.id
      );

      setCoverLetter(result);
      setActiveTab('cover-letter');

      toast({
        title: "Cover Letter Generated! 📝",
        description: "Your personalized cover letter is ready."
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

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard."
    });
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold flex items-center justify-center gap-2">
          <Brain className="h-8 w-8 text-blue-600" />
          AI-Powered Resume Analyzer
        </h1>
        <p className="text-muted-foreground">
          Get instant, interactive feedback powered by Google Gemini AI
        </p>
      </div>

      {/* Input Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Resume & Job Information
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
                className="min-h-[300px] font-mono text-sm"
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
              />
              
              {/* Real-time feedback indicators */}
              {resumeText.length > 100 && (
                <div className="grid grid-cols-3 gap-2 mt-2">
                  {Object.entries(realTimeFeedback).map(([section, feedback]) => (
                    <div key={section} className="text-center">
                      <div className={`text-sm font-medium ${feedback ? getScoreColor(feedback.score) : 'text-gray-400'}`}>
                        {section.charAt(0).toUpperCase() + section.slice(1)}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {feedback ? `${feedback.score}/100` : 'Analyzing...'}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="job-description">Job Description</Label>
              <Textarea
                id="job-description"
                placeholder="Paste the job description here..."
                className="min-h-[300px] font-mono text-sm"
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex items-center gap-2">
              <Label htmlFor="analysis-type" className="text-sm">Analysis Type:</Label>
              <select
                id="analysis-type"
                className="text-sm border rounded px-2 py-1"
                value={analysisType}
                onChange={(e) => setAnalysisType(e.target.value as any)}
              >
                <option value="comprehensive">Comprehensive</option>
                <option value="quick">Quick Analysis</option>
                <option value="ats_focus">ATS Focus</option>
                <option value="skills_gap">Skills Gap</option>
              </select>
            </div>

            <Button onClick={runAnalysis} disabled={loading} className="flex items-center gap-2">
              {loading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Zap className="h-4 w-4" />
              )}
              {loading ? 'Analyzing...' : 'Analyze Resume'}
            </Button>

            <Button 
              onClick={generateCoverLetter} 
              disabled={loading}
              variant="outline"
              className="flex items-center gap-2"
            >
              <MessageSquare className="h-4 w-4" />
              Generate Cover Letter
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results Section */}
      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analysis Results
              <Badge variant="secondary" className="ml-2">
                {analysisResult.processingVersion}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-5">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="insights">Insights</TabsTrigger>
                <TabsTrigger value="recommendations">Actions</TabsTrigger>
                <TabsTrigger value="competitive">Competitive</TabsTrigger>
                <TabsTrigger value="cover-letter">Cover Letter</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="text-center">
                  <div className="text-4xl font-bold mb-2">
                    <span className={getScoreColor(analysisResult.overallScore)}>
                      {analysisResult.overallScore}/100
                    </span>
                  </div>
                  <p className="text-muted-foreground">Overall Resume Score</p>
                  <Badge variant="outline" className="mt-2">
                    {analysisResult.confidenceScore}% Confidence
                  </Badge>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  {Object.entries(analysisResult.detailedAnalysis).map(([key, score]) => (
                    <Card key={key} className="text-center">
                      <CardContent className="pt-4">
                        <div className={`text-2xl font-bold ${getScoreColor(score)}`}>
                          {score}
                        </div>
                        <div className="text-sm text-muted-foreground mt-1">
                          {key.replace(/([A-Z])/g, ' $1').trim()}
                        </div>
                        <Progress value={score} className="mt-2" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>

              {/* Interactive Insights Tab */}
              <TabsContent value="insights" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Strengths */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-600">
                        <CheckCircle className="h-5 w-5" />
                        Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisResult.interactiveInsights.strengthsAnalysis.map((strength, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{strength.category}</h4>
                            <Badge variant="outline">{strength.score}/100</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{strength.details}</p>
                          {strength.examples.length > 0 && (
                            <ul className="text-xs space-y-1">
                              {strength.examples.map((example, i) => (
                                <li key={i} className="text-green-600">• {example}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Improvement Areas */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-orange-600">
                        <AlertCircle className="h-5 w-5" />
                        Improvement Areas
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysisResult.interactiveInsights.improvementAreas.map((area, index) => (
                        <div key={index} className="space-y-2">
                          <div className="flex justify-between items-center">
                            <h4 className="font-medium">{area.category}</h4>
                            <Badge variant={getPriorityColor(area.priority)}>
                              {area.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{area.issue}</p>
                          <Alert>
                            <Lightbulb className="h-4 w-4" />
                            <AlertTitle>Solution</AlertTitle>
                            <AlertDescription>{area.solution}</AlertDescription>
                          </Alert>
                          <p className="text-xs text-blue-600">
                            <strong>Impact:</strong> {area.impact}
                          </p>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Keywords Analysis */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Target className="h-5 w-5" />
                      Keywords Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h4 className="font-medium text-red-600 mb-2">Missing Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.interactiveInsights.missingKeywords.map((keyword, index) => (
                            <Badge key={index} variant="destructive">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                      <div>
                        <h4 className="font-medium text-green-600 mb-2">Suggested Keywords</h4>
                        <div className="flex flex-wrap gap-2">
                          {analysisResult.interactiveInsights.suggeredKeywords.map((keyword, index) => (
                            <Badge key={index} variant="secondary">{keyword}</Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Actionable Recommendations Tab */}
              <TabsContent value="recommendations" className="space-y-4">
                {analysisResult.actionableRecommendations.map((recommendation, index) => (
                  <Card key={index}>
                    <CardContent className="pt-4">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="font-medium">{recommendation.action}</h3>
                        <div className="flex gap-2">
                          <Badge variant={getPriorityColor(recommendation.difficulty)}>
                            {recommendation.difficulty}
                          </Badge>
                          <Badge variant="outline">{recommendation.timeEstimate}</Badge>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {recommendation.description}
                      </p>
                      <Alert>
                        <TrendingUp className="h-4 w-4" />
                        <AlertTitle>Expected Impact</AlertTitle>
                        <AlertDescription>{recommendation.expectedImpact}</AlertDescription>
                      </Alert>
                    </CardContent>
                  </Card>
                ))}
              </TabsContent>

              {/* Competitive Analysis Tab */}
              <TabsContent value="competitive" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5" />
                      Market Position
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-center mb-4">
                      <div className="text-3xl font-bold mb-2">
                        <span className={getScoreColor(analysisResult.competitiveAnalysis.competitivenessScore)}>
                          {analysisResult.competitiveAnalysis.competitivenessScore}/100
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">Competitiveness Score</p>
                    </div>
                    
                    <Separator className="my-4" />
                    
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-medium mb-2">Market Position</h4>
                        <p className="text-sm text-muted-foreground">
                          {analysisResult.competitiveAnalysis.marketPosition}
                        </p>
                      </div>
                      
                      <div>
                        <h4 className="font-medium mb-2">Standout Factors</h4>
                        <ul className="space-y-1">
                          {analysisResult.competitiveAnalysis.standoutFactors.map((factor, index) => (
                            <li key={index} className="text-sm flex items-center gap-2">
                              <Sparkles className="h-4 w-4 text-yellow-500" />
                              {factor}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Cover Letter Tab */}
              <TabsContent value="cover-letter" className="space-y-4">
                {coverLetter ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        AI-Generated Cover Letter
                        <div className="ml-auto flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyToClipboard(coverLetter.content)}
                          >
                            <Copy className="h-4 w-4" />
                            Copy
                          </Button>
                          <Button size="sm" variant="outline">
                            <Download className="h-4 w-4" />
                            Download
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                          <pre className="whitespace-pre-wrap text-sm font-mono">
                            {coverLetter.content}
                          </pre>
                        </div>
                        
                        <Separator />
                        
                        <div>
                          <h4 className="font-medium mb-2">Personalizations Applied</h4>
                          <ul className="space-y-1">
                            {coverLetter.personalizations.map((personalization, index) => (
                              <li key={index} className="text-sm flex items-center gap-2">
                                <Eye className="h-4 w-4 text-blue-500" />
                                {personalization}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-medium mb-2">No Cover Letter Generated</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Click "Generate Cover Letter" to create a personalized cover letter.
                      </p>
                      <Button onClick={generateCoverLetter} disabled={loading}>
                        Generate Cover Letter
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default InteractiveResumeAnalyzer;
