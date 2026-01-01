-- Migration: Create AI Resume Analysis Tables
-- Created: 2025-01-09
-- Purpose: Support advanced AI-powered resume analysis with Gemini integration

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
    resume_content_hash TEXT, -- For deduplication
    INDEX (user_id, created_at DESC),
    INDEX (created_at),
    INDEX (expires_at)
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
    content_embedding vector(1536), -- For semantic search
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '90 days'),
    INDEX (user_id, created_at DESC),
    INDEX (optimization_type),
    INDEX (created_at)
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
    description_embedding vector(1536), -- For semantic matching
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '180 days'),
    description_hash TEXT UNIQUE, -- For deduplication
    INDEX (user_id, created_at DESC),
    INDEX (job_title),
    INDEX (company_name),
    INDEX (created_at)
);

-- Analytics Events Table (Enhanced)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    session_id TEXT,
    user_agent TEXT,
    ip_address INET,
    INDEX (user_id, created_at DESC),
    INDEX (event_type, created_at DESC),
    INDEX (created_at)
);

-- Row Level Security Policies
ALTER TABLE resume_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE optimized_resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_descriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies for resume_analyses
CREATE POLICY "Users can view their own analyses" ON resume_analyses
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" ON resume_analyses
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" ON resume_analyses
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" ON resume_analyses
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for optimized_resumes
CREATE POLICY "Users can view their own optimized resumes" ON optimized_resumes
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own optimized resumes" ON optimized_resumes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own optimized resumes" ON optimized_resumes
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own optimized resumes" ON optimized_resumes
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for job_descriptions
CREATE POLICY "Users can view their own job descriptions" ON job_descriptions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own job descriptions" ON job_descriptions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own job descriptions" ON job_descriptions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own job descriptions" ON job_descriptions
    FOR DELETE USING (auth.uid() = user_id);

-- RLS Policies for analytics_events
CREATE POLICY "Users can view their own analytics" ON analytics_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert analytics" ON analytics_events
    FOR INSERT WITH CHECK (true);

-- Functions for cleanup and maintenance
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

-- Trigger to auto-cleanup expired records
CREATE OR REPLACE FUNCTION auto_cleanup_trigger()
RETURNS TRIGGER AS $$
BEGIN
    -- Randomly cleanup expired records (1% chance on each insert)
    IF random() < 0.01 THEN
        PERFORM cleanup_expired_analyses();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_cleanup_expired_analyses
    AFTER INSERT ON resume_analyses
    FOR EACH ROW
    EXECUTE FUNCTION auto_cleanup_trigger();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_resume_analyses_user_score ON resume_analyses(user_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_optimized_resumes_embedding ON optimized_resumes USING ivfflat (content_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_job_descriptions_embedding ON job_descriptions USING ivfflat (description_embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type_time ON analytics_events(event_type, created_at DESC);

-- Grant necessary permissions
GRANT USAGE ON SEQUENCE resume_analyses_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE optimized_resumes_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE job_descriptions_id_seq TO authenticated;
GRANT USAGE ON SEQUENCE analytics_events_id_seq TO authenticated;

GRANT SELECT, INSERT, UPDATE, DELETE ON resume_analyses TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON optimized_resumes TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON job_descriptions TO authenticated;
GRANT SELECT, INSERT ON analytics_events TO authenticated;

-- Comments for documentation
COMMENT ON TABLE resume_analyses IS 'Stores AI-powered resume analysis results with Gemini integration';
COMMENT ON TABLE optimized_resumes IS 'Stores AI-optimized resume versions with improvement tracking';
COMMENT ON TABLE job_descriptions IS 'Stores parsed job descriptions with semantic analysis';
COMMENT ON TABLE analytics_events IS 'Enhanced analytics tracking for resume analysis features';

COMMENT ON COLUMN resume_analyses.confidence_score IS 'AI model confidence in analysis accuracy (0-100)';
COMMENT ON COLUMN optimized_resumes.content_embedding IS 'Vector embedding for semantic resume matching';
COMMENT ON COLUMN job_descriptions.description_embedding IS 'Vector embedding for semantic job matching';

-- Insert initial test data (optional)
-- This will be populated by the application during actual usage
