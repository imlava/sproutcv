import { supabase } from '@/integrations/supabase/client';

export interface InteractiveAnalysisRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  analysisType?: 'comprehensive' | 'quick' | 'ats_focus' | 'skills_gap';
  includeInteractive?: boolean;
  includeCoverLetter?: boolean;
}

export interface InteractiveInsights {
  strengthsAnalysis: Array<{
    category: string;
    score: number;
    details: string;
    examples: string[];
  }>;
  improvementAreas: Array<{
    priority: 'high' | 'medium' | 'low';
    category: string;
    issue: string;
    solution: string;
    impact: string;
  }>;
  missingKeywords: string[];
  suggeredKeywords: string[];
}

export interface CoverLetter {
  content: string;
  sections: {
    opening: string;
    body: string[];
    closing: string;
  };
  personalizations: string[];
}

export interface ActionableRecommendation {
  action: string;
  description: string;
  expectedImpact: string;
  difficulty: 'easy' | 'medium' | 'hard';
  timeEstimate: string;
}

export interface CompetitiveAnalysis {
  marketPosition: string;
  standoutFactors: string[];
  competitivenessScore: number;
}

export interface GeminiAnalysisResult {
  overallScore: number;
  detailedAnalysis: {
    keywordMatch: number;
    skillsAlignment: number;
    experienceRelevance: number;
    atsCompatibility: number;
    formatOptimization: number;
  };
  interactiveInsights: InteractiveInsights;
  coverLetter?: CoverLetter;
  actionableRecommendations: ActionableRecommendation[];
  competitiveAnalysis: CompetitiveAnalysis;
  confidenceScore: number;
  processingVersion: string;
  timestamp: string;
}

export class GeminiAIService {
  private static instance: GeminiAIService;
  private cache = new Map<string, GeminiAnalysisResult>();
  private readonly CACHE_TTL = 30 * 60 * 1000; // 30 minutes

  static getInstance(): GeminiAIService {
    if (!GeminiAIService.instance) {
      GeminiAIService.instance = new GeminiAIService();
    }
    return GeminiAIService.instance;
  }

  async analyzeResumeInteractive(request: InteractiveAnalysisRequest, userId: string): Promise<GeminiAnalysisResult> {
    console.log('🧠 Starting Gemini AI interactive analysis');
    
    // Generate cache key
    const cacheKey = this.generateCacheKey(request);
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)!;
      if (Date.now() - new Date(cached.timestamp).getTime() < this.CACHE_TTL) {
        console.log('📋 Cache hit for Gemini analysis');
        return cached;
      } else {
        this.cache.delete(cacheKey);
      }
    }

    try {
      // Call Gemini analysis function
      const { data, error } = await supabase.functions.invoke('gemini-resume-analyzer', {
        body: {
          ...request,
          userId
        }
      });

      if (error) {
        throw new Error(`Gemini analysis failed: ${error.message}`);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Analysis failed');
      }

      const result: GeminiAnalysisResult = data.data;
      
      // Cache the result
      this.cache.set(cacheKey, result);
      
      // Clean old cache entries
      this.cleanCache();

      console.log('✅ Gemini analysis completed successfully');
      return result;

    } catch (error) {
      console.error('❌ Gemini analysis error:', error);
      throw error;
    }
  }

  async generateCoverLetter(
    resumeText: string, 
    jobDescription: string, 
    jobTitle?: string, 
    companyName?: string,
    userId?: string
  ): Promise<CoverLetter> {
    console.log('📝 Generating cover letter with Gemini AI');

    try {
      const result = await this.analyzeResumeInteractive({
        resumeText,
        jobDescription,
        jobTitle,
        companyName,
        analysisType: 'comprehensive',
        includeInteractive: false,
        includeCoverLetter: true
      }, userId || '');

      if (!result.coverLetter) {
        throw new Error('Cover letter generation failed');
      }

      return result.coverLetter;

    } catch (error) {
      console.error('❌ Cover letter generation error:', error);
      throw error;
    }
  }

  async getQuickAnalysis(
    resumeText: string, 
    jobDescription: string, 
    userId: string
  ): Promise<GeminiAnalysisResult> {
    return this.analyzeResumeInteractive({
      resumeText,
      jobDescription,
      analysisType: 'quick',
      includeInteractive: true,
      includeCoverLetter: false
    }, userId);
  }

  async getSkillsGapAnalysis(
    resumeText: string, 
    jobDescription: string, 
    userId: string
  ): Promise<InteractiveInsights> {
    const result = await this.analyzeResumeInteractive({
      resumeText,
      jobDescription,
      analysisType: 'skills_gap',
      includeInteractive: true,
      includeCoverLetter: false
    }, userId);

    return result.interactiveInsights;
  }

  async getATSOptimizationSuggestions(
    resumeText: string, 
    jobDescription: string, 
    userId: string
  ): Promise<ActionableRecommendation[]> {
    const result = await this.analyzeResumeInteractive({
      resumeText,
      jobDescription,
      analysisType: 'ats_focus',
      includeInteractive: true,
      includeCoverLetter: false
    }, userId);

    return result.actionableRecommendations;
  }

  async getCompetitiveAnalysis(
    resumeText: string, 
    jobDescription: string, 
    userId: string
  ): Promise<CompetitiveAnalysis> {
    const result = await this.analyzeResumeInteractive({
      resumeText,
      jobDescription,
      analysisType: 'comprehensive',
      includeInteractive: true,
      includeCoverLetter: false
    }, userId);

    return result.competitiveAnalysis;
  }

  // Real-time feedback methods
  async getInstantFeedback(resumeText: string, section: 'skills' | 'experience' | 'summary'): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    // Quick analysis for real-time feedback
    try {
      const prompt = this.createInstantFeedbackPrompt(resumeText, section);
      
      // For demo purposes, return mock data
      // In production, this would call a lightweight Gemini endpoint
      return {
        score: Math.floor(Math.random() * 30) + 70, // 70-100
        feedback: `Your ${section} section shows good ${section === 'skills' ? 'technical competencies' : section === 'experience' ? 'professional progression' : 'career focus'}.`,
        suggestions: [
          `Consider adding more ${section === 'skills' ? 'industry-specific skills' : section === 'experience' ? 'quantified achievements' : 'compelling value propositions'}`,
          `Optimize for ATS by including relevant keywords`,
          `Strengthen impact statements with metrics`
        ]
      };
    } catch (error) {
      console.error('Instant feedback error:', error);
      return {
        score: 75,
        feedback: 'Analysis in progress...',
        suggestions: ['Continue editing for real-time feedback']
      };
    }
  }

  private generateCacheKey(request: InteractiveAnalysisRequest): string {
    const key = `${request.resumeText.substring(0, 100)}_${request.jobDescription.substring(0, 100)}_${request.analysisType}`;
    return btoa(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  private cleanCache(): void {
    const now = Date.now();
    for (const [key, result] of this.cache.entries()) {
      if (now - new Date(result.timestamp).getTime() > this.CACHE_TTL) {
        this.cache.delete(key);
      }
    }
  }

  private createInstantFeedbackPrompt(resumeText: string, section: string): string {
    return `Analyze the ${section} section of this resume and provide instant feedback:

${resumeText}

Focus on the ${section} and provide:
1. A score (0-100)
2. Brief feedback
3. 2-3 quick suggestions

Keep response concise for real-time feedback.`;
  }

  // Utility methods for interactive features
  async explainScore(
    score: number, 
    category: string, 
    resumeText: string, 
    jobDescription: string
  ): Promise<string> {
    // Generate detailed explanation for why a score was given
    return `Your ${category} score of ${score}/100 is based on the alignment between your resume content and the job requirements. This score considers keyword matching, skill relevance, and experience depth.`;
  }

  async suggestImprovements(
    category: string, 
    resumeText: string, 
    jobDescription: string
  ): Promise<string[]> {
    // Generate specific improvement suggestions
    return [
      `Add more ${category}-related keywords from the job description`,
      `Quantify your achievements with specific metrics`,
      `Include industry-specific terminology`,
      `Optimize formatting for ATS compatibility`
    ];
  }

  // Batch processing for multiple job applications
  async analyzeBatch(
    resumeText: string, 
    jobDescriptions: Array<{id: string, description: string, title?: string, company?: string}>,
    userId: string
  ): Promise<Array<{id: string, analysis: GeminiAnalysisResult}>> {
    const results = [];
    
    for (const job of jobDescriptions) {
      try {
        const analysis = await this.analyzeResumeInteractive({
          resumeText,
          jobDescription: job.description,
          jobTitle: job.title,
          companyName: job.company,
          analysisType: 'quick',
          includeInteractive: false,
          includeCoverLetter: false
        }, userId);
        
        results.push({
          id: job.id,
          analysis
        });
      } catch (error) {
        console.error(`Batch analysis failed for job ${job.id}:`, error);
        // Continue with other jobs
      }
    }
    
    return results;
  }
}
