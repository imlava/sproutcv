/**
 * Unified AI Service
 * Consolidates all AI-related functionality into a single, well-structured service
 * Provides resume analysis, tailoring, cover letter generation, and interview prep
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ResumeAnalysisRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  analysisType?: 'comprehensive' | 'quick' | 'ats_focus' | 'skills_gap';
  includeInteractive?: boolean;
  includeCoverLetter?: boolean;
  generateTailoredResume?: boolean;
}

export interface ResumeAnalysisResult {
  overallScore: number;
  detailedAnalysis: {
    keywordMatch: number;
    skillsAlignment: number;
    experienceRelevance: number;
    atsCompatibility: number;
    formatOptimization: number;
  };
  interactiveInsights: {
    strengthsAnalysis: StrengthItem[];
    improvementAreas: ImprovementItem[];
    missingKeywords: string[];
    suggestedKeywords: string[];
  };
  actionableRecommendations: RecommendationItem[];
  competitiveAnalysis: {
    marketPosition: string;
    standoutFactors: string[];
    competitivenessScore: number;
  };
  coverLetter?: CoverLetterResult;
  tailoredResume?: string;
  confidenceScore: number;
  processingVersion: string;
  timestamp: string;
}

export interface StrengthItem {
  category: string;
  score: number;
  details: string;
  examples: string[];
}

export interface ImprovementItem {
  priority: 'high' | 'medium' | 'low';
  category: string;
  issue: string;
  solution: string;
  impact: string;
}

export interface RecommendationItem {
  action: string;
  description: string;
  expectedImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
}

export interface CoverLetterResult {
  content: string;
  sections: {
    opening: string;
    body: string[];
    closing: string;
  };
  personalizations: string[];
}

export interface TailorResumeRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  targetKeywords?: string[];
  focusAreas?: string[];
}

export interface TailorResumeResult {
  tailoredResume: string;
  changes: {
    section: string;
    original: string;
    modified: string;
    reason: string;
  }[];
  addedKeywords: string[];
  improvementsSummary: string[];
}

export interface SectionRewriteRequest {
  sectionName: string;
  sectionContent: string;
  jobDescription: string;
  jobTitle?: string;
  targetKeywords?: string[];
  tone?: 'professional' | 'conversational' | 'executive' | 'technical';
}

export interface InterviewPrepRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
}

export interface InterviewQuestion {
  category: 'Technical' | 'Behavioral' | 'Situational' | 'Company-Specific';
  question: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tips: string[];
  sampleAnswer?: string;
  expectedDuration: string;
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

class UnifiedAIService {
  private static instance: UnifiedAIService;
  private isInitialized: boolean = false;
  private retryAttempts: number = 3;
  private retryDelay: number = 1000;

  private constructor() {
    this.initialize();
  }

  static getInstance(): UnifiedAIService {
    if (!UnifiedAIService.instance) {
      UnifiedAIService.instance = new UnifiedAIService();
    }
    return UnifiedAIService.instance;
  }

  private initialize(): void {
    // Check if Supabase is configured
    this.isInitialized = true;
  }

  // ============================================================================
  // RESUME ANALYSIS
  // ============================================================================

  /**
   * Comprehensive resume analysis against a job description
   */
  async analyzeResume(request: ResumeAnalysisRequest): Promise<ResumeAnalysisResult> {
    this.validateInput(request.resumeText, 'Resume text');
    this.validateInput(request.jobDescription, 'Job description');

    try {
      const { data, error } = await supabase.functions.invoke('gemini-resume-analyzer', {
        body: {
          resumeText: request.resumeText,
          jobDescription: request.jobDescription,
          jobTitle: request.jobTitle,
          companyName: request.companyName,
          analysisType: request.analysisType || 'comprehensive',
          includeInteractive: request.includeInteractive ?? true,
          includeCoverLetter: request.includeCoverLetter ?? false,
          generateTailoredResume: request.generateTailoredResume ?? false,
        },
      });

      if (error) {
        console.error('Analysis API error:', error);
        throw new AIServiceError(`Analysis failed: ${error.message}`, 'API_ERROR');
      }

      if (!data?.success) {
        throw new AIServiceError(data?.error || 'No analysis data returned', 'INVALID_RESPONSE');
      }

      return this.validateAndNormalizeAnalysisResult(data.data);
    } catch (error) {
      if (error instanceof AIServiceError) {
        throw error;
      }
      console.error('Resume analysis error:', error);
      throw new AIServiceError(
        'Failed to analyze resume. Please try again.',
        'ANALYSIS_FAILED',
        error
      );
    }
  }

  /**
   * Quick analysis for faster feedback
   */
  async quickAnalyze(resumeText: string, jobDescription: string): Promise<Partial<ResumeAnalysisResult>> {
    return this.analyzeResume({
      resumeText,
      jobDescription,
      analysisType: 'quick',
      includeInteractive: false,
    });
  }

  /**
   * ATS-focused analysis
   */
  async analyzeATS(resumeText: string, jobDescription: string): Promise<Partial<ResumeAnalysisResult>> {
    return this.analyzeResume({
      resumeText,
      jobDescription,
      analysisType: 'ats_focus',
      includeInteractive: true,
    });
  }

  // ============================================================================
  // RESUME TAILORING
  // ============================================================================

  /**
   * Generate a tailored resume for a specific job
   */
  async tailorResume(request: TailorResumeRequest): Promise<TailorResumeResult> {
    this.validateInput(request.resumeText, 'Resume text');
    this.validateInput(request.jobDescription, 'Job description');

    try {
      const { data, error } = await supabase.functions.invoke('gemini-resume-analyzer', {
        body: {
          resumeText: request.resumeText,
          jobDescription: request.jobDescription,
          jobTitle: request.jobTitle,
          companyName: request.companyName,
          generateTailoredResume: true,
        },
      });

      if (error) {
        throw new AIServiceError(`Tailoring failed: ${error.message}`, 'API_ERROR');
      }

      if (!data?.success || !data?.data?.tailoredResume) {
        throw new AIServiceError('Failed to generate tailored resume', 'INVALID_RESPONSE');
      }

      return {
        tailoredResume: data.data.tailoredResume,
        changes: [], // Would need to parse changes from AI response
        addedKeywords: data.data.interactiveInsights?.suggestedKeywords || [],
        improvementsSummary: data.data.actionableRecommendations?.map((r: any) => r.action) || [],
      };
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError('Failed to tailor resume', 'TAILOR_FAILED', error);
    }
  }

  /**
   * Rewrite a specific section of the resume
   */
  async rewriteSection(request: SectionRewriteRequest): Promise<string> {
    this.validateInput(request.sectionContent, 'Section content');
    this.validateInput(request.jobDescription, 'Job description');

    try {
      const { data, error } = await supabase.functions.invoke('gemini-analyze', {
        body: {
          prompt: this.buildSectionRewritePrompt(request),
        },
      });

      if (error) {
        throw new AIServiceError(`Section rewrite failed: ${error.message}`, 'API_ERROR');
      }

      return data?.analysis || request.sectionContent;
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      console.error('Section rewrite error:', error);
      // Return original content as fallback
      return request.sectionContent;
    }
  }

  // ============================================================================
  // COVER LETTER GENERATION
  // ============================================================================

  /**
   * Generate a personalized cover letter
   */
  async generateCoverLetter(
    resumeText: string,
    jobDescription: string,
    jobTitle?: string,
    companyName?: string
  ): Promise<CoverLetterResult> {
    this.validateInput(resumeText, 'Resume text');
    this.validateInput(jobDescription, 'Job description');

    try {
      const result = await this.analyzeResume({
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        analysisType: 'quick',
        includeCoverLetter: true,
      });

      if (!result.coverLetter) {
        throw new AIServiceError('Cover letter generation failed', 'INVALID_RESPONSE');
      }

      return result.coverLetter;
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      throw new AIServiceError('Failed to generate cover letter', 'COVER_LETTER_FAILED', error);
    }
  }

  // ============================================================================
  // INTERVIEW PREPARATION
  // ============================================================================

  /**
   * Generate interview preparation questions and tips
   */
  async generateInterviewPrep(request: InterviewPrepRequest): Promise<InterviewQuestion[]> {
    this.validateInput(request.resumeText, 'Resume text');
    this.validateInput(request.jobDescription, 'Job description');

    try {
      const { data, error } = await supabase.functions.invoke('gemini-analyze', {
        body: {
          prompt: this.buildInterviewPrepPrompt(request),
        },
      });

      if (error) {
        throw new AIServiceError(`Interview prep failed: ${error.message}`, 'API_ERROR');
      }

      // Parse the response
      try {
        const cleanedResponse = (data?.analysis || '').replace(/```json\n?|\n?```/g, '').trim();
        const questions = JSON.parse(cleanedResponse);
        return Array.isArray(questions) ? questions : [];
      } catch (parseError) {
        console.warn('Failed to parse interview questions, using fallback');
        return this.getDefaultInterviewQuestions(request.jobTitle);
      }
    } catch (error) {
      if (error instanceof AIServiceError) throw error;
      return this.getDefaultInterviewQuestions(request.jobTitle);
    }
  }

  // ============================================================================
  // KEYWORD ANALYSIS
  // ============================================================================

  /**
   * Extract and analyze keywords from resume and job description
   */
  async analyzeKeywords(
    resumeText: string,
    jobDescription: string
  ): Promise<{
    matched: string[];
    missing: string[];
    suggested: string[];
    density: number;
  }> {
    // Quick local keyword analysis for immediate feedback
    const jobKeywords = this.extractKeywords(jobDescription);
    const resumeKeywords = this.extractKeywords(resumeText);
    
    const matched = jobKeywords.filter(k => resumeKeywords.includes(k));
    const missing = jobKeywords.filter(k => !resumeKeywords.includes(k));
    
    return {
      matched,
      missing,
      suggested: missing.slice(0, 10), // Top 10 suggestions
      density: matched.length / Math.max(jobKeywords.length, 1),
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private validateInput(input: string | undefined, fieldName: string): void {
    if (!input || input.trim().length < 10) {
      throw new AIServiceError(`${fieldName} is required and must be at least 10 characters`, 'INVALID_INPUT');
    }
  }

  private validateAndNormalizeAnalysisResult(data: any): ResumeAnalysisResult {
    // Ensure all scores are within valid range
    const normalizeScore = (score: number): number => Math.max(0, Math.min(100, score || 0));

    return {
      overallScore: normalizeScore(data.overallScore),
      detailedAnalysis: {
        keywordMatch: normalizeScore(data.detailedAnalysis?.keywordMatch),
        skillsAlignment: normalizeScore(data.detailedAnalysis?.skillsAlignment),
        experienceRelevance: normalizeScore(data.detailedAnalysis?.experienceRelevance),
        atsCompatibility: normalizeScore(data.detailedAnalysis?.atsCompatibility),
        formatOptimization: normalizeScore(data.detailedAnalysis?.formatOptimization),
      },
      interactiveInsights: {
        strengthsAnalysis: data.interactiveInsights?.strengthsAnalysis || [],
        improvementAreas: data.interactiveInsights?.improvementAreas || [],
        missingKeywords: data.interactiveInsights?.missingKeywords || [],
        suggestedKeywords: data.interactiveInsights?.suggeredKeywords || data.interactiveInsights?.suggestedKeywords || [],
      },
      actionableRecommendations: data.actionableRecommendations || [],
      competitiveAnalysis: {
        marketPosition: data.competitiveAnalysis?.marketPosition || 'Analysis not available',
        standoutFactors: data.competitiveAnalysis?.standoutFactors || [],
        competitivenessScore: normalizeScore(data.competitiveAnalysis?.competitivenessScore),
      },
      coverLetter: data.coverLetter,
      tailoredResume: data.tailoredResume,
      confidenceScore: normalizeScore(data.confidenceScore || 85),
      processingVersion: data.processingVersion || 'unified-v1.0',
      timestamp: data.timestamp || new Date().toISOString(),
    };
  }

  private buildSectionRewritePrompt(request: SectionRewriteRequest): string {
    return `You are a professional resume writer. Rewrite this resume section to better match the job requirements.

Section: ${request.sectionName}
Original Content: ${request.sectionContent}
Target Keywords: ${request.targetKeywords?.join(', ') || 'None specified'}
Desired Tone: ${request.tone || 'professional'}
Job Title: ${request.jobTitle || 'Not specified'}

Job Description:
${request.jobDescription}

Guidelines:
1. Incorporate target keywords naturally
2. Use strong action verbs
3. Quantify achievements where possible
4. Make it ATS-friendly
5. Maintain truthfulness

Return ONLY the rewritten content without any explanation.`;
  }

  private buildInterviewPrepPrompt(request: InterviewPrepRequest): string {
    return `Based on this resume and job description, generate 6 likely interview questions.

Resume: ${request.resumeText.substring(0, 2000)}
Job: ${request.jobDescription.substring(0, 1500)}
Position: ${request.jobTitle || 'Not specified'}
Company: ${request.companyName || 'Not specified'}

Return as JSON array:
[
  {
    "category": "Technical|Behavioral|Situational|Company-Specific",
    "question": "question text",
    "difficulty": "Easy|Medium|Hard",
    "tips": ["tip1", "tip2"],
    "sampleAnswer": "brief sample answer structure",
    "expectedDuration": "2-3 minutes"
  }
]

Return only valid JSON.`;
  }

  private extractKeywords(text: string): string[] {
    const commonWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with',
      'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does',
      'will', 'would', 'could', 'should', 'may', 'might', 'must', 'can', 'this', 'that',
      'these', 'those', 'i', 'you', 'we', 'they', 'he', 'she', 'it', 'as', 'by', 'from',
      'about', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2 && !commonWords.has(word));

    return [...new Set(words)];
  }

  private getDefaultInterviewQuestions(jobTitle?: string): InterviewQuestion[] {
    return [
      {
        category: 'Behavioral',
        question: 'Tell me about a challenging project you worked on and how you handled it.',
        difficulty: 'Medium',
        tips: ['Use the STAR method', 'Be specific about your role', 'Highlight the outcome'],
        expectedDuration: '3-4 minutes',
      },
      {
        category: 'Technical',
        question: `What makes you qualified for this ${jobTitle || 'position'}?`,
        difficulty: 'Easy',
        tips: ['Align your skills with the job requirements', 'Give specific examples'],
        expectedDuration: '2-3 minutes',
      },
      {
        category: 'Situational',
        question: 'How do you handle tight deadlines and multiple priorities?',
        difficulty: 'Medium',
        tips: ['Describe your prioritization process', 'Give a real example'],
        expectedDuration: '2-3 minutes',
      },
    ];
  }

  // ============================================================================
  // STATUS & UTILITIES
  // ============================================================================

  /**
   * Check if the AI service is available
   */
  isAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status
   */
  getStatus(): { available: boolean; version: string } {
    return {
      available: this.isInitialized,
      version: 'unified-v1.0',
    };
  }
}

// ============================================================================
// ERROR CLASS
// ============================================================================

export class AIServiceError extends Error {
  code: string;
  originalError?: any;

  constructor(message: string, code: string, originalError?: any) {
    super(message);
    this.name = 'AIServiceError';
    this.code = code;
    this.originalError = originalError;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const unifiedAIService = UnifiedAIService.getInstance();
export default UnifiedAIService;
