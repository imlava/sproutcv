/**
 * Enhanced Document Processing Integration for AIResumeAnalyzerPage
 * 
 * This file provides helper functions to integrate the new SOTA features
 * into the existing AIResumeAnalyzerPage.tsx
 * 
 * Usage: Import these functions and replace the existing file processing logic
 */

import { documentProcessor } from '@/services/DocumentProcessingService';
import { aiService } from '@/services/ai/EnhancedAIService';
import { addBreadcrumb, captureError } from '@/lib/sentry';
import type { AnalysisResult } from '@/types/ai-schemas';

/**
 * Enhanced file upload handler with OCR support
 * Replaces the existing handleFileUpload function
 */
export async function handleEnhancedFileUpload(
  file: File,
  onProgress?: (progress: number, stage: string) => void,
  onError?: (error: string) => void
): Promise<string> {
  try {
    // Track file upload
    addBreadcrumb('File uploaded for processing', 'user-action', 'info', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
    });

    // Validate file
    const validation = documentProcessor.validateFile(file);
    if (!validation.valid) {
      const errorMsg = validation.error || 'Invalid file';
      onError?.(errorMsg);
      throw new Error(errorMsg);
    }

    // Detect document type
    const typeInfo = await documentProcessor.detectType(file);
    console.log('Document type detected:', typeInfo);

    // Show appropriate message based on type
    if (typeInfo.needsOCR) {
      onProgress?.(0, 'Starting OCR processing for scanned document...');
    } else {
      onProgress?.(0, 'Extracting text from document...');
    }

    // Extract text with automatic OCR if needed
    const result = await documentProcessor.extractText(file, {
      enableOCR: true,
      ocrLanguage: 'eng',
      onProgress: (progress, stage) => {
        onProgress?.(progress, stage);
      },
    });

    // Log extraction metadata
    console.log('Document processed:', {
      wordCount: result.metadata.wordCount,
      characterCount: result.metadata.characterCount,
      processingTime: result.metadata.processingTime,
      method: result.metadata.method,
      confidence: result.metadata.confidence,
    });

    // Track successful extraction
    addBreadcrumb('Document extracted successfully', 'process', 'info', {
      wordCount: result.metadata.wordCount,
      method: result.metadata.method,
      processingTime: result.metadata.processingTime,
    });

    // Show warnings if any
    if (result.warnings && result.warnings.length > 0) {
      console.warn('Extraction warnings:', result.warnings);
      result.warnings.forEach(warning => {
        onProgress?.(100, `Warning: ${warning}`);
      });
    }

    return result.text;

  } catch (error) {
    console.error('File processing error:', error);
    
    // Capture error in Sentry
    captureError(error as Error, {
      tags: { feature: 'document-processing', fileName: file.name },
      extra: { fileSize: file.size, fileType: file.type },
      level: 'error',
    });

    const errorMsg = error instanceof Error ? error.message : 'Failed to process file';
    onError?.(errorMsg);
    throw error;
  }
}

/**
 * Enhanced analysis with streaming support
 * Replaces the existing handleAnalyze function
 */
export async function handleEnhancedAnalysis(
  resumeText: string,
  jobDescription: string,
  userId: string,
  options: {
    enableStreaming?: boolean;
    analysisType?: 'comprehensive' | 'quick' | 'keyword-only';
    priority?: 'high' | 'normal' | 'low';
    onProgress?: (progress: number, stage: string, message?: string) => void;
    onPartial?: (section: string, content: any) => void;
    onError?: (error: any) => void;
  } = {}
): Promise<AnalysisResult> {
  try {
    // Validate inputs
    if (!resumeText || resumeText.length < 100) {
      throw new Error('Resume text is too short. Please provide a complete resume.');
    }

    if (!jobDescription || jobDescription.length < 50) {
      throw new Error('Job description is too short. Please provide more details.');
    }

    // Track analysis start
    addBreadcrumb('Starting AI analysis', 'user-action', 'info', {
      resumeLength: resumeText.length,
      jdLength: jobDescription.length,
      enableStreaming: options.enableStreaming,
      analysisType: options.analysisType,
    });

    // Check service health
    const queueStatus = aiService.getQueueStatus();
    const cbStatus = aiService.getCircuitBreakerStatus();

    console.log('Service status:', {
      queue: `${queueStatus.pending} active, ${queueStatus.size} waiting`,
      circuitBreaker: cbStatus.isOpen ? 'OPEN (degraded)' : 'CLOSED (healthy)',
    });

    if (cbStatus.isOpen) {
      throw new Error('AI service is temporarily unavailable. Please try again in 30 seconds.');
    }

    // Perform analysis with streaming callbacks
    const result = await aiService.analyzeResume(
      resumeText,
      jobDescription,
      userId,
      {
        enableStreaming: options.enableStreaming ?? true,
        analysisType: options.analysisType || 'comprehensive',
        priority: options.priority || 'normal',
        timeout: 90000, // 90 seconds
      },
      {
        onProgress: options.onProgress,
        onPartial: options.onPartial,
        onComplete: (finalResult) => {
          console.log('Analysis complete:', {
            overallScore: finalResult.overall_score,
            atsScore: finalResult.ats_score,
            matchPercentage: finalResult.match_percentage,
          });
        },
        onError: options.onError,
      }
    );

    // Track successful analysis
    addBreadcrumb('Analysis completed successfully', 'process', 'info', {
      overallScore: result.overall_score,
      atsScore: result.ats_score,
      matchPercentage: result.match_percentage,
    });

    return result;

  } catch (error) {
    console.error('Analysis error:', error);

    // Capture error in Sentry
    captureError(error as Error, {
      tags: { feature: 'ai-analysis' },
      extra: {
        resumeLength: resumeText.length,
        jdLength: jobDescription.length,
        enableStreaming: options.enableStreaming,
      },
      level: 'error',
    });

    throw error;
  }
}

/**
 * Check system health status
 * Use this to show service status to users
 */
export function getSystemHealth() {
  const queueStatus = aiService.getQueueStatus();
  const cbStatus = aiService.getCircuitBreakerStatus();

  return {
    isHealthy: !cbStatus.isOpen,
    queue: {
      pending: queueStatus.pending,
      waiting: queueStatus.size,
      isPaused: queueStatus.isPaused,
    },
    circuitBreaker: {
      isOpen: cbStatus.isOpen,
      stats: cbStatus.stats,
    },
    message: cbStatus.isOpen 
      ? '⚠️ AI service is experiencing issues. Retrying automatically...'
      : '✅ All systems operational',
  };
}

/**
 * Example: Drop-in replacement for existing code
 * 
 * OLD CODE:
 * ```typescript
 * const handleFileUpload = async (acceptedFiles: File[]) => {
 *   const file = acceptedFiles[0];
 *   setIsProcessingFile(true);
 *   try {
 *     const text = await extractTextFromPDF(file);
 *     setResumeText(text);
 *   } catch (error) {
 *     toast({ title: "Error", description: error.message });
 *   }
 *   setIsProcessingFile(false);
 * };
 * ```
 * 
 * NEW CODE:
 * ```typescript
 * const handleFileUpload = async (acceptedFiles: File[]) => {
 *   const file = acceptedFiles[0];
 *   setIsProcessingFile(true);
 *   
 *   try {
 *     const text = await handleEnhancedFileUpload(
 *       file,
 *       (progress, stage) => {
 *         console.log(`${stage}: ${progress}%`);
 *         // Update UI with progress
 *       },
 *       (error) => {
 *         toast({ 
 *           title: "Processing Error", 
 *           description: error,
 *           variant: "destructive" 
 *         });
 *       }
 *     );
 *     
 *     setResumeText(text);
 *     toast({ 
 *       title: "Success", 
 *       description: "Document processed successfully" 
 *     });
 *   } catch (error) {
 *     // Error already handled in helper
 *   }
 *   
 *   setIsProcessingFile(false);
 * };
 * ```
 * 
 * ANALYSIS OLD CODE:
 * ```typescript
 * const handleAnalyze = async () => {
 *   setIsAnalyzing(true);
 *   try {
 *     const result = await aiResumeService.analyzeResume({
 *       resumeText,
 *       jobDescription,
 *       userId: user.id,
 *     });
 *     setAnalysis(result);
 *   } catch (error) {
 *     setError(error.message);
 *   }
 *   setIsAnalyzing(false);
 * };
 * ```
 * 
 * ANALYSIS NEW CODE (with streaming):
 * ```typescript
 * const handleAnalyze = async () => {
 *   setIsAnalyzing(true);
 *   setAnalysis(null);
 *   
 *   try {
 *     const result = await handleEnhancedAnalysis(
 *       resumeText,
 *       jobDescription,
 *       user.id,
 *       {
 *         enableStreaming: true,
 *         analysisType: 'comprehensive',
 *         priority: 'high',
 *         onProgress: (progress, stage, message) => {
 *           // Update progress bar
 *           setAnalysisProgress(progress);
 *           setAnalysisStage(stage);
 *         },
 *         onPartial: (section, content) => {
 *           // Show partial results as they arrive
 *           setPartialResults(prev => ({
 *             ...prev,
 *             [section]: content
 *           }));
 *         },
 *         onError: (error) => {
 *           toast({
 *             title: "Analysis Error",
 *             description: error.error,
 *             variant: "destructive"
 *           });
 *         }
 *       }
 *     );
 *     
 *     setAnalysis(result);
 *     toast({ 
 *       title: "Analysis Complete!", 
 *       description: `Overall Score: ${result.overall_score}/100` 
 *     });
 *   } catch (error) {
 *     setError(error.message);
 *   }
 *   
 *   setIsAnalyzing(false);
 * };
 * ```
 */

/**
 * React Hook for streaming analysis state management
 * Use this in your component to manage streaming state
 */
export function useEnhancedAnalysis() {
  const [state, setState] = React.useState({
    isAnalyzing: false,
    progress: 0,
    currentStage: '',
    message: '',
    partialResults: {} as Record<string, any>,
    error: undefined as string | undefined,
  });

  const callbacks = {
    onProgress: (progress: number, stage: string, message?: string) => {
      setState(prev => ({
        ...prev,
        progress,
        currentStage: stage,
        message: message || '',
      }));
    },

    onPartial: (section: string, content: any) => {
      setState(prev => ({
        ...prev,
        partialResults: {
          ...prev.partialResults,
          [section]: content,
        },
      }));
    },

    onError: (error: any) => {
      setState(prev => ({
        ...prev,
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
      error: undefined,
    });
  };

  const reset = () => {
    setState({
      isAnalyzing: false,
      progress: 0,
      currentStage: '',
      message: '',
      partialResults: {},
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

// Re-export for convenience
export { documentProcessor, aiService };
export { addBreadcrumb, captureError, setSentryUser, clearSentryUser } from '@/lib/sentry';
