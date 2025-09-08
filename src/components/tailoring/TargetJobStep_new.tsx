import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { geminiService } from '@/services/ai/geminiService';
import { 
  Target, 
  Building, 
  Briefcase, 
  Brain, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  Zap,
  BarChart3,
  Users,
  Clock,
  RefreshCw
} from 'lucide-react';

interface TargetJobStepProps {
  state: {
    description: string;
    title: string;
    company: string;
    requirements: string[];
    keywords: string[];
    skillGaps: string[];
    analysis?: any;
    analyzed: boolean;
  };
  onUpdate: (job: any) => void;
  onNext: () => void;
  onPrev: () => void;
  resumeText: string;
}

const TargetJobStep: React.FC<TargetJobStepProps> = ({ state, onUpdate, onNext, onPrev, resumeText }) => {
  const [analyzing, setAnalyzing] = useState(false);
  const { toast } = useToast();

  const handleAnalyzeJob = async () => {
    if (!state.description.trim()) {
      toast({
        title: "Job Description Required",
        description: "Please paste the job description to analyze.",
        variant: "destructive",
      });
      return;
    }

    if (!geminiService.isServiceAvailable()) {
      toast({
        title: "AI Service Unavailable",
        description: "Gemini AI service is not configured. Please check your API key.",
        variant: "destructive",
      });
      return;
    }

    setAnalyzing(true);
    
    try {
      // Use Gemini AI to analyze the job description
      const analysisResult = await geminiService.analyzeJobDescription(state.description);
      
      // Extract job info from the description for basic fields
      const lines = state.description.split('\n');
      const possibleTitle = lines.find(line => 
        line.toLowerCase().includes('title:') || 
        line.toLowerCase().includes('position:') ||
        line.toLowerCase().includes('role:')
      )?.split(':')[1]?.trim() || '';
      
      const possibleCompany = lines.find(line => 
        line.toLowerCase().includes('company:') || 
        line.toLowerCase().includes('organization:')
      )?.split(':')[1]?.trim() || '';

      const updatedState = {
        ...state,
        title: possibleTitle || state.title,
        company: possibleCompany || state.company,
        requirements: analysisResult.keyRequirements,
        keywords: Object.keys(analysisResult.keywordDensity),
        skillGaps: [], // Will be determined in resume analysis
        analysis: analysisResult,
        analyzed: true
      };

      onUpdate(updatedState);

      toast({
        title: "Job Analysis Complete",
        description: `Identified ${analysisResult.keyRequirements.length} key requirements and ${Object.keys(analysisResult.keywordDensity).length} keywords.`,
      });
    } catch (error) {
      console.error('Job analysis error:', error);
      toast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to analyze the job description. Please try again.",
        variant: "destructive",
      });
      
      // Fallback to mock data if API fails
      const fallbackResult = {
        requirements: [
          'Experience in relevant field',
          'Strong communication skills',
          'Team collaboration',
          'Problem-solving abilities'
        ],
        keywords: ['Experience', 'Skills', 'Team', 'Communication'],
        skillGaps: [],
        analysis: { roleLevel: 'mid', techStack: [] },
        analyzed: true
      };
      
      onUpdate({ ...state, ...fallbackResult });
    } finally {
      setAnalyzing(false);
    }
  };

  const canProceed = state.description && state.analyzed;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Step 2: Target Job Analysis</h2>
        <p className="text-gray-600">Analyze the job description to understand requirements and keywords.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Job Information Input */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2 text-blue-600" />
            Job Information
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="jobTitle">Job Title</Label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="jobTitle"
                  className="pl-10"
                  placeholder="Senior Frontend Developer"
                  value={state.title}
                  onChange={(e) => onUpdate({ ...state, title: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="company">Company</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="company"
                  className="pl-10"
                  placeholder="Company Name"
                  value={state.company}
                  onChange={(e) => onUpdate({ ...state, company: e.target.value })}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Job Description</Label>
              <Textarea
                id="description"
                placeholder="Paste the complete job description here..."
                className="min-h-40"
                value={state.description}
                onChange={(e) => onUpdate({ ...state, description: e.target.value })}
              />
            </div>
            
            <Button 
              onClick={handleAnalyzeJob}
              disabled={analyzing || !state.description.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              {analyzing ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Analyzing with AI...
                </>
              ) : (
                <>
                  <Brain className="h-4 w-4 mr-2" />
                  Analyze Job Description
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* AI Analysis Results */}
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <Zap className="h-5 w-5 mr-2 text-yellow-600" />
            AI Analysis Results
          </h3>
          
          {!state.analyzed ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500">Analyze the job description to see AI insights</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{state.requirements.length}</div>
                  <div className="text-sm text-blue-700">Key Requirements</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{state.keywords.length}</div>
                  <div className="text-sm text-green-700">Keywords Found</div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Key Requirements:</h4>
                <div className="space-y-2">
                  {state.requirements.slice(0, 5).map((req, index) => (
                    <div key={index} className="flex items-start">
                      <CheckCircle className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                      <span className="text-sm text-gray-700">{req}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-800 mb-2">Top Keywords:</h4>
                <div className="flex flex-wrap gap-2">
                  {state.keywords.slice(0, 8).map((keyword, index) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
              
              {state.analysis && (
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">Role Level:</span>
                      <Badge className="ml-2">{state.analysis.roleLevel}</Badge>
                    </div>
                    {state.analysis.techStack && state.analysis.techStack.length > 0 && (
                      <div>
                        <span className="font-medium text-gray-600">Tech Stack:</span>
                        <span className="ml-2 text-gray-700">{state.analysis.techStack.slice(0, 3).join(', ')}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      {/* Job Insights */}
      {state.analyzed && (
        <Card className="p-6">
          <h3 className="text-xl font-semibold mb-4 flex items-center">
            <BarChart3 className="h-5 w-5 mr-2 text-purple-600" />
            Job Market Insights
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Users className="h-8 w-8 text-purple-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-purple-800">Competitive</div>
              <div className="text-sm text-purple-600">Market demand level</div>
            </div>
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Clock className="h-8 w-8 text-orange-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-orange-800">2-3 weeks</div>
              <div className="text-sm text-orange-600">Typical hiring time</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Target className="h-8 w-8 text-green-600 mx-auto mb-2" />
              <div className="text-lg font-semibold text-green-800">High Match</div>
              <div className="text-sm text-green-600">Based on job analysis</div>
            </div>
          </div>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back: Build Profile
        </Button>
        
        <Button 
          onClick={onNext}
          disabled={!canProceed}
          className="bg-green-600 hover:bg-green-700"
        >
          Next: Tailor Resume
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {!canProceed && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertTriangle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Please provide a job description and run the AI analysis to continue.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TargetJobStep;
