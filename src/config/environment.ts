// Environment configuration for AI Resume Analyzer
export const config = {
  // Supabase configuration
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key',
  
  // Feature flags
  enableAIAnalysis: true,
  enableAnalytics: true,
  
  // API endpoints
  endpoints: {
    geminiAnalyze: '/functions/v1/gemini-analyze',
    logAnalytics: '/functions/v1/log-analytics'
  },
  
  // Local development settings
  isDevelopment: import.meta.env.DEV,
  
  // Demo mode settings
  demoMode: {
    enabled: !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_DEMO_MODE === 'true',
    sampleAnalysis: {
      overall_score: 85,
      ats_score: 78,
      match_percentage: 82,
      top_strengths: [
        "Strong technical background with 8+ years experience",
        "Excellent leadership and mentoring experience",
        "Proven track record of performance optimization",
        "Comprehensive full-stack development skills"
      ],
      immediate_improvements: [
        "Add more specific metrics and quantified achievements",
        "Include more relevant keywords from the job description",
        "Highlight fintech or financial services experience"
      ],
      quick_wins: [
        "Reorder experience to highlight most relevant roles first",
        "Add TypeScript proficiency to skills section",
        "Include GraphQL experience if applicable"
      ],
      matched_keywords: ["React", "Node.js", "JavaScript", "AWS", "PostgreSQL", "CI/CD", "Docker"],
      missing_critical_keywords: ["TypeScript", "GraphQL", "Fintech", "Microservices"],
      ats_optimization_tips: [
        "Use standard section headings like 'Experience' and 'Skills'",
        "Include exact keyword matches from job description",
        "Avoid complex formatting that ATS might not parse correctly"
      ]
    }
  }
};

// Environment validation
export const validateEnvironment = () => {
  const issues: string[] = [];
  
  if (!config.supabaseUrl || config.supabaseUrl.includes('your-project')) {
    issues.push('Supabase URL not configured');
  }
  
  if (!config.supabaseAnonKey || config.supabaseAnonKey.includes('your-anon-key')) {
    issues.push('Supabase anonymous key not configured');
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    demoMode: config.demoMode.enabled
  };
};
