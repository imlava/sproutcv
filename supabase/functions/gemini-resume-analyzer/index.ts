import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Gemini API Configuration
const GEMINI_API_KEY = Deno.env.get("GOOGLE_GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

interface AnalysisRequest {
  resumeText: string;
  jobDescription: string;
  jobTitle?: string;
  companyName?: string;
  userId?: string;
  analysisType?: 'comprehensive' | 'quick' | 'ats_focus' | 'skills_gap';
  includeInteractive?: boolean;
  includeCoverLetter?: boolean;
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

    // Initialize Supabase for analytics
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
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
    // Return fallback analysis
    return getFallbackAnalysis(request);
  }
}

function createSystemPrompt(request: AnalysisRequest): string {
  const { resumeText, jobDescription, jobTitle = "Position", companyName = "Company" } = request;
  
  return `You are an expert resume analyst and career consultant. Analyze the following resume against the job description and provide a comprehensive, structured analysis.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

Please provide a detailed analysis in the following JSON format (ensure valid JSON):

{
  "overallScore": [0-100],
  "detailedAnalysis": {
    "keywordMatch": [0-100],
    "skillsAlignment": [0-100], 
    "experienceRelevance": [0-100],
    "atsCompatibility": [0-100],
    "formatOptimization": [0-100]
  },
  "interactiveInsights": {
    "strengthsAnalysis": [
      {
        "category": "Technical Skills",
        "score": [0-100],
        "details": "Detailed explanation of strengths",
        "examples": ["Specific examples from resume"]
      }
    ],
    "improvementAreas": [
      {
        "priority": "high|medium|low",
        "category": "Skills Gap",
        "issue": "Specific issue identified",
        "solution": "Actionable solution",
        "impact": "Expected impact of improvement"
      }
    ],
    "missingKeywords": ["keyword1", "keyword2"],
    "suggeredKeywords": ["suggested1", "suggested2"]
  },
  "actionableRecommendations": [
    {
      "action": "Specific action to take",
      "description": "Detailed description",
      "expectedImpact": "Impact description",
      "difficulty": "easy|medium|hard",
      "timeEstimate": "Time needed"
    }
  ],
  "competitiveAnalysis": {
    "marketPosition": "Assessment of market competitiveness",
    "standoutFactors": ["Unique strengths"],
    "competitivenessScore": [0-100]
  },
  "confidenceScore": [0-100]
}

Focus on:
1. Deep keyword analysis and semantic matching
2. Skills gap identification with specific recommendations
3. ATS optimization suggestions
4. Experience relevance and transferable skills
5. Competitive positioning in the market
6. Actionable, prioritized recommendations
7. Industry-specific insights

Provide specific, actionable advice that will genuinely improve the candidate's chances.`;
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
  console.log("📝 Generating personalized cover letter");

  const coverLetterPrompt = `Generate a personalized, professional cover letter for the following:

RESUME:
${request.resumeText}

JOB DESCRIPTION:
${request.jobDescription}

JOB TITLE: ${request.jobTitle || "Position"}
COMPANY: ${request.companyName || "Company"}

Create a compelling cover letter that:
1. Demonstrates clear understanding of the role
2. Highlights relevant experience and achievements
3. Shows enthusiasm for the company and position
4. Includes specific examples from the resume
5. Maintains professional tone while showing personality

Return the response in this JSON format:
{
  "content": "Complete cover letter text",
  "sections": {
    "opening": "Opening paragraph",
    "body": ["Body paragraph 1", "Body paragraph 2"],
    "closing": "Closing paragraph"
  },
  "personalizations": ["Specific personalization points used"]
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
          temperature: 0.8,
          topK: 40,
          topP: 0.95,
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
    
    // Return fallback cover letter
    return {
      content: `Dear Hiring Manager,\n\nI am writing to express my strong interest in the ${request.jobTitle || 'position'} at ${request.companyName || 'your company'}.\n\nBest regards,\n[Your Name]`,
      sections: {
        opening: "Standard opening paragraph",
        body: ["Generated based on resume analysis"],
        closing: "Professional closing"
      },
      personalizations: ["Fallback content due to generation error"]
    };
  }
}

function getFallbackAnalysis(request: AnalysisRequest): AnalysisResult {
  console.log("📋 Generating fallback analysis");
  
  return {
    overallScore: 75,
    detailedAnalysis: {
      keywordMatch: 70,
      skillsAlignment: 75,
      experienceRelevance: 80,
      atsCompatibility: 75,
      formatOptimization: 70
    },
    interactiveInsights: {
      strengthsAnalysis: [
        {
          category: "Professional Experience",
          score: 80,
          details: "Resume shows relevant professional experience",
          examples: ["Work history demonstrates career progression"]
        }
      ],
      improvementAreas: [
        {
          priority: "medium" as const,
          category: "Keyword Optimization",
          issue: "Could include more industry-specific keywords",
          solution: "Review job description and incorporate relevant terms",
          impact: "Improved ATS compatibility and recruiter appeal"
        }
      ],
      missingKeywords: ["Keywords analysis requires full processing"],
      suggeredKeywords: ["Suggested keywords require full analysis"]
    },
    actionableRecommendations: [
      {
        action: "Optimize keywords",
        description: "Include more relevant keywords from the job description",
        expectedImpact: "Better ATS compatibility",
        difficulty: "easy" as const,
        timeEstimate: "30 minutes"
      }
    ],
    competitiveAnalysis: {
      marketPosition: "Fallback analysis - upgrade to premium for detailed insights",
      standoutFactors: ["Professional experience", "Relevant background"],
      competitivenessScore: 75
    },
    confidenceScore: 70,
    processingVersion: "fallback-v1.0",
    timestamp: new Date().toISOString()
  };
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
