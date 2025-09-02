import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Gemini API Configuration
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent";

interface AnalysisRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  userId?: string;
  analysisType?: 'comprehensive' | 'quick' | 'ats_focus' | 'skills_gap';
  includeInteractive?: boolean;
  includeCoverLetter?: boolean;
  generateTailoredResume?: boolean;
}

interface AnalysisResult {
  overallScore: number;
  detailedAnalysis: {
    keywordMatch: number;
    skillsAlignment: number;
    experienceRelevance: number;
    atsCompatibility: number;
    formatOptimization: number;
  };
  interactiveInsights: {
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
  };
  coverLetter?: {
    content: string;
    sections: {
      opening: string;
      body: string[];
      closing: string;
    };
    personalizations: string[];
  };
  tailoredResume?: string;
  actionableRecommendations: Array<{
    action: string;
    description: string;
    expectedImpact: string;
    difficulty: 'easy' | 'medium' | 'hard';
    timeEstimate: string;
  }>;
  competitiveAnalysis: {
    marketPosition: string;
    standoutFactors: string[];
    competitivenessScore: number;
  };
  confidenceScore: number;
  processingVersion: string;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🧠 GEMINI RESUME ANALYZER START");
    
    // Parse and validate request
    const body: AnalysisRequest = await req.json();
    
    if (!body.resumeText?.trim()) {
      throw new Error("Resume text is required");
    }
    if (!body.jobDescription?.trim()) {
      throw new Error("Job description is required");
    }
    if (!GEMINI_API_KEY) {
      throw new Error("Google Gemini API key not configured");
    }

    console.log("✓ Input validation passed");
    console.log(`Analysis type: ${body.analysisType || 'comprehensive'}`);
    console.log(`Include interactive: ${body.includeInteractive !== false}`);
    console.log(`Include cover letter: ${body.includeCoverLetter === true}`);
    console.log(`Generate tailored resume: ${body.generateTailoredResume === true}`);

    // Initialize Supabase for analytics
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle specific tailored resume request
    if (body.generateTailoredResume) {
      console.log("🎯 Generating tailored resume only");
      const tailoredResume = await generateTailoredResume(body);
      
      return new Response(JSON.stringify({
        success: true,
        data: { tailoredResume },
        version: "gemini-v1.0",
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate comprehensive analysis using Gemini
    const analysisResult = await generateGeminiAnalysis(body);

    // Save analysis to database
    if (body.userId) {
      await saveAnalysisToDatabase(supabase, analysisResult, body.userId, body);
    }

    // Log analytics
    await logAnalyticsEvent(supabase, body.userId, 'gemini_analysis_completed', {
      analysisType: body.analysisType,
      includeInteractive: body.includeInteractive,
      includeCoverLetter: body.includeCoverLetter,
      overallScore: analysisResult.overallScore
    });

    console.log("✅ Analysis completed successfully");

    return new Response(JSON.stringify({
      success: true,
      data: analysisResult,
      version: "gemini-v1.0",
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Analysis failed:", error);
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function generateGeminiAnalysis(request: AnalysisRequest): Promise<AnalysisResult> {
  console.log("🚀 Starting Gemini AI analysis");

  // Create comprehensive prompt for Gemini
  const systemPrompt = createSystemPrompt(request);
  
  try {
    // Call Gemini API
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: systemPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 8192,
        },
        safetySettings: [
          {
            category: "HARM_CATEGORY_HARASSMENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_HATE_SPEECH", 
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          },
          {
            category: "HARM_CATEGORY_DANGEROUS_CONTENT",
            threshold: "BLOCK_MEDIUM_AND_ABOVE"
          }
        ]
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      throw new Error(`Gemini API error: ${response.status} - ${errorText}`);
    }

    const geminiResponse = await response.json();
    console.log("✓ Gemini response received");

    // Parse Gemini response
    const analysisText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!analysisText) {
      throw new Error("No analysis content received from Gemini");
    }

    // Parse structured analysis from Gemini response
    const analysis = parseGeminiAnalysis(analysisText, request);
    
    // Generate cover letter if requested
    if (request.includeCoverLetter) {
      console.log("📝 Generating cover letter");
      analysis.coverLetter = await generateCoverLetter(request);
    }

    return analysis;

  } catch (error) {
    console.error("Gemini analysis error:", error);
    // Retry once with simplified prompt
    try {
      console.log("🔄 Retrying with simplified analysis prompt");
      const retryResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: createSimplifiedPrompt(request)
            }]
          }],
          generationConfig: {
            temperature: 0.4,
            topK: 20,
            topP: 0.8,
            maxOutputTokens: 4096,
          }
        })
      });

      if (retryResponse.ok) {
        const retryGeminiResponse = await retryResponse.json();
        const retryAnalysisText = retryGeminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
        if (retryAnalysisText) {
          return parseGeminiAnalysis(retryAnalysisText, request);
        }
      }
    } catch (retryError) {
      console.error("Retry also failed:", retryError);
    }
    
    // If both attempts fail, throw error instead of returning fallback
    throw new Error(`AI analysis failed: ${error.message}. Please try again or contact support.`);
  }
}

async function generateTailoredResume(request: AnalysisRequest): Promise<string> {
  console.log("🎯 Generating tailored resume with Gemini AI");

  const tailoredResumePrompt = `You are an elite resume optimization expert. Your task is to create a perfectly tailored, ATS-optimized resume that guarantees maximum impact for this specific job opportunity.

ORIGINAL RESUME:
${request.resumeText}

TARGET JOB DESCRIPTION:
${request.jobDescription}

TARGET POSITION: ${request.jobTitle || "Position"}
TARGET COMPANY: ${request.companyName || "Company"}

INSTRUCTIONS FOR OPTIMIZATION:
1. KEYWORD OPTIMIZATION: Seamlessly integrate ALL relevant keywords from job description
2. CONTENT ENHANCEMENT: Add quantifiable achievements and industry-specific metrics
3. STRUCTURE OPTIMIZATION: Ensure perfect ATS compatibility with clear section headers
4. SKILLS ALIGNMENT: Highlight skills that directly match job requirements
5. ACHIEVEMENT QUANTIFICATION: Transform bullet points into measurable accomplishments
6. PROFESSIONAL FORMATTING: Clean, ATS-friendly layout with consistent formatting
7. VALUE PROPOSITION: Lead with compelling summary that matches job requirements

FORMATTING REQUIREMENTS:
- Use standard section headers: PROFESSIONAL SUMMARY, EXPERIENCE, EDUCATION, SKILLS
- Bullet points with strong action verbs
- Consistent date formatting
- Clean, simple formatting (no tables, columns, or complex layouts)
- Keywords naturally integrated (not keyword stuffed)
- Achievement-focused language with metrics

OUTPUT REQUIREMENTS:
- Return ONLY the complete tailored resume text
- Include all contact information from original resume
- Maintain truthful representation of candidate's background
- Optimize for both ATS systems and human reviewers
- Length: 1-2 pages optimal

Create the most compelling, keyword-optimized resume that transforms this candidate into the perfect fit for this specific role.`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: tailoredResumePrompt
          }]
        }],
        generationConfig: {
          temperature: 0.4,
          topK: 40,
          topP: 0.8,
          maxOutputTokens: 8192,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Tailored resume generation failed: ${response.status}`);
    }

    const geminiResponse = await response.json();
    const tailoredResumeText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!tailoredResumeText) {
      throw new Error("No tailored resume content received");
    }

    console.log("✅ Tailored resume generated successfully");
    return tailoredResumeText;

  } catch (error) {
    console.error("Tailored resume generation error:", error);
    
    // Return enhanced version of original resume as fallback
    return `${request.resumeText}\n\n--- OPTIMIZATION NOTES ---\nThis resume has been analyzed for the ${request.jobTitle || 'target position'} at ${request.companyName || 'target company'}. Consider adding more specific keywords from the job description and quantifying your achievements with measurable results.`;
  }
}

function createSystemPrompt(request: AnalysisRequest): string {
  const { resumeText, jobDescription, jobTitle = "Position", companyName = "Company", analysisType = "comprehensive" } = request;
  
  const basePrompt = `You are an elite resume strategist and AI career consultant with expertise across all industries. You have helped thousands of candidates achieve 3x better application success rates. 

CRITICAL ANALYSIS REQUIREMENTS:
- Conduct deep semantic analysis of both resume and job description
- Use advanced keyword extraction and matching algorithms
- Apply industry-specific scoring models and benchmarks
- Analyze competitive positioning against market standards
- Provide data-driven scores based on quantitative analysis
- Generate actionable insights that guarantee measurable improvement

RESUME CONTENT:
${resumeText}

TARGET JOB DESCRIPTION:
${jobDescription}

TARGET POSITION: ${jobTitle}
TARGET COMPANY: ${companyName}
ANALYSIS TYPE: ${analysisType}

ADVANCED ANALYSIS INSTRUCTIONS:
1. KEYWORD ANALYSIS: Extract ALL relevant keywords from job description and measure semantic similarity with resume content
2. SKILLS MAPPING: Create comprehensive skills matrix comparing required vs demonstrated capabilities
3. EXPERIENCE ALIGNMENT: Calculate weighted relevance scores for each role based on job requirements
4. ATS OPTIMIZATION: Analyze resume structure, formatting, and keyword density for ATS compatibility
5. COMPETITIVE ANALYSIS: Benchmark against industry standards and provide market positioning insights
6. QUANTIFIED RECOMMENDATIONS: Generate specific, measurable improvement suggestions with expected impact

Return ONLY valid JSON in this exact format:

{
  "overallScore": [0-100 integer - be critical, average candidates score 65-75],
  "detailedAnalysis": {
    "keywordMatch": [0-100 - semantic analysis of job-relevant terms],
    "skillsAlignment": [0-100 - technical and soft skills match], 
    "experienceRelevance": [0-100 - how well experience maps to requirements],
    "atsCompatibility": [0-100 - format and keyword optimization for tracking systems],
    "formatOptimization": [0-100 - structure, readability, professional presentation]
  },
  "interactiveInsights": {
    "strengthsAnalysis": [
      {
        "category": "Specific strength category",
        "score": [0-100],
        "details": "Detailed analysis of why this is a strength with specific evidence",
        "examples": ["Exact quote or achievement from resume", "Another specific example"]
      }
    ],
    "improvementAreas": [
      {
        "priority": "high|medium|low",
        "category": "Specific improvement category",
        "issue": "Exact problem identified with concrete evidence",
        "solution": "Specific step-by-step solution with examples",
        "impact": "Quantified expected improvement in application success"
      }
    ],
    "missingKeywords": ["critical job-specific terms not found in resume"],
    "suggeredKeywords": ["high-impact terms to add based on job description"]
  },
  "actionableRecommendations": [
    {
      "action": "Specific action with clear deliverable",
      "description": "Detailed implementation steps with examples",
      "expectedImpact": "Quantified improvement in hiring probability",
      "difficulty": "easy|medium|hard",
      "timeEstimate": "Realistic time to complete"
    }
  ],
  "competitiveAnalysis": {
    "marketPosition": "Comprehensive assessment of candidate's market competitiveness with salary benchmarks and demand insights",
    "standoutFactors": ["Unique competitive advantages that differentiate from other candidates"],
    "competitivenessScore": [0-100 - honest assessment vs. market competition]
  },
  "confidenceScore": [85-99 - your confidence in this analysis quality]
}`;
}

function parseGeminiAnalysis(analysisText: string, request: AnalysisRequest): AnalysisResult {
  try {
    // Extract JSON from Gemini response (remove markdown formatting if present)
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in Gemini response");
    }

    const analysisData = JSON.parse(jsonMatch[0]);
    
    return {
      overallScore: Math.max(0, Math.min(100, analysisData.overallScore || 0)),
      detailedAnalysis: {
        keywordMatch: Math.max(0, Math.min(100, analysisData.detailedAnalysis?.keywordMatch || 0)),
        skillsAlignment: Math.max(0, Math.min(100, analysisData.detailedAnalysis?.skillsAlignment || 0)),
        experienceRelevance: Math.max(0, Math.min(100, analysisData.detailedAnalysis?.experienceRelevance || 0)),
        atsCompatibility: Math.max(0, Math.min(100, analysisData.detailedAnalysis?.atsCompatibility || 0)),
        formatOptimization: Math.max(0, Math.min(100, analysisData.detailedAnalysis?.formatOptimization || 0))
      },
      interactiveInsights: {
        strengthsAnalysis: analysisData.interactiveInsights?.strengthsAnalysis || [],
        improvementAreas: analysisData.interactiveInsights?.improvementAreas || [],
        missingKeywords: analysisData.interactiveInsights?.missingKeywords || [],
        suggeredKeywords: analysisData.interactiveInsights?.suggeredKeywords || []
      },
      actionableRecommendations: analysisData.actionableRecommendations || [],
      competitiveAnalysis: {
        marketPosition: analysisData.competitiveAnalysis?.marketPosition || "Analysis unavailable",
        standoutFactors: analysisData.competitiveAnalysis?.standoutFactors || [],
        competitivenessScore: Math.max(0, Math.min(100, analysisData.competitiveAnalysis?.competitivenessScore || 0))
      },
      confidenceScore: Math.max(0, Math.min(100, analysisData.confidenceScore || 85)),
      processingVersion: "gemini-v1.0",
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    console.error("Error parsing Gemini analysis:", error);
    throw error;
  }
}

async function generateCoverLetter(request: AnalysisRequest): Promise<NonNullable<AnalysisResult['coverLetter']>> {
  console.log("📝 Generating personalized cover letter with enhanced prompting");

  const coverLetterPrompt = `You are an elite career strategist creating a compelling cover letter. Generate a personalized, professional cover letter that GUARANTEES interview callbacks.

CANDIDATE RESUME:
${request.resumeText}

TARGET JOB DESCRIPTION:
${request.jobDescription}

TARGET POSITION: ${request.jobTitle || "Position"}
TARGET COMPANY: ${request.companyName || "Company"}

REQUIREMENTS FOR EXCEPTIONAL COVER LETTER:
1. IMMEDIATE IMPACT: Opening line must grab attention in first 10 words
2. VALUE PROPOSITION: Clearly articulate unique value within first paragraph
3. SPECIFIC ACHIEVEMENTS: Reference 2-3 quantifiable accomplishments from resume
4. COMPANY CONNECTION: Show genuine knowledge of company/role (research-based insights)
5. SKILLS ALIGNMENT: Demonstrate perfect fit for 3-5 key job requirements
6. PROFESSIONAL TONE: Confident but not arrogant, enthusiastic but professional
7. CALL TO ACTION: Strong, confident closing that prompts next steps

STRUCTURE REQUIREMENTS:
- Opening: Hook attention + clear position interest (2-3 sentences)
- Body Paragraph 1: Relevant experience + specific achievements (3-4 sentences)  
- Body Paragraph 2: Skills alignment + company fit (3-4 sentences)
- Closing: Enthusiasm + next steps (2-3 sentences)
- Total length: 250-350 words

Return ONLY valid JSON in this format:
{
  "content": "Complete cover letter text with proper formatting and line breaks",
  "sections": {
    "opening": "Attention-grabbing opening paragraph",
    "body": ["First body paragraph with achievements", "Second body paragraph with skills/fit"],
    "closing": "Strong closing with call to action"
  },
  "personalizations": ["Specific personalization techniques used", "Company-specific insights included", "Achievement highlights emphasized"]
}`;

  try {
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: coverLetterPrompt
          }]
        }],
        generationConfig: {
          temperature: 0.6,
          topK: 40,
          topP: 0.9,
          maxOutputTokens: 4096,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Cover letter generation failed: ${response.status}`);
    }

    const geminiResponse = await response.json();
    const coverLetterText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!coverLetterText) {
      throw new Error("No cover letter content received");
    }

    // Parse cover letter JSON
    const jsonMatch = coverLetterText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const coverLetterData = JSON.parse(jsonMatch[0]);
      return {
        content: coverLetterData.content || "",
        sections: {
          opening: coverLetterData.sections?.opening || "",
          body: coverLetterData.sections?.body || [],
          closing: coverLetterData.sections?.closing || ""
        },
        personalizations: coverLetterData.personalizations || []
      };
    } else {
      // Fallback: use the entire text as content
      return {
        content: coverLetterText,
        sections: {
          opening: "Generated cover letter",
          body: [coverLetterText],
          closing: ""
        },
        personalizations: ["AI-generated personalized content"]
      };
    }

  } catch (error) {
    console.error("Cover letter generation error:", error);
    throw new Error(`Cover letter generation failed: ${error.message}. Please try again.`);
  }
}

function createSimplifiedPrompt(request: AnalysisRequest): string {
  const { resumeText, jobDescription, jobTitle = "Position", companyName = "Company" } = request;
  
  return `Analyze this resume against the job requirements and return ONLY valid JSON:

RESUME: ${resumeText.substring(0, 2000)}
JOB: ${jobDescription.substring(0, 1500)}
POSITION: ${jobTitle}

{
  "overallScore": [number 0-100],
  "detailedAnalysis": {
    "keywordMatch": [number 0-100],
    "skillsAlignment": [number 0-100], 
    "experienceRelevance": [number 0-100],
    "atsCompatibility": [number 0-100],
    "formatOptimization": [number 0-100]
  },
  "interactiveInsights": {
    "strengthsAnalysis": [{"category": "string", "score": [0-100], "details": "string", "examples": ["string"]}],
    "improvementAreas": [{"priority": "high|medium|low", "category": "string", "issue": "string", "solution": "string", "impact": "string"}],
    "missingKeywords": ["string"],
    "suggeredKeywords": ["string"]
  },
  "actionableRecommendations": [{"action": "string", "description": "string", "expectedImpact": "string", "difficulty": "easy|medium|hard", "timeEstimate": "string"}],
  "competitiveAnalysis": {
    "marketPosition": "string",
    "standoutFactors": ["string"],
    "competitivenessScore": [0-100]
  },
  "confidenceScore": [85-99]
}`;
}

async function saveAnalysisToDatabase(supabase: any, analysis: AnalysisResult, userId: string, request: AnalysisRequest) {
  try {
    const { error } = await supabase
      .from('resume_analyses')
      .insert({
        user_id: userId,
        job_title: request.jobTitle || 'Position',
        company_name: request.companyName || 'Company',
        overall_score: analysis.overallScore,
        keyword_match: analysis.detailedAnalysis.keywordMatch,
        skills_alignment: analysis.detailedAnalysis.skillsAlignment,
        experience_relevance: analysis.detailedAnalysis.experienceRelevance,
        ats_compatibility: analysis.detailedAnalysis.atsCompatibility,
        suggestions: analysis.actionableRecommendations,
        detailed_feedback: {
          interactiveInsights: analysis.interactiveInsights,
          competitiveAnalysis: analysis.competitiveAnalysis,
          coverLetter: analysis.coverLetter
        },
        analysis_engine: 'gemini-v1.0',
        confidence_score: analysis.confidenceScore,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
      });

    if (error) {
      console.error("Database save error:", error);
    } else {
      console.log("✓ Analysis saved to database");
    }
  } catch (error) {
    console.error("Database operation error:", error);
  }
}

async function logAnalyticsEvent(supabase: any, userId: string | undefined, event: string, metadata: any) {
  try {
    if (!userId) return;

    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_type: event,
        metadata: metadata,
        created_at: new Date().toISOString()
      });
  } catch (error) {
    console.error("Analytics logging error:", error);
  }
}
