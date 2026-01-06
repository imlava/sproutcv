/**
 * Example: Enhanced Resume Analysis with Streaming
 * This demonstrates how to use all the new SOTA features
 */

import React, { useState } from 'react';
import { aiService } from '@/services/ai/EnhancedAIService';
import { documentProcessor } from '@/services/DocumentProcessingService';
import { StreamingProgress, useStreamingAnalysis } from '@/components/analysis/StreamingProgress';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { addBreadcrumb, captureError } from '@/lib/sentry';

export function EnhancedResumeAnalyzer() {
  const [file, setFile] = useState<File | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [result, setResult] = useState<any>(null);
  
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

  /**
   * Step 1: Handle file upload with enhanced processing
   */
  const handleFileUpload = async (uploadedFile: File) => {
    try {
      // Add breadcrumb for monitoring
      addBreadcrumb('File uploaded', 'user-action', 'info', {
        fileName: uploadedFile.name,
        fileSize: uploadedFile.size,
        fileType: uploadedFile.type,
      });

      // Validate file
      const validation = documentProcessor.validateFile(uploadedFile);
      if (!validation.valid) {
        toast({
          title: 'Invalid File',
          description: validation.error,
          variant: 'destructive',
        });
        return;
      }

      setFile(uploadedFile);
      
      toast({
        title: 'Processing Document',
        description: 'Extracting text from your file...',
      });

      // Detect document type first
      const typeInfo = await documentProcessor.detectType(uploadedFile);
      console.log('Detected type:', typeInfo);

      // Extract text with automatic OCR if needed
      const extractionResult = await documentProcessor.extractText(uploadedFile, {
        enableOCR: true,  // Auto-detects if OCR is needed
        ocrLanguage: 'eng',
        onProgress: (progress, stage) => {
          console.log(`Document processing: ${stage} - ${progress}%`);
        },
      });

      setExtractedText(extractionResult.text);

      toast({
        title: 'Document Processed',
        description: `Extracted ${extractionResult.metadata.wordCount} words in ${(extractionResult.metadata.processingTime / 1000).toFixed(2)}s`,
      });

      // Show warnings if any
      if (extractionResult.warnings && extractionResult.warnings.length > 0) {
        console.warn('Extraction warnings:', extractionResult.warnings);
      }

      // Add breadcrumb
      addBreadcrumb('Document extracted', 'process', 'info', {
        wordCount: extractionResult.metadata.wordCount,
        method: extractionResult.metadata.method,
        hasWarnings: !!extractionResult.warnings?.length,
      });

    } catch (error) {
      console.error('File processing error:', error);
      
      // Capture error in Sentry
      captureError(error as Error, {
        tags: { feature: 'document-processing' },
        extra: { fileName: uploadedFile.name },
        level: 'error',
      });

      toast({
        title: 'Processing Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  /**
   * Step 2: Analyze resume with streaming AI
   */
  const handleAnalyze = async () => {
    if (!extractedText || !jobDescription) {
      toast({
        title: 'Missing Information',
        description: 'Please upload a resume and provide a job description',
        variant: 'destructive',
      });
      return;
    }

    // Reset previous state
    reset();
    setResult(null);
    startAnalysis();

    try {
      // Add breadcrumb
      addBreadcrumb('Analysis started', 'user-action', 'info', {
        resumeLength: extractedText.length,
        jdLength: jobDescription.length,
      });

      // Check service health before starting
      const queueStatus = aiService.getQueueStatus();
      const cbStatus = aiService.getCircuitBreakerStatus();

      if (cbStatus.isOpen) {
        toast({
          title: 'Service Unavailable',
          description: 'AI service is temporarily unavailable. Please try again in 30 seconds.',
          variant: 'destructive',
        });
        return;
      }

      console.log(`Queue status: ${queueStatus.pending} active, ${queueStatus.size} waiting`);

      // Call streaming analysis
      const analysisResult = await aiService.analyzeResume(
        extractedText,
        jobDescription,
        'user-123', // Replace with actual user ID
        {
          enableStreaming: true,          // Enable real-time streaming
          priority: 'high',                // High priority in queue
          analysisType: 'comprehensive',   // Full analysis
          timeout: 90000,                  // 90 second timeout
        },
        callbacks  // Pass streaming callbacks for real-time updates
      );

      setResult(analysisResult);

      toast({
        title: 'Analysis Complete!',
        description: `Overall Score: ${analysisResult.overall_score}/100`,
      });

      // Add breadcrumb
      addBreadcrumb('Analysis completed', 'process', 'info', {
        overallScore: analysisResult.overall_score,
        atsScore: analysisResult.ats_score,
      });

    } catch (error) {
      console.error('Analysis error:', error);

      // Capture error in Sentry
      captureError(error as Error, {
        tags: { feature: 'ai-analysis' },
        extra: {
          resumeLength: extractedText.length,
          jdLength: jobDescription.length,
        },
        level: 'error',
      });

      toast({
        title: 'Analysis Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  /**
   * Check system health
   */
  const checkHealth = () => {
    const queueStatus = aiService.getQueueStatus();
    const cbStatus = aiService.getCircuitBreakerStatus();

    console.log('System Health:', {
      queue: {
        pending: queueStatus.pending,
        waiting: queueStatus.size,
        isPaused: queueStatus.isPaused,
      },
      circuitBreaker: {
        isOpen: cbStatus.isOpen,
        stats: cbStatus.stats,
      },
    });

    toast({
      title: 'System Health',
      description: cbStatus.isOpen 
        ? '🔴 AI service degraded' 
        : '🟢 All systems operational',
    });
  };

  return (
    <div className="container mx-auto py-8 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Enhanced Resume Analyzer</h1>
        <Button variant="outline" onClick={checkHealth}>
          Check System Health
        </Button>
      </div>

      {/* File Upload */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Step 1: Upload Resume</h2>
        <input
          type="file"
          accept=".pdf,.docx,.txt,.md,.png,.jpg,.jpeg,.gif,.bmp,.tiff,.rtf,.html,.csv"
          onChange={(e) => {
            const uploadedFile = e.target.files?.[0];
            if (uploadedFile) handleFileUpload(uploadedFile);
          }}
          className="block w-full text-sm text-gray-500
            file:mr-4 file:py-2 file:px-4
            file:rounded-full file:border-0
            file:text-sm file:font-semibold
            file:bg-primary file:text-primary-foreground
            hover:file:bg-primary/90"
        />
        {file && (
          <p className="mt-2 text-sm text-muted-foreground">
            Loaded: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
          </p>
        )}
        {extractedText && (
          <p className="mt-2 text-sm text-green-600">
            ✓ Extracted {extractedText.split(/\s+/).length} words
          </p>
        )}
      </Card>

      {/* Job Description */}
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-4">Step 2: Job Description</h2>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the job description here..."
          className="w-full min-h-[200px] p-3 border rounded-md"
        />
      </Card>

      {/* Analyze Button */}
      <div className="flex gap-4">
        <Button
          onClick={handleAnalyze}
          disabled={!extractedText || !jobDescription || isAnalyzing}
          size="lg"
          className="flex-1"
        >
          {isAnalyzing ? 'Analyzing...' : 'Analyze Resume'}
        </Button>
        {isAnalyzing && (
          <Button variant="outline" onClick={reset}>
            Cancel
          </Button>
        )}
      </div>

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
        <Card className="p-6">
          <h2 className="text-2xl font-bold mb-4">Analysis Results</h2>
          
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="text-center p-4 bg-primary/10 rounded-lg">
              <div className="text-3xl font-bold text-primary">
                {result.overall_score}
              </div>
              <div className="text-sm text-muted-foreground">Overall Score</div>
            </div>
            <div className="text-center p-4 bg-blue-500/10 rounded-lg">
              <div className="text-3xl font-bold text-blue-600">
                {result.ats_score}
              </div>
              <div className="text-sm text-muted-foreground">ATS Score</div>
            </div>
            <div className="text-center p-4 bg-green-500/10 rounded-lg">
              <div className="text-3xl font-bold text-green-600">
                {result.match_percentage}%
              </div>
              <div className="text-sm text-muted-foreground">Job Match</div>
            </div>
          </div>

          {/* Display full results */}
          <details className="mt-4">
            <summary className="cursor-pointer font-semibold">
              View Complete Analysis
            </summary>
            <pre className="mt-2 p-4 bg-muted rounded-md overflow-auto text-xs">
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </Card>
      )}
    </div>
  );
}
