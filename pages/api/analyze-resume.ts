// API Route: /api/analyze-resume
import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// Initialize clients
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request: NextRequest) {
  try {
    const startTime = Date.now();
    
    // Parse request body
    const body = await request.json();
    const {
      resumeText,
      jobDescription,
      jobTitle,
      companyName,
      analysisType = 'comprehensive',
      userId = 'demo-user' // Replace with actual user ID from auth
    } = body;

    // Validate required fields
    if (!resumeText || !jobDescription) {
      return NextResponse.json(
        { error: 'Resume text and job description are required' },
        { status: 400 }
      );
    }

    // Generate content hashes for deduplication
    const resumeHash = crypto.createHash('sha256').update(resumeText).digest('hex');
    const jobDescHash = crypto.createHash('sha256').update(jobDescription).digest('hex');

    // Check for existing analysis
    const { data: existingAnalysis } = await supabase
      .from('enhanced_analyses')
      .select('*')
      .eq('user_id', userId)
      .eq('resume_content_hash', resumeHash)
      .eq('job_description_hash', jobDescHash)
      .eq('analysis_type', analysisType)
      .order('created_at', { ascending: false })
      .limit(1);

    // Return existing analysis if found and recent (within 24 hours)
    if (existingAnalysis && existingAnalysis.length > 0) {
      const analysis = existingAnalysis[0];
      const analysisAge = Date.now() - new Date(analysis.created_at).getTime();
      if (analysisAge < 24 * 60 * 60 * 1000) { // 24 hours
        return NextResponse.json({
          success: true,
          analysis: analysis.analysis_data,
          fromCache: true,
          processingTime: analysis.processing_time_ms
        });
      }
    }

    // Generate AI analysis
    const analysisResult = await generateAIAnalysis(
      resumeText,
      jobDescription,
      jobTitle,
      companyName,
      analysisType
    );

    const processingTime = Date.now() - startTime;

    // Store analysis in database
    const { data: storedAnalysis, error: storeError } = await supabase
      .from('enhanced_analyses')
      .insert({
        user_id: userId,
        document_type: 'resume',
        analysis_type: analysisType,
        job_title: jobTitle,
        company_name: companyName,
        overall_score: analysisResult.overall_score || analysisResult.ats_score,
        ats_score: analysisResult.ats_score,
        match_percentage: analysisResult.match_percentage,
        analysis_data: analysisResult,
        resume_content_hash: resumeHash,
        job_description_hash: jobDescHash,
        processing_time_ms: processingTime,
        ai_model_version: 'gemini-pro'
      })
      .select()
      .single();

    if (storeError) {
      console.error('Failed to store analysis:', storeError);
      // Continue without storing if database error
    }

    // Track analytics event
    await trackAnalyticsEvent(userId, 'analysis_completed', {
      analysisType,
      processingTime,
      jobTitle,
      companyName,
      overallScore: analysisResult.overall_score || analysisResult.ats_score
    });

    return NextResponse.json({
      success: true,
      analysis: analysisResult,
      processingTime,
      analysisId: storedAnalysis?.id
    });

  } catch (error) {
    console.error('Analysis error:', error);
    return NextResponse.json(
      { 
        error: 'Failed to analyze resume',
        details: error.message 
      },
      { status: 500 }
    );
  }
}

async function generateAIAnalysis(
  resumeText: string,
  jobDescription: string,
  jobTitle: string,
  companyName: string,
  analysisType: string
) {
  const model = genAI.getGenerativeModel({ model: "gemini-pro" });

  let prompt = '';
  
  if (analysisType === 'comprehensive') {
    prompt = `
As an expert AI resume analyzer with 50+ years of experience in talent acquisition and career development, perform a comprehensive analysis of this resume against the job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

JOB TITLE: ${jobTitle}
COMPANY: ${companyName}

Please provide a detailed JSON analysis with the following structure:

{
  "overall_score": number (0-100),
  "ats_score": number (0-100),
  "match_percentage": number (0-100),
  "strengths": [
    {
      "category": "Technical Skills" | "Experience" | "Leadership" | "Education" | "Achievements",
      "description": "detailed strength description",
      "impact": "High" | "Medium" | "Low",
      "relevance_score": number (0-100)
    }
  ],
  "areas_for_improvement": [
    {
      "category": "Technical Skills" | "Experience" | "Education" | "Certifications" | "Keywords",
      "description": "specific improvement needed",
      "priority": "High" | "Medium" | "Low",
      "suggested_action": "actionable recommendation"
    }
  ],
  "keyword_analysis": {
    "matched_keywords": ["array of matched keywords"],
    "missing_keywords": ["array of missing critical keywords"],
    "keyword_density": number (0-100),
    "optimization_suggestions": ["array of keyword optimization tips"]
  },
  "experience_analysis": {
    "years_experience": number,
    "relevance_score": number (0-100),
    "leadership_experience": boolean,
    "industry_alignment": number (0-100),
    "progression_score": number (0-100)
  },
  "technical_skills_analysis": {
    "programming_languages": {
      "matched": ["languages"],
      "missing": ["languages"],
      "proficiency_assessment": "Expert" | "Advanced" | "Intermediate" | "Beginner"
    },
    "frameworks_tools": {
      "matched": ["frameworks/tools"],
      "missing": ["frameworks/tools"],
      "modern_stack_score": number (0-100)
    },
    "cloud_devops": {
      "matched": ["cloud/devops skills"],
      "missing": ["cloud/devops skills"],
      "maturity_score": number (0-100)
    }
  },
  "ats_optimization": {
    "formatting_score": number (0-100),
    "keyword_placement": number (0-100),
    "section_structure": number (0-100),
    "improvements": ["array of ATS improvements"]
  },
  "recommendations": {
    "immediate_actions": ["array of immediate improvements"],
    "short_term_goals": ["array of 3-6 month goals"],
    "long_term_development": ["array of 6+ month goals"],
    "additional_skills": ["array of skills to learn"]
  },
  "salary_insights": {
    "estimated_range": "salary range based on experience",
    "negotiation_points": ["array of negotiation strengths"],
    "market_positioning": "description of market position"
  },
  "interview_preparation": {
    "likely_questions": ["array of interview questions"],
    "story_opportunities": ["array of STAR method opportunities"],
    "technical_prep": ["array of technical preparation areas"]
  },
  "cultural_fit": {
    "company_alignment": number (0-100),
    "role_alignment": number (0-100),
    "growth_potential": number (0-100),
    "red_flags": ["array of potential concerns"]
  }
}

Provide only the JSON response, no additional text.`;
  } else if (analysisType === 'quick') {
    prompt = `
Perform a quick analysis of this resume against the job description. Focus on key match points and immediate improvements.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide a JSON response with:
{
  "overall_score": number (0-100),
  "match_percentage": number (0-100),
  "top_strengths": ["array of top 3 strengths"],
  "immediate_improvements": ["array of top 3 improvements"],
  "missing_keywords": ["array of critical missing keywords"],
  "quick_wins": ["array of easy improvements"]
}`;
  } else if (analysisType === 'ats') {
    prompt = `
Perform an ATS-focused analysis of this resume for the given job description.

RESUME:
${resumeText}

JOB DESCRIPTION:
${jobDescription}

Provide a JSON response with:
{
  "ats_score": number (0-100),
  "keyword_match": number (0-100),
  "formatting_score": number (0-100),
  "matched_keywords": ["array"],
  "missing_critical_keywords": ["array"],
  "formatting_issues": ["array"],
  "ats_optimization_tips": ["array"]
}`;
  }

  const result = await model.generateContent(prompt);
  const response = await result.response;
  const text = response.text();
  
  // Parse JSON response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error('Invalid response format from AI');
  }

  return JSON.parse(jsonMatch[0]);
}

async function trackAnalyticsEvent(
  userId: string,
  eventName: string,
  eventData: any
) {
  try {
    await supabase
      .from('analytics_events')
      .insert({
        user_id: userId,
        event_type: 'analysis',
        event_name: eventName,
        event_data: eventData
      });
  } catch (error) {
    console.error('Failed to track analytics event:', error);
  }
}
