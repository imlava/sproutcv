/**
 * Gemini AI Service - Secure Server-Side Implementation
 * 
 * This service routes all AI requests through Supabase Edge Functions
 * to keep API keys secure on the server side.
 */

import { supabase } from '@/integrations/supabase/client';

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

class GeminiService {
  private isInitialized: boolean = true; // Always true since we use Edge Functions

  /**
   * Generate content using Gemini AI via Edge Function
   * API key is stored securely on the server
   */
  private async generateContent(prompt: string): Promise<string> {
    try {
      const { data, error } = await supabase.functions.invoke('gemini-analyze', {
        body: { prompt }
      });

      if (error) {
        console.error('Gemini Edge Function error:', error);
        throw new Error(error.message || 'Failed to generate AI response');
      }

      if (!data?.analysis) {
        throw new Error('Invalid response from AI service');
      }

      return data.analysis;
    } catch (error: any) {
      console.error('Gemini API error:', error);
      throw new Error(error.message || 'Failed to generate AI response. Please try again.');
    }
  }

  async analyzeJobDescription(jobDescription: string): Promise<JobAnalysisResult> {
    const prompt = `
    Analyze this job description and extract key information. Return a JSON object with the following structure:
    {
      "keyRequirements": ["requirement1", "requirement2"],
      "preferredQualifications": ["qual1", "qual2"],
      "companyInfo": "brief company description",
      "roleLevel": "entry/mid/senior/executive",
      "techStack": ["tech1", "tech2"],
      "responsibilities": ["resp1", "resp2"],
      "keywordDensity": {"keyword": frequency}
    }

    Job Description:
    ${jobDescription}

    Return ONLY valid JSON, no markdown formatting or code blocks.
    `;

    try {
      const response = await this.generateContent(prompt);
      // Clean the response - remove any markdown code blocks
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error analyzing job description:', error);
      // Return a default structure if parsing fails
      return {
        keyRequirements: [],
        preferredQualifications: [],
        companyInfo: '',
        roleLevel: 'mid',
        techStack: [],
        responsibilities: [],
        keywordDensity: {}
      };
    }
  }

  async analyzeResume(resumeText: string, jobDescription: string): Promise<ResumeAnalysisResult> {
    const prompt = `
    Analyze this resume against the job description. Return a JSON object with:
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
          "original": "original text",
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

    Resume:
    ${resumeText}

    Job Description:
    ${jobDescription}

    Return ONLY valid JSON, no markdown formatting or code blocks.
    `;

    try {
      const response = await this.generateContent(prompt);
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      return {
        keywordMatches: { matched: [], missing: [], score: 0 },
        gapAnalysis: { skillGaps: [], experienceGaps: [], recommendations: [] },
        suggestions: [],
        overallScore: 0,
        toneAnalysis: { currentTone: '', recommendedTone: '', readabilityScore: 0 }
      };
    }
  }

  async rewriteSection(request: RewriteRequest): Promise<string> {
    const prompt = `
    Rewrite this resume section to be more impactful. Use a ${request.tone} tone.
    
    Target keywords to incorporate: ${request.targetKeywords.join(', ')}
    
    Context: ${request.context}
    
    Original ${request.section}:
    ${request.content}
    
    Provide ONLY the rewritten section text, no explanations or formatting.
    Make it:
    1. More achievement-focused with quantifiable results
    2. ATS-optimized with natural keyword integration
    3. Action-verb driven
    4. Concise but impactful
    `;

    try {
      return await this.generateContent(prompt);
    } catch (error) {
      console.error('Error rewriting section:', error);
      return request.content; // Return original if rewrite fails
    }
  }

  async generateBulletPoints(experience: string, keywords: string[]): Promise<string[]> {
    const prompt = `
    Generate 3-5 impactful resume bullet points based on this experience.
    
    Experience: ${experience}
    Keywords to incorporate: ${keywords.join(', ')}
    
    Requirements:
    - Start each with a strong action verb
    - Include quantifiable achievements where possible
    - Keep each under 100 characters
    - Naturally incorporate relevant keywords
    
    Return ONLY a JSON array of strings, no explanations:
    ["bullet1", "bullet2", "bullet3"]
    `;

    try {
      const response = await this.generateContent(prompt);
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating bullet points:', error);
      return [
        'Led cross-functional initiatives resulting in improved outcomes',
        'Implemented strategic solutions driving operational efficiency',
        'Collaborated with stakeholders to deliver key objectives'
      ];
    }
  }

  async suggestKeywords(jobDescription: string, currentResume: string): Promise<{
    mustHave: string[];
    niceToHave: string[];
    industryTerms: string[];
  }> {
    const prompt = `
    Analyze the job description and resume to suggest keywords.
    
    Job Description: ${jobDescription}
    
    Current Resume: ${currentResume}
    
    Return a JSON object with keyword suggestions:
    {
      "mustHave": ["keyword1", "keyword2"],
      "niceToHave": ["keyword3", "keyword4"],
      "industryTerms": ["term1", "term2"]
    }
    
    Return ONLY valid JSON, no markdown.
    `;

    try {
      const response = await this.generateContent(prompt);
      const cleanedResponse = response
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error suggesting keywords:', error);
      return {
        mustHave: [],
        niceToHave: [],
        industryTerms: []
      };
    }
  }

  // Health check method - always returns true since we use Edge Functions
  isServiceAvailable(): boolean {
    return this.isInitialized;
  }

  // Get service status for debugging
  getServiceStatus(): { available: boolean; hasApiKey: boolean } {
    return {
      available: true,
      hasApiKey: true // API key is on the server, always available if Edge Function works
    };
  }
}

// Export singleton instance
export const geminiService = new GeminiService();
