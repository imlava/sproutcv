/**
 * Quick Integration Test Component
 * Drop this component into any page to test the enhanced features
 */

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { StreamingProgress, useStreamingAnalysis } from '@/components/analysis/StreamingProgress';
import { 
  handleEnhancedFileUpload, 
  handleEnhancedAnalysis, 
  getSystemHealth 
} from '@/integrations/enhancedServices';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertCircle, Upload } from 'lucide-react';

export function QuickEnhancedTest() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [systemHealth, setSystemHealth] = useState(getSystemHealth());
  
  const { toast } = useToast();
  
  const {
    isAnalyzing,
    progress,
    currentStage,
    message,
    partialResults,
    estimatedTimeRemaining,
    error,
    callbacks,
    startAnalysis,
    reset,
  } = useStreamingAnalysis();

  // Test file upload
  const testFileUpload = async (uploadedFile: File) => {
    setIsProcessing(true);
    try {
      const text = await handleEnhancedFileUpload(
        uploadedFile,
        (progress, stage) => {
          console.log(`Processing: ${stage} - ${progress}%`);
        },
        (error) => {
          toast({
            title: 'Processing Error',
            description: error,
            variant: 'destructive',
          });
        }
      );

      setExtractedText(text);
      setFile(uploadedFile);
      
      toast({
        title: 'Success!',
        description: `Extracted ${text.split(/\s+/).length} words from ${uploadedFile.name}`,
      });
    } catch (error) {
      console.error('Upload failed:', error);
    }
    setIsProcessing(false);
  };

  // Test streaming analysis
  const testAnalysis = async () => {
    if (!extractedText || !jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please upload a file and add job description',
        variant: 'destructive',
      });
      return;
    }

    reset();
    setResult(null);
    startAnalysis();

    try {
      const analysisResult = await handleEnhancedAnalysis(
        extractedText,
        jobDescription,
        'test-user-id',
        {
          enableStreaming: true,
          analysisType: 'comprehensive',
          priority: 'high',
          ...callbacks,
        }
      );

      setResult(analysisResult);
      
      toast({
        title: 'Analysis Complete!',
        description: `Score: ${analysisResult.overall_score}/100`,
      });
    } catch (error) {
      console.error('Analysis failed:', error);
    }
  };

  // Refresh system health
  const refreshHealth = () => {
    setSystemHealth(getSystemHealth());
    toast({
      title: 'System Health',
      description: systemHealth.message,
    });
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Enhanced Features Test</CardTitle>
            <Button variant="outline" onClick={refreshHealth}>
              Check Health
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* System Health Status */}
          <Alert>
            <div className="flex items-center gap-2">
              {systemHealth.isHealthy ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <AlertDescription>
                <strong>System Status:</strong> {systemHealth.message}
              </AlertDescription>
            </div>
            <div className="mt-2 text-sm text-muted-foreground">
              Queue: {systemHealth.queue.pending} active, {systemHealth.queue.waiting} waiting
            </div>
          </Alert>

          {/* File Upload Test */}
          <div className="space-y-2">
            <h3 className="font-semibold flex items-center gap-2">
              <Upload className="h-4 w-4" />
              Step 1: Upload Resume (12+ formats supported)
            </h3>
            <Input
              type="file"
              accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.rtf,.html,.csv"
              onChange={(e) => {
                const uploadedFile = e.target.files?.[0];
                if (uploadedFile) testFileUpload(uploadedFile);
              }}
              disabled={isProcessing}
            />
            {file && (
              <div className="flex items-center gap-2">
                <Badge variant="secondary">
                  {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </Badge>
                {extractedText && (
                  <Badge variant="outline" className="text-green-600">
                    ✓ {extractedText.split(/\s+/).length} words extracted
                  </Badge>
                )}
              </div>
            )}
          </div>

          {/* Job Description */}
          <div className="space-y-2">
            <h3 className="font-semibold">Step 2: Add Job Description</h3>
            <textarea
              value={jobDescription}
              onChange={(e) => setJobDescription(e.target.value)}
              placeholder="Paste job description here..."
              className="w-full min-h-[100px] p-3 border rounded-md"
            />
          </div>

          {/* Analyze Button */}
          <Button
            onClick={testAnalysis}
            disabled={!extractedText || !jobDescription || isAnalyzing}
            className="w-full"
            size="lg"
          >
            {isAnalyzing ? 'Analyzing...' : 'Test Streaming Analysis'}
          </Button>
        </CardContent>
      </Card>

      {/* Streaming Progress */}
      {isAnalyzing && (
        <StreamingProgress
          progress={progress}
          currentStage={currentStage}
          message={message}
          partialResults={partialResults}
          estimatedTimeRemaining={estimatedTimeRemaining}
          isComplete={false}
          error={error}
        />
      )}

      {/* Results */}
      {result && !isAnalyzing && (
        <Card>
          <CardHeader>
            <CardTitle>Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center p-4 bg-primary/10 rounded-lg">
                <div className="text-3xl font-bold text-primary">
                  {result.overall_score}
                </div>
                <div className="text-sm text-muted-foreground">Overall</div>
              </div>
              <div className="text-center p-4 bg-blue-500/10 rounded-lg">
                <div className="text-3xl font-bold text-blue-600">
                  {result.ats_score}
                </div>
                <div className="text-sm text-muted-foreground">ATS</div>
              </div>
              <div className="text-center p-4 bg-green-500/10 rounded-lg">
                <div className="text-3xl font-bold text-green-600">
                  {result.match_percentage}%
                </div>
                <div className="text-sm text-muted-foreground">Match</div>
              </div>
            </div>

            <details className="mt-4">
              <summary className="cursor-pointer font-semibold text-sm">
                View Full Response
              </summary>
              <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto text-xs max-h-96">
                {JSON.stringify(result, null, 2)}
              </pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
