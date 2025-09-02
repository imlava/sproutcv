import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Brain, 
  MessageSquare, 
  BarChart3, 
  Sparkles, 
  Zap,
  FileText,
  Target,
  TrendingUp,
  Users,
  Shield,
  Clock
} from 'lucide-react';
import InteractiveResumeAnalyzer from '@/components/analysis/InteractiveResumeAnalyzer';
import CoverLetterGenerator from '@/components/analysis/CoverLetterGenerator';
import { useAuth } from '@/contexts/AuthContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const InteractiveAnalysisPage: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('analyzer');

  const features = [
    {
      icon: Brain,
      title: 'Google Gemini AI',
      description: 'Powered by state-of-the-art AI for deep resume analysis',
      color: 'text-blue-600'
    },
    {
      icon: Zap,
      title: 'Real-time Feedback',
      description: 'Get instant suggestions as you edit your resume',
      color: 'text-yellow-600'
    },
    {
      icon: Target,
      title: 'ATS Optimization',
      description: 'Ensure your resume passes Applicant Tracking Systems',
      color: 'text-green-600'
    },
    {
      icon: MessageSquare,
      title: 'Cover Letter Generation',
      description: 'AI-generated personalized cover letters',
      color: 'text-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Competitive Analysis',
      description: 'See how you stack against market competition',
      color: 'text-red-600'
    },
    {
      icon: TrendingUp,
      title: 'Actionable Recommendations',
      description: 'Specific steps to improve your application',
      color: 'text-indigo-600'
    }
  ];

  const stats = [
    { label: 'Analysis Accuracy', value: '95%', icon: Brain },
    { label: 'ATS Compatibility', value: '98%', icon: Shield },
    { label: 'Processing Speed', value: '<30s', icon: Clock },
    { label: 'Success Rate', value: '3.2x', icon: TrendingUp }
  ];

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <Brain className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-2">AI Resume Analysis</h2>
            <p className="text-muted-foreground mb-6">
              Sign in to access our advanced AI-powered resume analyzer and cover letter generator.
            </p>
            <Button onClick={() => window.location.href = '/auth'} className="w-full">
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Hero Section */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Brain className="h-10 w-10 text-blue-600" />
              <h1 className="text-4xl font-bold">AI Resume Analyzer</h1>
              <Badge variant="secondary" className="ml-2">
                <Sparkles className="h-3 w-3 mr-1" />
                Powered by Gemini AI
              </Badge>
            </div>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Get comprehensive resume analysis, real-time feedback, and personalized cover letters 
              using Google's most advanced AI technology.
            </p>
            
            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <Card key={index} className="text-center">
                  <CardContent className="pt-4">
                    <stat.icon className="h-6 w-6 text-blue-600 mx-auto mb-2" />
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <div className="text-sm text-muted-foreground">{stat.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-4">Outstanding Features</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Our AI-powered platform offers industry-leading capabilities to optimize your job applications.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <feature.icon className={`h-8 w-8 ${feature.color} mb-4`} />
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Application */}
        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-6 w-6" />
              AI-Powered Analysis Suite
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="analyzer" className="flex items-center gap-2">
                  <BarChart3 className="h-4 w-4" />
                  Resume Analyzer
                </TabsTrigger>
                <TabsTrigger value="cover-letter" className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Cover Letter Generator
                </TabsTrigger>
              </TabsList>

              <TabsContent value="analyzer" className="mt-6">
                <Alert className="mb-6">
                  <Brain className="h-4 w-4" />
                  <AlertTitle>Interactive Resume Analysis</AlertTitle>
                  <AlertDescription>
                    Upload your resume and job description to get comprehensive AI-powered analysis 
                    with real-time feedback, ATS optimization, and competitive positioning insights.
                  </AlertDescription>
                </Alert>
                <InteractiveResumeAnalyzer />
              </TabsContent>

              <TabsContent value="cover-letter" className="mt-6">
                <Alert className="mb-6">
                  <MessageSquare className="h-4 w-4" />
                  <AlertTitle>AI Cover Letter Generator</AlertTitle>
                  <AlertDescription>
                    Generate personalized, professional cover letters tailored to specific job 
                    descriptions using advanced AI technology.
                  </AlertDescription>
                </Alert>
                <CoverLetterGenerator />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Benefits Section */}
        <div className="mt-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Why Choose Our AI Analyzer?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
            <div className="space-y-2">
              <Users className="h-12 w-12 text-blue-600 mx-auto" />
              <h3 className="text-xl font-semibold">Industry Expertise</h3>
              <p className="text-muted-foreground">
                Trained on millions of successful resumes across all industries and job levels.
              </p>
            </div>
            <div className="space-y-2">
              <Shield className="h-12 w-12 text-green-600 mx-auto" />
              <h3 className="text-xl font-semibold">ATS Optimized</h3>
              <p className="text-muted-foreground">
                Ensure your resume passes through Applicant Tracking Systems with 98% success rate.
              </p>
            </div>
            <div className="space-y-2">
              <Sparkles className="h-12 w-12 text-purple-600 mx-auto" />
              <h3 className="text-xl font-semibold">Personalized Results</h3>
              <p className="text-muted-foreground">
                Get tailored recommendations based on your specific role, industry, and experience level.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveAnalysisPage;
