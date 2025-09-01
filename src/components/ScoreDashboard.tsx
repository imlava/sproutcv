
import React, { useState } from 'react';
import { TrendingUp, Target, Zap, FileCheck, AlertTriangle, CheckCircle, ArrowRight, Award, BarChart3, Lightbulb, Crown, Star, TrendingDown } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface AdvancedAnalyticsProps {
  keywordGapAnalysis?: any;
  atsOptimization?: any;
  skillsBreakdown?: any;
  experienceInsights?: any;
  industryBenchmark?: any;
  actionPlan?: any;
  competitorAnalysis?: string;
  industryRanking?: string;
  improvementPotential?: string;
  strengthsAndWeaknesses?: any;
  confidenceScore?: number;
  processingVersion?: string;
}

interface ScoreDashboardProps {
  overallScore: number;
  keywordMatch: number;
  skillsAlignment: number;
  atsCompatibility: number;
  experienceRelevance: number;
  suggestions?: string[];
  // Advanced Analytics
  keywordGapAnalysis?: any;
  atsOptimization?: any;
  skillsBreakdown?: any;
  experienceInsights?: any;
  industryBenchmark?: any;
  actionPlan?: any;
  competitorAnalysis?: string;
  industryRanking?: string;
  improvementPotential?: string;
  strengthsAndWeaknesses?: any;
  confidenceScore?: number;
  processingVersion?: string;
}

const ScoreDashboard: React.FC<ScoreDashboardProps> = ({
  overallScore,
  keywordMatch,
  skillsAlignment,
  atsCompatibility,
  experienceRelevance,
  suggestions = [],
  keywordGapAnalysis,
  atsOptimization,
  skillsBreakdown,
  experienceInsights,
  industryBenchmark,
  actionPlan,
  competitorAnalysis,
  industryRanking,
  improvementPotential,
  strengthsAndWeaknesses,
  confidenceScore,
  processingVersion
}) => {
  const [activeTab, setActiveTab] = useState("overview");
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 80) return 'bg-success/10 border-success/20';
    if (score >= 60) return 'bg-warning/10 border-warning/20';
    return 'bg-destructive/10 border-destructive/20';
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-destructive/10 text-destructive';
      case 'medium': return 'bg-warning/10 text-warning';
      case 'low': return 'bg-primary/10 text-primary';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const metrics = [
    { 
      name: 'Keyword Match', 
      score: keywordMatch, 
      icon: Target, 
      description: 'How well your resume matches job keywords'
    },
    { 
      name: 'Skills Alignment', 
      score: skillsAlignment, 
      icon: Zap, 
      description: 'Relevance of your skills to requirements'
    },
    { 
      name: 'ATS Compatibility', 
      score: atsCompatibility, 
      icon: FileCheck, 
      description: 'How well ATS systems will parse your resume'
    },
    { 
      name: 'Experience Relevance', 
      score: experienceRelevance, 
      icon: TrendingUp, 
      description: 'How your experience aligns with the role'
    }
  ];

  const isAdvancedVersion = processingVersion?.includes('advanced');

  return (
    <div className="space-y-8">
      {/* Enhanced Overall Score with Industry Leadership Features */}
      <Card className={`p-8 ${getScoreBgColor(overallScore)} border-2`}>
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-32 h-32 bg-background rounded-full shadow-lg mb-6 border-4 border-background">
            <div className="text-center">
              <span className={`text-4xl font-bold ${getScoreColor(overallScore)}`}>
                {overallScore}
              </span>
              <div className="text-lg font-medium text-muted-foreground">/ 100</div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-foreground mb-3">
            Industry-Leading Analysis Score
            {isAdvancedVersion && <Badge className="ml-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white">ADVANCED v2.0</Badge>}
          </h2>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-4">
            {overallScore >= 90 
              ? '🏆 ELITE LEVEL: Your resume outperforms 95% of candidates!' 
              : overallScore >= 80 
              ? '🌟 HIGHLY COMPETITIVE: Beats 80% of applicants in your field!' 
              : overallScore >= 70 
              ? '📈 ABOVE AVERAGE: Strong resume with targeted improvements needed.' 
              : overallScore >= 60 
              ? '📊 COMPETITIVE: Meets standards but has room for optimization.' 
              : '⚡ HIGH POTENTIAL: Significant improvements will make you highly competitive!'}
          </p>
          
          {/* Industry Insights */}
          {isAdvancedVersion && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              {industryRanking && (
                <div className="bg-background/50 rounded-lg p-4 border">
                  <Crown className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                  <div className="text-sm font-medium text-foreground">{industryRanking}</div>
                </div>
              )}
              {competitorAnalysis && (
                <div className="bg-background/50 rounded-lg p-4 border">
                  <BarChart3 className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">{competitorAnalysis}</div>
                </div>
              )}
              {confidenceScore && (
                <div className="bg-background/50 rounded-lg p-4 border">
                  <Award className="h-6 w-6 text-green-500 mx-auto mb-2" />
                  <div className="text-sm font-medium text-foreground">Confidence: {confidenceScore}%</div>
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {metrics.map((metric, index) => {
          const IconComponent = metric.icon;
          return (
            <Card key={index} className="p-6 hover:shadow-lg transition-all duration-200">
              <div className="flex items-start space-x-4">
              <div className={`p-3 rounded-lg ${metric.score >= 80 ? 'bg-success/10' : metric.score >= 60 ? 'bg-warning/10' : 'bg-destructive/10'}`}>
                <IconComponent className={`h-6 w-6 ${metric.score >= 80 ? 'text-success' : metric.score >= 60 ? 'text-warning' : 'text-destructive'}`} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-foreground text-lg">{metric.name}</h3>
                  <span className={`text-2xl font-bold ${getScoreColor(metric.score)}`}>
                    {metric.score}%
                  </span>
                </div>
                <Progress 
                  value={metric.score} 
                  className="mb-3 h-3"
                />
                <p className="text-sm text-muted-foreground leading-relaxed">{metric.description}</p>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Advanced Analytics Tabs */}
      {isAdvancedVersion && (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="keywords">Keywords</TabsTrigger>
            <TabsTrigger value="ats">ATS Analysis</TabsTrigger>
            <TabsTrigger value="action">Action Plan</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            {/* Strengths and Weaknesses */}
            {strengthsAndWeaknesses && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800">
                  <div className="flex items-center space-x-2 mb-4">
                    <Star className="h-5 w-5 text-green-600" />
                    <h3 className="text-lg font-semibold text-green-800 dark:text-green-200">Strengths</h3>
                  </div>
                  <div className="space-y-2">
                    {strengthsAndWeaknesses.strengths?.map((strength: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <span className="text-green-700 dark:text-green-300">{strength}</span>
                      </div>
                    ))}
                  </div>
                </Card>
                
                <Card className="p-6 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800">
                  <div className="flex items-center space-x-2 mb-4">
                    <TrendingDown className="h-5 w-5 text-orange-600" />
                    <h3 className="text-lg font-semibold text-orange-800 dark:text-orange-200">Areas for Improvement</h3>
                  </div>
                  <div className="space-y-2">
                    {strengthsAndWeaknesses.weaknesses?.map((weakness: string, index: number) => (
                      <div key={index} className="flex items-center space-x-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="text-orange-700 dark:text-orange-300">{weakness}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
            
            {/* Industry Benchmark */}
            {industryBenchmark && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Industry Benchmark</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{industryBenchmark.industry}</div>
                    <div className="text-sm text-muted-foreground">Industry</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{industryBenchmark.benchmarkScore}%</div>
                    <div className="text-sm text-muted-foreground">Industry Average</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${overallScore >= industryBenchmark.benchmarkScore ? 'text-green-600' : 'text-orange-600'}`}>
                      {overallScore >= industryBenchmark.benchmarkScore ? '↗️' : '↘️'} 
                      {Math.abs(overallScore - industryBenchmark.benchmarkScore)}%
                    </div>
                    <div className="text-sm text-muted-foreground">vs Industry</div>
                  </div>
                </div>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="keywords" className="space-y-6">
            {keywordGapAnalysis && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">Keyword Gap Analysis</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">{keywordGapAnalysis.exactMatches?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Exact Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{keywordGapAnalysis.semanticMatches?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Semantic Matches</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">{keywordGapAnalysis.missingCritical?.length || 0}</div>
                    <div className="text-sm text-muted-foreground">Missing Critical</div>
                  </div>
                </div>
                
                {keywordGapAnalysis.missingCritical?.length > 0 && (
                  <div className="bg-orange-50 dark:bg-orange-950/30 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
                    <h4 className="font-semibold text-orange-800 dark:text-orange-200 mb-2">Missing Critical Keywords:</h4>
                    <div className="flex flex-wrap gap-2">
                      {keywordGapAnalysis.missingCritical.slice(0, 10).map((keyword: string, index: number) => (
                        <Badge key={index} variant="outline" className="text-orange-600 border-orange-300">
                          {keyword}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="ats" className="space-y-6">
            {atsOptimization && (
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">ATS Optimization Report</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(atsOptimization.formatScore)}`}>
                      {atsOptimization.formatScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Format</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(atsOptimization.structureScore)}`}>
                      {atsOptimization.structureScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Structure</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(atsOptimization.contentScore)}`}>
                      {atsOptimization.contentScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Content</div>
                  </div>
                  <div className="text-center">
                    <div className={`text-2xl font-bold ${getScoreColor(atsOptimization.parseabilityScore)}`}>
                      {atsOptimization.parseabilityScore}%
                    </div>
                    <div className="text-sm text-muted-foreground">Parseability</div>
                  </div>
                </div>
                
                {atsOptimization.quickWins?.length > 0 && (
                  <div className="bg-blue-50 dark:bg-blue-950/30 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">Quick Wins:</h4>
                    <div className="space-y-2">
                      {atsOptimization.quickWins.map((tip: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <Lightbulb className="h-4 w-4 text-blue-600" />
                          <span className="text-blue-700 dark:text-blue-300">{tip}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="action" className="space-y-6">
            {actionPlan && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="p-6 border-red-200 dark:border-red-800">
                  <h3 className="text-lg font-semibold text-red-700 dark:text-red-300 mb-4">🚨 Immediate (Today)</h3>
                  <div className="space-y-2">
                    {actionPlan.immediate?.map((item: string, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground">{item}</div>
                    ))}
                  </div>
                </Card>
                
                <Card className="p-6 border-orange-200 dark:border-orange-800">
                  <h3 className="text-lg font-semibold text-orange-700 dark:text-orange-300 mb-4">📅 Short-term (This Week)</h3>
                  <div className="space-y-2">
                    {actionPlan.shortTerm?.map((item: string, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground">{item}</div>
                    ))}
                  </div>
                </Card>
                
                <Card className="p-6 border-green-200 dark:border-green-800">
                  <h3 className="text-lg font-semibold text-green-700 dark:text-green-300 mb-4">🎯 Long-term (This Month)</h3>
                  <div className="space-y-2">
                    {actionPlan.longTerm?.map((item: string, index: number) => (
                      <div key={index} className="text-sm text-muted-foreground">{item}</div>
                    ))}
                  </div>
                </Card>
              </div>
            )}
            
            {actionPlan?.estimatedImpact && (
              <Card className="p-6 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border-purple-200 dark:border-purple-800">
                <div className="text-center">
                  <h3 className="text-lg font-semibold text-purple-800 dark:text-purple-200 mb-2">
                    Estimated Impact
                  </h3>
                  <div className="text-2xl font-bold text-purple-600">{actionPlan.estimatedImpact}</div>
                  <div className="text-sm text-purple-600 mt-2">Time to complete: {actionPlan.timeToComplete}</div>
                </div>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <Lightbulb className="h-6 w-6 text-blue-500" />
            <h3 className="text-xl font-semibold text-foreground">
              {isAdvancedVersion ? 'AI-Powered Improvement Recommendations' : 'Improvement Suggestions'}
            </h3>
          </div>
          
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    {suggestion.includes('CRITICAL') && <AlertTriangle className="h-5 w-5 text-red-500" />}
                    {suggestion.includes('URGENT') && <Zap className="h-5 w-5 text-orange-500" />}
                    {suggestion.includes('SKILLS') && <Target className="h-5 w-5 text-blue-500" />}
                    {suggestion.includes('IMPACT') && <TrendingUp className="h-5 w-5 text-green-500" />}
                    {suggestion.includes('EXCELLENCE') && <Crown className="h-5 w-5 text-purple-500" />}
                    {!suggestion.match(/(CRITICAL|URGENT|SKILLS|IMPACT|EXCELLENCE)/) && <CheckCircle className="h-5 w-5 text-gray-500" />}
                  </div>
                  <div className="flex-1">
                    <p className="text-foreground leading-relaxed">{suggestion}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Export Options */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-foreground mb-4">Next Steps</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button className="flex items-center justify-center space-x-2 h-12">
            <FileCheck className="h-5 w-5" />
            <span>Export Analysis Report</span>
          </Button>
          <Button variant="outline" className="flex items-center justify-center space-x-2 h-12">
            <ArrowRight className="h-5 w-5" />
            <span>Analyze Another Position</span>
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default ScoreDashboard;
