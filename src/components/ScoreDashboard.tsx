
import React from 'react';
import { TrendingUp, Target, Zap, FileCheck, AlertTriangle, CheckCircle, ArrowRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Suggestion {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  description: string;
  action: string;
}

interface ScoreDashboardProps {
  overallScore: number;
  keywordMatch: number;
  skillsAlignment: number;
  atsCompatibility: number;
  experienceRelevance: number;
  suggestions?: Suggestion[];
}

const ScoreDashboard: React.FC<ScoreDashboardProps> = ({
  overallScore,
  keywordMatch,
  skillsAlignment,
  atsCompatibility,
  experienceRelevance,
  suggestions = []
}) => {
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

  return (
    <div className="space-y-8">
      {/* Overall Score */}
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
           <h2 className="text-3xl font-bold text-foreground mb-3">Overall Match Score</h2>
           <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {overallScore >= 80 
              ? '🎉 Excellent match! Your resume is well-optimized for this position.' 
              : overallScore >= 60 
              ? '👍 Good match with room for improvement. Follow the suggestions below.' 
              : '🔧 Needs significant improvements. Your resume has potential - let\'s optimize it!'}
          </p>
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

      {/* Suggestions */}
      {suggestions.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-6">
            <AlertTriangle className="h-6 w-6 text-warning" />
            <h3 className="text-xl font-semibold text-foreground">Improvement Suggestions</h3>
          </div>
          
          <div className="space-y-4">
            {suggestions.map((suggestion, index) => (
              <div key={index} className="border border-border rounded-lg p-5 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <Badge className={getPriorityColor(suggestion.priority)}>
                      {suggestion.priority.toUpperCase()}
                    </Badge>
                    <h4 className="font-semibold text-foreground">{suggestion.title}</h4>
                  </div>
                </div>
                <p className="text-muted-foreground mb-3 leading-relaxed">{suggestion.description}</p>
                <div className="flex items-center text-sm text-primary">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  <span className="font-medium">Action: {suggestion.action}</span>
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
