
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import OpenAI from "https://deno.land/x/openai@v4.58.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const resume_text = body.resumeText ?? body.resume_text;
    const job_description = body.jobDescription ?? body.job_description;
    const job_title = body.jobTitle ?? body.job_title;
    const company_name = body.companyName ?? body.company_name;

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

  // Initialize OpenAI
  const openai = new OpenAI({ apiKey: Deno.env.get("OPENAI_API_KEY") });

  // Get embeddings for semantic matching
  const [resumeEmbedding, jobEmbedding] = await Promise.all([
    openai.embeddings.create({
      model: "text-embedding-3-small",
      input: resumeText
    }),
    openai.embeddings.create({
      model: "text-embedding-3-small",
      input: jobDescription
    })
  ]);

  // Calculate semantic similarity
  const semanticSimilarity = calculateCosineSimilarity(
    resumeEmbedding.data[0].embedding,
    jobEmbedding.data[0].embedding
  );

  // Extract comprehensive keywords and skills with semantic context
  const { jobKeywords, resumeKeywords, technicalSkills, softSkills } = await extractComprehensiveKeywords(
    jobDesc, 
    resume,
    semanticSimilarity
  );

  // Calculate detailed matching scores
  const matchingKeywords = jobKeywords.filter(keyword => 
    resume.includes(keyword.toLowerCase())
  );
  const keywordMatch = Math.round((matchingKeywords.length / jobKeywords.length) * 100);

  // Enhanced calculations
  const skillsAlignment = calculateEnhancedSkillsAlignment(resume, jobDesc, technicalSkills, softSkills);
  const atsCompatibility = calculateATSCompatibility(resumeText);
  const experienceRelevance = calculateEnhancedExperienceRelevance(resume, jobDesc, jobTitle, semanticSimilarity);
  
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

function calculateEnhancedExperienceRelevance(resume: string, jobDesc: string, jobTitle?: string, semanticSimilarity: number) {
  let score = 50; // Lower base score to allow more room for detailed analysis
  
  // Extract detailed experience information
  const resumeExp = extractDetailedExperience(resume);
  const jobExp = extractDetailedExperience(jobDesc);
  
  // Compare role levels with more granular scoring
  if (resumeExp.level >= jobExp.level) {
    score += 15;
  } else if (resumeExp.level >= jobExp.level * 0.8) {
    score += 10;
  } else if (resumeExp.level >= jobExp.level * 0.6) {
    score += 5;
  }
  
  // Compare years of experience with context
  if (resumeExp.years && jobExp.years) {
    if (resumeExp.years >= jobExp.years) {
      score += 15;
    } else if (resumeExp.years >= jobExp.years * 0.8) {
      score += 10;
    } else if (resumeExp.years >= jobExp.years * 0.6) {
      score += 5;
    }
  }
  
  // Industry alignment with weighted scoring
  const industries = {
    'healthcare': ['medical', 'clinical', 'patient', 'health'],
    'finance': ['banking', 'investment', 'financial', 'trading'],
    'technology': ['software', 'tech', 'digital', 'IT'],
    'education': ['teaching', 'academic', 'education', 'learning'],
    'retail': ['retail', 'ecommerce', 'sales', 'store'],
    'consulting': ['consulting', 'advisory', 'strategy', 'management'],
    'marketing': ['marketing', 'advertising', 'brand', 'digital marketing']
  };
  
  let industryScore = 0;
  Object.entries(industries).forEach(([industry, terms]) => {
    const jobMatch = terms.some(term => jobDesc.includes(term));
    const resumeMatch = terms.some(term => resume.includes(term));
    if (jobMatch && resumeMatch) {
      industryScore += 5;
    }
  });
  score += Math.min(industryScore, 15);
  
  // Role-specific terms with context
  if (jobTitle) {
    const roleTerms = extractRoleTerms(jobTitle);
    const matchedTerms = roleTerms.filter(term => 
      resume.toLowerCase().includes(term.toLowerCase())
    );
    score += Math.min(matchedTerms.length * 3, 10);
  }
  
  // Add semantic similarity boost
  score += Math.round(semanticSimilarity * 10);
  
  return Math.min(score, 100);
}

function extractDetailedExperience(text: string) {
  const levelIndicators = {
    entry: ['entry', 'junior', 'associate', 'intern', 'graduate'],
    mid: ['mid', 'intermediate', 'regular', 'experienced'],
    senior: ['senior', 'lead', 'principal', 'architect', 'head', 'manager', 'director']
  };
  
  // Calculate experience level (1-3)
  let level = 1;
  for (const [key, indicators] of Object.entries(levelIndicators)) {
    if (indicators.some(i => text.toLowerCase().includes(i))) {
      level = key === 'entry' ? 1 : key === 'mid' ? 2 : 3;
      break;
    }
  }
  
  // Extract years of experience with multiple patterns
  const yearPatterns = [
    /(\d+)\+?\s*years?\s*of\s*experience/i,
    /(\d+)\+?\s*years?\s*experience/i,
    /experience\s*of\s*(\d+)\+?\s*years?/i,
    /(\d+)\+?\s*yrs/i,
    /(\d+)\+?\s*years?\s*in\s*(?:the\s*)?(?:industry|field)/i
  ];
  
  let years = 0;
  for (const pattern of yearPatterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      const extracted = parseInt(match[1]);
      if (extracted > years) years = extracted;
    }
  }
  
  return { level, years };
}

function extractRoleTerms(jobTitle: string): string[] {
  const terms = jobTitle.toLowerCase().split(/\s+/);
  return terms.filter(term => 
    term.length > 2 && 
    !['and', 'the', 'for', 'with'].includes(term)
  );
}

function detectExperienceMismatch(resume: string, jobDesc: string, jobTitle?: string) {
  const warnings = [];
  let severity = 'none';
  
  // Only proceed with mismatch detection if we have meaningful job requirements
  if (!jobTitle && !jobDesc.trim()) {
    return { warnings, severity };
  }
  
  const jobTitleLower = (jobTitle || '').toLowerCase();
  const jobDescLower = jobDesc.toLowerCase();
  const resumeLower = resume.toLowerCase();
  
  // Robust technical role detection
  const strongTechIndicators = [
    'software engineer', 'software developer', 'full stack developer', 'backend developer', 
    'frontend developer', 'senior engineer', 'staff engineer', 'principal engineer',
    'devops engineer', 'platform engineer', 'data engineer', 'machine learning engineer'
  ];
  
  const techSkillsRequired = [
    'programming', 'coding', 'javascript', 'python', 'java', 'react', 'node.js',
    'sql', 'database', 'api', 'git', 'docker', 'kubernetes', 'aws', 'azure'
  ];
  
  // Check if job explicitly requires technical skills
  const jobRequiresTech = strongTechIndicators.some(indicator => 
    jobTitleLower.includes(indicator) || jobDescLower.includes(indicator)
  ) || techSkillsRequired.filter(skill => jobDescLower.includes(skill)).length >= 3;
  
  // Check if resume shows technical experience
  const resumeShowsTech = techSkillsRequired.filter(skill => 
    resumeLower.includes(skill)
  ).length >= 2 || ['developer', 'engineer', 'programming', 'software'].some(term => 
    resumeLower.includes(term)
  );
  
  // Only flag major mismatch for clearly technical roles
  if (jobRequiresTech && !resumeShowsTech) {
    warnings.push("This position requires technical programming skills, but your resume doesn't demonstrate software development experience.");
    severity = 'high';
  }
  
  // Enhanced seniority detection with clear thresholds
  const jobSeniority = detectSeniority(jobDescLower + ' ' + jobTitleLower);
  const resumeSeniority = detectSeniority(resumeLower);
  
  // Only flag major seniority mismatches
  if (jobSeniority === 'senior' && resumeSeniority === 'entry') {
    const resumeYears = extractYearsOfExperience(resumeLower);
    const jobYears = extractYearsOfExperience(jobDescLower);
    
    // Be more lenient - only flag if there's a significant gap
    if ((jobYears && resumeYears && resumeYears < jobYears * 0.4) || 
        (!resumeYears && (jobDescLower.includes('5+ years') || jobDescLower.includes('senior')))) {
      warnings.push(`This appears to be a senior-level position requiring significant experience. Consider if your background aligns with senior-level responsibilities.`);
      severity = severity === 'none' ? 'medium' : severity;
    }
  }
  
  return { warnings, severity };
}

function detectSeniority(text: string) {
  // Look for explicit seniority indicators with context
  const seniorIndicators = [
    'senior', 'sr.', 'principal', 'staff', 'lead', 'head of', 'director', 
    'vp ', 'vice president', 'chief', 'architect', 'team lead'
  ];
  
  const entryIndicators = [
    'entry level', 'junior', 'jr.', 'associate', 'trainee', 'intern', 
    'graduate', 'new grad', 'entry-level', 'assistant'
  ];
  
  const midIndicators = [
    'mid-level', 'intermediate', 'mid level', 'regular', 'standard'
  ];
  
  // Count matches to determine confidence
  const seniorMatches = seniorIndicators.filter(term => text.includes(term)).length;
  const entryMatches = entryIndicators.filter(term => text.includes(term)).length;
  const midMatches = midIndicators.filter(term => text.includes(term)).length;
  
  if (seniorMatches >= 1) return 'senior';
  if (entryMatches >= 1) return 'entry';
  if (midMatches >= 1) return 'mid';
  
  // Look for experience indicators
  const yearsMatch = text.match(/(\d+)\+?\s*years?/gi);
  if (yearsMatch) {
    const years = parseInt(yearsMatch[0].match(/\d+/)?.[0] || '0');
    if (years >= 5) return 'senior';
    if (years <= 2) return 'entry';
    return 'mid';
  }
  
  return 'mid'; // Default to mid-level if unclear
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

function calculateCosineSimilarity(embedding1: number[], embedding2: number[]): number {
  if (embedding1.length !== embedding2.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let norm1 = 0;
  let norm2 = 0;

  for (let i = 0; i < embedding1.length; i++) {
    dotProduct += embedding1[i] * embedding2[i];
    norm1 += embedding1[i] * embedding1[i];
    norm2 += embedding2[i] * embedding2[i];
  }

  return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
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
