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
    console.log("=== ADVANCED RESUME ANALYZER v2.0 START ===");
    
    // Step 1: Parse request body
    let body;
    try {
      const rawBody = await req.text();
      if (!rawBody?.trim()) {
        return createErrorResponse("Empty request body", "EMPTY_BODY", 400);
      }
      body = JSON.parse(rawBody);
    } catch (parseError) {
      return createErrorResponse("Invalid JSON format", "INVALID_JSON", 400);
    }

    // Step 2: Extract and validate inputs
    const resumeText = body.resumeText ?? body.resume_text ?? '';
    const jobDescription = body.jobDescription ?? body.job_description ?? '';
    const jobTitle = body.jobTitle ?? body.job_title ?? 'Position';
    const companyName = body.companyName ?? body.company_name ?? 'Company';

    if (!resumeText?.trim() || !jobDescription?.trim()) {
      return createErrorResponse("Missing resume or job description", "MISSING_INPUT", 400);
    }
    if (resumeText.length < 50 || jobDescription.length < 50) {
      return createErrorResponse("Input too short for analysis", "INPUT_TOO_SHORT", 400);
    }

    // Step 3: Environment and authentication
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      return createErrorResponse("Server configuration error", "CONFIG_ERROR", 500);
    }

    const supabase = createClient(supabaseUrl, serviceKey);
    const authHeader = req.headers.get("Authorization");
    
    if (!authHeader?.startsWith("Bearer ")) {
      return createErrorResponse("Invalid authorization", "AUTH_INVALID", 401);
    }

    const token = authHeader.replace("Bearer ", "");
    const { data, error } = await supabase.auth.getUser(token);
    
    if (error || !data.user) {
      return createErrorResponse("Authentication failed", "AUTH_FAILED", 401);
    }

    const user = data.user;

    // Step 4: Check credits
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("credits")
      .eq("id", user.id)
      .single();

    if (profileError || !profile || profile.credits <= 0) {
      return createErrorResponse("Insufficient credits", "NO_CREDITS", 402);
    }

    // Step 5: Perform ADVANCED analysis
    console.log("🚀 Starting Industry-Leading Analysis...");
    const analysisResults = await performAdvancedAnalysis(resumeText, jobDescription, jobTitle, companyName);

    // Step 6: Save to database
    const { data: analysis, error: saveError } = await supabase
      .from("resume_analyses")
      .insert({
        user_id: user.id,
        job_title: jobTitle,
        company_name: companyName,
        resume_text: resumeText.substring(0, 8000),
        job_description: jobDescription.substring(0, 4000),
        analysis_results: analysisResults,
        overall_score: analysisResults.overallScore,
        keyword_match: analysisResults.keywordMatch,
        skills_alignment: analysisResults.skillsAlignment,
        ats_compatibility: analysisResults.atsCompatibility,
        experience_relevance: analysisResults.experienceRelevance,
        suggestions: analysisResults.suggestions
      })
      .select()
      .single();

    if (saveError) {
      return createErrorResponse("Failed to save analysis", "SAVE_ERROR", 500);
    }

    // Step 7: Consume credit
    const { error: creditError } = await supabase.rpc('consume_analysis_credit', {
      target_user_id: user.id,
      analysis_id: analysis.id
    });

    if (creditError) {
      await supabase.from("resume_analyses").delete().eq("id", analysis.id);
      return createErrorResponse("Credit processing failed", "CREDIT_ERROR", 500);
    }

    console.log("✨ Advanced analysis completed successfully");
    return new Response(JSON.stringify({
      ...analysisResults,
      success: true,
      timestamp: new Date().toISOString(),
      version: "2.0-advanced"
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (unexpectedError) {
    console.error("=== UNEXPECTED ERROR ===", unexpectedError);
    return createErrorResponse("Unexpected error occurred", "UNEXPECTED_ERROR", 500);
  }
});

function createErrorResponse(message: string, code: string, status: number) {
  return new Response(
    JSON.stringify({ error: message, code, timestamp: new Date().toISOString() }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" }, status }
  );
}

// ========================================================================================
// ADVANCED ANALYSIS ENGINE - Industry-Leading Resume Intelligence
// ========================================================================================

async function performAdvancedAnalysis(resumeText: string, jobDescription: string, jobTitle: string, companyName: string) {
  console.log("🚀 Advanced Analysis Engine v2.0 - Best in Industry");
  
  // Advanced Analysis Pipeline
  const keywordAnalysis = performAdvancedKeywordAnalysis(resumeText, jobDescription);
  const atsAnalysis = performComprehensiveATSAnalysis(resumeText);
  const skillsAnalysis = performSkillsIntelligenceAnalysis(resumeText, jobDescription, jobTitle);
  const experienceAnalysis = performExperienceRelevanceAnalysis(resumeText, jobDescription, jobTitle);
  const industryBenchmark = performIndustryBenchmarking(jobDescription, companyName);
  const intelligentScoring = calculateIntelligentScores(keywordAnalysis, atsAnalysis, skillsAnalysis, experienceAnalysis, industryBenchmark);
  const tailoredSuggestions = generateTailoredSuggestions(keywordAnalysis, atsAnalysis, skillsAnalysis, experienceAnalysis, intelligentScoring);
  const actionPlan = createPersonalizedActionPlan(tailoredSuggestions, intelligentScoring);
  
  return {
    // Enhanced Core Scores
    overallScore: intelligentScoring.overallScore,
    keywordMatch: keywordAnalysis.matchScore,
    skillsAlignment: skillsAnalysis.alignmentScore,
    atsCompatibility: atsAnalysis.overallScore,
    experienceRelevance: experienceAnalysis.relevanceScore,
    
    // Advanced Analytics
    keywordGapAnalysis: keywordAnalysis,
    atsOptimization: atsAnalysis,
    skillsBreakdown: skillsAnalysis,
    experienceInsights: experienceAnalysis,
    industryBenchmark: industryBenchmark,
    
    // Actionable Intelligence
    suggestions: tailoredSuggestions,
    actionPlan: actionPlan,
    competitorAnalysis: getCompetitorInsights(intelligentScoring),
    
    // Enhanced Metadata
    analysisTimestamp: new Date().toISOString(),
    matchingKeywords: keywordAnalysis.matchingKeywords.length,
    totalKeywords: keywordAnalysis.totalJobKeywords,
    confidenceScore: intelligentScoring.confidenceScore,
    processingVersion: "advanced-v2.0",
    
    // Industry Leadership Features
    industryRanking: calculateIndustryRanking(intelligentScoring.overallScore),
    improvementPotential: calculateImprovementPotential(intelligentScoring),
    strengthsAndWeaknesses: identifyStrengthsAndWeaknesses(keywordAnalysis, atsAnalysis, skillsAnalysis, experienceAnalysis)
  };
}

// ========================================================================================
// ADVANCED KEYWORD GAP ANALYSIS
// ========================================================================================

function performAdvancedKeywordAnalysis(resumeText: string, jobDescription: string) {
  const resumeKeywords = extractAdvancedKeywords(resumeText);
  const jobKeywords = extractAdvancedKeywords(jobDescription);
  
  const exactMatches = findExactMatches(resumeKeywords, jobKeywords);
  const semanticMatches = findSemanticMatches(resumeKeywords, jobKeywords);
  const missingCritical = findMissingCriticalKeywords(jobKeywords, resumeKeywords, exactMatches, semanticMatches);
  
  const matchScore = calculateAdvancedMatchScore(exactMatches, semanticMatches, jobKeywords);
  
  return {
    matchScore: Math.max(Math.min(matchScore, 100), 0),
    exactMatches,
    semanticMatches,
    missingCritical,
    matchingKeywords: [...exactMatches, ...semanticMatches],
    totalJobKeywords: jobKeywords.technical.length + jobKeywords.soft.length + jobKeywords.industry.length,
    keywordDensity: calculateKeywordDensity(resumeText, [...exactMatches, ...semanticMatches]),
    recommendations: generateKeywordRecommendations(missingCritical)
  };
}

function extractAdvancedKeywords(text: string) {
  const normalizedText = text.toLowerCase();
  
  const technicalKeywords = [
    'javascript', 'typescript', 'python', 'java', 'c++', 'c#', 'php', 'ruby', 'go', 'rust', 'swift', 'kotlin',
    'react', 'angular', 'vue', 'svelte', 'node.js', 'express', 'django', 'flask', 'spring', 'laravel',
    'next.js', 'nuxt.js', 'gatsby', 'react native', 'flutter', 'xamarin',
    'mysql', 'postgresql', 'mongodb', 'redis', 'elasticsearch', 'oracle', 'sqlite', 'neo4j',
    'aws', 'azure', 'gcp', 'docker', 'kubernetes', 'jenkins', 'gitlab', 'github', 'terraform', 'ansible',
    'machine learning', 'deep learning', 'ai', 'tensorflow', 'pytorch', 'scikit-learn', 'pandas', 'numpy',
    'html', 'css', 'sass', 'webpack', 'api', 'rest', 'graphql', 'git', 'agile', 'scrum', 'testing'
  ];
  
  const softSkills = [
    'leadership', 'management', 'communication', 'teamwork', 'collaboration', 'problem solving',
    'analytical thinking', 'critical thinking', 'creativity', 'innovation', 'adaptability',
    'time management', 'organization', 'planning', 'presentation', 'mentoring', 'coaching'
  ];
  
  const industryTerms = [
    'fintech', 'healthtech', 'edtech', 'e-commerce', 'saas', 'b2b', 'b2c', 'startup', 'enterprise',
    'scalability', 'performance', 'security', 'compliance', 'automation', 'optimization'
  ];
  
  return {
    technical: technicalKeywords.filter(keyword => normalizedText.includes(keyword)),
    soft: softSkills.filter(skill => normalizedText.includes(skill)),
    industry: industryTerms.filter(term => normalizedText.includes(term))
  };
}

// ========================================================================================
// COMPREHENSIVE ATS OPTIMIZATION
// ========================================================================================

function performComprehensiveATSAnalysis(resumeText: string) {
  const formatAnalysis = analyzeFormat(resumeText);
  const structureAnalysis = analyzeStructure(resumeText);
  const contentAnalysis = analyzeContent(resumeText);
  const parseabilityAnalysis = analyzeParseability(resumeText);
  
  const overallScore = Math.round(
    (formatAnalysis.score * 0.25) + (structureAnalysis.score * 0.25) +
    (contentAnalysis.score * 0.25) + (parseabilityAnalysis.score * 0.25)
  );
  
  return {
    overallScore: Math.max(Math.min(overallScore, 100), 0),
    formatScore: formatAnalysis.score,
    structureScore: structureAnalysis.score,
    contentScore: contentAnalysis.score,
    parseabilityScore: parseabilityAnalysis.score,
    detailedAnalysis: {
      formatIssues: formatAnalysis.issues,
      structureIssues: structureAnalysis.issues,
      contentIssues: contentAnalysis.issues
    },
    optimizationTips: generateATSOptimizationTips(formatAnalysis, structureAnalysis, contentAnalysis),
    criticalIssues: identifyCriticalATSIssues(contentAnalysis),
    quickWins: identifyATSQuickWins(contentAnalysis)
  };
}

function analyzeFormat(resumeText: string) {
  const issues = [];
  let score = 100;
  
  if (resumeText.includes('│') || resumeText.includes('─')) {
    issues.push('Complex table formatting detected');
    score -= 20;
  }
  if (resumeText.match(/\s{5,}/g)) {
    issues.push('Excessive spacing detected');
    score -= 10;
  }
  
  return { score: Math.max(score, 0), issues };
}

function analyzeStructure(resumeText: string) {
  const issues = [];
  let score = 100;
  
  const sections = {
    contact: /(?:email|phone|address)/i.test(resumeText),
    experience: /(?:experience|employment|work)/i.test(resumeText),
    education: /(?:education|degree|university)/i.test(resumeText),
    skills: /(?:skills|technical|competencies)/i.test(resumeText)
  };
  
  Object.entries(sections).forEach(([section, found]) => {
    if (!found) {
      issues.push(`Missing ${section} section`);
      score -= 15;
    }
  });
  
  return { score: Math.max(score, 0), issues };
}

function analyzeContent(resumeText: string) {
  const issues = [];
  let score = 100;
  
  const hasEmail = resumeText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const hasPhone = resumeText.match(/[\+]?[\d\s\-\(\)]{10,}/);
  const hasQuantified = resumeText.match(/\d+%|\d+\$|\d+k|\d+ million|\d+x/i);
  
  if (!hasEmail) { issues.push('Missing email address'); score -= 25; }
  if (!hasPhone) { issues.push('Missing phone number'); score -= 15; }
  if (!hasQuantified) { issues.push('No quantified achievements'); score -= 15; }
  
  return { 
    score: Math.max(score, 0), 
    issues,
    hasEmail: !!hasEmail,
    hasPhone: !!hasPhone,
    hasQuantified: !!hasQuantified
  };
}

function analyzeParseability(resumeText: string) {
  let score = 100;
  if (resumeText.length < 500) score -= 20;
  else if (resumeText.length > 8000) score -= 10;
  return { score: Math.max(score, 0), issues: [] };
}

// ========================================================================================
// SKILLS & EXPERIENCE ANALYSIS
// ========================================================================================

function performSkillsIntelligenceAnalysis(resumeText: string, jobDescription: string, jobTitle: string) {
  const resumeSkills = extractAdvancedKeywords(resumeText);
  const jobSkills = extractAdvancedKeywords(jobDescription);
  
  const technicalAlignment = calculateSkillAlignment(resumeSkills.technical, jobSkills.technical);
  const softAlignment = calculateSkillAlignment(resumeSkills.soft, jobSkills.soft);
  const industryAlignment = calculateSkillAlignment(resumeSkills.industry, jobSkills.industry);
  
  const overallAlignment = Math.round(
    (technicalAlignment * 0.5) + (softAlignment * 0.3) + (industryAlignment * 0.2)
  );
  
  return {
    alignmentScore: Math.max(Math.min(overallAlignment, 100), 0),
    technicalAlignment,
    softAlignment,
    industryAlignment,
    missingTechnicalSkills: jobSkills.technical.filter(skill => !resumeSkills.technical.includes(skill)),
    missingSoftSkills: jobSkills.soft.filter(skill => !resumeSkills.soft.includes(skill))
  };
}

function performExperienceRelevanceAnalysis(resumeText: string, jobDescription: string, jobTitle: string) {
  const resumeYears = extractYearsOfExperience(resumeText);
  const jobYears = extractYearsOfExperience(jobDescription);
  const seniorityMatch = analyzeSeniorityMatch(resumeText, jobTitle);
  
  let relevanceScore = 70;
  
  if (resumeYears >= jobYears) relevanceScore += 20;
  else if (resumeYears >= jobYears * 0.8) relevanceScore += 15;
  else if (resumeYears >= jobYears * 0.6) relevanceScore += 10;
  
  if (seniorityMatch.isGoodMatch) relevanceScore += 10;
  
  return {
    relevanceScore: Math.max(Math.min(relevanceScore, 100), 0),
    experienceYears: resumeYears,
    requiredYears: jobYears,
    seniorityMatch,
    experienceGap: Math.max(0, jobYears - resumeYears)
  };
}

function performIndustryBenchmarking(jobDescription: string, companyName: string) {
  const industry = detectIndustry(jobDescription, companyName);
  const benchmarkScores = {
    technology: 85, healthcare: 78, finance: 82, education: 75, retail: 70, consulting: 80
  };
  
  return {
    industry,
    benchmarkScore: benchmarkScores[industry] || 75,
    industryStandards: getIndustryStandards(industry)
  };
}

// ========================================================================================
// INTELLIGENT SCORING & RECOMMENDATIONS
// ========================================================================================

function calculateIntelligentScores(keywordAnalysis: any, atsAnalysis: any, skillsAnalysis: any, experienceAnalysis: any, industryBenchmark: any) {
  const weights = { keywords: 0.25, ats: 0.20, skills: 0.25, experience: 0.20, industry: 0.10 };
  
  const overallScore = Math.round(
    (keywordAnalysis.matchScore * weights.keywords) +
    (atsAnalysis.overallScore * weights.ats) +
    (skillsAnalysis.alignmentScore * weights.skills) +
    (experienceAnalysis.relevanceScore * weights.experience) +
    (industryBenchmark.benchmarkScore * weights.industry)
  );
  
  const confidenceScore = Math.round(
    (keywordAnalysis.totalJobKeywords > 10 ? 25 : 15) +
    (atsAnalysis.overallScore > 70 ? 25 : 15) +
    (skillsAnalysis.alignmentScore > 60 ? 25 : 15) +
    (experienceAnalysis.relevanceScore > 60 ? 25 : 15)
  );
  
  return {
    overallScore: Math.max(Math.min(overallScore, 100), 0),
    confidenceScore: Math.max(Math.min(confidenceScore, 100), 0)
  };
}

function generateTailoredSuggestions(keywordAnalysis: any, atsAnalysis: any, skillsAnalysis: any, experienceAnalysis: any, intelligentScoring: any) {
  const suggestions = [];
  
  if (keywordAnalysis.matchScore < 60) {
    suggestions.push(`🎯 CRITICAL: Add ${keywordAnalysis.missingCritical.slice(0, 3).join(', ')} to boost keyword match by ~${Math.round((100 - keywordAnalysis.matchScore) * 0.3)}%`);
  }
  
  if (atsAnalysis.overallScore < 70) {
    suggestions.push(`🤖 ATS URGENT: ${atsAnalysis.criticalIssues?.[0] || 'Fix formatting for better ATS parsing'}`);
  }
  
  if (skillsAnalysis.alignmentScore < 70) {
    const missingSkills = skillsAnalysis.missingTechnicalSkills.slice(0, 2);
    if (missingSkills.length > 0) {
      suggestions.push(`💪 SKILLS GAP: Highlight experience with ${missingSkills.join(' and ')} in your descriptions`);
    }
  }
  
  if (experienceAnalysis.experienceGap > 0) {
    suggestions.push(`📈 EXPERIENCE: Emphasize transferable skills to bridge ${experienceAnalysis.experienceGap}-year experience gap`);
  }
  
  suggestions.push("📊 IMPACT: Quantify 3-4 achievements with specific metrics (e.g., 'Increased efficiency by 35%')");
  suggestions.push("⚡ POWER WORDS: Use dynamic verbs like 'spearheaded', 'orchestrated', 'revolutionized'");
  
  if (intelligentScoring.overallScore >= 85) {
    suggestions.push("🌟 EXCELLENCE: Top-tier resume! Add industry certifications for extra competitive edge");
  }
  
  return suggestions.slice(0, 6);
}

function createPersonalizedActionPlan(suggestions: string[], intelligentScoring: any) {
  return {
    immediate: suggestions.filter(s => s.includes('CRITICAL') || s.includes('URGENT')),
    shortTerm: suggestions.filter(s => s.includes('SKILLS') || s.includes('IMPACT')),
    longTerm: suggestions.filter(s => s.includes('EXCELLENCE') || s.includes('EXPERIENCE')),
    estimatedImpact: `+${Math.round((100 - intelligentScoring.overallScore) * 0.5)}% score improvement potential`,
    timeToComplete: suggestions.length <= 3 ? '2-3 hours' : '4-6 hours'
  };
}

// ========================================================================================
// HELPER FUNCTIONS
// ========================================================================================

function findExactMatches(resumeKeywords: any, jobKeywords: any): string[] {
  const allResumeKeywords = [...resumeKeywords.technical, ...resumeKeywords.soft, ...resumeKeywords.industry];
  const allJobKeywords = [...jobKeywords.technical, ...jobKeywords.soft, ...jobKeywords.industry];
  
  return allJobKeywords.filter(jobKeyword => 
    allResumeKeywords.some(resumeKeyword => resumeKeyword.toLowerCase() === jobKeyword.toLowerCase())
  );
}

function findSemanticMatches(resumeKeywords: any, jobKeywords: any): string[] {
  const synonymMap = {
    'javascript': ['js'], 'typescript': ['ts'], 'react': ['reactjs'], 'node.js': ['nodejs', 'node'],
    'mongodb': ['mongo'], 'postgresql': ['postgres'], 'machine learning': ['ml', 'ai']
  };
  
  const matches = [];
  const allResumeKeywords = [...resumeKeywords.technical, ...resumeKeywords.soft, ...resumeKeywords.industry];
  const allJobKeywords = [...jobKeywords.technical, ...jobKeywords.soft, ...jobKeywords.industry];
  
  allJobKeywords.forEach(jobKeyword => {
    const synonyms = synonymMap[jobKeyword.toLowerCase()] || [];
    const found = allResumeKeywords.some(resumeKeyword => 
      synonyms.some(synonym => resumeKeyword.toLowerCase().includes(synonym))
    );
    if (found) matches.push(jobKeyword);
  });
  
  return matches;
}

function findMissingCriticalKeywords(jobKeywords: any, resumeKeywords: any, exactMatches: string[], semanticMatches: string[]): string[] {
  const criticalKeywords = [...jobKeywords.technical.slice(0, 5), ...jobKeywords.soft.slice(0, 3)];
  const allMatched = [...exactMatches, ...semanticMatches];
  return criticalKeywords.filter(keyword => !allMatched.includes(keyword));
}

function calculateAdvancedMatchScore(exactMatches: string[], semanticMatches: string[], jobKeywords: any): number {
  const totalJobKeywords = jobKeywords.technical.length + jobKeywords.soft.length + jobKeywords.industry.length;
  if (totalJobKeywords === 0) return 50;
  
  const weightedMatches = (exactMatches.length * 1.0) + (semanticMatches.length * 0.7);
  return Math.round((weightedMatches / totalJobKeywords) * 100);
}

function calculateKeywordDensity(text: string, keywords: string[]): number {
  const totalWords = text.split(/\s+/).length;
  const keywordOccurrences = keywords.reduce((count, keyword) => {
    const regex = new RegExp(keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    const matches = text.match(regex);
    return count + (matches ? matches.length : 0);
  }, 0);
  return totalWords > 0 ? Math.round((keywordOccurrences / totalWords) * 100 * 100) / 100 : 0;
}

function generateKeywordRecommendations(missingCritical: string[]): string[] {
  return missingCritical.length > 0 ? [`Add these critical keywords: ${missingCritical.slice(0, 5).join(', ')}`] : ['Great keyword coverage!'];
}

function calculateSkillAlignment(resumeSkills: string[], jobSkills: string[]): number {
  if (jobSkills.length === 0) return 100;
  const matches = resumeSkills.filter(skill => jobSkills.includes(skill));
  return Math.round((matches.length / jobSkills.length) * 100);
}

function extractYearsOfExperience(text: string): number {
  const yearMatches = text.match(/(\d+)\+?\s*years?/gi);
  if (yearMatches) {
    const years = yearMatches.map(match => parseInt(match.match(/\d+/)?.[0] || '0'));
    return Math.max(...years);
  }
  return 2;
}

function analyzeSeniorityMatch(resumeText: string, jobTitle: string) {
  const seniorIndicators = ['senior', 'lead', 'principal', 'architect', 'director', 'manager'];
  
  const jobSeniority = seniorIndicators.some(indicator => jobTitle.toLowerCase().includes(indicator)) ? 'senior' : 'mid';
  const resumeSeniority = seniorIndicators.some(indicator => resumeText.toLowerCase().includes(indicator)) ? 'senior' : 'mid';
  
  return {
    jobSeniority,
    resumeSeniority,
    isGoodMatch: jobSeniority === resumeSeniority || (jobSeniority === 'mid' && resumeSeniority === 'senior')
  };
}

function detectIndustry(jobDescription: string, companyName: string): string {
  const industries = {
    technology: ['tech', 'software', 'ai', 'saas', 'startup'],
    healthcare: ['health', 'medical', 'hospital', 'pharma'],
    finance: ['bank', 'financial', 'fintech', 'investment'],
    education: ['education', 'university', 'school'],
    retail: ['retail', 'ecommerce', 'shopping']
  };
  
  const text = (jobDescription + ' ' + companyName).toLowerCase();
  for (const [industry, keywords] of Object.entries(industries)) {
    if (keywords.some(keyword => text.includes(keyword))) return industry;
  }
  return 'technology';
}

function getIndustryStandards(industry: string): string[] {
  const standards = {
    technology: ['Agile methodology', 'Version control', 'Testing frameworks'],
    healthcare: ['HIPAA compliance', 'Clinical experience', 'Regulatory knowledge'],
    finance: ['Financial regulations', 'Risk management', 'Compliance'],
    education: ['Curriculum development', 'Assessment methods', 'Learning management'],
    retail: ['Customer service', 'Inventory management', 'Sales processes']
  };
  return standards[industry] || ['Industry best practices', 'Professional standards', 'Domain expertise'];
}

function getCompetitorInsights(intelligentScoring: any): string {
  if (intelligentScoring.overallScore >= 90) return "🏆 TOP 5%: Elite-level resume that outperforms 95% of candidates";
  if (intelligentScoring.overallScore >= 80) return "🌟 TOP 20%: Strong resume that beats 80% of applicants";
  if (intelligentScoring.overallScore >= 70) return "📈 COMPETITIVE: Above-average resume that meets most requirements";
  if (intelligentScoring.overallScore >= 60) return "📊 ADEQUATE: Meets basic standards but has room for improvement";
  return "⚡ NEEDS WORK: Focus on key improvements to reach competitive levels";
}

function calculateIndustryRanking(overallScore: number): string {
  if (overallScore >= 90) return "Top 5% - Elite Level";
  if (overallScore >= 80) return "Top 20% - Highly Competitive";
  if (overallScore >= 70) return "Top 40% - Above Average";
  if (overallScore >= 60) return "Average Range";
  return "Below Average - Needs Improvement";
}

function calculateImprovementPotential(intelligentScoring: any): string {
  const potential = 100 - intelligentScoring.overallScore;
  if (potential <= 10) return "Limited improvement needed - already excellent";
  if (potential <= 20) return "Moderate improvement potential - fine-tuning recommended";
  if (potential <= 40) return "Good improvement potential - targeted enhancements recommended";
  return "High improvement potential - significant enhancements recommended";
}

function identifyStrengthsAndWeaknesses(keywordAnalysis: any, atsAnalysis: any, skillsAnalysis: any, experienceAnalysis: any) {
  const strengths = [];
  const weaknesses = [];
  
  if (keywordAnalysis.matchScore >= 80) strengths.push("Excellent keyword optimization");
  else if (keywordAnalysis.matchScore < 60) weaknesses.push("Keyword gap needs attention");
  
  if (atsAnalysis.overallScore >= 80) strengths.push("ATS-optimized formatting");
  else if (atsAnalysis.overallScore < 70) weaknesses.push("ATS compatibility issues");
  
  if (skillsAnalysis.alignmentScore >= 80) strengths.push("Strong skills alignment");
  else if (skillsAnalysis.alignmentScore < 60) weaknesses.push("Skills gap identified");
  
  if (experienceAnalysis.relevanceScore >= 80) strengths.push("Relevant experience highlighted");
  else if (experienceAnalysis.relevanceScore < 60) weaknesses.push("Experience relevance could be improved");
  
  return { strengths, weaknesses };
}

function generateATSOptimizationTips(formatAnalysis: any, structureAnalysis: any, contentAnalysis: any): string[] {
  const tips = [];
  if (formatAnalysis.issues.length > 0) tips.push('Use simple formatting without complex tables');
  if (structureAnalysis.issues.length > 0) tips.push('Include all standard resume sections');
  if (contentAnalysis.issues.length > 0) tips.push('Add complete contact information');
  return tips;
}

function identifyCriticalATSIssues(contentAnalysis: any): string[] {
  const issues = [];
  if (!contentAnalysis.hasEmail) issues.push('Missing email address - critical for ATS');
  if (!contentAnalysis.hasPhone) issues.push('Missing phone number');
  return issues;
}

function identifyATSQuickWins(contentAnalysis: any): string[] {
  const wins = [];
  if (!contentAnalysis.hasQuantified) wins.push('Add numbers and percentages to achievements');
  return wins;
}
