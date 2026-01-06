/**
 * AI Response Validation Schemas using Zod
 * Ensures type safety and data integrity for all AI API responses
 */

import { z } from 'zod';

// Base score schema (0-100)
const ScoreSchema = z.number().min(0).max(100);

// Detailed scoring breakdown
export const DetailedScoreSchema = z.object({
  keywordMatch: ScoreSchema,
  skillsAlignment: ScoreSchema,
  experienceRelevance: ScoreSchema,
  atsCompatibility: ScoreSchema,
  formatOptimization: ScoreSchema,
});

// Analysis insights
export const AnalysisInsightsSchema = z.object({
  strengthsAnalysis: z.array(z.string()),
  improvementAreas: z.array(z.string()),
  missingKeywords: z.array(z.string()),
  suggestedKeywords: z.array(z.string()),
  competitiveAdvantages: z.array(z.string()).optional(),
  industryBenchmarks: z.object({
    averageScore: z.number().optional(),
    topPerformerScore: z.number().optional(),
    yourRanking: z.string().optional(),
  }).optional(),
});

// Quick wins and actionable recommendations
export const ActionableRecommendationsSchema = z.array(
  z.object({
    priority: z.enum(['high', 'medium', 'low']),
    category: z.string(),
    action: z.string(),
    impact: z.string(),
    effort: z.enum(['low', 'medium', 'high']),
    estimatedImprovement: z.number().optional(),
  })
);

// ATS optimization tips
export const ATSOptimizationSchema = z.object({
  tips: z.array(z.string()),
  formattingIssues: z.array(z.string()).optional(),
  parsingWarnings: z.array(z.string()).optional(),
  compatibilityScore: ScoreSchema,
});

// Competitive analysis
export const CompetitiveAnalysisSchema = z.object({
  marketPosition: z.string(),
  differentiators: z.array(z.string()),
  gapAnalysis: z.array(z.string()),
  recommendations: z.array(z.string()),
}).optional();

// Main analysis result schema
export const AnalysisResultSchema = z.object({
  overall_score: ScoreSchema,
  ats_score: ScoreSchema,
  match_percentage: ScoreSchema,
  detailed_scores: DetailedScoreSchema,
  insights: AnalysisInsightsSchema,
  top_strengths: z.array(z.string()),
  immediate_improvements: z.array(z.string()),
  quick_wins: z.array(z.string()),
  matched_keywords: z.array(z.string()),
  missing_critical_keywords: z.array(z.string()),
  ats_optimization: ATSOptimizationSchema,
  actionable_recommendations: ActionableRecommendationsSchema,
  competitive_analysis: CompetitiveAnalysisSchema,
  metadata: z.object({
    analysisVersion: z.string().optional(),
    modelUsed: z.string().optional(),
    processingTime: z.number().optional(),
    confidence: z.number().optional(),
    industryContext: z.string().optional(),
  }).optional(),
});

// Streaming analysis chunk schema (partial results)
export const StreamingChunkSchema = z.object({
  type: z.enum(['progress', 'partial', 'complete', 'error']),
  timestamp: z.number(),
  data: z.union([
    z.object({
      stage: z.string(),
      progress: z.number(), // 0-100
      message: z.string().optional(),
    }),
    z.object({
      section: z.string(),
      content: z.any(),
    }),
    AnalysisResultSchema,
    z.object({
      error: z.string(),
      code: z.string().optional(),
      retryable: z.boolean().optional(),
    }),
  ]),
});

// Cover letter generation schema
export const CoverLetterSchema = z.object({
  content: z.string(),
  tone: z.enum(['professional', 'enthusiastic', 'conservative', 'creative']),
  keyPoints: z.array(z.string()),
  personalizationSuggestions: z.array(z.string()).optional(),
  metadata: z.object({
    wordCount: z.number(),
    readingLevel: z.string().optional(),
    sentiment: z.string().optional(),
  }).optional(),
});

// Real-time feedback schema (section-specific)
export const RealTimeFeedbackSchema = z.object({
  section: z.enum(['summary', 'experience', 'skills', 'education', 'overall']),
  score: ScoreSchema,
  feedback: z.array(z.string()),
  suggestions: z.array(z.string()),
  keywordRelevance: z.array(z.string()).optional(),
  strengthsInSection: z.array(z.string()).optional(),
  weaknessesInSection: z.array(z.string()).optional(),
});

// API error schema
export const APIErrorSchema = z.object({
  error: z.string(),
  code: z.string().optional(),
  details: z.any().optional(),
  retryAfter: z.number().optional(), // seconds
  retryable: z.boolean(),
  timestamp: z.number(),
});

// Type exports from schemas
export type AnalysisResult = z.infer<typeof AnalysisResultSchema>;
export type StreamingChunk = z.infer<typeof StreamingChunkSchema>;
export type CoverLetter = z.infer<typeof CoverLetterSchema>;
export type RealTimeFeedback = z.infer<typeof RealTimeFeedbackSchema>;
export type APIError = z.infer<typeof APIErrorSchema>;
export type ActionableRecommendation = z.infer<typeof ActionableRecommendationsSchema>[number];
export type DetailedScore = z.infer<typeof DetailedScoreSchema>;

/**
 * Validate and parse AI response
 * Throws ZodError with detailed validation errors if invalid
 */
export function validateAnalysisResult(data: unknown): AnalysisResult {
  return AnalysisResultSchema.parse(data);
}

/**
 * Safe parse that returns errors instead of throwing
 */
export function safeValidateAnalysisResult(data: unknown): {
  success: boolean;
  data?: AnalysisResult;
  error?: z.ZodError;
} {
  const result = AnalysisResultSchema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error };
}

/**
 * Validate streaming chunk
 */
export function validateStreamingChunk(data: unknown): StreamingChunk {
  return StreamingChunkSchema.parse(data);
}

/**
 * Validate cover letter response
 */
export function validateCoverLetter(data: unknown): CoverLetter {
  return CoverLetterSchema.parse(data);
}

/**
 * Validate real-time feedback
 */
export function validateRealTimeFeedback(data: unknown): RealTimeFeedback {
  return RealTimeFeedbackSchema.parse(data);
}

/**
 * Create a validated error response
 */
export function createAPIError(
  error: string,
  options: {
    code?: string;
    details?: any;
    retryAfter?: number;
    retryable?: boolean;
  } = {}
): APIError {
  return {
    error,
    code: options.code,
    details: options.details,
    retryAfter: options.retryAfter,
    retryable: options.retryable ?? false,
    timestamp: Date.now(),
  };
}
