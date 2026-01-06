/**
 * Streaming Analysis Progress Component
 * Real-time visual feedback for AI analysis with live updates
 */

import React, { useState, useEffect } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  Brain,
  FileSearch,
  Target,
  Sparkles,
  TrendingUp 
} from 'lucide-react';

interface StreamingProgressProps {
  progress: number;
  currentStage: string;
  message?: string;
  partialResults?: Record<string, any>;
  estimatedTimeRemaining?: number; // seconds
  isComplete?: boolean;
  error?: string;
}

const stageIcons: Record<string, React.ReactNode> = {
  'initializing': <Loader2 className="h-4 w-4 animate-spin" />,
  'quick_assessment': <Brain className="h-4 w-4" />,
  'keyword_analysis': <FileSearch className="h-4 w-4" />,
  'detailed_scoring': <Target className="h-4 w-4" />,
  'recommendations': <Sparkles className="h-4 w-4" />,
  'competitive_analysis': <TrendingUp className="h-4 w-4" />,
  'ats_optimization': <CheckCircle2 className="h-4 w-4" />,
};

const stageLabels: Record<string, string> = {
  'initializing': 'Initializing Analysis',
  'quick_assessment': 'Quick Assessment',
  'keyword_analysis': 'Keyword Analysis',
  'detailed_scoring': 'Detailed Scoring',
  'recommendations': 'Generating Recommendations',
  'competitive_analysis': 'Competitive Analysis',
  'ats_optimization': 'ATS Optimization',
};

export function StreamingProgress({
  progress,
  currentStage,
  message,
  partialResults,
  estimatedTimeRemaining,
  isComplete,
  error,
}: StreamingProgressProps) {
  const [elapsedTime, setElapsedTime] = useState(0);

  useEffect(() => {
    if (isComplete || error) return;

    const interval = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, [isComplete, error]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {error ? (
              <AlertCircle className="h-5 w-5 text-destructive" />
            ) : isComplete ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              stageIcons[currentStage] || <Loader2 className="h-4 w-4 animate-spin" />
            )}
            <CardTitle className="text-lg">
              {error ? 'Analysis Error' : isComplete ? 'Analysis Complete' : 'Analyzing Your Resume'}
            </CardTitle>
          </div>
          <Badge variant={error ? 'destructive' : isComplete ? 'default' : 'secondary'}>
            {error ? 'Failed' : isComplete ? 'Done' : 'In Progress'}
          </Badge>
        </div>
        <CardDescription>
          {error ? (
            error
          ) : isComplete ? (
            'Analysis completed successfully'
          ) : (
            message || stageLabels[currentStage] || 'Processing...'
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Progress Bar */}
        {!error && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>{Math.round(progress)}% Complete</span>
              <span>
                {isComplete ? (
                  `Completed in ${formatTime(elapsedTime)}`
                ) : estimatedTimeRemaining ? (
                  `~${formatTime(estimatedTimeRemaining)} remaining`
                ) : (
                  `Elapsed: ${formatTime(elapsedTime)}`
                )}
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}

        {/* Stage Indicators */}
        {!error && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {Object.entries(stageLabels).map(([stage, label]) => {
              const stages = Object.keys(stageLabels);
              const currentIndex = stages.indexOf(currentStage);
              const stageIndex = stages.indexOf(stage);
              const isCompleted = stageIndex < currentIndex || isComplete;
              const isCurrent = stage === currentStage && !isComplete;

              return (
                <div
                  key={stage}
                  className={`
                    flex items-center gap-2 p-2 rounded-md text-sm
                    ${isCompleted ? 'bg-green-500/10 text-green-700 dark:text-green-400' : ''}
                    ${isCurrent ? 'bg-primary/10 text-primary animate-pulse' : ''}
                    ${!isCompleted && !isCurrent ? 'text-muted-foreground' : ''}
                  `}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  ) : isCurrent ? (
                    <Loader2 className="h-4 w-4 animate-spin flex-shrink-0" />
                  ) : (
                    <div className="h-4 w-4 rounded-full border-2 border-muted flex-shrink-0" />
                  )}
                  <span className="truncate">{label}</span>
                </div>
              );
            })}
          </div>
        )}

        {/* Partial Results Preview */}
        {partialResults && Object.keys(partialResults).length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-semibold">Early Insights</h4>
            <div className="space-y-2">
              {partialResults.overall_score !== undefined && (
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Overall Score</span>
                  <Badge variant="outline">{partialResults.overall_score}/100</Badge>
                </div>
              )}
              {partialResults.ats_score !== undefined && (
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">ATS Compatibility</span>
                  <Badge variant="outline">{partialResults.ats_score}/100</Badge>
                </div>
              )}
              {partialResults.match_percentage !== undefined && (
                <div className="flex items-center justify-between p-2 bg-muted/50 rounded">
                  <span className="text-sm">Job Match</span>
                  <Badge variant="outline">{partialResults.match_percentage}%</Badge>
                </div>
              )}
              {partialResults.top_strengths && partialResults.top_strengths.length > 0 && (
                <div className="p-2 bg-green-500/10 rounded">
                  <span className="text-sm font-medium text-green-700 dark:text-green-400">
                    Top Strength:
                  </span>
                  <p className="text-sm mt-1">{partialResults.top_strengths[0]}</p>
                </div>
              )}
              {partialResults.critical_gaps && partialResults.critical_gaps.length > 0 && (
                <div className="p-2 bg-orange-500/10 rounded">
                  <span className="text-sm font-medium text-orange-700 dark:text-orange-400">
                    Quick Win:
                  </span>
                  <p className="text-sm mt-1">{partialResults.critical_gaps[0]}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Hook for managing streaming analysis state
 */
export function useStreamingAnalysis() {
  const [state, setState] = useState({
    isAnalyzing: false,
    progress: 0,
    currentStage: 'initializing',
    message: '',
    partialResults: {} as Record<string, any>,
    estimatedTimeRemaining: undefined as number | undefined,
    error: undefined as string | undefined,
  });

  const callbacks = {
    onProgress: (progress: number, stage: string, message?: string) => {
      setState(prev => ({
        ...prev,
        progress,
        currentStage: stage,
        message: message || '',
        // Estimate time remaining based on progress
        estimatedTimeRemaining: progress > 0 
          ? Math.round((100 - progress) / progress * state.progress) 
          : undefined,
      }));
    },

    onPartial: (section: string, content: any) => {
      setState(prev => ({
        ...prev,
        partialResults: {
          ...prev.partialResults,
          ...content,
        },
      }));
    },

    onComplete: () => {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        progress: 100,
      }));
    },

    onError: (error: any) => {
      setState(prev => ({
        ...prev,
        isAnalyzing: false,
        error: error.error || 'Analysis failed',
      }));
    },
  };

  const startAnalysis = () => {
    setState({
      isAnalyzing: true,
      progress: 0,
      currentStage: 'initializing',
      message: 'Starting analysis...',
      partialResults: {},
      estimatedTimeRemaining: undefined,
      error: undefined,
    });
  };

  const reset = () => {
    setState({
      isAnalyzing: false,
      progress: 0,
      currentStage: 'initializing',
      message: '',
      partialResults: {},
      estimatedTimeRemaining: undefined,
      error: undefined,
    });
  };

  return {
    ...state,
    callbacks,
    startAnalysis,
    reset,
  };
}
