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
import IssueCategoryPanel from '@/components/analysis/IssueCategoryPanel';
import { Issue, categoryLabels } from '@/components/analysis/IssueTypes';
import { usePersistentState } from '@/hooks/usePersistentState';
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

const buildIssuesFromAnalysis = (analysis: AnalysisData): Issue[] => {
  const issues: Issue[] = [];
  const mkId = (prefix: string) => `${analysis.id}:${prefix}`;

  // Critical: very low overall score
  if (typeof analysis.overall_score === 'number' && analysis.overall_score < 60) {
    issues.push({
      id: mkId('overall_low'),
      title: 'Low overall alignment',
      category: 'relevance',
      severity: 'critical',
      description: `Overall score is ${analysis.overall_score}%.`,
      why: 'Low overall alignment reduces your chances of passing recruiter and ATS screening.',
      howToImprove: 'Improve keyword match in summary and experience; tailor bullet points to role requirements.'
    });
  }

  // Relevance: missing critical keywords
  if ((analysis.missing_keywords?.length || 0) > 0) {
    const miss = analysis.missing_keywords.slice(0, 8).join(', ');
    issues.push({
      id: mkId('missing_keywords'),
      title: 'Missing critical keywords',
      category: 'relevance',
      severity: analysis.keyword_match < 60 ? 'urgent' : 'optional',
      description: `Missing: ${miss}${analysis.missing_keywords.length > 8 ? '…' : ''}`,
      why: 'Recruiters and ATS look for specific keywords that match job requirements.',
      howToImprove: 'Incorporate the most relevant keywords uniquely in summary and role bullets without keyword stuffing.'
    });
  }

  // Skills alignment
  if (typeof analysis.skills_alignment === 'number' && analysis.skills_alignment < 65) {
    issues.push({
      id: mkId('skills_gap'),
      title: 'Skills gap vs role requirements',
      category: 'skills',
      severity: 'urgent',
      description: `Skills alignment is ${analysis.skills_alignment}%`,
      why: 'A clear match between your skills and the job improves interview chances.',
      howToImprove: 'Add concrete skills, tools and outcomes that match the job description. Quantify where possible.'
    });
  }

  // ATS compatibility
  if (typeof analysis.ats_compatibility === 'number' && analysis.ats_compatibility < 70) {
    issues.push({
      id: mkId('ats_formatting'),
      title: 'Potential ATS formatting issues',
      category: 'ats',
      severity: 'urgent',
      description: `ATS compatibility is ${analysis.ats_compatibility}%`,
      why: 'ATS systems may not parse complex layouts or uncommon section labels.',
      howToImprove: 'Use standard section headings, simple bullet symbols, and avoid tables/columns for critical content.'
    });
  }

  // Experience relevance and mismatch
  if (analysis.analysis_results?.experienceMismatch) {
    const em = analysis.analysis_results.experienceMismatch;
    const sev = (em.severity || 'urgent').toLowerCase() as 'critical' | 'urgent' | 'optional';
    const text = Array.isArray(em.warnings) ? em.warnings.join(' ') : String(em.warnings);
    issues.push({
      id: mkId('experience_mismatch'),
      title: 'Irrelevant Work Exp. Title',
      category: 'experience',
      severity: sev,
      description: text,
      why: 'Recruiters scan job titles and responsibilities. Mismatch signals poor fit for the target role.',
      howToImprove: 'Reframe titles and bullets to highlight responsibilities aligning with the target role without misrepresentation.'
    });
  }

  // Impact & achievements from suggestions (if present)
  const suggArray: any[] = Array.isArray(analysis.suggestions) ? analysis.suggestions : [];
  for (const s of suggArray) {
    if (!s) continue;
    const sev: 'critical' | 'urgent' | 'optional' = s.priority === 'critical' ? 'critical' : s.priority === 'high' ? 'urgent' : 'optional';
    issues.push({
      id: mkId(`sugg_${(s.title || s.type || 'generic').toString().toLowerCase().replace(/\s+/g, '_')}`),
      title: s.title || s.type || 'Improvement Suggestion',
      category: (s.type || 'impact'),
      severity: sev,
      description: s.description,
      why: 'Addressing this suggestion will increase clarity, credibility and alignment with the role.',
      howToImprove: s.action
    });
  }

  return issues;
};

const DetailedAnalysisView: React.FC<DetailedAnalysisViewProps> = ({ analysisId, onBack }) => {
  const { toast } = useToast();
  const [analysis, setAnalysis] = useState<AnalysisData | null>(null);
  const [loading, setLoading] = useState(true);
  const [dismissedIds, setDismissedIds] = usePersistentState<string[]>(`analysis_dismissed_${analysisId}`, []);

  const allIssues = React.useMemo(() => (analysis ? buildIssuesFromAnalysis(analysis) : []), [analysis]);
  const visibleIssues = React.useMemo(() => allIssues.filter(i => !dismissedIds.includes(i.id)), [allIssues, dismissedIds]);
  const groupedIssues = React.useMemo(() => {
    const m: Record<string, Issue[]> = {};
    for (const i of visibleIssues) {
      (m[i.category] ||= []).push(i);
    }
    return m;
  }, [visibleIssues]);
  const counts = React.useMemo(() => ({
    critical: visibleIssues.filter(i => i.severity === 'critical').length,
    urgent: visibleIssues.filter(i => i.severity === 'urgent').length,
    optional: visibleIssues.filter(i => i.severity === 'optional').length,
  }), [visibleIssues]);

  const handleDismiss = (id: string) => setDismissedIds(Array.from(new Set([...dismissedIds, id])));
  const handleExplain = (issue: Issue) => toast({ title: 'Explanation requested', description: issue.why });
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
      <Card className="p-6 bg-gradient-to-br from-background to-muted/20">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <TrendingUp className="h-5 w-5 mr-2" />
          Analysis Overview
        </h2>
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
            {analysis.analysis_results?.totalKeywords && (
              <p className="text-xs text-muted-foreground mt-1">
                {analysis.analysis_results.matchingKeywords || 0} of {analysis.analysis_results.totalKeywords} keywords
              </p>
            )}
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

      {/* Summary */}
      <div className="flex flex-wrap gap-2">
        <Badge variant="destructive" className="text-xs">{counts.critical} Critical Fix</Badge>
        <Badge variant="default" className="text-xs">{counts.urgent} Urgent Fix</Badge>
        <Badge variant="secondary" className="text-xs">{counts.optional} Optional Fix</Badge>
      </div>

      <h2 className="text-xl font-semibold mt-4">Analysis Highlights</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <IssueCategoryPanel title={categoryLabels.relevance} issues={groupedIssues['relevance'] || []} onDismiss={handleDismiss} onExplain={handleExplain} />
        <IssueCategoryPanel title={categoryLabels.impact} issues={groupedIssues['impact'] || []} onDismiss={handleDismiss} onExplain={handleExplain} />
        <IssueCategoryPanel title={categoryLabels.experience} issues={groupedIssues['experience'] || []} onDismiss={handleDismiss} onExplain={handleExplain} />
        <IssueCategoryPanel title={categoryLabels.skills} issues={groupedIssues['skills'] || []} onDismiss={handleDismiss} onExplain={handleExplain} />
        <IssueCategoryPanel title={categoryLabels.ats} issues={groupedIssues['ats'] || []} onDismiss={handleDismiss} onExplain={handleExplain} />
      </div>

      {/* Original Analysis Results */}
      {analysis.analysis_results && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <FileText className="h-5 w-5 mr-2" />
            Original Analysis Results
          </h3>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Experience Mismatch Warning */}
            {analysis.analysis_results.experienceMismatch && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <h4 className="font-medium text-red-800 dark:text-red-200 mb-2 flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Experience Mismatch ({analysis.analysis_results.experienceMismatch.severity})
                </h4>
                <div className="space-y-2">
                  {analysis.analysis_results.experienceMismatch.warnings?.map((warning, index) => (
                    <p key={index} className="text-sm text-red-700 dark:text-red-300">{warning}</p>
                  ))}
                </div>
              </div>
            )}

            {/* Recommended Roles */}
            {analysis.analysis_results.recommendedRoles && analysis.analysis_results.recommendedRoles.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2 flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Recommended Roles
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.analysis_results.recommendedRoles.map((role, index) => (
                    <Badge key={index} variant="secondary" className="bg-blue-100 text-blue-800">
                      {role}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Detailed Analysis Metrics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-primary">
                {analysis.analysis_results.totalKeywords || 0}
              </div>
              <p className="text-sm text-muted-foreground">Total Keywords</p>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {analysis.analysis_results.matchingKeywords || 0}
              </div>
              <p className="text-sm text-muted-foreground">Matching Keywords</p>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {analysis.analysis_results.keywordMatch || analysis.keyword_match}%
              </div>
              <p className="text-sm text-muted-foreground">Keyword Match Rate</p>
            </div>
            
            <div className="text-center p-3 bg-muted/50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {analysis.analysis_results.overallScore || analysis.overall_score}%
              </div>
              <p className="text-sm text-muted-foreground">Computed Score</p>
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
                Found Keywords ({analysis.keywords_found?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.keywords_found?.length ? (
                  analysis.keywords_found.map((keyword, index) => (
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
                Missing Keywords ({analysis.missing_keywords?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {analysis.missing_keywords?.length ? (
                  analysis.missing_keywords.map((keyword, index) => (
                    <Badge key={index} variant="outline" className="border-red-200 text-red-600 dark:border-red-800 dark:text-red-400">
                      {keyword}
                    </Badge>
                  ))
                ) : (
                  <p className="text-muted-foreground text-sm">No missing keywords data available</p>
                )}
              </div>
            </div>

            {/* Keyword Insights from original analysis */}
            {analysis.analysis_results?.suggestions && (
              <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                <h5 className="font-medium text-blue-800 dark:text-blue-200 text-sm mb-1">Keyword Suggestions:</h5>
                {analysis.analysis_results.suggestions
                  .filter(s => s.type === 'keywords')
                  .map((suggestion, index) => (
                    <p key={index} className="text-sm text-blue-700 dark:text-blue-300">
                      {suggestion.description}
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
              {analysis.improvement_areas?.length ? (
                analysis.improvement_areas.map((area, index) => (
                  <div key={index} className="flex items-start space-x-2 p-3 bg-orange-50 dark:bg-orange-950/20 rounded-lg">
                    <TrendingUp className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <p className="text-sm">{area}</p>
                  </div>
                ))
              ) : (
                <>
                  {/* Fallback to suggestions from analysis results */}
                  {analysis.analysis_results?.suggestions?.length ? (
                    analysis.analysis_results.suggestions.map((suggestion, index) => (
                      <div key={index} className="p-3 border border-orange-200 dark:border-orange-800 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Badge variant="outline" className="text-xs mr-2 capitalize">
                            {suggestion.type}
                          </Badge>
                          <span className="font-medium text-sm">{suggestion.title}</span>
                        </div>
                        <p className="text-sm text-muted-foreground">{suggestion.description}</p>
                        {suggestion.action && (
                          <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                            Action: {suggestion.action}
                          </p>
                        )}
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-sm">No improvement areas identified</p>
                  )}
                </>
              )}
            </div>
          </ScrollArea>
        </Card>
      </div>

      {/* Detailed Suggestions */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Lightbulb className="h-5 w-5 mr-2" />
          Detailed Suggestions & Recommendations
        </h3>
        
        <ScrollArea className="h-[350px]">
          <div className="space-y-4">
            {analysis.suggestions && typeof analysis.suggestions === 'object' ? (
              Array.isArray(analysis.suggestions) ? (
                // Handle array format (from analysis_results)
                analysis.suggestions.map((suggestion, index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-medium capitalize flex items-center">
                        <Star className="h-4 w-4 text-yellow-500 mr-2" />
                        {suggestion.title || suggestion.type?.replace('_', ' ')}
                      </h4>
                      {suggestion.priority && (
                        <Badge 
                          variant={suggestion.priority === 'high' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {suggestion.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{suggestion.description}</p>
                    {suggestion.action && (
                      <div className="bg-muted/50 p-2 rounded text-sm">
                        <strong>Action:</strong> {suggestion.action}
                      </div>
                    )}
                  </div>
                ))
              ) : (
                // Handle object format
                Object.entries(analysis.suggestions).map(([category, suggestions], index) => (
                  <div key={index} className="border border-border rounded-lg p-4">
                    <h4 className="font-medium capitalize mb-3 flex items-center">
                      <Star className="h-4 w-4 text-yellow-500 mr-2" />
                      {category.replace('_', ' ')}
                    </h4>
                    {Array.isArray(suggestions) ? (
                      <ul className="space-y-2">
                        {suggestions.map((suggestion, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground flex items-start">
                            <span className="inline-block w-2 h-2 bg-primary rounded-full mt-2 mr-3 flex-shrink-0"></span>
                            {String(suggestion)}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-muted-foreground">{String(suggestions)}</p>
                    )}
                  </div>
                ))
              )
            ) : (
              <div className="text-center py-8">
                <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground">No detailed suggestions available</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Suggestions will appear here after analysis is complete
                </p>
              </div>
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