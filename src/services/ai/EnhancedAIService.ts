/**
 * Enhanced AI Service with SOTA Architecture
 * Features: Streaming, Circuit Breaker, Request Queue, Zod Validation
 */

import { supabase } from '@/integrations/supabase/client';
import PQueue from 'p-queue';
import CircuitBreaker from 'opossum';
import { createParser, ParsedEvent } from 'eventsource-parser';
import {
  validateAnalysisResult,
  validateStreamingChunk,
  safeValidateAnalysisResult,
  createAPIError,
  type AnalysisResult,
  type StreamingChunk,
  type APIError,
} from '@/types/ai-schemas';

export interface StreamingCallbacks {
  onProgress?: (progress: number, stage: string, message?: string) => void;
  onPartial?: (section: string, content: any) => void;
  onComplete?: (result: AnalysisResult) => void;
  onError?: (error: APIError) => void;
}

export interface AnalysisOptions {
  analysisType?: 'comprehensive' | 'quick' | 'keyword-only';
  enableStreaming?: boolean;
  priority?: 'high' | 'normal' | 'low';
  timeout?: number; // milliseconds
  retryAttempts?: number;
}

/**
 * Enhanced AI Service with Production-Grade Features
 */
export class EnhancedAIService {
  private static instance: EnhancedAIService;
  private cache: Map<string, { result: AnalysisResult; timestamp: number }>;
  private queue: PQueue;
  private circuitBreaker: CircuitBreaker;
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  private readonly MAX_CACHE_SIZE = 100;

  private constructor() {
    this.cache = new Map();
    
    // Configure request queue with priority support
    this.queue = new PQueue({
      concurrency: 3, // Max 3 concurrent AI requests
      interval: 1000, // 1 second
      intervalCap: 5, // Max 5 requests per second
      timeout: 60000, // 60 second timeout
      throwOnTimeout: true,
    });

    // Configure circuit breaker for resilience
    this.circuitBreaker = new CircuitBreaker(this.callAIEndpoint.bind(this), {
      timeout: 30000, // 30 seconds
      errorThresholdPercentage: 50, // Open circuit if 50% of requests fail
      resetTimeout: 30000, // Try again after 30 seconds
      rollingCountTimeout: 10000, // 10 second window
      rollingCountBuckets: 10,
      name: 'gemini-api',
    });

    // Circuit breaker event handlers
    this.circuitBreaker.on('open', () => {
      console.warn('🔴 Circuit breaker OPENED - AI service temporarily unavailable');
    });

    this.circuitBreaker.on('halfOpen', () => {
      console.info('🟡 Circuit breaker HALF-OPEN - testing recovery');
    });

    this.circuitBreaker.on('close', () => {
      console.info('🟢 Circuit breaker CLOSED - AI service restored');
    });

    // Queue event handlers
    this.queue.on('active', () => {
      console.log(`📊 Queue active - ${this.queue.size} pending, ${this.queue.pending} running`);
    });

    this.queue.on('idle', () => {
      console.log('✅ Queue is idle - all requests processed');
    });
  }

  static getInstance(): EnhancedAIService {
    if (!EnhancedAIService.instance) {
      EnhancedAIService.instance = new EnhancedAIService();
    }
    return EnhancedAIService.instance;
  }

  /**
   * Analyze resume with streaming support
   */
  async analyzeResume(
    resumeText: string,
    jobDescription: string,
    userId: string,
    options: AnalysisOptions = {},
    callbacks?: StreamingCallbacks
  ): Promise<AnalysisResult> {
    const cacheKey = this.generateCacheKey(resumeText, jobDescription);

    // Check cache
    const cached = this.getCachedResult(cacheKey);
    if (cached) {
      console.log('✨ Cache hit - returning cached result');
      callbacks?.onComplete?.(cached);
      return cached;
    }

    // Determine priority
    const priority = this.getPriorityValue(options.priority || 'normal');

    // Add to queue with priority
    return this.queue.add(
      async () => {
        if (options.enableStreaming) {
          return this.analyzeWithStreaming(
            resumeText,
            jobDescription,
            userId,
            options,
            callbacks
          );
        } else {
          return this.analyzeStandard(
            resumeText,
            jobDescription,
            userId,
            options
          );
        }
      },
      { priority }
    );
  }

  /**
   * Streaming analysis with real-time updates
   */
  private async analyzeWithStreaming(
    resumeText: string,
    jobDescription: string,
    userId: string,
    options: AnalysisOptions,
    callbacks?: StreamingCallbacks
  ): Promise<AnalysisResult> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;

    if (!token) {
      throw new Error('Authentication required for streaming analysis');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const streamUrl = `${supabaseUrl}/functions/v1/gemini-stream-analyzer`;

    return new Promise((resolve, reject) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => {
        controller.abort();
        reject(new Error('Streaming request timeout'));
      }, options.timeout || 90000); // 90 seconds default

      let finalResult: AnalysisResult | null = null;

      const parser = createParser((event: ParsedEvent) => {
        if (event.type === 'event') {
          try {
            const chunk: StreamingChunk = validateStreamingChunk(JSON.parse(event.data));

            switch (chunk.type) {
              case 'progress':
                callbacks?.onProgress?.(
                  chunk.data.progress,
                  chunk.data.stage,
                  chunk.data.message
                );
                break;

              case 'partial':
                callbacks?.onPartial?.(chunk.data.section, chunk.data.content);
                break;

              case 'complete':
                // Validate final result
                const validation = safeValidateAnalysisResult(chunk.data);
                if (validation.success && validation.data) {
                  finalResult = validation.data;
                  const cacheKey = this.generateCacheKey(resumeText, jobDescription);
                  this.setCachedResult(cacheKey, finalResult);
                  callbacks?.onComplete?.(finalResult);
                  clearTimeout(timeout);
                  resolve(finalResult);
                } else {
                  const error = createAPIError('Invalid analysis result', {
                    code: 'VALIDATION_ERROR',
                    details: validation.error,
                    retryable: true,
                  });
                  callbacks?.onError?.(error);
                  reject(new Error('Validation failed'));
                }
                break;

              case 'error':
                const apiError = chunk.data as APIError;
                callbacks?.onError?.(apiError);
                clearTimeout(timeout);
                reject(new Error(apiError.error));
                break;
            }
          } catch (parseError) {
            console.error('Failed to parse streaming chunk:', parseError);
          }
        }
      });

      fetch(streamUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          resumeText,
          jobDescription,
          userId,
          analysisType: options.analysisType || 'comprehensive',
          metadata: {
            requestId: crypto.randomUUID(),
            clientTimestamp: Date.now(),
          },
        }),
        signal: controller.signal,
      })
        .then(async (response) => {
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
          }

          const reader = response.body?.getReader();
          const decoder = new TextDecoder();

          if (!reader) {
            throw new Error('No response body reader');
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const text = decoder.decode(value, { stream: true });
            parser.feed(text);
          }

          if (!finalResult) {
            throw new Error('Stream ended without complete result');
          }
        })
        .catch((error) => {
          clearTimeout(timeout);
          console.error('Streaming error:', error);
          const apiError = createAPIError(
            error.message || 'Streaming request failed',
            {
              code: 'STREAMING_ERROR',
              retryable: !controller.signal.aborted,
            }
          );
          callbacks?.onError?.(apiError);
          reject(error);
        });
    });
  }

  /**
   * Standard (non-streaming) analysis
   */
  private async analyzeStandard(
    resumeText: string,
    jobDescription: string,
    userId: string,
    options: AnalysisOptions
  ): Promise<AnalysisResult> {
    try {
      // Use circuit breaker to call AI endpoint
      const response = await this.circuitBreaker.fire({
        resumeText,
        jobDescription,
        userId,
        analysisType: options.analysisType || 'comprehensive',
      });

      // Validate response
      const validatedResult = validateAnalysisResult(response);

      // Cache result
      const cacheKey = this.generateCacheKey(resumeText, jobDescription);
      this.setCachedResult(cacheKey, validatedResult);

      return validatedResult;
    } catch (error) {
      if (this.circuitBreaker.opened) {
        throw createAPIError('AI service temporarily unavailable', {
          code: 'CIRCUIT_OPEN',
          retryable: true,
          retryAfter: 30,
        });
      }
      throw error;
    }
  }

  /**
   * Call AI endpoint (used by circuit breaker)
   */
  private async callAIEndpoint(params: {
    resumeText: string;
    jobDescription: string;
    userId: string;
    analysisType: string;
  }): Promise<any> {
    const { data, error } = await supabase.functions.invoke('gemini-resume-analyzer', {
      body: {
        ...params,
        includeInteractive: true,
        includeCoverLetter: false,
        metadata: {
          requestId: crypto.randomUUID(),
          clientTimestamp: Date.now(),
        },
      },
    });

    if (error) {
      throw new Error(`Edge function error: ${error.message || JSON.stringify(error)}`);
    }

    return data?.success ? data.data : data;
  }

  /**
   * Cache management
   */
  private generateCacheKey(resumeText: string, jobDescription: string): string {
    const text = resumeText.substring(0, 1000) + jobDescription.substring(0, 500);
    return btoa(text).substring(0, 32);
  }

  private getCachedResult(key: string): AnalysisResult | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(key);
      return null;
    }

    return cached.result;
  }

  private setCachedResult(key: string, result: AnalysisResult): void {
    this.cache.set(key, { result, timestamp: Date.now() });

    // Clean old entries
    if (this.cache.size > this.MAX_CACHE_SIZE) {
      const entries = Array.from(this.cache.entries());
      entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
      const toDelete = entries.slice(0, this.cache.size - this.MAX_CACHE_SIZE);
      toDelete.forEach(([key]) => this.cache.delete(key));
    }
  }

  private getPriorityValue(priority: 'high' | 'normal' | 'low'): number {
    switch (priority) {
      case 'high': return 10;
      case 'normal': return 5;
      case 'low': return 1;
    }
  }

  /**
   * Public API for queue status
   */
  getQueueStatus() {
    return {
      size: this.queue.size,
      pending: this.queue.pending,
      isPaused: this.queue.isPaused,
    };
  }

  /**
   * Public API for circuit breaker status
   */
  getCircuitBreakerStatus() {
    return {
      isOpen: this.circuitBreaker.opened,
      stats: this.circuitBreaker.stats,
    };
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }

  /**
   * Pause queue (useful for maintenance)
   */
  pauseQueue(): void {
    this.queue.pause();
  }

  /**
   * Resume queue
   */
  resumeQueue(): void {
    this.queue.start();
  }
}

// Export singleton instance
export const aiService = EnhancedAIService.getInstance();

// Re-export for backward compatibility
export { AIService } from './AIService';
