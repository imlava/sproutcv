import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';

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
  private genAI: GoogleGenerativeAI;
  private model: GenerativeModel;
  private isInitialized: boolean = false;

  constructor() {
    const apiKey = import.meta.env.VITE_GOOGLE_AI_API_KEY || import.meta.env.GOOGLE_AI_API_KEY;
    
    if (!apiKey) {
      console.warn('Google AI API key not found. Gemini features will be limited.');
      return;
    }

    try {
      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ 
        model: "gemini-1.5-pro",
        generationConfig: {
          temperature: 0.7,
          topP: 0.8,
          topK: 40,
          maxOutputTokens: 4096,
        },
      });
      this.isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize Gemini AI:', error);
    }
  }

  private async generateContent(prompt: string): Promise<string> {
    if (!this.isInitialized) {
      throw new Error('Gemini AI service is not properly initialized');
    }

    try {
      const result = await this.model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Gemini API error:', error);
      throw new Error('Failed to generate AI response. Please try again.');
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

    Focus on extracting:
    1. Must-have technical skills and experience
    2. Nice-to-have qualifications
    3. Company culture and values
    4. Seniority level indicators
    5. Technology stack mentioned
    6. Key responsibilities and duties
    7. Important keywords and their frequency

    Return only valid JSON without markdown formatting.
    `;

    try {
      const response = await this.generateContent(prompt);
      // Clean the response to ensure it's valid JSON
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error analyzing job description:', error);
      // Return fallback data
      return {
        keyRequirements: ['Experience in relevant field', 'Strong communication skills'],
        preferredQualifications: ['Additional experience preferred'],
        companyInfo: 'Company information not available',
        roleLevel: 'mid',
        techStack: [],
        responsibilities: ['Perform assigned duties', 'Collaborate with team'],
        keywordDensity: {}
      };
    }
  }

  async analyzeResume(resumeText: string, jobDescription: string): Promise<ResumeAnalysisResult> {
    const prompt = `
    Analyze this resume against the job description and provide detailed feedback. Return a JSON object with this structure:
    {
      "keywordMatches": {
        "matched": ["keyword1", "keyword2"],
        "missing": ["missing1", "missing2"],
        "score": 75
      },
      "gapAnalysis": {
        "skillGaps": ["gap1", "gap2"],
        "experienceGaps": ["exp1", "exp2"],
        "recommendations": ["rec1", "rec2"]
      },
      "suggestions": [
        {
          "section": "Experience",
          "original": "original text",
          "improved": "improved text",
          "reasoning": "why this is better"
        }
      ],
      "overallScore": 78,
      "toneAnalysis": {
        "currentTone": "formal",
        "recommendedTone": "professional",
        "readabilityScore": 85
      }
    }

    Resume Text:
    ${resumeText}

    Job Description:
    ${jobDescription}

    Provide:
    1. Keyword matching analysis with percentage score
    2. Identify skill and experience gaps
    3. Specific improvement suggestions for each section
    4. Overall compatibility score (0-100)
    5. Tone and readability analysis
    6. Actionable recommendations

    Return only valid JSON without markdown formatting.
    `;

    try {
      const response = await this.generateContent(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error analyzing resume:', error);
      // Return fallback data
      return {
        keywordMatches: {
          matched: ['Experience', 'Skills'],
          missing: ['Leadership', 'Communication'],
          score: 65
        },
        gapAnalysis: {
          skillGaps: ['Modern frameworks', 'Cloud platforms'],
          experienceGaps: ['Senior level experience'],
          recommendations: ['Add more quantified achievements', 'Highlight leadership experience']
        },
        suggestions: [],
        overallScore: 65,
        toneAnalysis: {
          currentTone: 'formal',
          recommendedTone: 'professional',
          readabilityScore: 75
        }
      };
    }
  }

  async rewriteSection(request: RewriteRequest): Promise<string> {
    const prompt = `
    Rewrite this resume section to better match the job requirements while maintaining authenticity.

    Section: ${request.section}
    Original Content: ${request.content}
    Target Keywords: ${request.targetKeywords.join(', ')}
    Desired Tone: ${request.tone}
    Context: ${request.context}

    Guidelines:
    1. Incorporate target keywords naturally
    2. Maintain the ${request.tone} tone
    3. Use action verbs and quantifiable achievements
    4. Keep the core truth of the original content
    5. Make it ATS-friendly
    6. Improve readability and impact

    Return only the rewritten content without any explanation or markdown formatting.
    `;

    try {
      const response = await this.generateContent(prompt);
      return response.trim();
    } catch (error) {
      console.error('Error rewriting section:', error);
      // Return the original content as fallback
      return request.content;
    }
  }

  async generateAchievementPrompts(experienceText: string): Promise<string[]> {
    const prompt = `
    Analyze this work experience and suggest specific questions to help quantify achievements:

    Experience: ${experienceText}

    Generate 3-5 specific questions that would help the person add measurable achievements and impact metrics.
    Focus on:
    1. Quantifiable results (numbers, percentages, savings)
    2. Process improvements
    3. Team impact
    4. Business outcomes
    5. Efficiency gains

    Return as a JSON array of question strings.
    Example: ["How much did you increase sales by?", "How many team members did you manage?"]

    Return only the JSON array without markdown formatting.
    `;

    try {
      const response = await this.generateContent(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating achievement prompts:', error);
      return [
        'What specific results did you achieve in this role?',
        'How did you measure success in your projects?',
        'What was the impact of your work on the team or company?'
      ];
    }
  }

  async generateInterviewQuestions(jobDescription: string, resumeText: string): Promise<any[]> {
    const prompt = `
    Based on this job description and resume, generate relevant interview questions the candidate should prepare for:

    Job Description: ${jobDescription}
    Resume: ${resumeText}

    Generate 5-7 questions in this JSON format:
    [
      {
        "category": "Technical|Behavioral|Situational",
        "question": "question text",
        "difficulty": "Easy|Medium|Hard",
        "tips": ["tip1", "tip2", "tip3"],
        "expectedDuration": "2-3 minutes"
      }
    ]

    Focus on:
    1. Role-specific technical questions
    2. Behavioral questions based on their experience
    3. Situational questions for the target role
    4. Questions that test the required skills

    Return only valid JSON without markdown formatting.
    `;

    try {
      const response = await this.generateContent(prompt);
      const cleanedResponse = response.replace(/```json\n?|\n?```/g, '').trim();
      return JSON.parse(cleanedResponse);
    } catch (error) {
      console.error('Error generating interview questions:', error);
      return [
        {
          category: 'Behavioral',
          question: 'Tell me about a challenging project you worked on.',
          difficulty: 'Medium',
          tips: ['Use the STAR method', 'Be specific about your role', 'Highlight the outcome'],
          expectedDuration: '3-4 minutes'
        }
      ];
    }
  }

  // Health check method
  isServiceAvailable(): boolean {
    return this.isInitialized;
  }

  // Get service status for debugging
  getServiceStatus(): { available: boolean; hasApiKey: boolean } {
    const hasApiKey = !!(import.meta.env.VITE_GOOGLE_AI_API_KEY || import.meta.env.GOOGLE_AI_API_KEY);
    return {
      available: this.isInitialized,
      hasApiKey
    };
  }
}

export const geminiService = new GeminiService();
export default geminiService;
