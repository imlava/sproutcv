
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

    // Perform AI analysis with enhanced matching logic
    const analysisResults = await performEnhancedResumeAnalysis(resume_text, job_description, job_title);

    // Save analysis to database first
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
      console.error("Analysis save error:", analysisError);
      throw analysisError;
    }

    // Use the secure function to consume credits
    const { data: creditResult, error: creditError } = await supabaseAdmin.rpc(
      'consume_analysis_credit',
      {
        target_user_id: user.id,
        analysis_id: analysis.id
      }
    );

    if (creditError || !creditResult) {
      console.error("Credit consumption error:", creditError);
      await supabaseAdmin
        .from("resume_analyses")
        .delete()
        .eq("id", analysis.id);
      
      throw new Error("Failed to process credit transaction");
    }

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

// Enhanced AI Analysis function
async function performEnhancedResumeAnalysis(resumeText: string, jobDescription: string, jobTitle?: string) {
  const resume = resumeText.toLowerCase();
  const jobDesc = jobDescription.toLowerCase();

  // Extract comprehensive keywords and skills
  const { jobKeywords, resumeKeywords, technicalSkills, softSkills } = extractComprehensiveKeywords(jobDesc, resume);

  // Calculate detailed matching scores
  const matchingKeywords = jobKeywords.filter(keyword => 
    resume.includes(keyword.toLowerCase())
  );
  const keywordMatch = Math.round((matchingKeywords.length / jobKeywords.length) * 100);

  // Enhanced calculations
  const skillsAlignment = calculateEnhancedSkillsAlignment(resume, jobDesc, technicalSkills, softSkills);
  const atsCompatibility = calculateATSCompatibility(resumeText);
  const experienceRelevance = calculateEnhancedExperienceRelevance(resume, jobDesc, jobTitle);
  
  // Experience mismatch detection
  const experienceMismatch = detectExperienceMismatch(resume, jobDesc, jobTitle);
  
  // Overall score with enhanced weighting
  let overallScore = Math.round(
    (keywordMatch * 0.35) +
    (skillsAlignment * 0.25) +
    (atsCompatibility * 0.15) +
    (experienceRelevance * 0.25)
  );

  // Apply penalty for major mismatches
  if (experienceMismatch.severity === 'high') {
    overallScore = Math.max(overallScore - 30, 10);
  } else if (experienceMismatch.severity === 'medium') {
    overallScore = Math.max(overallScore - 15, 20);
  }

  // Generate enhanced suggestions
  const suggestions = generateEnhancedSuggestions(
    resume, 
    jobDesc, 
    matchingKeywords, 
    jobKeywords, 
    experienceMismatch,
    overallScore
  );

  return {
    overallScore,
    keywordMatch,
    skillsAlignment,
    atsCompatibility,
    experienceRelevance,
    experienceMismatch,
    suggestions,
    matchingKeywords: matchingKeywords.length,
    totalKeywords: jobKeywords.length,
    recommendedRoles: experienceMismatch.severity !== 'none' ? suggestBetterMatchingRoles(resume) : []
  };
}

function extractComprehensiveKeywords(jobDesc: string, resume: string) {
  // Technical skills database
  const technicalSkills = [
    // Programming Languages
    'javascript', 'python', 'java', 'typescript', 'c++', 'c#', 'php', 'ruby', 'go', 'rust',
    'swift', 'kotlin', 'scala', 'r', 'matlab', 'sql', 'html', 'css',
    
    // Frameworks & Libraries
    'react', 'angular', 'vue', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
    'jquery', 'bootstrap', 'tailwind', 'next.js', 'nuxt.js', 'gatsby',
    
    // Databases
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite',
    'dynamodb', 'cassandra', 'neo4j',
    
    // Cloud & DevOps
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github',
    'terraform', 'ansible', 'chef', 'puppet', 'nagios', 'prometheus',
    
    // Tools & Technologies
    'git', 'jira', 'confluence', 'slack', 'trello', 'asana', 'figma', 'sketch',
    'adobe', 'photoshop', 'illustrator', 'indesign'
  ];

  const softSkills = [
    'leadership', 'management', 'communication', 'teamwork', 'collaboration',
    'problem solving', 'analytical', 'critical thinking', 'creativity', 'innovation',
    'project management', 'time management', 'organization', 'planning',
    'presentation', 'public speaking', 'writing', 'research'
  ];

  const industryTerms = [
    'agile', 'scrum', 'kanban', 'devops', 'ci/cd', 'microservices', 'api',
    'machine learning', 'artificial intelligence', 'data science', 'analytics',
    'cybersecurity', 'blockchain', 'iot', 'mobile development', 'web development'
  ];

  // Extract job keywords
  const allKeywords = [...technicalSkills, ...softSkills, ...industryTerms];
  const jobKeywords = allKeywords.filter(keyword => jobDesc.includes(keyword));
  const resumeKeywords = allKeywords.filter(keyword => resume.includes(keyword));

  return { jobKeywords, resumeKeywords, technicalSkills, softSkills };
}

function calculateEnhancedSkillsAlignment(resume: string, jobDesc: string, technicalSkills: string[], softSkills: string[]) {
  let score = 50; // Base score
  
  // Technical skills matching
  const jobTechSkills = technicalSkills.filter(skill => jobDesc.includes(skill));
  const resumeTechSkills = technicalSkills.filter(skill => resume.includes(skill));
  const techMatches = jobTechSkills.filter(skill => resumeTechSkills.includes(skill));
  
  if (jobTechSkills.length > 0) {
    score += Math.round((techMatches.length / jobTechSkills.length) * 30);
  }
  
  // Soft skills matching
  const jobSoftSkills = softSkills.filter(skill => jobDesc.includes(skill));
  const resumeSoftSkills = softSkills.filter(skill => resume.includes(skill));
  const softMatches = jobSoftSkills.filter(skill => resumeSoftSkills.includes(skill));
  
  if (jobSoftSkills.length > 0) {
    score += Math.round((softMatches.length / jobSoftSkills.length) * 20);
  }
  
  return Math.min(score, 100);
}

function calculateEnhancedExperienceRelevance(resume: string, jobDesc: string, jobTitle?: string) {
  let score = 60; // Base score
  
  // Extract years of experience
  const resumeYears = extractYearsOfExperience(resume);
  const jobYears = extractYearsOfExperience(jobDesc);
  
  if (resumeYears && jobYears) {
    if (resumeYears >= jobYears) score += 15;
    else if (resumeYears >= jobYears * 0.7) score += 10;
    else if (resumeYears >= jobYears * 0.5) score += 5;
  }
  
  // Industry and role alignment
  const industries = ['healthcare', 'finance', 'technology', 'education', 'retail', 'consulting', 'marketing'];
  industries.forEach(industry => {
    if (jobDesc.includes(industry) && resume.includes(industry)) {
      score += 3;
    }
  });
  
  // Role-specific terms
  if (jobTitle) {
    const roleTerms = jobTitle.toLowerCase().split(' ');
    roleTerms.forEach(term => {
      if (term.length > 2 && resume.includes(term)) {
        score += 2;
      }
    });
  }
  
  return Math.min(score, 100);
}

function detectExperienceMismatch(resume: string, jobDesc: string, jobTitle?: string) {
  const warnings = [];
  let severity = 'none';
  
  // Check for major role mismatches
  const seniorityLevels = {
    'entry': ['entry', 'junior', 'associate', 'trainee', 'intern'],
    'mid': ['mid-level', 'senior', 'lead'],
    'senior': ['senior', 'principal', 'staff', 'lead', 'manager', 'director']
  };
  
  const jobSeniority = detectSeniority(jobDesc + ' ' + (jobTitle || ''));
  const resumeSeniority = detectSeniority(resume);
  
  if (jobSeniority === 'senior' && resumeSeniority === 'entry') {
    warnings.push("This appears to be a senior-level position, but your resume shows entry-level experience.");
    severity = 'high';
  }
  
  // Check for technical vs non-technical mismatch
  const techKeywords = ['developer', 'engineer', 'programmer', 'coding', 'software', 'technical'];
  const jobIsTech = techKeywords.some(keyword => (jobTitle || '').toLowerCase().includes(keyword) || jobDesc.includes(keyword));
  const resumeIsTech = techKeywords.some(keyword => resume.includes(keyword));
  
  if (jobIsTech && !resumeIsTech) {
    warnings.push("This appears to be a technical role, but your resume doesn't show technical experience.");
    severity = severity === 'none' ? 'high' : severity;
  }
  
  // Check for experience gaps
  const resumeYears = extractYearsOfExperience(resume);
  const jobYears = extractYearsOfExperience(jobDesc);
  
  if (jobYears && resumeYears && resumeYears < jobYears * 0.5) {
    warnings.push(`This role requires ${jobYears}+ years of experience, but you appear to have ${resumeYears} years.`);
    severity = severity === 'none' ? 'medium' : severity;
  }
  
  return { warnings, severity };
}

function detectSeniority(text: string) {
  const seniorTerms = ['senior', 'principal', 'staff', 'lead', 'manager', 'director'];
  const midTerms = ['mid-level', 'intermediate'];
  const entryTerms = ['entry', 'junior', 'associate', 'trainee', 'intern'];
  
  if (seniorTerms.some(term => text.includes(term))) return 'senior';
  if (midTerms.some(term => text.includes(term))) return 'mid';
  if (entryTerms.some(term => text.includes(term))) return 'entry';
  
  return 'mid'; // Default
}

function extractYearsOfExperience(text: string): number | null {
  const yearPatterns = [
    /(\d+)\+?\s*years?\s*of\s*experience/gi,
    /(\d+)\+?\s*years?\s*experience/gi,
    /experience\s*of\s*(\d+)\+?\s*years?/gi,
    /(\d+)\+?\s*yrs/gi
  ];
  
  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match) {
      const years = parseInt(match[0].match(/\d+/)?.[0] || '0');
      if (years > 0) return years;
    }
  }
  
  return null;
}

function suggestBetterMatchingRoles(resume: string) {
  const suggestions = [];
  
  // Analyze resume content to suggest better roles
  if (resume.includes('marketing') || resume.includes('social media')) {
    suggestions.push('Marketing Specialist', 'Social Media Manager', 'Content Creator');
  }
  
  if (resume.includes('sales') || resume.includes('customer')) {
    suggestions.push('Sales Representative', 'Customer Success Manager', 'Account Manager');
  }
  
  if (resume.includes('design') || resume.includes('creative')) {
    suggestions.push('Graphic Designer', 'UI/UX Designer', 'Creative Director');
  }
  
  if (resume.includes('data') || resume.includes('analysis')) {
    suggestions.push('Data Analyst', 'Business Analyst', 'Research Analyst');
  }
  
  return suggestions.slice(0, 3); // Return top 3 suggestions
}

function calculateATSCompatibility(resumeText: string): number {
  let score = 70; // Base score
  
  // Check for proper formatting indicators
  if (resumeText.includes('•') || resumeText.includes('-')) score += 5;
  if (resumeText.match(/\d{4}/g)) score += 5; // Years
  if (resumeText.match(/[A-Z][a-z]+ \d{4}/g)) score += 5; // Dates
  if (resumeText.includes('@')) score += 5; // Email
  if (resumeText.match(/\(\d{3}\)/)) score += 5; // Phone
  
  // Penalize for problematic formatting
  if (resumeText.includes('│') || resumeText.includes('─')) score -= 10; // Tables
  if (resumeText.match(/\s{10,}/g)) score -= 5; // Excessive spacing
  
  return Math.min(score, 95);
}

function generateEnhancedSuggestions(resume: string, jobDesc: string, matchingKeywords: string[], allKeywords: string[], experienceMismatch: any, overallScore: number) {
  const suggestions = [];
  
  // Experience mismatch warnings
  if (experienceMismatch.severity === 'high') {
    suggestions.push({
      type: 'warning',
      priority: 'high',
      title: 'Significant Experience Mismatch Detected',
      description: experienceMismatch.warnings.join(' '),
      action: 'Consider applying to roles that better match your experience level, or click "Proceed" if you still want to tailor your resume'
    });
  } else if (experienceMismatch.severity === 'medium') {
    suggestions.push({
      type: 'caution',
      priority: 'medium',
      title: 'Potential Experience Gap',
      description: experienceMismatch.warnings.join(' '),
      action: 'Consider highlighting transferable skills or relevant projects'
    });
  }
  
  // Missing keywords
  const missingKeywords = allKeywords.filter(keyword => !matchingKeywords.includes(keyword));
  if (missingKeywords.length > 0) {
    suggestions.push({
      type: 'keywords',
      priority: 'high',
      title: 'Add Missing Keywords',
      description: `Consider adding these relevant keywords: ${missingKeywords.slice(0, 8).join(', ')}`,
      action: 'Incorporate these terms naturally into your experience and skills sections'
    });
  }
  
  // Quantification suggestions
  if (!resume.match(/\d+%|\d+\$|\d+k|\d+ million|\d+x increase|\d+ team/gi)) {
    suggestions.push({
      type: 'quantification',
      priority: 'high',
      title: 'Quantify Your Achievements',
      description: 'Add specific numbers, percentages, or dollar amounts to your accomplishments',
      action: 'Replace vague terms like "increased sales" with "increased sales by 25%" or "managed team of 8"'
    });
  }
  
  // Action verbs improvement
  const weakVerbs = ['responsible for', 'worked on', 'helped with', 'involved in', 'participated in'];
  const hasWeakVerbs = weakVerbs.some(verb => resume.includes(verb));
  if (hasWeakVerbs) {
    suggestions.push({
      type: 'language',
      priority: 'medium',
      title: 'Use Stronger Action Verbs',
      description: 'Replace passive language with dynamic action verbs',
      action: 'Use verbs like "achieved", "implemented", "optimized", "led", "designed", "developed"'
    });
  }
  
  // Low overall score suggestions
  if (overallScore < 40) {
    suggestions.push({
      type: 'major_revision',
      priority: 'high',
      title: 'Major Resume Revision Needed',
      description: 'Your resume needs significant changes to match this job description',
      action: 'Consider restructuring your resume to better highlight relevant experience and skills'
    });
  }
  
  return suggestions;
}
