// Environment configuration for AI Resume Analyzer
// Note: Supabase anon keys are PUBLIC (client-side) keys - security is via RLS
export const config = {
  // Supabase configuration - anon key is safe to include (it's a public key)
  // All data access is controlled by Row Level Security policies
  supabaseUrl: import.meta.env.VITE_SUPABASE_URL || 'https://yucdpvnmcuokemhqpnvz.supabase.co',
  supabaseAnonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y2Rwdm5tY3Vva2VtaHFwbnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDg3OTksImV4cCI6MjA2OTY4NDc5OX0.slvx1sMBHmGrlFuLltvePeA417SFTWhZGCJIJZeYIgQ',
  
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
    enabled: false, // AI is now fully functional with GEMINI_API_KEY configured
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
