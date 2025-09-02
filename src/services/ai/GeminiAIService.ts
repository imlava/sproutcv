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
  tailoredResume?: string;
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

  async generateTailoredResume(
    resumeText: string, 
    jobDescription: string, 
    jobTitle?: string, 
    companyName?: string,
    userId?: string
  ): Promise<string> {
    console.log('🎯 Generating tailored resume with Gemini AI');

    try {
      const { data, error } = await supabase.functions.invoke('gemini-resume-analyzer', {
        body: {
          resumeText,
          jobDescription,
          jobTitle,
          companyName,
          analysisType: 'comprehensive',
          includeInteractive: false,
          includeCoverLetter: false,
          generateTailoredResume: true,
          userId
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Tailored resume generation failed');
      }

      return data.data.tailoredResume;

    } catch (error) {
      console.error('❌ Tailored resume generation error:', error);
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

  // Real-time feedback methods with actual AI analysis
  async getInstantFeedback(resumeText: string, section: 'skills' | 'experience' | 'summary'): Promise<{
    score: number;
    feedback: string;
    suggestions: string[];
  }> {
    try {
      // Call dedicated real-time feedback edge function
      const { data, error } = await supabase.functions.invoke('gemini-realtime-feedback', {
        body: {
          resumeText,
          section,
          analysisType: 'section_focus'
        }
      });

      if (error || !data?.success) {
        throw new Error(data?.error || 'Real-time feedback failed');
      }

      return data.feedback;

    } catch (error) {
      console.error('Real-time feedback error:', error);
      throw new Error(`AI feedback temporarily unavailable for ${section} section. Please try again.`);
    }
  }


  private extractSectionText(resumeText: string, section: string): string {
    const lines = resumeText.split('\n');
    const sectionKeywords = {
      skills: ['skill', 'technical', 'competenc', 'proficient'],
      experience: ['experience', 'employment', 'work', 'position', 'role'],
      summary: ['summary', 'objective', 'profile', 'overview']
    };
    
    const keywords = sectionKeywords[section as keyof typeof sectionKeywords] || [];
    const relevantLines = lines.filter(line => 
      keywords.some(keyword => line.toLowerCase().includes(keyword))
    );
    
    return relevantLines.length > 0 ? relevantLines.join('\n') : resumeText.substring(0, 500);
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

  // AI-powered utility methods for interactive features
  async explainScore(
    score: number, 
    category: string, 
    resumeText: string, 
    jobDescription: string
  ): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-resume-analyzer', {
        body: {
          resumeText: resumeText.substring(0, 1000),
          jobDescription: jobDescription.substring(0, 800),
          analysisType: 'quick',
          explainScore: { score, category }
        }
      });

      if (error || !data?.success) {
        throw new Error('Score explanation failed');
      }

      return data.explanation || `Your ${category} score of ${score}/100 reflects the AI analysis of content alignment, keyword relevance, and competitive positioning.`;
    } catch (error) {
      console.error('Score explanation error:', error);
      throw new Error(`Unable to explain ${category} score. Please try again.`);
    }
  }

  async suggestImprovements(
    category: string, 
    resumeText: string, 
    jobDescription: string
  ): Promise<string[]> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-resume-analyzer', {
        body: {
          resumeText: resumeText.substring(0, 1000),
          jobDescription: jobDescription.substring(0, 800),
          analysisType: 'quick',
          generateSuggestions: { category }
        }
      });

      if (error || !data?.success) {
        throw new Error('Suggestion generation failed');
      }

      return data.suggestions || [`Enhance ${category} with AI-generated recommendations`];
    } catch (error) {
      console.error('Suggestion generation error:', error);
      throw new Error(`Unable to generate ${category} suggestions. Please try again.`);
    }
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
