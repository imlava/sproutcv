import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  FileText, 
  TrendingUp, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Target,
  Lightbulb,
  Star,
  Download,
  Share2,
  ArrowLeft,
  Brain,
  Sparkles,
  Crown,
  Award,
  Medal,
  Trophy,
  Users,
  Zap,
  Clock,
  Eye,
  Mail,
  Printer,
  Copy
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface DetailedAnalysisViewProps {
  analysisId: string;
  onBack: () => void;
}

interface AnalysisData {
  id: string;
  job_title: string;
  company_name: string;
  overall_score: number;
  keyword_match: number;
  skills_alignment: number;
  ats_compatibility: number;
  experience_relevance: number;
  suggestions: any;
  analysis_results: any;
  detailed_feedback: any;
  keywords_found: string[];
  missing_keywords: string[];
  improvement_areas: string[];
  created_at: string;
  expires_at: string;
  // Real analysis data from UnifiedResumeAnalyzer
  lineByLineAnalysis?: any;
  optimization?: any;
  aiSuggestions?: string[];
  userScore?: number;
  achievements?: string[];
  analysisMetadata?: any;
}

const DetailedAnalysisView: React.FC<DetailedAnalysisViewProps> = ({ analysisId, onBack }) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalysisDetails();
  }, [analysisId]);

  const fetchAnalysisDetails = async () => {
    try {
      const { data, error } = await supabase
        .from('resume_analyses')
        .select('*')
        .eq('id', analysisId)
        .single();

      if (error) throw error;

      // Check if analysis has expired
      if (new Date(data.expires_at) < new Date()) {
        toast({
          variant: "destructive",
          title: "Analysis Expired",
          description: "This analysis has expired and is no longer available"
        });
        onBack();
        return;
      }

      setAnalysis(data);
    } catch (error) {
      console.error('Error fetching analysis:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load analysis details"
      });
      onBack();
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return 'Excellent';
    if (score >= 60) return 'Good';
    return 'Needs Work';
  };

  const exportToPDF = async () => {
    toast({
      title: "Export Feature",
      description: "PDF export functionality coming soon!"
    });
  };

  const shareAnalysis = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Resume Analysis - ${analysis?.job_title}`,
          text: `My resume scored ${analysis?.overall_score}% for ${analysis?.job_title} at ${analysis?.company_name}`,
          url: window.location.href
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link copied",
        description: "Analysis link copied to clipboard"
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="text-center py-12">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold mb-2">Analysis Not Found</h3>
        <p className="text-muted-foreground mb-4">The requested analysis could not be found or has expired.</p>
        <Button onClick={onBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  const daysUntilExpiry = Math.ceil((new Date(analysis.expires_at).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));

  // Real analysis results from UnifiedResumeAnalyzer
  const realAnalysisResults = analysis.analysis_results || {};
  const lineByLineAnalysis = realAnalysisResults.lineByLineAnalysis;
  const optimization = realAnalysisResults.optimization;
  const aiSuggestions = realAnalysisResults.aiSuggestions || [];
  const userScore = realAnalysisResults.userScore || analysis.overall_score;
  const achievements = realAnalysisResults.achievements || [];
  const analysisMetadata = realAnalysisResults.analysisMetadata;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{analysis.job_title || 'Resume Analysis'}</h1>
            <p className="text-muted-foreground">
              {analysis.company_name && `${analysis.company_name} • `}
              Analyzed on {new Date(analysis.created_at).toLocaleDateString()}
            </p>
            <Badge variant="secondary" className="mt-1">
              Expires in {daysUntilExpiry} days
            </Badge>
          </div>
        </div>
        
        <div className="flex space-x-2">
          <Button variant="outline" onClick={shareAnalysis}>
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </Button>
          <Button variant="outline" onClick={exportToPDF}>
            <Download className="h-4 w-4 mr-2" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* Achievement Display */}
      {achievements.length > 0 && (
        <Card className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center">
              <Trophy className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900">🎉 Achievements Unlocked!</h4>
              <div className="flex flex-wrap gap-2 mt-2">
                {achievements.map((achievement, index) => (
                  <Badge key={index} className="bg-yellow-100 text-yellow-800 border-yellow-300">
                    <Medal className="h-3 w-3 mr-1" />
                    {achievement}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* AI Keyword Optimization Display */}
      {optimization && (
        <Card className="p-6 bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-blue-900">AI Keyword Optimization</h3>
              <p className="text-sm text-blue-700">{optimization.context}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Current Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {optimization.original.slice(0, 8).map((keyword, index) => (
                  <Badge key={index} variant="outline" className="text-gray-600">
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
            
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">AI-Suggested Keywords</h4>
              <div className="flex flex-wrap gap-2">
                {optimization.suggested.slice(0, 8).map((keyword, index) => (
                  <Badge key={index} className="bg-green-100 text-green-800 border-green-300">
                    <Sparkles className="h-3 w-3 mr-1" />
                    {keyword}
                  </Badge>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-800">
                Potential Score Improvement: +{Math.round((100 - optimization.confidence) * 0.4)}%
              </span>
            </div>
          </div>
        </Card>
      )}

      {/* Score Overview */}
      <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Analysis Overview
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(userScore)} mb-2`}>
              {userScore}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <Badge variant="outline" className="mt-2">
              {getScoreBadge(userScore)}
            </Badge>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(realAnalysisResults.keywordMatch || analysis.keyword_match)} mb-2`}>
              {realAnalysisResults.keywordMatch || analysis.keyword_match}%
            </div>
            <p className="text-sm text-muted-foreground">Keyword Match</p>
            {analysisMetadata && (
              <p className="text-xs text-muted-foreground mt-1">
                {realAnalysisResults.matchingKeywords?.length || 0} of {analysisMetadata.totalKeywords} keywords
              </p>
            )}
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(realAnalysisResults.skillsAlignment || analysis.skills_alignment)} mb-2`}>
              {realAnalysisResults.skillsAlignment || analysis.skills_alignment}%
            </div>
            <p className="text-sm text-muted-foreground">Skills Alignment</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(realAnalysisResults.atsCompatibility || analysis.ats_compatibility)} mb-2`}>
              {realAnalysisResults.atsCompatibility || analysis.ats_compatibility}%
            </div>
            <p className="text-sm text-muted-foreground">ATS Compatibility</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(realAnalysisResults.experienceRelevance || analysis.experience_relevance)} mb-2`}>
              {realAnalysisResults.experienceRelevance || analysis.experience_relevance}%
            </div>
            <p className="text-sm text-muted-foreground">Experience Relevance</p>
          </div>
        </div>
      </Card>

      {/* Line-by-Line Analysis */}
      {lineByLineAnalysis && (
        <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-200">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
              <Brain className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-purple-900">AI Line-by-Line Analysis</h3>
              <p className="text-sm text-purple-700">Detailed analysis of every line in your resume</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Sections Analysis */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Resume Sections</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lineByLineAnalysis.sections.map((section, index) => (
                  <div key={index} className="bg-white p-3 rounded-lg border border-purple-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-gray-900">{section.name}</span>
                      <Badge className="bg-purple-100 text-purple-800">
                        {section.content.length} lines
                      </Badge>
                    </div>
                    <div className="text-sm text-gray-600">
                      Lines {section.startLine}-{section.startLine + section.content.length - 1}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Quantified Achievements */}
            {lineByLineAnalysis.quantifiedAchievements.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Quantified Achievements Found</h4>
                <div className="space-y-2">
                  {lineByLineAnalysis.quantifiedAchievements.map((achievement, index) => (
                    <div key={index} className="bg-green-50 p-3 rounded-lg border border-green-200">
                      <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-sm font-medium text-green-800">Line {achievement.line}</span>
                      </div>
                      <p className="text-sm text-gray-700">{achievement.content}</p>
                      <div className="mt-1 text-xs text-green-600">
                        {achievement.achievement.metric}: {achievement.achievement.value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Improvement Suggestions */}
            {lineByLineAnalysis.improvements.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Improvement Suggestions</h4>
                <div className="space-y-3">
                  {lineByLineAnalysis.improvements.map((improvement, index) => (
                    <div key={index} className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                      <div className="flex items-center space-x-2 mb-2">
                        <Target className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-800">Line {improvement.line}</span>
                        <Badge className="bg-yellow-100 text-yellow-800 text-xs">
                          {improvement.section}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{improvement.original}</p>
                      <div className="space-y-1">
                        {improvement.suggestions.map((suggestion, sIndex) => (
                          <div key={sIndex} className="flex items-start space-x-2">
                            <Sparkles className="h-3 w-3 text-yellow-600 mt-0.5 flex-shrink-0" />
                            <span className="text-xs text-yellow-700">{suggestion}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing Elements */}
            {lineByLineAnalysis.missingElements.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Missing Elements</h4>
                <div className="space-y-2">
                  {lineByLineAnalysis.missingElements.map((element, index) => (
                    <div key={index} className="bg-red-50 p-3 rounded-lg border border-red-200">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                        <span className="text-sm text-red-800">{element}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Keywords Analysis */}
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Keywords Analysis</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Found Keywords</h5>
                  <div className="flex flex-wrap gap-2">
                    {lineByLineAnalysis.keywords.slice(0, 10).map((keyword, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800 border-green-300">
                        {keyword}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <h5 className="text-sm font-medium text-gray-700 mb-2">Total Analysis</h5>
                  <div className="space-y-1 text-sm text-gray-600">
                    <div>• {lineByLineAnalysis.sections.length} sections analyzed</div>
                    <div>• {lineByLineAnalysis.keywords.length} keywords found</div>
                    <div>• {lineByLineAnalysis.quantifiedAchievements.length} quantified achievements</div>
                    <div>• {lineByLineAnalysis.improvements.length} improvement suggestions</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Keywords Analysis */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Target className="h-5 w-5 mr-2" />
            Keywords Analysis
          </h3>
          
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-green-600 mb-2 flex items-center">
                <CheckCircle className="h-4 w-4 mr-2" />
                Found Keywords ({realAnalysisResults.matchingKeywords?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {realAnalysisResults.matchingKeywords?.length ? (
                  realAnalysisResults.matchingKeywords.slice(0, 10).map((keyword, index) => (
                    <Badge key={index} variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No keywords data available</p>
                )}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-red-600 mb-2 flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Missing Keywords ({optimization ? optimization.suggested.length - optimization.original.length : 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {optimization ? (
                  optimization.suggested
                    .filter(keyword => !optimization.original.includes(keyword))
                    .slice(0, 8)
                    .map((keyword, index) => (
                      <Badge key={index} variant="outline" className="border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                        {keyword}
                      </Badge>
                    ))
                ) : (
                  <p className="text-muted-foreground text-sm">No missing keywords data available</p>
                )}
              </div>
            </div>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-1">AI Suggestions:</h5>
                {aiSuggestions.map((suggestion, index) => (
                  <p key={index} className="text-sm text-blue-700 dark:text-blue-300">
                    • {suggestion}
                  </p>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Improvement Areas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Improvement Areas
          </h3>
          
          <ScrollArea className="h-[250px]">
            <div className="space-y-3">
              {lineByLineAnalysis?.improvements?.length ? (
                lineByLineAnalysis.improvements.map((improvement, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium">Line {improvement.line}</p>
                      <p className="text-sm text-muted-foreground">{improvement.original}</p>
                      <div className="mt-1">
                        {improvement.suggestions.map((suggestion, sIndex) => (
                          <p key={sIndex} className="text-xs text-orange-600">• {suggestion}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">No improvement areas identified</p>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* AI Suggestions & Recommendations */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          AI Suggestions & Recommendations
        </h3>
        
        <ScrollArea className="h-[350px]">
          <div className="space-y-4">
            {aiSuggestions.length > 0 ? (
              aiSuggestions.map((suggestion, index) => (
                <div key={index} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      AI Suggestion {index + 1}
                    </h4>
                    <Badge variant="secondary" className="text-xs">
                      HIGH
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{suggestion}</p>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No AI suggestions available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  AI suggestions will appear here after analysis is complete
                </p>
              </div>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Analysis Metadata */}
      {analysisMetadata && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Brain className="h-5 w-5 mr-2" />
            Analysis Metadata
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {analysisMetadata.totalKeywords || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total Keywords</p>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analysisMetadata.suggestedKeywords || 0}
              </div>
              <p className="text-sm text-muted-foreground">Suggested Keywords</p>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {analysisMetadata.confidence || 0}%
              </div>
              <p className="text-sm text-muted-foreground">Confidence</p>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 capitalize">
                {analysisMetadata.impact || 'low'}
              </div>
              <p className="text-sm text-muted-foreground">Impact Level</p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default DetailedAnalysisView;