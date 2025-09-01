import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("Starting robust analysis function...");
    
    // Parse request body with comprehensive error handling
    let body;
    try {
      const rawBody = await req.text();
      if (!rawBody || rawBody.trim() === '') {
        throw new Error("Empty request body");
      }
      body = JSON.parse(rawBody);
    } catch (parseError) {
      console.error("Request parsing error:", parseError);
      return new Response(
        JSON.stringify({ 
          error: "Invalid request format. Please send valid JSON.",
          code: "INVALID_REQUEST"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Extract and validate input data with fallbacks
    const resumeText = body.resumeText ?? body.resume_text ?? '';
    const jobDescription = body.jobDescription ?? body.job_description ?? '';
    const jobTitle = body.jobTitle ?? body.job_title ?? 'Position';
    const companyName = body.companyName ?? body.company_name ?? 'Company';

    // Input validation with specific error messages
    if (!resumeText.trim()) {
      return new Response(
        JSON.stringify({ 
          error: "Resume text is required",
          code: "MISSING_RESUME"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (!jobDescription.trim()) {
      return new Response(
        JSON.stringify({ 
          error: "Job description is required",
          code: "MISSING_JOB_DESCRIPTION"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (resumeText.length < 50) {
      return new Response(
        JSON.stringify({ 
          error: "Resume text too short for meaningful analysis (minimum 50 characters)",
          code: "RESUME_TOO_SHORT"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    if (jobDescription.length < 50) {
      return new Response(
        JSON.stringify({ 
          error: "Job description too short for meaningful analysis (minimum 50 characters)",
          code: "JOB_DESCRIPTION_TOO_SHORT"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Environment validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      console.error("Missing critical environment variables");
      return new Response(
        JSON.stringify({ 
          error: "Server configuration error. Please contact support.",
          code: "CONFIG_ERROR"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);

    // Authentication validation with detailed error handling
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ 
          error: "Missing authorization header",
          code: "NO_AUTH_HEADER"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    if (!authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid authorization format. Expected 'Bearer <token>'",
          code: "INVALID_AUTH_FORMAT"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    if (!token || token.length < 10) {
      return new Response(
        JSON.stringify({ 
          error: "Invalid authentication token",
          code: "INVALID_TOKEN"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Get user with timeout
    let user;
    try {
      const authResult = await Promise.race([
        supabaseAdmin.auth.getUser(token),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 10000)
        )
      ]);
      
      if (authResult.error || !authResult.data.user) {
        throw new Error(authResult.error?.message || 'Authentication failed');
      }
      
      user = authResult.data.user;
    } catch (authError) {
      console.error("Authentication error:", authError);
      return new Response(
        JSON.stringify({ 
          error: "Authentication failed. Please sign in again.",
          code: "AUTH_FAILED"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 401,
        }
      );
    }

    // Check user credits with error handling
    let profile;
    try {
      const { data: profileData, error: profileError } = await supabaseAdmin
        .from("profiles")
        .select("credits")
        .eq("id", user.id)
        .single();

      if (profileError) {
        throw profileError;
      }
      
      profile = profileData;
    } catch (profileError) {
      console.error("Profile fetch error:", profileError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to fetch user profile. Please try again.",
          code: "PROFILE_ERROR"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    if (!profile || profile.credits <= 0) {
      return new Response(
        JSON.stringify({ 
          error: "Insufficient credits. Please purchase more credits to continue.",
          code: "INSUFFICIENT_CREDITS",
          credits: profile?.credits || 0
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 402,
        }
      );
    }

    // Perform analysis with timeout protection and error handling
    console.log("Starting analysis for user:", user.id);
    let analysisResults;
    try {
      analysisResults = await Promise.race([
        performSimpleAnalysis(resumeText, jobDescription, jobTitle),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Analysis timeout - please try again')), 20000)
        )
      ]);

      // Validate analysis results
      if (!analysisResults || typeof analysisResults.overallScore !== 'number') {
        throw new Error("Invalid analysis results generated");
      }

      // Ensure all scores are within valid ranges
      analysisResults.overallScore = Math.max(Math.min(analysisResults.overallScore, 100), 0);
      analysisResults.keywordMatch = Math.max(Math.min(analysisResults.keywordMatch, 100), 0);
      analysisResults.skillsAlignment = Math.max(Math.min(analysisResults.skillsAlignment, 100), 0);
      analysisResults.atsCompatibility = Math.max(Math.min(analysisResults.atsCompatibility, 100), 0);
      analysisResults.experienceRelevance = Math.max(Math.min(analysisResults.experienceRelevance, 100), 0);

    } catch (analysisError) {
      console.error("Analysis error:", analysisError);
      return new Response(
        JSON.stringify({ 
          error: analysisError.message || "Analysis failed. Please try again.",
          code: "ANALYSIS_ERROR"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Save analysis to database with error handling
    let analysis;
    try {
      const { data: saveData, error: saveError } = await supabaseAdmin
        .from("resume_analyses")
        .insert({
          user_id: user.id,
          job_title: jobTitle,
          company_name: companyName,
          resume_text: resumeText.substring(0, 10000), // Truncate for storage efficiency
          job_description: jobDescription.substring(0, 5000),
          analysis_results: analysisResults,
          overall_score: analysisResults.overallScore,
          keyword_match: analysisResults.keywordMatch,
          skills_alignment: analysisResults.skillsAlignment,
          ats_compatibility: analysisResults.atsCompatibility,
          experience_relevance: analysisResults.experienceRelevance,
          suggestions: analysisResults.suggestions || []
        })
        .select()
        .single();

      if (saveError) {
        throw saveError;
      }
      
      analysis = saveData;
    } catch (saveError) {
      console.error("Database save error:", saveError);
      return new Response(
        JSON.stringify({ 
          error: "Failed to save analysis results. Please try again.",
          code: "SAVE_ERROR"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    // Consume credit with comprehensive error handling and cleanup
    try {
      const { error: creditError } = await supabaseAdmin.rpc(
        'consume_analysis_credit',
        {
          target_user_id: user.id,
          analysis_id: analysis.id
        }
      );

      if (creditError) {
        console.error("Credit consumption error:", creditError);
        // Cleanup on credit failure
        try {
          await supabaseAdmin.from("resume_analyses").delete().eq("id", analysis.id);
        } catch (cleanupError) {
          console.error("Cleanup error:", cleanupError);
        }
        
        return new Response(
          JSON.stringify({ 
            error: "Credit processing failed. Please try again.",
            code: "CREDIT_ERROR"
          }),
          {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
            status: 500,
          }
        );
      }
    } catch (creditException) {
      console.error("Credit processing exception:", creditException);
      // Cleanup on exception
      try {
        await supabaseAdmin.from("resume_analyses").delete().eq("id", analysis.id);
      } catch (cleanupError) {
        console.error("Exception cleanup error:", cleanupError);
      }
      
      return new Response(
        JSON.stringify({ 
          error: "Credit processing failed. Please contact support if this persists.",
          code: "CREDIT_EXCEPTION"
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        }
      );
    }

    console.log("Analysis completed successfully for user:", user.id);
    return new Response(JSON.stringify({
      ...analysisResults,
      processingTime: Date.now(),
      success: true
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (unexpectedError) {
    console.error("Unexpected function error:", unexpectedError);
    
    return new Response(
      JSON.stringify({ 
        error: "An unexpected error occurred. Please try again.",
        code: "UNEXPECTED_ERROR",
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});

// Simplified, robust analysis function
async function performSimpleAnalysis(resumeText: string, jobDescription: string, jobTitle: string) {
  try {
    console.log("Starting simple analysis...");
    
    // Sanitize inputs to prevent processing issues
    const cleanResumeText = resumeText.trim().substring(0, 15000);
    const cleanJobDescription = jobDescription.trim().substring(0, 8000);
    
    // Extract keywords with error handling
    const resumeWords = extractSimpleKeywords(cleanResumeText);
    const jobWords = extractSimpleKeywords(cleanJobDescription);
    
    if (!resumeWords.length && !jobWords.length) {
      console.warn("No keywords extracted, using fallback values");
      return getFallbackAnalysis();
    }
    
    // Find matching keywords with fuzzy matching
    const matchingWords = findMatchingKeywords(resumeWords, jobWords);
    
    // Calculate keyword match score
    const keywordMatch = jobWords.length > 0 ? 
      Math.round((matchingWords.length / jobWords.length) * 100) : 50;
    
    // Calculate other scores with bounds checking
    const skillsAlignment = calculateSkillsScore(cleanResumeText, cleanJobDescription);
    const atsCompatibility = calculateATSScore(cleanResumeText);
    const experienceRelevance = calculateExperienceScore(cleanResumeText, cleanJobDescription, jobTitle);
    
    // Calculate overall score with proper weighting
    const overallScore = Math.round(
      (keywordMatch * 0.35) +
      (skillsAlignment * 0.25) +
      (atsCompatibility * 0.20) +
      (experienceRelevance * 0.20)
    );

    // Generate helpful suggestions
    const suggestions = generateSuggestions(keywordMatch, skillsAlignment, atsCompatibility, matchingWords.length);

    const result = {
      overallScore: Math.max(Math.min(overallScore, 100), 10),
      keywordMatch: Math.max(Math.min(keywordMatch, 100), 0),
      skillsAlignment: Math.max(Math.min(skillsAlignment, 100), 20),
      atsCompatibility: Math.max(Math.min(atsCompatibility, 100), 30),
      experienceRelevance: Math.max(Math.min(experienceRelevance, 100), 20),
      suggestions: suggestions.slice(0, 6), // Limit suggestions
      matchingKeywords: matchingWords.length,
      totalKeywords: jobWords.length,
      analysisTimestamp: new Date().toISOString()
    };

    console.log("Analysis completed successfully:", {
      overallScore: result.overallScore,
      matchingKeywords: result.matchingKeywords,
      totalKeywords: result.totalKeywords
    });
    
    return result;

  } catch (error) {
    console.error("Simple analysis error:", error);
    return getFallbackAnalysis();
  }
}

function extractSimpleKeywords(text: string): string[] {
  try {
    // Common technical keywords
    const techKeywords = [
      'javascript', 'python', 'react', 'node', 'nodejs', 'sql', 'aws', 'docker',
      'git', 'api', 'database', 'html', 'css', 'typescript', 'angular', 'vue',
      'mongodb', 'mysql', 'kubernetes', 'jenkins', 'azure', 'java', 'php',
      'leadership', 'management', 'communication', 'teamwork', 'agile', 'scrum'
    ];
    
    const normalizedText = text.toLowerCase();
    
    // Find technical keywords
    const foundTechKeywords = techKeywords.filter(keyword => 
      normalizedText.includes(keyword.toLowerCase())
    );
    
    // Extract other meaningful words
    const words = normalizedText
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3 && word.length < 20)
      .filter(word => !isCommonWord(word))
      .filter(word => /^[a-zA-Z]+$/.test(word))
      .slice(0, 60);
      
    const uniqueWords = [...new Set([...foundTechKeywords, ...words])];
    return uniqueWords.slice(0, 80);
  } catch (error) {
    console.error('Keyword extraction error:', error);
    return ['experience', 'skills', 'work', 'technology'];
  }
}

function findMatchingKeywords(resumeWords: string[], jobWords: string[]): string[] {
  try {
    const matches = new Set<string>();
    
    jobWords.forEach(jobWord => {
      resumeWords.forEach(resumeWord => {
        // Exact match
        if (jobWord.toLowerCase() === resumeWord.toLowerCase()) {
          matches.add(jobWord);
        }
        // Partial match (contains)
        else if (jobWord.length > 4 && resumeWord.length > 4) {
          if (jobWord.toLowerCase().includes(resumeWord.toLowerCase()) || 
              resumeWord.toLowerCase().includes(jobWord.toLowerCase())) {
            matches.add(jobWord);
          }
        }
      });
    });
    
    return Array.from(matches);
  } catch (error) {
    console.error('Keyword matching error:', error);
    return [];
  }
}

function calculateSkillsScore(resumeText: string, jobDescription: string): number {
  try {
    const skills = ['leadership', 'communication', 'teamwork', 'problem solving', 'analytical'];
    const techSkills = ['programming', 'development', 'coding', 'software', 'technical'];
    
    let score = 50;
    
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();
    
    // Check for soft skills
    const resumeSkills = skills.filter(skill => resumeLower.includes(skill));
    const jobSkills = skills.filter(skill => jobLower.includes(skill));
    
    if (jobSkills.length > 0) {
      const skillMatch = resumeSkills.filter(skill => jobSkills.includes(skill));
      score += Math.round((skillMatch.length / jobSkills.length) * 25);
    }
    
    // Check for technical skills
    const resumeTechSkills = techSkills.filter(skill => resumeLower.includes(skill));
    const jobTechSkills = techSkills.filter(skill => jobLower.includes(skill));
    
    if (jobTechSkills.length > 0) {
      const techMatch = resumeTechSkills.filter(skill => jobTechSkills.includes(skill));
      score += Math.round((techMatch.length / jobTechSkills.length) * 25);
    }
    
    return Math.min(score, 95);
  } catch (error) {
    console.error('Skills score calculation error:', error);
    return 60;
  }
}

function calculateATSScore(resumeText: string): number {
  try {
    let score = 80;
    
    // Check for email
    if (!resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/)) {
      score -= 15;
    }
    
    // Check for phone
    if (!resumeText.match(/[\+]?[\d\s\-\(\)]{10,}/)) {
      score -= 10;
    }
    
    // Check for dates
    if (!resumeText.match(/\b20\d{2}\b|\b19\d{2}\b/)) {
      score -= 8;
    }
    
    // Check for problematic formatting
    if (resumeText.includes('│') || resumeText.includes('─')) {
      score -= 15;
    }
    
    // Check for structure
    if (!resumeText.match(/[•\-\*]/)) {
      score -= 5;
    }
    
    return Math.max(score, 40);
  } catch (error) {
    console.error('ATS score calculation error:', error);
    return 70;
  }
}

function calculateExperienceScore(resumeText: string, jobDescription: string, jobTitle: string): number {
  try {
    let score = 60;
    
    const resumeLower = resumeText.toLowerCase();
    const jobLower = jobDescription.toLowerCase();
    const titleLower = jobTitle.toLowerCase();
    
    // Check for experience indicators
    const resumeYears = extractYearsFromText(resumeLower);
    const jobYears = extractYearsFromText(jobLower);
    
    if (resumeYears >= jobYears) {
      score += 15;
    } else if (resumeYears >= jobYears * 0.7) {
      score += 10;
    }
    
    // Check for role alignment
    const titleWords = titleLower.split(/\s+/).filter(word => word.length > 3);
    const roleMatches = titleWords.filter(word => resumeLower.includes(word));
    
    if (roleMatches.length > 0) {
      score += Math.min(roleMatches.length * 5, 20);
    }
    
    return Math.min(score, 90);
  } catch (error) {
    console.error('Experience score calculation error:', error);
    return 55;
  }
}

function extractYearsFromText(text: string): number {
  try {
    const yearMatches = text.match(/(\d+)\+?\s*years?/gi);
    if (yearMatches) {
      const years = yearMatches.map(match => {
        const num = match.match(/\d+/);
        return num ? parseInt(num[0]) : 0;
      });
      return Math.max(...years);
    }
    return 2; // Default assumption
  } catch (error) {
    return 2;
  }
}

function generateSuggestions(keywordMatch: number, skillsScore: number, atsScore: number, matchingCount: number): string[] {
  const suggestions = [];
  
  try {
    if (keywordMatch < 50) {
      suggestions.push("Add more relevant keywords from the job description to improve your match score");
    }
    
    if (keywordMatch < 70) {
      suggestions.push("Include specific technical skills and tools mentioned in the job posting");
    }
    
    if (skillsScore < 70) {
      suggestions.push("Highlight both technical and soft skills that align with the job requirements");
    }
    
    if (atsScore < 70) {
      suggestions.push("Improve resume formatting for better ATS compatibility - use simple, clean formatting");
    }
    
    if (matchingCount < 5) {
      suggestions.push("Incorporate more industry-specific terminology from the job description");
    }
    
    suggestions.push("Quantify your achievements with specific numbers, percentages, and metrics");
    suggestions.push("Use strong action verbs to describe your accomplishments and responsibilities");
    
    if (suggestions.length === 0) {
      suggestions.push("Your resume shows good alignment! Consider minor optimizations for even better results");
    }
    
    return suggestions;
  } catch (error) {
    console.error('Suggestion generation error:', error);
    return ["Review and optimize your resume for better job alignment"];
  }
}

function isCommonWord(word: string): boolean {
  const commonWords = new Set([
    'the', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by',
    'from', 'up', 'about', 'into', 'through', 'during', 'before', 'after',
    'above', 'below', 'between', 'this', 'that', 'these', 'those', 'will',
    'would', 'could', 'should', 'have', 'has', 'had', 'been', 'being', 'very'
  ]);
  return commonWords.has(word.toLowerCase());
}

function getFallbackAnalysis() {
  return {
    overallScore: 65,
    keywordMatch: 50,
    skillsAlignment: 60,
    atsCompatibility: 75,
    experienceRelevance: 55,
    suggestions: [
      "Review your resume content for better job alignment",
      "Add relevant keywords from the job description",
      "Ensure proper formatting for ATS compatibility",
      "Quantify your achievements with specific metrics"
    ],
    matchingKeywords: 8,
    totalKeywords: 15,
    analysisTimestamp: new Date().toISOString(),
    fallback: true
  };
}
