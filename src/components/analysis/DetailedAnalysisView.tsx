import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  ArrowLeft
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

      {/* Score Overview */}
      <Card className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          <div className="text-center">
            <div className={`text-4xl font-bold ${getScoreColor(analysis.overall_score)} mb-2`}>
              {analysis.overall_score}%
            </div>
            <p className="text-sm text-muted-foreground">Overall Score</p>
            <Badge variant="outline" className="mt-2">
              {getScoreBadge(analysis.overall_score)}
            </Badge>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.keyword_match)} mb-2`}>
              {analysis.keyword_match}%
            </div>
            <p className="text-sm text-muted-foreground">Keyword Match</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.skills_alignment)} mb-2`}>
              {analysis.skills_alignment}%
            </div>
            <p className="text-sm text-muted-foreground">Skills Alignment</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.ats_compatibility)} mb-2`}>
              {analysis.ats_compatibility}%
            </div>
            <p className="text-sm text-muted-foreground">ATS Compatibility</p>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${getScoreColor(analysis.experience_relevance)} mb-2`}>
              {analysis.experience_relevance}%
            </div>
            <p className="text-sm text-muted-foreground">Experience Relevance</p>
          </div>
        </div>
      </Card>

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
                Found Keywords ({analysis.keywords_found?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords_found?.map((keyword, index) => (
                  <Badge key={index} variant="default" className="bg-green-100 text-green-800">
                    {keyword}
                  </Badge>
                )) || <p className="text-muted-foreground text-sm">No keywords found</p>}
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h4 className="font-medium text-red-600 mb-2 flex items-center">
                <XCircle className="h-4 w-4 mr-2" />
                Missing Keywords ({analysis.missing_keywords?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_keywords?.map((keyword, index) => (
                  <Badge key={index} variant="outline" className="border-red-200 text-red-600">
                    {keyword}
                  </Badge>
                )) || <p className="text-muted-foreground text-sm">No missing keywords identified</p>}
              </div>
            </div>
          </div>
        </Card>

        {/* Improvement Areas */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="h-5 w-5 mr-2" />
            Improvement Areas
          </h3>
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-3">
              {analysis.improvement_areas?.map((area, index) => (
                <div key={index} className="flex items-start space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{area}</p>
                </div>
              )) || <p className="text-muted-foreground text-sm">No specific improvement areas identified</p>}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Detailed Suggestions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          Detailed Suggestions
        </h3>
        
        <ScrollArea className="h-[300px]">
          <div className="space-y-4">
            {analysis.suggestions && typeof analysis.suggestions === 'object' ? (
              Object.entries(analysis.suggestions).map(([category, suggestions], index) => (
                <div key={index}>
                  <h4 className="font-medium capitalize mb-2">{category.replace('_', ' ')}</h4>
                  {Array.isArray(suggestions) ? (
                    <ul className="space-y-1 ml-4">
                      {suggestions.map((suggestion, idx) => (
                        <li key={idx} className="text-sm text-muted-foreground flex items-start">
                          <Star className="h-3 w-3 text-yellow-500 mt-1 mr-2 flex-shrink-0" />
                          {String(suggestion)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground ml-4">{String(suggestions)}</p>
                  )}
                  {index < Object.entries(analysis.suggestions).length - 1 && <Separator className="mt-4" />}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground">No detailed suggestions available</p>
            )}
          </div>
        </ScrollArea>
      </Card>

      {/* Additional Feedback */}
      {analysis.detailed_feedback && Object.keys(analysis.detailed_feedback).length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Additional Feedback
          </h3>
          
          <ScrollArea className="h-[200px]">
            <div className="space-y-4">
              {Object.entries(analysis.detailed_feedback).map(([key, value], index) => (
                <div key={index}>
                  <h4 className="font-medium capitalize mb-2">{key.replace('_', ' ')}</h4>
                  <p className="text-sm text-muted-foreground">{String(value)}</p>
                  {index < Object.entries(analysis.detailed_feedback).length - 1 && <Separator className="mt-4" />}
                </div>
              ))}
            </div>
          </ScrollArea>
        </Card>
      )}
    </div>
  );
};

export default DetailedAnalysisView;