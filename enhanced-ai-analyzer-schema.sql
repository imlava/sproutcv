-- Enhanced Database Schema for AI Resume Analyzer
-- Supports comprehensive analysis storage and retrieval

-- Create enhanced_analyses table for storing AI analysis results
CREATE TABLE IF NOT EXISTS enhanced_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Document Information
    document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'cover_letter', 'job_description')),
    analysis_type TEXT NOT NULL CHECK (analysis_type IN ('comprehensive', 'quick', 'ats')),
    
    -- Job Information
    job_title TEXT,
    company_name TEXT,
    
    -- Core Scores
    overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
    ats_score INTEGER CHECK (ats_score >= 0 AND ats_score <= 100),
    match_percentage INTEGER CHECK (match_percentage >= 0 AND match_percentage <= 100),
    
    -- Complete Analysis Data (JSON)
    analysis_data JSONB NOT NULL,
    
    -- Content Hashes for deduplication
    resume_content_hash TEXT,
    job_description_hash TEXT,
    
    -- Metadata
    processing_time_ms INTEGER,
    ai_model_version TEXT DEFAULT 'gemini-pro',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign key (assuming auth.users table exists)
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_user_id ON enhanced_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_created_at ON enhanced_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_scores ON enhanced_analyses(overall_score DESC, match_percentage DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_job_title ON enhanced_analyses(job_title);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_analysis_type ON enhanced_analyses(analysis_type);

-- Create composite index for common queries
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_user_type_created 
ON enhanced_analyses(user_id, analysis_type, created_at DESC);

-- Create GIN index for JSON analysis data searches
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_data_gin 
ON enhanced_analyses USING GIN(analysis_data);

-- Create enhanced_documents table for storing document content
CREATE TABLE IF NOT EXISTS enhanced_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Document Content
    document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'cover_letter', 'job_description')),
    content TEXT NOT NULL,
    content_hash TEXT UNIQUE NOT NULL,
    
    -- Metadata
    title TEXT,
    file_name TEXT,
    file_size INTEGER,
    word_count INTEGER,
    
    -- Processing Status
    processing_status TEXT DEFAULT 'pending' CHECK (processing_status IN ('pending', 'processing', 'completed', 'failed')),
    error_message TEXT,
    
    -- AI Extracted Information
    extracted_data JSONB DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    
    -- Vector Embeddings (for semantic search)
    content_embedding vector(768),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for enhanced_documents
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_user_id ON enhanced_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_type ON enhanced_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_hash ON enhanced_documents(content_hash);
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_status ON enhanced_documents(processing_status);

-- Create vector index for semantic search (if pgvector is available)
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_embedding 
ON enhanced_documents USING hnsw (content_embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

-- Create analysis_sessions table for tracking user sessions
CREATE TABLE IF NOT EXISTS analysis_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    session_token TEXT UNIQUE NOT NULL,
    
    -- Session Data
    session_data JSONB DEFAULT '{}',
    analyses_count INTEGER DEFAULT 0,
    
    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for analysis_sessions
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_user_id ON analysis_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_token ON analysis_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_analysis_sessions_active ON analysis_sessions(is_active, expires_at);

-- Create user_preferences table for storing analysis preferences
CREATE TABLE IF NOT EXISTS user_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL,
    
    -- Analysis Preferences
    default_analysis_type TEXT DEFAULT 'comprehensive' CHECK (default_analysis_type IN ('comprehensive', 'quick', 'ats')),
    preferred_industries TEXT[] DEFAULT '{}',
    career_level TEXT CHECK (career_level IN ('entry', 'mid', 'senior', 'executive')),
    
    -- AI Preferences
    ai_insights_enabled BOOLEAN DEFAULT TRUE,
    detailed_feedback BOOLEAN DEFAULT TRUE,
    interview_prep_enabled BOOLEAN DEFAULT TRUE,
    salary_insights_enabled BOOLEAN DEFAULT TRUE,
    
    -- Notification Preferences
    email_notifications BOOLEAN DEFAULT TRUE,
    analysis_reminders BOOLEAN DEFAULT FALSE,
    
    -- Privacy Settings
    data_retention_days INTEGER DEFAULT 90,
    share_anonymized_data BOOLEAN DEFAULT FALSE,
    
    -- Custom Settings
    custom_settings JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create analysis_feedback table for collecting user feedback
CREATE TABLE IF NOT EXISTS analysis_feedback (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Feedback Data
    overall_rating INTEGER CHECK (overall_rating >= 1 AND overall_rating <= 5),
    accuracy_rating INTEGER CHECK (accuracy_rating >= 1 AND accuracy_rating <= 5),
    usefulness_rating INTEGER CHECK (usefulness_rating >= 1 AND usefulness_rating <= 5),
    
    -- Detailed Feedback
    feedback_text TEXT,
    suggestions TEXT,
    
    -- Categories
    helpful_features TEXT[] DEFAULT '{}',
    improvement_areas TEXT[] DEFAULT '{}',
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    FOREIGN KEY (analysis_id) REFERENCES enhanced_analyses(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for analysis_feedback
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_analysis_id ON analysis_feedback(analysis_id);
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_user_id ON analysis_feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_analysis_feedback_ratings ON analysis_feedback(overall_rating, accuracy_rating);

-- Create analytics_events table for tracking user interactions
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    session_id UUID,
    
    -- Event Data
    event_type TEXT NOT NULL,
    event_name TEXT NOT NULL,
    event_data JSONB DEFAULT '{}',
    
    -- Page/Component Context
    page_url TEXT,
    component_name TEXT,
    
    -- User Agent and Context
    user_agent TEXT,
    ip_address INET,
    referrer TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for analytics_events
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_type ON analytics_events(event_type, event_name);
CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON analytics_events(created_at DESC);

-- Create partitioned table for analytics_events (optional, for high volume)
-- Partition by month for better performance
-- CREATE TABLE analytics_events_y2024m01 PARTITION OF analytics_events
-- FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- Views for common queries

-- Analysis Summary View
CREATE OR REPLACE VIEW analysis_summary AS
SELECT 
    ea.user_id,
    COUNT(*) as total_analyses,
    AVG(ea.overall_score) as avg_overall_score,
    AVG(ea.ats_score) as avg_ats_score,
    AVG(ea.match_percentage) as avg_match_percentage,
    MAX(ea.created_at) as last_analysis,
    array_agg(DISTINCT ea.job_title) FILTER (WHERE ea.job_title IS NOT NULL) as analyzed_roles
FROM enhanced_analyses ea
GROUP BY ea.user_id;

-- User Activity Dashboard View
CREATE OR REPLACE VIEW user_activity_dashboard AS
SELECT 
    u.id as user_id,
    u.email,
    COALESCE(as_summary.total_analyses, 0) as total_analyses,
    COALESCE(as_summary.avg_overall_score, 0) as avg_score,
    as_summary.last_analysis,
    COUNT(DISTINCT ed.id) as total_documents,
    COUNT(DISTINCT af.id) as feedback_count,
    AVG(af.overall_rating) as avg_feedback_rating
FROM auth.users u
LEFT JOIN analysis_summary as_summary ON u.id = as_summary.user_id
LEFT JOIN enhanced_documents ed ON u.id = ed.user_id
LEFT JOIN analysis_feedback af ON u.id = af.user_id
GROUP BY u.id, u.email, as_summary.total_analyses, as_summary.avg_overall_score, as_summary.last_analysis;

-- Popular Job Titles View
CREATE OR REPLACE VIEW popular_job_titles AS
SELECT 
    job_title,
    COUNT(*) as analysis_count,
    AVG(overall_score) as avg_score,
    AVG(match_percentage) as avg_match,
    COUNT(DISTINCT user_id) as unique_users
FROM enhanced_analyses
WHERE job_title IS NOT NULL
GROUP BY job_title
HAVING COUNT(*) >= 3
ORDER BY analysis_count DESC, avg_score DESC;

-- Analysis Performance Metrics View
CREATE OR REPLACE VIEW analysis_performance_metrics AS
SELECT 
    analysis_type,
    COUNT(*) as total_analyses,
    AVG(processing_time_ms) as avg_processing_time,
    AVG(overall_score) as avg_score,
    PERCENTILE_CONT(0.5) WITHIN GROUP (ORDER BY processing_time_ms) as median_processing_time,
    PERCENTILE_CONT(0.95) WITHIN GROUP (ORDER BY processing_time_ms) as p95_processing_time
FROM enhanced_analyses
WHERE processing_time_ms IS NOT NULL
GROUP BY analysis_type;

-- Functions for data management

-- Function to get user's analysis history
CREATE OR REPLACE FUNCTION get_user_analysis_history(p_user_id UUID, p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    id UUID,
    job_title TEXT,
    company_name TEXT,
    overall_score INTEGER,
    match_percentage INTEGER,
    analysis_type TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.id,
        ea.job_title,
        ea.company_name,
        ea.overall_score,
        ea.match_percentage,
        ea.analysis_type,
        ea.created_at
    FROM enhanced_analyses ea
    WHERE ea.user_id = p_user_id
    ORDER BY ea.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Function to get analysis insights
CREATE OR REPLACE FUNCTION get_analysis_insights(p_user_id UUID)
RETURNS JSON AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'total_analyses', COUNT(*),
        'avg_score', ROUND(AVG(overall_score), 1),
        'best_score', MAX(overall_score),
        'improvement_trend', CASE 
            WHEN COUNT(*) >= 2 THEN
                ROUND((AVG(overall_score) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') - 
                       AVG(overall_score) FILTER (WHERE created_at < NOW() - INTERVAL '30 days')), 1)
            ELSE 0
        END,
        'favorite_analysis_type', MODE() WITHIN GROUP (ORDER BY analysis_type),
        'analyzed_companies', array_agg(DISTINCT company_name) FILTER (WHERE company_name IS NOT NULL)
    ) INTO result
    FROM enhanced_analyses
    WHERE user_id = p_user_id;
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to cleanup old data
CREATE OR REPLACE FUNCTION cleanup_old_data(p_retention_days INTEGER DEFAULT 90)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    -- Delete old analyses
    DELETE FROM enhanced_analyses 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_retention_days;
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    
    -- Delete orphaned documents
    DELETE FROM enhanced_documents 
    WHERE created_at < NOW() - INTERVAL '1 day' * p_retention_days
    AND id NOT IN (SELECT DISTINCT regexp_replace(analysis_data->>'document_id', '[^a-f0-9-]', '', 'g')::UUID 
                   FROM enhanced_analyses 
                   WHERE analysis_data->>'document_id' IS NOT NULL);
    
    -- Delete old analytics events
    DELETE FROM analytics_events 
    WHERE created_at < NOW() - INTERVAL '1 day' * (p_retention_days * 2);
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- RLS (Row Level Security) Policies

-- Enable RLS on all tables
ALTER TABLE enhanced_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for enhanced_analyses
CREATE POLICY "Users can view their own analyses" 
ON enhanced_analyses FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses" 
ON enhanced_analyses FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own analyses" 
ON enhanced_analyses FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own analyses" 
ON enhanced_analyses FOR DELETE 
USING (auth.uid() = user_id);

-- Policies for enhanced_documents
CREATE POLICY "Users can view their own documents" 
ON enhanced_documents FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own documents" 
ON enhanced_documents FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own documents" 
ON enhanced_documents FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own documents" 
ON enhanced_documents FOR DELETE 
USING (auth.uid() = user_id);

-- Similar policies for other tables...
CREATE POLICY "Users can manage their own sessions" 
ON analysis_sessions FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own preferences" 
ON user_preferences FOR ALL 
USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own feedback" 
ON analysis_feedback FOR ALL 
USING (auth.uid() = user_id);

-- Grant permissions
GRANT ALL ON enhanced_analyses TO authenticated;
GRANT ALL ON enhanced_documents TO authenticated;
GRANT ALL ON analysis_sessions TO authenticated;
GRANT ALL ON user_preferences TO authenticated;
GRANT ALL ON analysis_feedback TO authenticated;
GRANT SELECT ON analytics_events TO authenticated;

-- Grant usage on sequences
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- Create triggers for updating timestamps

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers
CREATE TRIGGER update_enhanced_analyses_updated_at 
    BEFORE UPDATE ON enhanced_analyses 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_enhanced_documents_updated_at 
    BEFORE UPDATE ON enhanced_documents 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at 
    BEFORE UPDATE ON user_preferences 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE enhanced_analyses IS 'Stores comprehensive AI analysis results for resumes and job descriptions';
COMMENT ON TABLE enhanced_documents IS 'Stores document content with extracted metadata and embeddings';
COMMENT ON TABLE analysis_sessions IS 'Tracks user analysis sessions for analytics and rate limiting';
COMMENT ON TABLE user_preferences IS 'Stores user preferences for analysis customization';
COMMENT ON TABLE analysis_feedback IS 'Collects user feedback on analysis quality and usefulness';
COMMENT ON TABLE analytics_events IS 'Tracks user interactions and events for product analytics';

-- Final verification query
SELECT 
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    hasrules,
    hastriggers
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename LIKE '%enhanced%' OR tablename LIKE '%analysis%'
ORDER BY tablename;
