/**
 * Gemini AI Service - Secure Server-Side Implementation
 * 
 * This service routes all AI requests through Supabase Edge Functions
 * to keep API keys secure on the server side.
 * 
 * Features:
 * - Automatic retry with exponential backoff
 * - JSON mode for structured responses
 * - Comprehensive error handling
 * - Type-safe responses
 */

import { supabase } from '@/integrations/supabase/client';

// ============================================================================
// TYPES
// ============================================================================

export interface ResumeAnalysisResult {
  keywordMatches: {
    matched: string[];
    missing: string[];
    score: number;
  };
  gapAnalysis: {
    skillGaps: string[];
    experienceGaps: string[];
    recommendations: string[];
  };
  suggestions: {
    section: string;
    original: string;
    improved: string;
    reasoning: string;
  }[];
  overallScore: number;
  toneAnalysis: {
    currentTone: string;
    recommendedTone: string;
    readabilityScore: number;
  };
}

export interface JobAnalysisResult {
  keyRequirements: string[];
  preferredQualifications: string[];
  companyInfo: string;
  roleLevel: string;
  techStack: string[];
  responsibilities: string[];
  keywordDensity: { [key: string]: number };
}

export interface RewriteRequest {
  section: string;
  content: string;
  targetKeywords: string[];
  tone: 'professional' | 'conversational' | 'executive' | 'technical';
  context: string;
}

interface GeminiResponse {
  analysis: string;
  success: boolean;
  model?: string;
  timestamp?: string;
  error?: string;
  retryable?: boolean;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;
const REQUEST_TIMEOUT_MS = 60000; // 60 seconds

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Clean JSON response by removing markdown code blocks
 */
function cleanJsonResponse(text: string): string {
  return text
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim();
}

/**
 * Safely parse JSON with fallback
 */
function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    const cleaned = cleanJsonResponse(text);
    return JSON.parse(cleaned);
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

// ============================================================================
// GEMINI SERVICE CLASS
// ============================================================================

class GeminiService {
  private isInitialized: boolean = true;

  /**
   * Generate content using Gemini AI via Edge Function
   * Includes automatic retry with exponential backoff
   */
  private async generateContent(
    prompt: string, 
    options: { 
      type?: 'text' | 'json';
      temperature?: number;
      maxTokens?: number;
    } = {}
  ): Promise<string> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        console.log(`Gemini request attempt ${attempt}/${MAX_RETRIES}`);

        const { data, error } = await supabase.functions.invoke('gemini-analyze', {
          body: { 
            prompt,
            type: options.type || 'text',
            temperature: options.temperature,
            maxTokens: options.maxTokens
          }
        });

        if (error) {
          console.error('Edge Function error:', error);
          throw new Error(error.message || 'Failed to call AI service');
        }

        const response = data as GeminiResponse;

        if (!response.success) {
          // Check if error is retryable
          if (response.retryable === false) {
            throw new Error(response.error || 'AI service configuration error');
          }
          throw new Error(response.error || 'AI service returned an error');
        }

        if (!response.analysis) {
          throw new Error('Invalid response from AI service');
        }

        return response.analysis;

      } catch (error: any) {
        lastError = error;
        console.error(`Attempt ${attempt} failed:`, error.message);

        // Don't retry on non-retryable errors
        if (error.message?.includes('configuration') || 
            error.message?.includes('API key')) {
          throw error;
        }

        if (attempt < MAX_RETRIES) {
          const waitTime = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
          console.log(`Retrying in ${waitTime}ms...`);
          await delay(waitTime);
        }
      }
    }

    throw lastError || new Error('Failed to generate AI response after all retries');
  }

  /**
   * Analyze a job description to extract key information
   */
  async analyzeJobDescription(jobDescription: string): Promise<JobAnalysisResult> {
    const prompt = `You are a professional job market analyst. Analyze this job description and extract key information.

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "keyRequirements": ["requirement1", "requirement2", "..."],
  "preferredQualifications": ["qual1", "qual2", "..."],
  "companyInfo": "Brief company description if mentioned",
  "roleLevel": "entry|mid|senior|lead|executive",
  "techStack": ["technology1", "technology2", "..."],
  "responsibilities": ["resp1", "resp2", "..."],
  "keywordDensity": {"keyword1": 3, "keyword2": 2}
}

Job Description:
${jobDescription}

Analyze thoroughly and identify ALL technical skills, soft skills, certifications, and experience requirements. The keywordDensity should show how many times important terms appear.`;

    try {
      const response = await this.generateContent(prompt, { 
        type: 'json',
        temperature: 0.2 
      });
      
      return safeParseJSON<JobAnalysisResult>(response, {
        keyRequirements: [],
        preferredQualifications: [],
        companyInfo: '',
        roleLevel: 'mid',
        techStack: [],
        responsibilities: [],
        keywordDensity: {}
      });
    } catch (error) {
      console.error('Error analyzing job description:', error);
      throw error;
    }
  }

  /**
   * Analyze a resume against a job description
   */
  async analyzeResume(resumeText: string, jobDescription: string): Promise<ResumeAnalysisResult> {
    const prompt = `You are an expert ATS (Applicant Tracking System) and career coach. Analyze this resume against the job description.

IMPORTANT: Return ONLY a valid JSON object with this exact structure:
{
  "keywordMatches": {
    "matched": ["keyword1", "keyword2"],
    "missing": ["keyword3", "keyword4"],
    "score": 75
  },
  "gapAnalysis": {
    "skillGaps": ["gap1", "gap2"],
    "experienceGaps": ["gap1"],
    "recommendations": ["rec1", "rec2"]
  },
  "suggestions": [
    {
      "section": "Experience",
      "original": "original text snippet",
      "improved": "improved text",
      "reasoning": "why this improvement helps"
    }
  ],
  "overallScore": 75,
  "toneAnalysis": {
    "currentTone": "professional",
    "recommendedTone": "more action-oriented",
    "readabilityScore": 80
  }
}

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide actionable, specific suggestions. The overallScore should be 0-100 based on how well the resume matches the job.`;

    try {
      const response = await this.generateContent(prompt, { 
        type: 'json',
        temperature: 0.3
      });
      
      return safeParseJSON<ResumeAnalysisResult>(response, {
        keywordMatches: { matched: [], missing: [], score: 0 },
        gapAnalysis: { skillGaps: [], experienceGaps: [], recommendations: [] },
        suggestions: [],
        overallScore: 0,
        toneAnalysis: { currentTone: '', recommendedTone: '', readabilityScore: 0 }
      });
    } catch (error) {
      console.error('Error analyzing resume:', error);
      throw error;
    }
  }

  /**
   * Rewrite a resume section to be more impactful
   */
  async rewriteSection(request: RewriteRequest): Promise<string> {
    const prompt = `You are an expert resume writer specializing in ${request.tone} content.

TASK: Rewrite this ${request.section} section to be more impactful and ATS-optimized.

TARGET KEYWORDS TO INCORPORATE NATURALLY: ${request.targetKeywords.join(', ')}

CONTEXT: ${request.context}

ORIGINAL CONTENT:
${request.content}

REQUIREMENTS:
1. Start with strong action verbs
2. Include quantifiable achievements where possible
3. Naturally incorporate the target keywords
4. Maintain a ${request.tone} tone
5. Keep it concise but impactful
6. Optimize for ATS systems

IMPORTANT: Return ONLY the rewritten section text. No explanations, no JSON, no formatting - just the improved text.`;

    try {
      const response = await this.generateContent(prompt, { 
        type: 'text',
        temperature: 0.6
      });
      return response.trim();
    } catch (error) {
      console.error('Error rewriting section:', error);
      return request.content; // Return original if rewrite fails
    }
  }

  /**
   * Generate impactful bullet points for experience
   */
  async generateBulletPoints(experience: string, keywords: string[]): Promise<string[]> {
    const prompt = `You are an expert resume writer. Generate 3-5 impactful resume bullet points.

EXPERIENCE TO TRANSFORM:
${experience}

KEYWORDS TO INCORPORATE: ${keywords.join(', ')}

REQUIREMENTS:
- Start each bullet with a strong action verb (Led, Developed, Achieved, Implemented, etc.)
- Include quantifiable achievements (percentages, numbers, metrics) where possible
- Keep each bullet under 100 characters
- Naturally incorporate 1-2 relevant keywords per bullet
- Focus on impact and results, not just duties

IMPORTANT: Return ONLY a JSON array of strings:
["bullet1", "bullet2", "bullet3"]`;

    try {
      const response = await this.generateContent(prompt, { 
        type: 'json',
        temperature: 0.5
      });
      
      const bullets = safeParseJSON<string[]>(response, []);
      
      if (bullets.length === 0) {
        return [
          'Led cross-functional initiatives resulting in measurable improvements',
          'Implemented solutions that drove operational efficiency',
          'Collaborated with stakeholders to deliver key objectives on time'
        ];
      }
      
      return bullets;
    } catch (error) {
      console.error('Error generating bullet points:', error);
      return [
        'Led cross-functional initiatives resulting in measurable improvements',
        'Implemented solutions that drove operational efficiency',
        'Collaborated with stakeholders to deliver key objectives on time'
      ];
    }
  }

  /**
   * Suggest keywords based on job description and resume
   */
  async suggestKeywords(jobDescription: string, currentResume: string): Promise<{
    mustHave: string[];
    niceToHave: string[];
    industryTerms: string[];
  }> {
    const prompt = `You are an ATS optimization expert. Analyze the job description and resume to suggest keywords.

JOB DESCRIPTION:
${jobDescription}

CURRENT RESUME:
${currentResume}

TASK: Identify keywords the resume is missing that would improve ATS matching.

Return ONLY a valid JSON object:
{
  "mustHave": ["keyword1", "keyword2"],
  "niceToHave": ["keyword3", "keyword4"],
  "industryTerms": ["term1", "term2"]
}

- mustHave: Critical keywords from job requirements that MUST be in the resume
- niceToHave: Preferred qualifications keywords
- industryTerms: Industry-standard terminology the resume should include`;

    try {
      const response = await this.generateContent(prompt, { 
        type: 'json',
        temperature: 0.2
      });
      
      return safeParseJSON(response, {
        mustHave: [],
        niceToHave: [],
        industryTerms: []
      });
    } catch (error) {
      console.error('Error suggesting keywords:', error);
      return {
        mustHave: [],
        niceToHave: [],
        industryTerms: []
      };
    }
  }

  /**
   * Generate a professional summary based on resume and job
   */
  async generateProfessionalSummary(
    resumeText: string, 
    jobTitle: string, 
    targetKeywords: string[]
  ): Promise<string> {
    const prompt = `You are an expert resume writer. Generate a compelling professional summary.

CANDIDATE'S BACKGROUND (from resume):
${resumeText.substring(0, 2000)}

TARGET POSITION: ${jobTitle}

KEYWORDS TO INCORPORATE: ${targetKeywords.slice(0, 10).join(', ')}

Write a 3-4 sentence professional summary that:
1. Highlights years of experience and expertise
2. Showcases key achievements
3. Naturally includes 3-4 target keywords
4. Positions the candidate as ideal for the target role

IMPORTANT: Return ONLY the summary text. No explanations or formatting.`;

    try {
      const response = await this.generateContent(prompt, { 
        type: 'text',
        temperature: 0.6
      });
      return response.trim();
    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  /**
   * Check if the AI service is available
   */
  isServiceAvailable(): boolean {
    return this.isInitialized;
  }

  /**
   * Get service status for debugging
   */
  getServiceStatus(): { available: boolean; hasApiKey: boolean } {
    return {
      available: true,
      hasApiKey: true // API key is on server, always available if Edge Function works
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
