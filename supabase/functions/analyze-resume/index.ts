
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
    const { resume_text, job_description, job_title, company_name } = await req.json();

    if (!resume_text || !job_description) {
      throw new Error("Missing resume text or job description");
    }

    // Create Supabase client with service role key
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Get authenticated user
    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data } = await supabaseAdmin.auth.getUser(token);
    const user = data.user;

    if (!user) {
      throw new Error("User not authenticated");
    }

    // Check if user has credits
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (!profile || profile.credits <= 0) {
      throw new Error("Insufficient credits. Please purchase more credits to continue.");
    }

    // Perform AI analysis (simplified version)
    const analysisResults = await performResumeAnalysis(resume_text, job_description);

    // Save analysis to database
    const { data: analysis, error: analysisError } = await supabaseAdmin
      .from("resume_analyses")
      .insert({
        user_id: user.id,
        job_title,
        company_name,
        resume_text,
        job_description,
        analysis_results: analysisResults,
        overall_score: analysisResults.overallScore,
        keyword_match: analysisResults.keywordMatch,
        skills_alignment: analysisResults.skillsAlignment,
        ats_compatibility: analysisResults.atsCompatibility,
        experience_relevance: analysisResults.experienceRelevance,
        suggestions: analysisResults.suggestions,
      })
      .select()
      .single();

    if (analysisError) {
      throw analysisError;
    }

    // Deduct credit from user
    await supabaseAdmin
      .from("profiles")
      .update({ 
        credits: profile.credits - 1,
        updated_at: new Date().toISOString()
      })
      .eq("id", user.id);

    return new Response(JSON.stringify(analysisResults), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    console.error("Analysis error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

// AI Analysis function (simplified version - in production, use OpenAI/Claude)
async function performResumeAnalysis(resumeText: string, jobDescription: string) {
  // Convert to lowercase for analysis
  const resume = resumeText.toLowerCase();
  const jobDesc = jobDescription.toLowerCase();

  // Extract keywords from job description
  const jobKeywords = extractKeywords(jobDesc);
  const resumeKeywords = extractKeywords(resume);

  // Calculate keyword match
  const matchingKeywords = jobKeywords.filter(keyword => 
    resume.includes(keyword.toLowerCase())
  );
  const keywordMatch = Math.round((matchingKeywords.length / jobKeywords.length) * 100);

  // Calculate other scores (simplified scoring logic)
  const skillsAlignment = calculateSkillsAlignment(resume, jobDesc);
  const atsCompatibility = calculateATSCompatibility(resumeText);
  const experienceRelevance = calculateExperienceRelevance(resume, jobDesc);

  // Overall score (weighted average)
  const overallScore = Math.round(
    (keywordMatch * 0.3) +
    (skillsAlignment * 0.25) +
    (atsCompatibility * 0.2) +
    (experienceRelevance * 0.25)
  );

  // Generate suggestions
  const suggestions = generateSuggestions(resume, jobDesc, matchingKeywords, jobKeywords);

  return {
    overallScore,
    keywordMatch,
    skillsAlignment,
    atsCompatibility,
    experienceRelevance,
    suggestions,
    matchingKeywords: matchingKeywords.length,
    totalKeywords: jobKeywords.length
  };
}

function extractKeywords(text: string): string[] {
  // Common technical and professional keywords
  const commonKeywords = [
    'javascript', 'python', 'react', 'node', 'sql', 'aws', 'docker', 'kubernetes',
    'management', 'leadership', 'analysis', 'strategy', 'marketing', 'sales',
    'communication', 'teamwork', 'problem solving', 'agile', 'scrum'
  ];

  return commonKeywords.filter(keyword => text.includes(keyword));
}

function calculateSkillsAlignment(resume: string, jobDesc: string): number {
  const techSkills = ['javascript', 'python', 'react', 'sql', 'aws'];
  const softSkills = ['leadership', 'communication', 'teamwork', 'management'];
  
  let score = 60; // Base score
  
  techSkills.forEach(skill => {
    if (jobDesc.includes(skill) && resume.includes(skill)) {
      score += 8;
    }
  });
  
  softSkills.forEach(skill => {
    if (jobDesc.includes(skill) && resume.includes(skill)) {
      score += 5;
    }
  });
  
  return Math.min(score, 100);
}

function calculateATSCompatibility(resumeText: string): number {
  let score = 70; // Base score
  
  // Check for proper formatting indicators
  if (resumeText.includes('•') || resumeText.includes('-')) score += 5;
  if (resumeText.match(/\d{4}/g)) score += 5; // Years
  if (resumeText.match(/[A-Z][a-z]+ \d{4}/g)) score += 5; // Dates
  if (resumeText.includes('@')) score += 5; // Email
  if (resumeText.match(/\(\d{3}\)/)) score += 5; // Phone
  
  return Math.min(score, 95);
}

function calculateExperienceRelevance(resume: string, jobDesc: string): number {
  let score = 65; // Base score
  
  // Look for years of experience mentioned
  const yearsInResume = resume.match(/(\d+)\+?\s*years?/gi);
  const yearsInJob = jobDesc.match(/(\d+)\+?\s*years?/gi);
  
  if (yearsInResume && yearsInJob) {
    score += 10;
  }
  
  // Industry-specific terms
  const industries = ['healthcare', 'finance', 'technology', 'education', 'retail'];
  industries.forEach(industry => {
    if (jobDesc.includes(industry) && resume.includes(industry)) {
      score += 5;
    }
  });
  
  return Math.min(score, 100);
}

function generateSuggestions(resume: string, jobDesc: string, matchingKeywords: string[], allKeywords: string[]) {
  const suggestions = [];
  
  // Missing keywords
  const missingKeywords = allKeywords.filter(keyword => !matchingKeywords.includes(keyword));
  if (missingKeywords.length > 0) {
    suggestions.push({
      type: 'keywords',
      priority: 'high',
      title: 'Add Missing Keywords',
      description: `Consider adding these relevant keywords: ${missingKeywords.slice(0, 5).join(', ')}`,
      action: 'Add to your skills or experience sections'
    });
  }
  
  // Quantification
  if (!resume.match(/\d+%|\d+\$|\d+k|\d+ million/gi)) {
    suggestions.push({
      type: 'quantification',
      priority: 'medium',
      title: 'Quantify Your Achievements',
      description: 'Add specific numbers, percentages, or dollar amounts to your accomplishments',
      action: 'Replace vague terms with concrete metrics'
    });
  }
  
  // Action verbs
  const weakVerbs = ['responsible for', 'worked on', 'helped with'];
  const hasWeakVerbs = weakVerbs.some(verb => resume.includes(verb));
  if (hasWeakVerbs) {
    suggestions.push({
      type: 'language',
      priority: 'medium',
      title: 'Use Stronger Action Verbs',
      description: 'Replace passive language with dynamic action verbs',
      action: 'Use verbs like "achieved", "implemented", "optimized", "led"'
    });
  }
  
  return suggestions;
}
