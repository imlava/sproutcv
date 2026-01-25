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

// Fast Mode types for quick analysis
export interface FastModeScores {
  atsCompatibility: number;
  keywordMatch: number;
  impactScore: number;
  formatQuality: number;
  overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
  overallScore: number;
}

export interface FastModeImprovement {
  id: string;
  category: string;
  priority: 'high' | 'medium' | 'low';
  original: string;
  improved: string;
  impact: string;
}

export interface FastModeResult {
  scores: FastModeScores;
  improvements: FastModeImprovement[];
  processingTime: number;
  timestamp: string;
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
    return this.toBase64Unicode(key).replace(/[^a-zA-Z0-9]/g, '');
  }

  // Safely base64-encode Unicode strings
  private toBase64Unicode(str: string): string {
    const utf8 = encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, (_, p1) =>
      String.fromCharCode(parseInt(p1, 16))
    );
    return btoa(utf8);
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

  /**
   * Fast Mode Quick Analysis
   * Optimized for speed (<10 seconds) with instant scoring and improvements
   * Used for the Fast Mode feature - "polished resume in under 3 minutes"
   */
  async quickAnalyzeFastMode(
    resumeText: string,
    jobDescription: string = '',
    userId: string
  ): Promise<FastModeResult> {
    const startTime = Date.now();
    console.log('⚡ Starting Fast Mode quick analysis');

    try {
      // Build prompt for Gemini API
      const prompt = `Analyze this resume and provide a JSON response with scores and improvements.

RESUME:
${resumeText.substring(0, 4000)}

${jobDescription ? `JOB DESCRIPTION:\n${jobDescription.substring(0, 1500)}` : ''}

Respond ONLY with valid JSON in this exact format:
{
  "scores": {
    "atsCompatibility": <number 0-100>,
    "keywordMatch": <number 0-100>,
    "impactScore": <number 0-100>,
    "formatQuality": <number 0-100>
  },
  "improvements": [
    {
      "id": "1",
      "category": "Impact|Keywords|ATS|Format",
      "priority": "high|medium|low",
      "original": "brief description of issue",
      "improved": "specific suggestion for improvement",
      "impact": "+X% Score Name"
    }
  ]
}

Analyze for: ATS compatibility, keyword relevance, quantified achievements, action verbs, formatting quality.
Provide 3-5 specific, actionable improvements prioritized by impact.`;

      // Try to use Gemini API for analysis
      const { data, error } = await supabase.functions.invoke('gemini-analyze', {
        body: {
          prompt,
          type: 'json',
          temperature: 0.3,
          maxTokens: 2048
        }
      });

      if (error) {
        console.warn('Gemini API error, using local analysis:', error);
        return this.performLocalFastAnalysis(resumeText, jobDescription, startTime);
      }

      if (data?.success && data?.analysis) {
        const processingTime = Date.now() - startTime;
        console.log(`✅ Fast Mode analysis completed in ${processingTime}ms`);
        
        try {
          // Parse the AI response
          const aiResult = typeof data.analysis === 'string' 
            ? JSON.parse(data.analysis.replace(/```json\n?/gi, '').replace(/```\n?/gi, '').trim())
            : data.analysis;
          
          // Calculate overall score and grade
          const scores = aiResult.scores || this.calculateLocalScores(resumeText, jobDescription);
          const overallScore = Math.round(
            (scores.atsCompatibility + scores.keywordMatch + scores.impactScore + scores.formatQuality) / 4
          );
          
          let overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
          if (overallScore >= 85) overallGrade = 'A';
          else if (overallScore >= 70) overallGrade = 'B';
          else if (overallScore >= 55) overallGrade = 'C';
          else if (overallScore >= 40) overallGrade = 'D';
          else overallGrade = 'F';

          return {
            scores: {
              ...scores,
              overallScore,
              overallGrade
            },
            improvements: aiResult.improvements || this.generateLocalImprovements(resumeText),
            processingTime,
            timestamp: new Date().toISOString()
          };
        } catch (parseError) {
          console.warn('Failed to parse AI response, using local analysis:', parseError);
          return this.performLocalFastAnalysis(resumeText, jobDescription, startTime);
        }
      }

      // Fallback to local analysis
      return this.performLocalFastAnalysis(resumeText, jobDescription, startTime);

    } catch (error) {
      console.error('Fast Mode analysis error, using fallback:', error);
      return this.performLocalFastAnalysis(resumeText, jobDescription, startTime);
    }
  }

  /**
   * Local fast analysis fallback
   * Provides instant results when API is unavailable
   */
  private performLocalFastAnalysis(
    resumeText: string,
    jobDescription: string,
    startTime: number
  ): FastModeResult {
    const scores = this.calculateLocalScores(resumeText, jobDescription);
    const improvements = this.generateLocalImprovements(resumeText);
    
    return {
      scores,
      improvements,
      processingTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate scores locally for instant feedback
   */
  private calculateLocalScores(resumeText: string, jobDescription: string): FastModeScores {
    const text = resumeText.toLowerCase();
    const job = jobDescription.toLowerCase();
    
    // Word count analysis
    const wordCount = resumeText.split(/\s+/).filter(w => w).length;
    
    // Check for key resume elements
    const hasQuantifiedAchievements = /\d+%|\$[\d,]+|\d+\s*(years?|months?|projects?|clients?|users?|team|members?)/i.test(resumeText);
    const hasActionVerbs = /(led|managed|developed|created|implemented|achieved|increased|decreased|improved|delivered|designed|built|launched|spearheaded|drove|orchestrated)/i.test(resumeText);
    const hasSections = /(experience|education|skills|summary|objective|professional|qualifications)/i.test(resumeText);
    const hasContact = /(email|phone|linkedin|github|portfolio|@)/i.test(resumeText);
    
    // ATS compatibility score
    let atsScore = 50;
    if (hasSections) atsScore += 20;
    if (hasContact) atsScore += 15;
    if (wordCount >= 200 && wordCount <= 800) atsScore += 10;
    atsScore = Math.min(95, atsScore + Math.floor(Math.random() * 5));

    // Keyword match score
    let keywordScore = 40;
    if (jobDescription) {
      const jobKeywords: string[] = job.match(/\b\w{4,}\b/g) || [];
      const resumeKeywords: string[] = text.match(/\b\w{4,}\b/g) || [];
      const matchCount = jobKeywords.filter((kw: string) => resumeKeywords.includes(kw)).length;
      keywordScore = Math.min(90, 40 + (matchCount / Math.max(1, jobKeywords.length)) * 50);
    } else {
      keywordScore = 45 + Math.floor(Math.random() * 15);
    }

    // Impact score
    let impactScore = 35;
    if (hasQuantifiedAchievements) impactScore += 30;
    if (hasActionVerbs) impactScore += 20;
    const numbersCount = (resumeText.match(/\d+/g) || []).length;
    impactScore += Math.min(15, numbersCount * 2);
    impactScore = Math.min(95, impactScore);

    // Format quality score
    let formatScore = 50;
    if (hasSections) formatScore += 15;
    if (wordCount >= 150 && wordCount <= 900) formatScore += 15;
    const lineBreaks = (resumeText.match(/\n/g) || []).length;
    if (lineBreaks >= 10 && lineBreaks <= 100) formatScore += 10;
    formatScore = Math.min(90, formatScore + Math.floor(Math.random() * 5));

    // Overall score
    const overallScore = Math.round((atsScore + keywordScore + impactScore + formatScore) / 4);

    // Determine grade
    let overallGrade: 'A' | 'B' | 'C' | 'D' | 'F';
    if (overallScore >= 85) overallGrade = 'A';
    else if (overallScore >= 70) overallGrade = 'B';
    else if (overallScore >= 55) overallGrade = 'C';
    else if (overallScore >= 40) overallGrade = 'D';
    else overallGrade = 'F';

    return {
      atsCompatibility: Math.round(atsScore),
      keywordMatch: Math.round(keywordScore),
      impactScore: Math.round(impactScore),
      formatQuality: Math.round(formatScore),
      overallGrade,
      overallScore
    };
  }

  /**
   * Generate improvement suggestions locally
   */
  private generateLocalImprovements(resumeText: string): FastModeImprovement[] {
    const improvements: FastModeImprovement[] = [];
    const text = resumeText.toLowerCase();
    
    // Check for common improvement areas
    if (!/\d+%|\$[\d,]+/.test(resumeText)) {
      improvements.push({
        id: 'imp_1',
        category: 'Impact',
        priority: 'high',
        original: 'Achievements without metrics',
        improved: 'Add quantified results like "increased sales by 25%" or "reduced costs by $50K"',
        impact: '+15% Impact Score'
      });
    }

    if (!/(led|managed|spearheaded|drove)/i.test(resumeText)) {
      improvements.push({
        id: 'imp_2',
        category: 'Impact',
        priority: 'high',
        original: 'Passive language in experience',
        improved: 'Use strong action verbs like "Led", "Spearheaded", "Drove", "Orchestrated"',
        impact: '+10% Impact Score'
      });
    }

    if (!/(skill|proficient|expert)/i.test(text)) {
      improvements.push({
        id: 'imp_3',
        category: 'Keywords',
        priority: 'high',
        original: 'Missing dedicated skills section',
        improved: 'Add a clear "Skills" section with relevant technical and soft skills',
        impact: '+12% ATS Score'
      });
    }

    if (!/(summary|objective|profile)/i.test(text)) {
      improvements.push({
        id: 'imp_4',
        category: 'Format',
        priority: 'medium',
        original: 'No professional summary',
        improved: 'Add a 2-3 sentence professional summary highlighting key achievements and expertise',
        impact: '+8% Format Quality'
      });
    }

    if (!/(linkedin|github|portfolio)/i.test(text)) {
      improvements.push({
        id: 'imp_5',
        category: 'ATS',
        priority: 'medium',
        original: 'Missing professional links',
        improved: 'Add LinkedIn profile URL and relevant portfolio/GitHub links',
        impact: '+5% ATS Score'
      });
    }

    // Always include some general improvements
    if (improvements.length < 3) {
      improvements.push({
        id: 'imp_generic_1',
        category: 'Keywords',
        priority: 'medium',
        original: 'Generic job titles',
        improved: 'Use industry-standard job titles that match target positions',
        impact: '+8% Keyword Match'
      });
    }

    if (improvements.length < 4) {
      improvements.push({
        id: 'imp_generic_2',
        category: 'Format',
        priority: 'low',
        original: 'Inconsistent formatting',
        improved: 'Ensure consistent date formats, bullet styles, and spacing throughout',
        impact: '+5% Format Quality'
      });
    }

    return improvements;
  }

  /**
   * Apply improvements to resume text
   * Returns improved version of the resume
   */
  async applyFastModeImprovements(
    resumeText: string,
    improvements: FastModeImprovement[],
    userId: string
  ): Promise<string> {
    console.log('🔧 Applying Fast Mode improvements');

    // For now, return the original text since improvements are suggestions
    // In a full implementation, this would use AI to rewrite sections
    // The improvements are displayed to the user for manual application
    
    // Note: Applying text improvements automatically requires complex
    // text manipulation. For now, we track that improvements were reviewed.
    console.log(`User reviewed ${improvements.length} improvements`);
    
    return resumeText;
  }
}
