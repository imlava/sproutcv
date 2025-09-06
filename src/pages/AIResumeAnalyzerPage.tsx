import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Brain, 
  FileText, 
  BarChart3, 
  Target, 
  Zap, 
  Download,
  Share2,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  Users,
  Award,
  Code,
  Briefcase,
  Loader2,
  Star
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { aiResumeService, AnalysisRequest, AnalysisResult } from '@/services/aiResumeService';
import { useAuth } from '@/contexts/AuthContext';
import { validateEnvironment } from '@/config/environment';

const AIResumeAnalyzerPage = () => {
  const [resumeText, setResumeText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [analysisType, setAnalysisType] = useState<'comprehensive' | 'quick' | 'ats'>('comprehensive');
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('input');
  const [userAnalyses, setUserAnalyses] = useState<any[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  // Protect route - redirect to auth if not logged in
  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);
  const environment = validateEnvironment();

  // Pre-fill with sample data
  useEffect(() => {
    setResumeText(`JOHN SMITH
Senior Software Engineer
Email: john.smith@email.com | Phone: (555) 123-4567

PROFESSIONAL SUMMARY
Experienced Senior Software Engineer with 8+ years developing scalable web applications using React, Node.js, and Python. Led cross-functional teams of 5+ developers and delivered 20+ successful projects. Expertise in cloud architecture, microservices, and agile methodologies.

EXPERIENCE
Senior Software Engineer | Tech Corp | 2020 - Present
• Led development of customer-facing web application serving 100K+ daily users
• Reduced system response time by 40% through performance optimization
• Mentored 3 junior developers and established code review processes
• Implemented CI/CD pipeline reducing deployment time from 2 hours to 15 minutes

Software Engineer | StartupXYZ | 2018 - 2020
• Built RESTful APIs handling 10M+ requests daily
• Collaborated with product team to deliver 15+ features ahead of schedule
• Reduced bug reports by 60% through comprehensive testing strategies
• Worked with React, Node.js, PostgreSQL, and AWS services

Junior Developer | WebSolutions | 2016 - 2018
• Developed responsive websites for 25+ clients
• Learned and applied modern JavaScript frameworks
• Participated in agile development processes

EDUCATION
Bachelor of Science in Computer Science | State University | 2016

SKILLS
Languages: JavaScript, Python, TypeScript, Java
Frameworks: React, Node.js, Express, Django
Databases: PostgreSQL, MongoDB, Redis
Cloud: AWS, Docker, Kubernetes
Tools: Git, Jenkins, JIRA, Slack`);

    setJobDescription(`SENIOR FULL STACK DEVELOPER
Company: InnovateNow Inc.
Location: San Francisco, CA (Remote OK)

ROLE OVERVIEW:
We're seeking a Senior Full Stack Developer to join our fast-growing fintech startup. You'll be responsible for building scalable web applications, leading technical initiatives, and mentoring junior developers.

REQUIREMENTS:
• 5+ years experience in full-stack development
• Strong proficiency in React, Node.js, and TypeScript
• Experience with cloud platforms (AWS preferred)
• Knowledge of microservices architecture and API design
• Experience with PostgreSQL and NoSQL databases
• Familiarity with DevOps practices (CI/CD, Docker, Kubernetes)
• Strong problem-solving skills and attention to detail
• Experience working in agile/scrum environments
• Bachelor's degree in Computer Science or related field

PREFERRED QUALIFICATIONS:
• Experience in fintech or financial services
• Knowledge of GraphQL and modern state management
• Experience with testing frameworks (Jest, Cypress)
• Leadership experience and ability to mentor junior developers
• Open source contributions

RESPONSIBILITIES:
• Design and develop scalable web applications
• Lead technical architecture decisions
• Mentor and guide junior developers
• Collaborate with product and design teams
• Implement best practices for code quality and security
• Participate in code reviews and technical discussions

BENEFITS:
• Competitive salary: $140K - $180K
• Equity package
• Health, dental, vision insurance
• Remote work flexibility
• Learning and development budget`);

    setJobTitle('Senior Full Stack Developer');
    setCompanyName('InnovateNow Inc.');
    
    // Load user's analysis history if authenticated
    if (user) {
      loadUserAnalyses();
    }
  }, [user]);

  const loadUserAnalyses = async () => {
    if (!user) return;
    
    setIsLoadingHistory(true);
    try {
      const analyses = await aiResumeService.getUserAnalyses(5);
      setUserAnalyses(analyses);
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  // Generate AI analysis
  const generateAIAnalysis = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to analyze your resume.",
        variant: "destructive",
      });
      return;
    }

    setIsAnalyzing(true);
    setError(null);
    
    try {
      const request: AnalysisRequest = {
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        analysisType
      };

      const result = await aiResumeService.analyzeResume(request);
      setAnalysis(result);
      setActiveTab('analysis');
      
      toast({
        title: "Analysis Complete!",
        description: "Your resume has been successfully analyzed.",
      });

      // Refresh history
      await loadUserAnalyses();
      
    } catch (error: any) {
      console.error('Analysis error:', error);
      setError(error.message || 'Failed to analyze resume. Please try again.');
      
      toast({
        title: "Analysis Failed",
        description: error.message || 'Failed to analyze resume. Please try again.',
        variant: "destructive",
      });
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Generate cover letter
  const generateCoverLetter = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate cover letters.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { coverLetter } = await aiResumeService.generateCoverLetter({
        resumeText,
        jobDescription,
        jobTitle,
        companyName
      });

      // Open in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Generated Cover Letter - ${jobTitle}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                .header { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                .content { white-space: pre-wrap; }
                @media print { body { padding: 20px; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Cover Letter</h1>
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="content">${coverLetter}</div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
      
      toast({
        title: "Cover Letter Generated!",
        description: "Your personalized cover letter has been generated and opened in a new window.",
      });
      
    } catch (error: any) {
      setError('Failed to generate cover letter: ' + error.message);
      toast({
        title: "Generation Failed",
        description: 'Failed to generate cover letter: ' + error.message,
        variant: "destructive",
      });
    }
  };

  // Generate tailored resume
  const generateTailoredResume = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please sign in to generate tailored resumes.",
        variant: "destructive",
      });
      return;
    }

    try {
      const { tailoredResume, optimizationApplied } = await aiResumeService.generateTailoredResume({
        resumeText,
        jobDescription,
        jobTitle,
        companyName
      });

      // Open in new window
      const newWindow = window.open('', '_blank');
      if (newWindow) {
        newWindow.document.write(`
          <html>
            <head>
              <title>Tailored Resume - ${jobTitle}</title>
              <style>
                body { font-family: Arial, sans-serif; padding: 40px; max-width: 800px; margin: 0 auto; line-height: 1.6; }
                h1 { color: #2563eb; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; }
                .header { background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 30px; }
                .content { white-space: pre-wrap; }
                .optimizations { background: #ecfdf5; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
                @media print { body { padding: 20px; } .header, .optimizations { background: white; } }
              </style>
            </head>
            <body>
              <div class="header">
                <h1>Tailored Resume</h1>
                <p><strong>Position:</strong> ${jobTitle}</p>
                <p><strong>Company:</strong> ${companyName}</p>
                <p><strong>Generated:</strong> ${new Date().toLocaleDateString()}</p>
              </div>
              <div class="optimizations">
                <h3>Optimizations Applied:</h3>
                <ul>
                  ${optimizationApplied?.map((opt: string) => `<li>${opt}</li>`).join('') || ''}
                </ul>
              </div>
              <div class="content">${tailoredResume}</div>
            </body>
          </html>
        `);
        newWindow.document.close();
      }
      
      toast({
        title: "Tailored Resume Generated!",
        description: "Your optimized resume has been generated and opened in a new window.",
      });
      
    } catch (error: any) {
      setError('Failed to generate tailored resume: ' + error.message);
      toast({
        title: "Generation Failed",
        description: 'Failed to generate tailored resume: ' + error.message,
        variant: "destructive",
      });
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 to-accent/5">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" aria-label="Loading" />
      </div>
    );
  }

  // Redirect to auth if not logged in (handled by useEffect, but this prevents flash)
  if (!user) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Brain className="h-10 w-10 text-blue-600" />
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            AI Resume Analyzer
          </h1>
        </div>
        <p className="text-lg text-gray-600">
          Advanced AI-powered resume analysis with Gemini integration
        </p>
        {environment.demoMode && (
          <Alert className="mt-4 max-w-2xl mx-auto">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Demo Mode: Using sample analysis data. Set up your Supabase environment to enable full AI functionality.
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* User's Analysis History */}
      {user && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Analyses
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoadingHistory ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Loading your analysis history...</span>
              </div>
            ) : userAnalyses.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {userAnalyses.map((analysis) => (
                  <Card key={analysis.id} className="border border-gray-200">
                    <CardContent className="p-4">
                      <h4 className="font-medium truncate">{analysis.job_title || 'Untitled Position'}</h4>
                      <p className="text-sm text-gray-600 truncate">{analysis.company_name || 'No company'}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">Score: {analysis.overall_score}%</Badge>
                        <Badge variant="outline">ATS: {analysis.ats_compatibility}%</Badge>
                      </div>
                      <p className="text-xs text-gray-500 mt-2">
                        {new Date(analysis.created_at).toLocaleDateString()}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No previous analyses found. Create your first analysis below!</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Main Interface */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-fit mx-auto">
          <TabsTrigger value="input" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Input
          </TabsTrigger>
          <TabsTrigger value="analysis" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Analysis
          </TabsTrigger>
          <TabsTrigger value="results" className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Results
          </TabsTrigger>
        </TabsList>

        {/* Error Display */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Input Tab */}
        <TabsContent value="input" className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Resume Input */}
            <Card>
              <CardHeader>
                <CardTitle>Resume Text</CardTitle>
                <CardDescription>Paste your resume text here</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={resumeText}
                  onChange={(e) => setResumeText(e.target.value)}
                  placeholder="Paste your resume text here..."
                  className="min-h-[300px]"
                  required
                />
              </CardContent>
            </Card>

            {/* Job Description Input */}
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
                <CardDescription>Paste the target job description</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  placeholder="Paste the job description here..."
                  className="min-h-[300px]"
                  required
                />
              </CardContent>
            </Card>
          </div>

          {/* Job Details */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <Input
                id="jobTitle"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g., Senior Software Engineer"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="e.g., Tech Company Inc."
              />
            </div>
          </div>

          {/* Analysis Options */}
          <Card>
            <CardHeader>
              <CardTitle>Analysis Options</CardTitle>
              <CardDescription>Choose your analysis type</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-4">
                {[
                  {
                    id: 'comprehensive' as const,
                    title: 'Comprehensive Analysis',
                    description: 'Deep dive analysis with detailed insights',
                    icon: Brain
                  },
                  {
                    id: 'quick' as const,
                    title: 'Quick Analysis',
                    description: 'Fast overview with key points',
                    icon: Zap
                  },
                  {
                    id: 'ats' as const,
                    title: 'ATS Focus Analysis',
                    description: 'Focus on ATS optimization',
                    icon: Target
                  }
                ].map(option => (
                  <Card
                    key={option.id}
                    className={`cursor-pointer transition-all ${
                      analysisType === option.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setAnalysisType(option.id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <option.icon className="h-5 w-5" />
                        <h4 className="font-medium">{option.title}</h4>
                      </div>
                      <p className="text-sm text-gray-600">{option.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-4">
            <Button
              onClick={generateAIAnalysis}
              disabled={isAnalyzing || !resumeText || !jobDescription || !user}
              size="lg"
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
            >
              {isAnalyzing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Brain className="h-5 w-5 mr-2" />
                  Analyze Resume
                </>
              )}
            </Button>

            <Button
              onClick={generateCoverLetter}
              disabled={!resumeText || !jobDescription || !user}
              variant="outline"
              size="lg"
            >
              <FileText className="h-5 w-5 mr-2" />
              Generate Cover Letter
            </Button>

            <Button
              onClick={generateTailoredResume}
              disabled={!resumeText || !jobDescription || !user}
              variant="outline"
              size="lg"
            >
              <Download className="h-5 w-5 mr-2" />
              Generate Tailored Resume
            </Button>
          </div>

          {!user && (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Please sign in to use the AI Resume Analyzer features.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        {/* Analysis Tab */}
        <TabsContent value="analysis" className="space-y-6">
          {analysis ? (
            <>
              {/* Overall Scores */}
              <div className="grid md:grid-cols-3 gap-6">
                <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <BarChart3 className="h-6 w-6" />
                      <h3 className="text-lg font-semibold">Overall Score</h3>
                    </div>
                    <div className="text-3xl font-bold">
                      {analysis.overall_score || analysis.ats_score}%
                    </div>
                  </CardContent>
                </Card>

                {analysis.match_percentage && (
                  <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Target className="h-6 w-6" />
                        <h3 className="text-lg font-semibold">Job Match</h3>
                      </div>
                      <div className="text-3xl font-bold">{analysis.match_percentage}%</div>
                    </CardContent>
                  </Card>
                )}

                {analysis.ats_score && (
                  <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
                    <CardContent className="p-6">
                      <div className="flex items-center gap-3 mb-2">
                        <Award className="h-6 w-6" />
                        <h3 className="text-lg font-semibold">ATS Score</h3>
                      </div>
                      <div className="text-3xl font-bold">{analysis.ats_score}%</div>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Analysis Content */}
              {analysisType === 'comprehensive' && analysis.strengths && (
                <>
                  {/* Strengths */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2 text-green-700">
                        <CheckCircle className="h-6 w-6" />
                        Key Strengths
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {analysis.strengths.map((strength, index) => (
                        <div key={index} className="bg-green-50 rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="font-medium text-green-800">{strength.category}</h4>
                            <Badge variant={
                              strength.impact === 'High' ? 'default' : 
                              strength.impact === 'Medium' ? 'secondary' : 'outline'
                            }>
                              {strength.impact} Impact
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{strength.description}</p>
                          <div className="space-y-1">
                            <Progress value={strength.relevance_score} className="h-2" />
                            <span className="text-xs text-gray-600">
                              Relevance: {strength.relevance_score}%
                            </span>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>

                  {/* Areas for Improvement */}
                  {analysis.areas_for_improvement && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-orange-700">
                          <TrendingUp className="h-6 w-6" />
                          Areas for Improvement
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {analysis.areas_for_improvement.map((area, index) => (
                          <div key={index} className="bg-orange-50 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-orange-800">{area.category}</h4>
                              <Badge variant={
                                area.priority === 'High' ? 'destructive' : 
                                area.priority === 'Medium' ? 'default' : 'secondary'
                              }>
                                {area.priority} Priority
                              </Badge>
                            </div>
                            <p className="text-gray-700 mb-2">{area.description}</p>
                            <div className="bg-gray-50 rounded p-3">
                              <p className="text-sm text-gray-700">
                                <strong>Suggestion:</strong> {area.suggested_action}
                              </p>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}
                </>
              )}

              {/* Quick Analysis Results */}
              {analysisType === 'quick' && (
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-green-700">Top Strengths</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.top_strengths?.map((strength, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                            <span>{strength}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-orange-700">Immediate Improvements</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.immediate_improvements?.map((improvement, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <AlertCircle className="h-5 w-5 text-orange-600 mt-0.5" />
                            <span>{improvement}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-700">Quick Wins</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.quick_wins?.map((win, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Zap className="h-5 w-5 text-blue-600 mt-0.5" />
                            <span>{win}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* ATS Analysis Results */}
              {analysisType === 'ats' && (
                <div className="space-y-6">
                  <div className="grid md:grid-cols-3 gap-6">
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="font-medium text-gray-800 mb-2">Keyword Match</h4>
                        <div className="text-2xl font-bold text-blue-600">{analysis.keyword_match}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="font-medium text-gray-800 mb-2">Formatting Score</h4>
                        <div className="text-2xl font-bold text-green-600">{analysis.formatting_score}%</div>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-6">
                        <h4 className="font-medium text-gray-800 mb-2">Overall ATS Score</h4>
                        <div className="text-2xl font-bold text-purple-600">{analysis.ats_score}%</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Keywords Analysis</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid md:grid-cols-2 gap-6">
                        <div>
                          <h4 className="font-medium text-green-800 mb-3">Matched Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.matched_keywords?.map((keyword, index) => (
                              <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                        <div>
                          <h4 className="font-medium text-red-800 mb-3">Missing Critical Keywords</h4>
                          <div className="flex flex-wrap gap-2">
                            {analysis.missing_critical_keywords?.map((keyword, index) => (
                              <Badge key={index} variant="destructive" className="bg-red-100 text-red-800">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-blue-800">ATS Optimization Tips</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2">
                        {analysis.ats_optimization_tips?.map((tip, index) => (
                          <li key={index} className="flex items-start gap-2">
                            <Target className="h-5 w-5 text-blue-600 mt-0.5" />
                            <span>{tip}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              )}
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Analysis Yet</h3>
                <p className="text-gray-600">
                  Go back to the Input tab and run an analysis to see results here.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Results Tab */}
        <TabsContent value="results" className="space-y-6">
          {analysis ? (
            <>
              {/* Action Items */}
              {analysis.recommendations && (
                <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Briefcase className="h-6 w-6" />
                      Actionable Recommendations
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid md:grid-cols-3 gap-6">
                      <div>
                        <h4 className="font-medium mb-3">Immediate Actions</h4>
                        <ul className="space-y-1">
                          {analysis.recommendations.immediate_actions?.map((action, index) => (
                            <li key={index} className="text-sm opacity-90">• {action}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Short-term Goals</h4>
                        <ul className="space-y-1">
                          {analysis.recommendations.short_term_goals?.map((goal, index) => (
                            <li key={index} className="text-sm opacity-90">• {goal}</li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium mb-3">Long-term Development</h4>
                        <ul className="space-y-1">
                          {analysis.recommendations.long_term_development?.map((dev, index) => (
                            <li key={index} className="text-sm opacity-90">• {dev}</li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Interview Preparation */}
              {analysis.interview_preparation && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-yellow-700">
                      <Users className="h-6 w-6" />
                      Interview Preparation
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">Likely Questions</h4>
                      <ul className="space-y-1">
                        {analysis.interview_preparation.likely_questions?.map((question, index) => (
                          <li key={index} className="text-sm text-gray-700">• {question}</li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-medium text-yellow-800 mb-2">STAR Method Opportunities</h4>
                      <ul className="space-y-1">
                        {analysis.interview_preparation.story_opportunities?.map((story, index) => (
                          <li key={index} className="text-sm text-gray-700">• {story}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Salary Insights */}
              {analysis.salary_insights && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-green-700">
                      <TrendingUp className="h-6 w-6" />
                      Salary & Negotiation Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <h4 className="font-medium text-green-800">Estimated Range</h4>
                      <p className="text-gray-700">{analysis.salary_insights.estimated_range}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Market Positioning</h4>
                      <p className="text-gray-700">{analysis.salary_insights.market_positioning}</p>
                    </div>
                    <div>
                      <h4 className="font-medium text-green-800">Negotiation Points</h4>
                      <ul className="space-y-1">
                        {analysis.salary_insights.negotiation_points?.map((point, index) => (
                          <li key={index} className="text-sm text-gray-700">• {point}</li>
                        ))}
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Export Options */}
              <div className="flex flex-wrap gap-4 justify-center">
                <Button 
                  onClick={() => window.print()}
                  variant="outline"
                >
                  <Download className="h-5 w-5 mr-2" />
                  Export Analysis
                </Button>
                <Button 
                  onClick={() => {
                    if (navigator.share) {
                      navigator.share({
                        title: 'Resume Analysis Results',
                        text: `My resume scored ${analysis.overall_score || analysis.ats_score}% for ${jobTitle}`,
                      });
                    }
                  }}
                  variant="outline"
                >
                  <Share2 className="h-5 w-5 mr-2" />
                  Share Results
                </Button>
              </div>
            </>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Results Yet</h3>
                <p className="text-gray-600">
                  Complete an analysis to see detailed results and recommendations.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* Loading Overlay */}
      {isAnalyzing && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="max-w-md">
            <CardContent className="p-8 text-center">
              <Brain className="h-12 w-12 text-blue-600 mx-auto mb-4 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">Analyzing Resume...</h3>
              <p className="text-gray-600 mb-4">Our AI is performing a deep analysis of your resume</p>
              <Progress value={70} className="w-full" />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default AIResumeAnalyzerPage;
