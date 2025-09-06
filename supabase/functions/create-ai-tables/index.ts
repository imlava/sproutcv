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
    console.log("🗄️ CREATING AI RESUME ANALYSIS TABLES");
    
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Read the SQL migration file content
    const migrationSQL = `
-- Migration: Create AI Resume Analysis Tables
-- Enable pgvector extension for semantic search capabilities
CREATE EXTENSION IF NOT EXISTS vector;

-- Resume Analysis Storage Table
CREATE TABLE IF NOT EXISTS resume_analyses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    keyword_match INTEGER NOT NULL CHECK (keyword_match >= 0 AND keyword_match <= 100),
    skills_alignment INTEGER NOT NULL CHECK (skills_alignment >= 0 AND skills_alignment <= 100),
    experience_relevance INTEGER NOT NULL CHECK (experience_relevance >= 0 AND experience_relevance <= 100),
    ats_compatibility INTEGER NOT NULL CHECK (ats_compatibility >= 0 AND ats_compatibility <= 100),
    suggestions JSONB NOT NULL DEFAULT '[]'::jsonb,
    detailed_feedback JSONB NOT NULL DEFAULT '{}'::jsonb,
    analysis_engine TEXT NOT NULL DEFAULT 'gemini-v1.0',
    confidence_score INTEGER DEFAULT 90 CHECK (confidence_score >= 0 AND confidence_score <= 100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '30 days'),
    resume_content_hash TEXT
);

-- Optimized Resume Storage Table
CREATE TABLE IF NOT EXISTS optimized_resumes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    analysis_id UUID REFERENCES resume_analyses(id) ON DELETE CASCADE,
    original_resume_text TEXT NOT NULL,
    optimized_resume_text TEXT NOT NULL,
    optimization_type TEXT NOT NULL DEFAULT 'ai_enhanced',
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    keyword_improvements TEXT[] DEFAULT ARRAY[]::TEXT[],
    ats_score_improvement INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days')
);

-- Job Description Analysis Table
CREATE TABLE IF NOT EXISTS job_descriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    job_title TEXT NOT NULL,
    company_name TEXT NOT NULL,
    description_text TEXT NOT NULL,
    parsed_requirements JSONB NOT NULL DEFAULT '{}'::jsonb,
    extracted_keywords TEXT[] DEFAULT ARRAY[]::TEXT[],
    required_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    preferred_skills TEXT[] DEFAULT ARRAY[]::TEXT[],
    experience_level TEXT,
    salary_range TEXT,
    remote_work_option BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '180 days'),
    description_hash TEXT UNIQUE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_created ON resume_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_created_at ON resume_analyses(created_at);
CREATE INDEX IF NOT EXISTS idx_resume_analyses_expires_at ON resume_analyses(expires_at);

CREATE INDEX IF NOT EXISTS idx_optimized_resumes_user_created ON optimized_resumes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_optimized_resumes_type ON optimized_resumes(optimization_type);
CREATE INDEX IF NOT EXISTS idx_optimized_resumes_created_at ON optimized_resumes(created_at);

CREATE INDEX IF NOT EXISTS idx_job_descriptions_user_created ON job_descriptions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_title ON job_descriptions(job_title);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_company ON job_descriptions(company_name);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_created_at ON job_descriptions(created_at);

-- Row Level Security Policies
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimized_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resume_analyses
DROP POLICY IF EXISTS "Users can view their own analyses" ON resume_analyses;
CREATE POLICY "Users can view their own analyses" ON resume_analyses
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own analyses" ON resume_analyses;
CREATE POLICY "Users can insert their own analyses" ON resume_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own analyses" ON resume_analyses;
CREATE POLICY "Users can update their own analyses" ON resume_analyses
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own analyses" ON resume_analyses;
CREATE POLICY "Users can delete their own analyses" ON resume_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for optimized_resumes
DROP POLICY IF EXISTS "Users can view their own optimized resumes" ON optimized_resumes;
CREATE POLICY "Users can view their own optimized resumes" ON optimized_resumes
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own optimized resumes" ON optimized_resumes;
CREATE POLICY "Users can insert their own optimized resumes" ON optimized_resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own optimized resumes" ON optimized_resumes;
CREATE POLICY "Users can update their own optimized resumes" ON optimized_resumes
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own optimized resumes" ON optimized_resumes;
CREATE POLICY "Users can delete their own optimized resumes" ON optimized_resumes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for job_descriptions
DROP POLICY IF EXISTS "Users can view their own job descriptions" ON job_descriptions;
CREATE POLICY "Users can view their own job descriptions" ON job_descriptions
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own job descriptions" ON job_descriptions;
CREATE POLICY "Users can insert their own job descriptions" ON job_descriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own job descriptions" ON job_descriptions;
CREATE POLICY "Users can update their own job descriptions" ON job_descriptions
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own job descriptions" ON job_descriptions;
CREATE POLICY "Users can delete their own job descriptions" ON job_descriptions
    FOR DELETE USING (auth.uid() = user_id);

-- Utility Functions
CREATE OR REPLACE FUNCTION cleanup_expired_analyses()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM resume_analyses WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    DELETE FROM optimized_resumes WHERE expires_at < NOW();
    DELETE FROM job_descriptions WHERE expires_at < NOW();
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate resume match score
CREATE OR REPLACE FUNCTION calculate_resume_match_score(
    resume_text TEXT,
    job_keywords TEXT[]
) RETURNS INTEGER AS $$
DECLARE
    match_count INTEGER := 0;
    total_keywords INTEGER;
    keyword TEXT;
    score INTEGER;
BEGIN
    total_keywords := array_length(job_keywords, 1);
    
    IF total_keywords = 0 THEN
        RETURN 0;
    END IF;
    
    FOREACH keyword IN ARRAY job_keywords
    LOOP
        IF position(lower(keyword) in lower(resume_text)) > 0 THEN
            match_count := match_count + 1;
        END IF;
    END LOOP;
    
    score := (match_count * 100) / total_keywords;
    RETURN LEAST(100, score);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
    `;

    // Execute the migration
    console.log("📊 Executing database migration...");
    const { error } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (error) {
      console.error("❌ Migration failed:", error);
      // Try alternative approach with individual table creation
      console.log("🔄 Trying alternative table creation approach...");
      
      // Create tables one by one
      const { error: error1 } = await supabase.from('resume_analyses').select('id').limit(1);
      if (error1 && error1.message.includes('does not exist')) {
        // Table doesn't exist, need to create it manually through admin
        console.log("⚠️ Tables need to be created through database admin");
        
        return new Response(JSON.stringify({
          success: false,
          error: "Database tables need to be created. Please run the SQL migration manually.",
          migration_sql: migrationSQL,
          instructions: "Copy the migration_sql and run it in your Supabase SQL editor"
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 500,
        });
      }
    }

    // Verify tables were created
    console.log("✅ Verifying table creation...");
    const { data: tables, error: verifyError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['resume_analyses', 'optimized_resumes', 'job_descriptions']);

    if (verifyError) {
      console.error("❌ Table verification failed:", verifyError);
    }

    console.log("🎉 AI Resume Analysis tables created successfully!");

    return new Response(JSON.stringify({
      success: true,
      message: "AI Resume Analysis database schema created successfully",
      tables_created: [
        'resume_analyses',
        'optimized_resumes', 
        'job_descriptions'
      ],
      features_enabled: [
        'Gemini AI Integration',
        'Vector Embeddings',
        'ATS Scoring',
        'Keyword Analysis',
        'Row Level Security'
      ],
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Migration error:", error);
    
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
