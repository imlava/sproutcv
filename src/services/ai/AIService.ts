import { supabase } from '@/integrations/supabase/client';
import { 
  AnalysisResult, 
  AIAnalysisError, 
  ErrorContext,
  ProcessingMetadata 
} from '@/types/analysis';

export class AIService {
  private static instance: AIService;
  private cache: Map<string, AnalysisResult>;
  private rateLimitTracker: Map<string, number[]>;

  private constructor() {
    this.cache = new Map();
    this.rateLimitTracker = new Map();
  }

  static getInstance(): AIService {
    if (!AIService.instance) {
      AIService.instance = new AIService();
    }
    return AIService.instance;
  }

  async analyzeResume(
    resumeText: string, 
    jobDescription: string, 
    userId: string,
    metadata: ProcessingMetadata
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const cacheKey = this.generateCacheKey(resumeText, jobDescription);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      console.log('AI Analysis: Cache hit');
      const cachedResult = this.cache.get(cacheKey)!;
      return {
        ...cachedResult,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };
    }

    // Check rate limits
    await this.checkRateLimit(userId);

    try {
      // Call the enhanced analyze-resume edge function (FIXED FINAL VERSION)
      const { data, error } = await supabase.functions.invoke('analyze-resume-fixed-final', {
        body: {
          resumeText,
          jobDescription,
          userId,
          metadata: {
            ...metadata,
            cacheKey,
            requestId: crypto.randomUUID()
          }
        }
      });

      if (error) {
        throw new AIAnalysisError('Edge function error', error);
      }

      const analysis: AnalysisResult = {
        ...data,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      this.cache.set(cacheKey, analysis);
      
      // Clean old cache entries
      this.cleanCache();

      // Save to database
      await this.saveAnalysisToDatabase(analysis, userId);

      return analysis;
    } catch (error) {
      console.error('AI Analysis Error:', error);
      
      // Log error with context
      await this.logError(error as Error, {
        userId,
        timestamp: new Date().toISOString(),
        fileInfo: {
          name: 'resume.pdf',
          size: metadata.fileSize,
          type: metadata.fileType
        }
      });

      throw new AIAnalysisError('Failed to analyze resume', error);
    }
  }

  private async checkRateLimit(userId: string): Promise<void> {
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute window
    const maxRequests = 10;

    if (!this.rateLimitTracker.has(userId)) {
      this.rateLimitTracker.set(userId, []);
    }

    const userRequests = this.rateLimitTracker.get(userId)!;
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      throw new Error('Rate limit exceeded. Please wait before making another request.');
    }

    // Add current request
    validRequests.push(now);
    this.rateLimitTracker.set(userId, validRequests);
  }

  private generateCacheKey(resumeText: string, jobDescription: string): string {
    const text = resumeText + jobDescription;
    return btoa(text).substring(0, 32);
  }

  private cleanCache(): void {
    // Keep only the most recent 100 entries
    if (this.cache.size > 100) {
      const entries = Array.from(this.cache.entries());
      const toKeep = entries.slice(-50);
      this.cache.clear();
      toKeep.forEach(([key, value]) => this.cache.set(key, value));
    }
  }

  private async saveAnalysisToDatabase(analysis: AnalysisResult, userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('resume_analyses')
        .insert({
          user_id: userId,
          resume_text: 'Resume analysis', // Placeholder - will be set by calling function
          job_description: 'Job analysis', // Placeholder - will be set by calling function
          analysis_results: analysis as any,
          overall_score: analysis.overallScore,
          keyword_match: analysis.keywordAnalysis.matched.length,
          skills_alignment: analysis.skillsGap.matchedSkills.length,
          ats_compatibility: analysis.atsCompatibility.score,
          experience_relevance: analysis.experienceMatch.relevantExperience ? 100 : 50
        });

      if (error) {
        console.error('Database Save Error:', error);
      }
    } catch (error) {
      console.error('Failed to save analysis to database:', error);
    }
  }

  private async logError(error: Error, context: ErrorContext): Promise<void> {
    try {
      const { error: logError } = await supabase
        .from('security_events')
        .insert({
          event_type: 'ai_error',
          user_id: context.userId || null,
          metadata: {
            error_type: error.name,
            error_message: error.message,
            error_stack: error.stack,
            timestamp: context.timestamp,
            userAgent: context.userAgent
          } as any,
          severity: 'high'
        });

      if (logError) {
        console.error('Failed to log error:', logError);
      }
    } catch (logErr) {
      console.error('Error logging failed:', logErr);
    }
  }

  // Public method to get cache stats
  getCacheStats(): { size: number; hitRate: number } {
    return {
      size: this.cache.size,
      hitRate: 0.85 // Placeholder - implement proper tracking
    };
  }

  // Public method to clear cache
  clearCache(): void {
    this.cache.clear();
  }

  // Public method to get rate limit info
  getRateLimitInfo(userId: string): { remaining: number; resetTime: number } {
    const now = Date.now();
    const windowMs = 60 * 1000;
    const maxRequests = 10;

    if (!this.rateLimitTracker.has(userId)) {
      return { remaining: maxRequests, resetTime: now + windowMs };
    }

    const userRequests = this.rateLimitTracker.get(userId)!;
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    return {
      remaining: maxRequests - validRequests.length,
      resetTime: validRequests.length > 0 ? validRequests[0] + windowMs : now + windowMs
    };
  }
}
