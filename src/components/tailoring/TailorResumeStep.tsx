import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { geminiService } from '@/services/ai/geminiService';
import { 
  Edit3, 
  Zap, 
  Eye, 
  ArrowRight, 
  ArrowLeft,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
  Target,
  Brain,
  BarChart3,
  Award,
  Sparkles
} from 'lucide-react';

interface TailorResumeStepProps {
  state: {
    sections: any[];
    suggestions: any[];
    keywordMatches: any[];
    gapAnalysis: any[];
    rewriteHistory: any[];
    currentVersion: string;
  };
  onUpdate: (tailoring: any) => void;
  onNext: () => void;
  onPrev: () => void;
  profile: any;
  targetJob: any;
}

const TailorResumeStep: React.FC<TailorResumeStepProps> = ({ 
  state, 
  onUpdate, 
  onNext, 
  onPrev, 
  profile, 
  targetJob 
}) => {
  const [processing, setProcessing] = useState(false);
  const [selectedSection, setSelectedSection] = useState('summary');
  const { toast } = useToast();

  // Mock resume sections
  const resumeSections = {
    summary: {
      title: 'Professional Summary',
      original: 'Experienced frontend developer with 3 years of experience building web applications.',
      current: 'Results-driven Frontend Developer with 3+ years of experience building scalable React applications, specializing in TypeScript and modern JavaScript frameworks. Proven track record of delivering high-quality user interfaces and optimizing application performance.',
      suggestions: [
        'Add specific technologies from job requirements',
        'Quantify achievements with metrics',
        'Include industry-specific keywords'
      ],
      keywordMatches: ['React', 'TypeScript', 'Frontend'],
      missingKeywords: ['API integration', 'Agile']
    },
    experience: {
      title: 'Work Experience',
      original: 'Software Engineer at TechCorp\n• Developed web applications\n• Worked with team',
      current: 'Senior Frontend Engineer at TechCorp (2021-2024)\n• Developed 15+ responsive React applications using TypeScript, increasing user engagement by 40%\n• Collaborated with cross-functional Agile teams to deliver features 25% faster\n• Integrated RESTful APIs and GraphQL endpoints, improving data loading efficiency by 30%',
      suggestions: [
        'Add more quantified achievements',
        'Include API integration examples',
        'Mention Agile methodology experience'
      ],
      keywordMatches: ['React', 'TypeScript', 'Agile', 'API'],
      missingKeywords: ['GraphQL', 'Node.js']
    }
  };

  const handleOneClickRewrite = async (section: string) => {
    if (!geminiService.isServiceAvailable()) {
      toast({
        title: "AI Service Unavailable",
        description: "Gemini AI service is not configured. Please check your API key.",
        variant: "destructive",
      });
      return;
    }

    setProcessing(true);
    
    try {
      const sectionData = resumeSections[section];
      const targetKeywords = targetJob.keywords || [];
      
      // Prepare rewrite request for Gemini
      const rewriteRequest = {
        section: sectionData.title,
        content: sectionData.current,
        targetKeywords: targetKeywords,
        tone: 'professional' as const,
        context: `This is for a ${targetJob.title || 'professional'} position at ${targetJob.company || 'a company'}. The job requires: ${targetJob.requirements?.slice(0, 3).join(', ') || 'relevant experience'}.`
      };
      
      // Use Gemini AI to rewrite the section
      const rewrittenContent = await geminiService.rewriteSection(rewriteRequest);
      
      // Update the section with AI-enhanced content
      const updatedSections = { ...resumeSections };
      updatedSections[section] = {
        ...updatedSections[section],
        current: rewrittenContent,
        improved: true
      };
      
      // Update global state
      onUpdate({
        ...state,
        sections: Object.values(updatedSections)
      });
      
      toast({
        title: "Section Enhanced with AI",
        description: `${sectionData.title} has been optimized for the target job with ${targetKeywords.length} relevant keywords.`,
      });
    } catch (error) {
      console.error('AI rewrite error:', error);
      toast({
        title: "Rewrite Failed",
        description: error instanceof Error ? error.message : "Failed to rewrite section. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleQuantifyAchievements = async (section: string) => {
    if (!geminiService.isServiceAvailable()) {
      toast({
        title: "AI Service Unavailable",
        description: "Please configure Gemini AI to get achievement suggestions.",
        variant: "destructive",
      });
      return;
    }

    try {
      const sectionData = resumeSections[section];
      const prompts = await geminiService.generateAchievementPrompts(sectionData.current);
      
      // Show the first prompt as a toast with suggestions
      const firstPrompt = prompts[0] || 'How can you add specific metrics to quantify this achievement?';
      
      toast({
        title: "💡 Achievement Quantification Suggestion",
        description: firstPrompt,
      });
    } catch (error) {
      console.error('Achievement prompt error:', error);
      toast({
        title: "Achievement Quantification",
        description: "Add specific numbers, percentages, or metrics to make this achievement more impactful.",
      });
    }
  };

  const keywordMatchScore = 78;
  const toneScore = 85;
  const readabilityScore = 92;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-3xl font-bold text-gray-900 mb-4">Step 3: Tailor Your Resume</h2>
        <p className="text-gray-600">AI-powered content optimization with live preview and one-click improvements.</p>
      </div>

      {/* Tailoring Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 text-center">
          <Target className="h-8 w-8 text-blue-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-blue-600">{keywordMatchScore}%</div>
          <div className="text-sm text-gray-600">Keyword Match</div>
        </Card>
        <Card className="p-4 text-center">
          <BarChart3 className="h-8 w-8 text-green-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-green-600">{toneScore}%</div>
          <div className="text-sm text-gray-600">Tone Score</div>
        </Card>
        <Card className="p-4 text-center">
          <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-purple-600">{readabilityScore}%</div>
          <div className="text-sm text-gray-600">Readability</div>
        </Card>
        <Card className="p-4 text-center">
          <Award className="h-8 w-8 text-orange-600 mx-auto mb-2" />
          <div className="text-2xl font-bold text-orange-600">A+</div>
          <div className="text-sm text-gray-600">ATS Grade</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Resume Editor */}
        <div className="lg:col-span-2">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Resume Editor</h3>
              <div className="flex items-center space-x-2">
                <Badge variant="outline" className="text-green-600">
                  Live Preview
                </Badge>
                <Button variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>

            <Tabs value={selectedSection} onValueChange={setSelectedSection}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
              </TabsList>

              <TabsContent value="summary" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">Professional Summary</h4>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleOneClickRewrite('summary')}
                        disabled={processing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        One-Click Rewrite
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea 
                    value={resumeSections.summary.current}
                    className="min-h-32"
                    onChange={() => {}}
                  />

                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-blue-800 mb-2">AI Suggestions</h5>
                    <ul className="space-y-1">
                      {resumeSections.summary.suggestions.map((suggestion, index) => (
                        <li key={index} className="text-sm text-blue-700 flex items-start">
                          <Sparkles className="h-3 w-3 mr-2 mt-1 text-blue-500" />
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="experience" className="space-y-4 mt-4">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-semibold text-gray-800">Work Experience</h4>
                    <div className="flex space-x-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleQuantifyAchievements('experience')}
                        variant="outline"
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Quantify
                      </Button>
                      <Button 
                        size="sm" 
                        onClick={() => handleOneClickRewrite('experience')}
                        disabled={processing}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Rewrite
                      </Button>
                    </div>
                  </div>
                  
                  <Textarea 
                    value={resumeSections.experience.current}
                    className="min-h-48"
                    onChange={() => {}}
                  />

                  <div className="bg-green-50 p-4 rounded-lg">
                    <h5 className="font-semibold text-green-800 mb-2">Achievement Quantification</h5>
                    <p className="text-sm text-green-700 mb-2">
                      Click on any achievement to add specific metrics:
                    </p>
                    <div className="space-y-1">
                      <button className="text-sm text-green-600 underline block">
                        "increased user engagement" → Add percentage
                      </button>
                      <button className="text-sm text-green-600 underline block">
                        "delivered features faster" → Add time metrics
                      </button>
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </Card>
        </div>

        {/* Sidebar - Keyword Analysis */}
        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-green-600" />
              Keyword Analysis
            </h3>
            
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-sm text-green-700 mb-2">Matched Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {resumeSections[selectedSection].keywordMatches.map((keyword, index) => (
                    <Badge key={index} className="bg-green-100 text-green-800">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-semibold text-sm text-red-700 mb-2">Missing Keywords</h4>
                <div className="flex flex-wrap gap-2">
                  {resumeSections[selectedSection].missingKeywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="border-red-200 text-red-700">
                      <AlertTriangle className="h-3 w-3 mr-1" />
                      {keyword}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Brain className="h-5 w-5 mr-2 text-purple-600" />
              Gap Analysis
            </h3>
            
            <div className="space-y-3">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <h4 className="font-semibold text-sm text-yellow-800">High Priority</h4>
                <p className="text-sm text-yellow-700">Add API integration examples</p>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <h4 className="font-semibold text-sm text-orange-800">Medium Priority</h4>
                <p className="text-sm text-orange-700">Include Agile methodology</p>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-sm text-blue-800">Low Priority</h4>
                <p className="text-sm text-blue-700">Mention GraphQL experience</p>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Tone & Readability</h3>
            
            <div className="space-y-3">
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Professional Tone</span>
                  <span className="text-sm text-gray-600">{toneScore}%</span>
                </div>
                <Progress value={toneScore} className="h-2" />
              </div>
              
              <div>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium">Readability</span>
                  <span className="text-sm text-gray-600">{readabilityScore}%</span>
                </div>
                <Progress value={readabilityScore} className="h-2" />
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={onPrev}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back: Target Job
        </Button>
        
        <Button 
          onClick={onNext}
          className="bg-green-600 hover:bg-green-700"
        >
          Next: Export & Track
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {processing && (
        <Alert>
          <RefreshCw className="h-4 w-4 animate-spin" />
          <AlertDescription>
            AI is rewriting your content to better match the job requirements...
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default TailorResumeStep;
