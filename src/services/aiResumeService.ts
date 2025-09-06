// API service for AI Resume Analyzer
import { supabase } from '@/integrations/supabase/client';
import { config, validateEnvironment } from '@/config/environment';

export interface AnalysisRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  analysisType: 'comprehensive' | 'quick' | 'ats';
}

export interface AnalysisResult {
  overall_score?: number;
  ats_score?: number;
  match_percentage?: number;
  strengths?: Array<{
    category: string;
    description: string;
    impact: string;
    relevance_score: number;
  }>;
  areas_for_improvement?: Array<{
    category: string;
    description: string;
    priority: string;
    suggested_action: string;
  }>;
  keyword_analysis?: {
    matched_keywords: string[];
    missing_keywords: string[];
    keyword_density: number;
    optimization_suggestions: string[];
  };
  technical_skills_analysis?: {
    programming_languages: {
      matched: string[];
      missing: string[];
      proficiency_assessment: string;
    };
    frameworks_tools: {
      matched: string[];
      missing: string[];
      modern_stack_score: number;
    };
    cloud_devops: {
      matched: string[];
      missing: string[];
      maturity_score: number;
    };
  };
  recommendations?: {
    immediate_actions: string[];
    short_term_goals: string[];
    long_term_development: string[];
    additional_skills: string[];
  };
  salary_insights?: {
    estimated_range: string;
    negotiation_points: string[];
    market_positioning: string;
  };
  interview_preparation?: {
    likely_questions: string[];
    story_opportunities: string[];
    technical_prep: string[];
  };
  // Quick analysis fields
  top_strengths?: string[];
  immediate_improvements?: string[];
  quick_wins?: string[];
  // ATS analysis fields
  keyword_match?: number;
  formatting_score?: number;
  matched_keywords?: string[];
  missing_critical_keywords?: string[];
  formatting_issues?: string[];
  ats_optimization_tips?: string[];
}

class AIResumeService {
  private async callGeminiAPI(prompt: string): Promise<string> {
    const environment = validateEnvironment();
    
    // Use demo mode if environment is not properly configured
    if (environment.demoMode) {
      console.log('Running in demo mode - using sample analysis');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Return demo analysis based on analysis type
      if (prompt.includes('comprehensive')) {
        return JSON.stringify(config.demoMode.sampleAnalysis);
      } else if (prompt.includes('quick')) {
        return JSON.stringify({
          overall_score: config.demoMode.sampleAnalysis.overall_score,
          match_percentage: config.demoMode.sampleAnalysis.match_percentage,
          top_strengths: config.demoMode.sampleAnalysis.top_strengths,
          immediate_improvements: config.demoMode.sampleAnalysis.immediate_improvements,
          quick_wins: config.demoMode.sampleAnalysis.quick_wins
        });
      } else if (prompt.includes('ATS')) {
        return JSON.stringify({
          ats_score: config.demoMode.sampleAnalysis.ats_score,
          keyword_match: 78,
          formatting_score: 85,
          matched_keywords: config.demoMode.sampleAnalysis.matched_keywords,
          missing_critical_keywords: config.demoMode.sampleAnalysis.missing_critical_keywords,
          ats_optimization_tips: config.demoMode.sampleAnalysis.ats_optimization_tips
        });
      }
      
      return JSON.stringify(config.demoMode.sampleAnalysis);
    }

    try {
      // Production mode - call actual Supabase Edge Function
      const response = await supabase.functions.invoke('gemini-analyze', {
        body: { prompt }
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return response.data.analysis;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to analyze with AI');
    }
  }

  private extractJSONFromResponse(response: string): string {
    // Remove markdown code blocks and extract JSON
    const jsonMatch = response.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      return jsonMatch[1];
    }
    
    // If no code blocks, try to find JSON object
    const directJsonMatch = response.match(/\{[\s\S]*\}/);
    if (directJsonMatch) {
      return directJsonMatch[0];
    }
    
    // Return as-is if no patterns match
    return response.trim();
  }

  private generateContentHash(content: string): string {
    // Simple hash function for content deduplication
    let hash = 0;
    for (let i = 0; i < content.length; i++) {
      const char = content.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }

  private preprocessContent(text: string): string {
    // Clean and normalize text content from various document formats
    return text
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      // Remove multiple newlines
      .replace(/\n\s*\n/g, '\n')
      // Remove special characters that might confuse AI
      .replace(/[^\w\s\.\,\;\:\!\?\-\(\)\[\]\{\}\"\'\/\@\#\$\%\&\*\+\=\<\>\~\`\|\\\n]/g, ' ')
      // Normalize quotes
      .replace(/[""'']/g, '"')
      // Remove excessive punctuation
      .replace(/\.{2,}/g, '.')
      // Clean up common OCR/extraction artifacts
      .replace(/\s+([,.;:!?])/g, '$1')
      // Trim and ensure proper spacing
      .trim()
      .replace(/\s+/g, ' ');
  }

  private validateContent(resumeText: string, jobDescription: string): void {
    // Validate content quality and length
    if (!resumeText || resumeText.trim().length < 50) {
      throw new Error('Resume text is too short or empty. Please provide a complete resume.');
    }
    
    if (!jobDescription || jobDescription.trim().length < 20) {
      throw new Error('Job description is too short or empty. Please provide a complete job description.');
    }

    // Check for common extraction errors
    if (resumeText.includes('Error:') || resumeText.includes('Failed to')) {
      throw new Error('There was an error processing your document. Please try copying and pasting the text manually.');
    }

    // Check for minimum content requirements
    const hasContactInfo = /email|phone|contact/i.test(resumeText);
    const hasExperience = /experience|work|job|position|role/i.test(resumeText);
    const hasSkills = /skill|proficient|knowledge|familiar/i.test(resumeText);
    
    if (!hasContactInfo && !hasExperience && !hasSkills) {
      console.warn('Resume may be missing key sections - proceeding but accuracy may be affected');
    }
  }

  async analyzeResume(request: AnalysisRequest): Promise<AnalysisResult> {
    let { resumeText, jobDescription, jobTitle, companyName, analysisType } = request;

    // Preprocess and validate content
    resumeText = this.preprocessContent(resumeText);
    jobDescription = this.preprocessContent(jobDescription);
    
    this.validateContent(resumeText, jobDescription);

    // Generate content hash for deduplication
    const contentHash = this.generateContentHash(resumeText + jobDescription + analysisType);

    try {
      // Check for existing analysis based on content similarity
      const { data: existingAnalyses } = await supabase
        .from('resume_analyses')
        .select('analysis_results, overall_score, ats_compatibility, keyword_match')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Simple cache check - if exact same text exists recently
      if (existingAnalyses) {
        for (const existing of existingAnalyses) {
          if (JSON.stringify(existing.analysis_results).includes(contentHash.substring(0, 8))) {
            console.log('Using cached analysis');
            return existing.analysis_results as AnalysisResult;
          }
        }
      }

      let prompt = '';
      
      if (analysisType === 'comprehensive') {
        prompt = `You are an expert HR consultant and career coach. Perform a comprehensive analysis of the following resume against the job description.

IMPORTANT: The resume text may come from different document formats (PDF, DOCX, TXT, etc.). Please:
1. Ignore any formatting artifacts or extraction errors
2. Focus on the actual content and meaning
3. Be flexible with text layout and spacing issues
4. Extract key information even if formatting is imperfect

Resume Content:
${resumeText}

Job Description:
${jobDescription}

Job Title: ${jobTitle || 'Not specified'}
Company: ${companyName || 'Not specified'}

Provide a detailed analysis in the following JSON format. Ensure all values are realistic and based on the actual content provided:

Provide a comprehensive analysis in the following JSON format:
{
  "overall_score": <integer 0-100>,
  "match_percentage": <integer 0-100>,
  "ats_score": <integer 0-100>,
  "strengths": [
    {
      "category": "string",
      "description": "string",
      "impact": "High|Medium|Low",
      "relevance_score": <integer 0-100>
    }
  ],
  "areas_for_improvement": [
    {
      "category": "string",
      "description": "string",
      "priority": "High|Medium|Low",
      "suggested_action": "string"
    }
  ],
  "keyword_analysis": {
    "matched_keywords": ["array of strings"],
    "missing_keywords": ["array of strings"],
    "keyword_density": <float>,
    "optimization_suggestions": ["array of strings"]
  },
  "technical_skills_analysis": {
    "programming_languages": {
      "matched": ["array of strings"],
      "missing": ["array of strings"],
      "proficiency_assessment": "string"
    },
    "frameworks_tools": {
      "matched": ["array of strings"],
      "missing": ["array of strings"],
      "modern_stack_score": <integer 0-100>
    },
    "cloud_devops": {
      "matched": ["array of strings"],
      "missing": ["array of strings"],
      "maturity_score": <integer 0-100>
    }
  },
  "recommendations": {
    "immediate_actions": ["array of strings"],
    "short_term_goals": ["array of strings"],
    "long_term_development": ["array of strings"],
    "additional_skills": ["array of strings"]
  },
  "salary_insights": {
    "estimated_range": "string",
    "negotiation_points": ["array of strings"],
    "market_positioning": "string"
  },
  "interview_preparation": {
    "likely_questions": ["array of strings"],
    "story_opportunities": ["array of strings"],
    "technical_prep": ["array of strings"]
  }
}

Provide only the JSON response, no additional text.`;

      } else if (analysisType === 'quick') {
        prompt = `You are an expert resume reviewer. Perform a quick analysis of this resume against the job description.

IMPORTANT: The resume text may come from different document formats (PDF, DOCX, TXT, etc.). Please:
1. Ignore any formatting artifacts or extraction errors
2. Focus on the actual content and meaning
3. Be flexible with text layout and spacing issues

Resume Content:
${resumeText}

Job Description:
${jobDescription}

Provide a quick analysis in JSON format:
{
  "overall_score": <integer 0-100>,
  "match_percentage": <integer 0-100>,
  "top_strengths": ["array of 3-5 key strengths"],
  "immediate_improvements": ["array of 3-5 immediate improvements"],
  "quick_wins": ["array of 3-5 quick wins to improve the resume"]
}

Provide only the JSON response, no additional text.`;

      } else if (analysisType === 'ats') {
        prompt = `You are an ATS (Applicant Tracking System) expert. Analyze this resume for ATS compatibility against the job description.

IMPORTANT: The resume text may come from different document formats (PDF, DOCX, TXT, etc.). Please:
1. Ignore any formatting artifacts or extraction errors
2. Focus on keyword matching and content relevance
3. Be flexible with text layout and spacing issues
4. Extract keywords even if formatting is imperfect

Resume Content:
${resumeText}

Job Description:
${jobDescription}

Provide an ATS-focused analysis in JSON format:
{
  "ats_score": <integer 0-100>,
  "keyword_match": <integer 0-100>,
  "formatting_score": <integer 0-100>,
  "matched_keywords": ["array of matched keywords"],
  "missing_critical_keywords": ["array of missing keywords"],
  "formatting_issues": ["array of formatting problems"],
  "ats_optimization_tips": ["array of specific optimization tips"]
}

Provide only the JSON response, no additional text.`;
      }

      // Call Gemini API
      const aiResponse = await this.callGeminiAPI(prompt);
      
      // Parse the JSON response (handle markdown code blocks)
      let analysisResult: AnalysisResult;
      try {
        const cleanedResponse = this.extractJSONFromResponse(aiResponse);
        analysisResult = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw response:', aiResponse);
        throw new Error('Invalid AI response format');
      }

      // Save analysis to database using existing schema (skip in demo mode)
      const environment = validateEnvironment();
      if (!environment.demoMode) {
        const { data: { user } } = await supabase.auth.getUser();
        
        const { error: saveError } = await supabase
          .from('resume_analyses')
          .insert({
            user_id: user?.id || '',
            resume_text: resumeText,
            job_description: jobDescription,
            job_title: jobTitle,
            company_name: companyName,
            analysis_results: analysisResult as any,
            overall_score: analysisResult.overall_score || 0,
            ats_compatibility: analysisResult.ats_score || 0,
            keyword_match: analysisResult.keyword_match || 0,
            experience_relevance: analysisResult.match_percentage || 0,
            skills_alignment: analysisResult.match_percentage || 0,
            keywords_found: analysisResult.matched_keywords || [],
            missing_keywords: analysisResult.missing_critical_keywords || analysisResult.keyword_analysis?.missing_keywords || [],
            improvement_areas: analysisResult.immediate_improvements || [],
            suggestions: analysisResult.recommendations as any || {},
            detailed_feedback: analysisResult as any
          });

        if (saveError) {
          console.error('Failed to save analysis:', saveError);
          // Continue anyway, don't fail the request
        }
      }

      // Log analytics event
      await this.logAnalyticsEvent('analysis_created', {
        analysis_type: analysisType,
        has_job_title: !!jobTitle,
        has_company_name: !!companyName
      });

      return analysisResult;

    } catch (error) {
      console.error('Analysis error:', error);
      throw error;
    }
  }

  async generateCoverLetter(request: Omit<AnalysisRequest, 'analysisType'>): Promise<{ coverLetter: string }> {
    const { resumeText, jobDescription, jobTitle, companyName } = request;

    const prompt = `You are a professional career coach. Write a compelling, personalized cover letter based on the resume and job description.

Resume:
${resumeText}

Job Description:
${jobDescription}

Job Title: ${jobTitle || 'the position'}
Company: ${companyName || 'your company'}

Write a professional cover letter that:
1. Highlights relevant experience from the resume
2. Addresses specific requirements from the job description
3. Shows enthusiasm for the role and company
4. Is approximately 3-4 paragraphs
5. Uses a professional but engaging tone

Return only the cover letter text, no additional formatting or JSON.`;

    try {
      const coverLetter = await this.callGeminiAPI(prompt);
      
      // Log analytics
      await this.logAnalyticsEvent('cover_letter_generated', {
        has_job_title: !!jobTitle,
        has_company_name: !!companyName
      });

      return { coverLetter };
    } catch (error) {
      console.error('Cover letter generation error:', error);
      throw error;
    }
  }

  async generateTailoredResume(request: Omit<AnalysisRequest, 'analysisType'>): Promise<{ tailoredResume: string; optimizationApplied: string[] }> {
    const { resumeText, jobDescription, jobTitle, companyName } = request;

    const prompt = `You are a professional resume optimization expert. Tailor the resume to better match the job description while maintaining truthfulness.

Original Resume:
${resumeText}

Job Description:
${jobDescription}

Job Title: ${jobTitle || 'the position'}
Company: ${companyName || 'the company'}

Optimize the resume by:
1. Reordering sections to highlight most relevant experience
2. Adjusting language to match job description keywords
3. Emphasizing relevant skills and achievements
4. Adding relevant keywords naturally
5. Maintaining all factual information

Provide the response in this format:
OPTIMIZED_RESUME:
[The complete optimized resume text]

OPTIMIZATIONS_APPLIED:
- Optimization 1
- Optimization 2
- Optimization 3
...`;

    try {
      const response = await this.callGeminiAPI(prompt);
      
      // Parse the response
      const parts = response.split('OPTIMIZATIONS_APPLIED:');
      const tailoredResume = parts[0].replace('OPTIMIZED_RESUME:', '').trim();
      const optimizationsText = parts[1] || '';
      
      const optimizationApplied = optimizationsText
        .split('\n')
        .filter(line => line.trim().startsWith('-'))
        .map(line => line.replace('-', '').trim())
        .filter(Boolean);

      // Log analytics
      await this.logAnalyticsEvent('tailored_resume_generated', {
        has_job_title: !!jobTitle,
        has_company_name: !!companyName,
        optimizations_count: optimizationApplied.length
      });

      return { tailoredResume, optimizationApplied };
    } catch (error) {
      console.error('Tailored resume generation error:', error);
      throw error;
    }
  }

  private async logAnalyticsEvent(eventType: string, eventData: any = {}) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      await supabase.functions.invoke('log-analytics', {
        body: {
          event_type: eventType,
          event_data: eventData,
          user_id: user?.id,
          user_agent: navigator.userAgent,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('Analytics logging error:', error);
      // Don't throw, analytics shouldn't break the main functionality
    }
  }

  // Get user's analysis history
  async getUserAnalyses(limit: number = 10) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { data, error } = await supabase
        .from('resume_analyses')
        .select(`
          id,
          job_title,
          company_name,
          overall_score,
          ats_compatibility,
          keyword_match,
          created_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user analyses:', error);
      throw error;
    }
  }

  // Submit feedback for an analysis (store in analysis_results JSON for now)
  async submitFeedback(analysisId: string, rating: number, feedbackText?: string, feedbackType?: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Since we don't have a feedback table, we'll store it in the analysis_results
      const { data: analysis, error: fetchError } = await supabase
        .from('resume_analyses')
        .select('analysis_results')
        .eq('id', analysisId)
        .eq('user_id', user?.id)
        .single();

      if (fetchError) {
        throw fetchError;
      }

      const updatedResults = {
        ...(analysis.analysis_results as Record<string, any>),
        user_feedback: {
          rating,
          feedback_text: feedbackText,
          feedback_type: feedbackType,
          submitted_at: new Date().toISOString()
        }
      };

      const { error } = await supabase
        .from('resume_analyses')
        .update({ analysis_results: updatedResults })
        .eq('id', analysisId)
        .eq('user_id', user?.id);

      if (error) {
        throw error;
      }

      await this.logAnalyticsEvent('feedback_submitted', {
        analysis_id: analysisId,
        rating,
        has_text: !!feedbackText,
        feedback_type: feedbackType
      });

      return { success: true };
    } catch (error) {
      console.error('Error submitting feedback:', error);
      throw error;
    }
  }

  async generateSectionSuggestions(request: {
    sectionName: string;
    sectionContent: string;
    jobDescription: string;
    jobTitle?: string;
  }): Promise<string[]> {
    const { sectionName, sectionContent, jobDescription, jobTitle } = request;

    const prompt = `You are a professional resume writer. Provide 3-5 specific suggestions to improve this resume section for the target job.

Section: ${sectionName}
Current Content:
${sectionContent}

Target Job: ${jobTitle || 'position'}
Job Requirements:
${jobDescription}

Provide suggestions that:
1. Better align with job requirements
2. Include relevant keywords
3. Quantify achievements where possible
4. Improve ATS compatibility
5. Enhance professional impact

Return only an array of specific, actionable suggestions.`;

    try {
      const environment = validateEnvironment();
      
      if (environment.demoMode) {
        // Demo suggestions based on section type
        const demoSuggestions: {[key: string]: string[]} = {
          summary: [
            "Add specific years of experience relevant to the role",
            "Include 2-3 key technologies mentioned in the job description",
            "Quantify achievements with metrics (e.g., team size, project scope)",
            "Highlight leadership or mentoring experience",
            "Emphasize results and business impact"
          ],
          experience: [
            "Start bullet points with strong action verbs (Led, Developed, Implemented)",
            "Include specific metrics and percentages for achievements",
            "Add relevant technologies and tools mentioned in job posting",
            "Highlight cross-functional collaboration and teamwork",
            "Quantify scope of work (budget, timeline, team size)"
          ],
          skills: [
            "Group skills by category (Programming, Frameworks, Tools)",
            "Include proficiency levels for key technologies",
            "Add any missing skills from the job requirements",
            "Remove outdated or irrelevant technologies",
            "Highlight certifications and recent training"
          ],
          education: [
            "Include relevant coursework related to the job",
            "Add GPA if above 3.5 and recent graduate",
            "Mention any honors, awards, or relevant projects",
            "Include continuing education and certifications",
            "Highlight relevant extracurricular activities"
          ]
        };
        
        const sectionKey = Object.keys(demoSuggestions).find(key => 
          sectionName.toLowerCase().includes(key)
        );
        
        return demoSuggestions[sectionKey] || demoSuggestions.summary;
      }

      const { data, error } = await supabase.functions.invoke('gemini-analyze', {
        body: { prompt }
      });

      if (error) throw error;

      // Parse response to extract suggestions array
      const suggestions = data.analysis?.split('\n')
        .filter((line: string) => line.trim().length > 0)
        .map((line: string) => line.replace(/^\d+\.\s*/, '').trim())
        .slice(0, 5) || [];

      return suggestions;
    } catch (error) {
      console.error('Section suggestions generation error:', error);
      throw error;
    }
  }
}

export const aiResumeService = new AIResumeService();
