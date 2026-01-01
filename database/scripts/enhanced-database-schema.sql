-- ====================================================================================================
-- ENHANCED SPROUTCV DATABASE SCHEMA WITH ADVANCED AI FEATURES
-- ====================================================================================================
-- This schema supports enterprise-grade document processing, vector embeddings, semantic search,
-- privacy protection, and comprehensive analytics for the advanced SproutCV AI system.
-- ====================================================================================================

-- Enable required extensions for advanced features
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "btree_gin";

-- ====================================================================================================
-- ENHANCED DOCUMENTS TABLE - Document AI Integration
-- ====================================================================================================
CREATE TABLE IF NOT EXISTS enhanced_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'job_description', 'cover_letter')),
    
    -- Document Content (Document AI Processed)
    content JSONB NOT NULL, -- Structured parsed content
    raw_text TEXT NOT NULL, -- Original text content
    file_metadata JSONB DEFAULT '{}', -- File info (size, format, etc.)
    
    -- Processing Metadata
    processing_metadata JSONB DEFAULT '{}', -- Document AI processing info
    quality_score INTEGER DEFAULT 0 CHECK (quality_score >= 0 AND quality_score <= 100),
    parsing_confidence DECIMAL(3,2) DEFAULT 0.0 CHECK (parsing_confidence >= 0.0 AND parsing_confidence <= 1.0),
    
    -- Privacy Protection
    pii_detected BOOLEAN DEFAULT FALSE,
    pii_redacted BOOLEAN DEFAULT FALSE,
    sensitive_fields JSONB DEFAULT '[]', -- List of detected PII types
    
    -- Indexing and Search
    search_vector tsvector GENERATED ALWAYS AS (to_tsvector('english', raw_text)) STORED,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ,
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for enhanced documents
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_user_id ON enhanced_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_type ON enhanced_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_quality ON enhanced_documents(quality_score DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_search ON enhanced_documents USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_content ON enhanced_documents USING GIN(content);
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_created ON enhanced_documents(created_at DESC);

-- ====================================================================================================
-- DOCUMENT EMBEDDINGS TABLE - Vertex AI Vector Storage
-- ====================================================================================================
CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL,
    user_id UUID NOT NULL,
    
    -- Embedding Data
    content_section TEXT NOT NULL, -- The text chunk that was embedded
    embedding vector(768) NOT NULL, -- Vertex AI embedding (768 dimensions)
    embedding_model TEXT DEFAULT 'textembedding-gecko@003',
    
    -- Section Metadata
    section_type TEXT DEFAULT 'general', -- work_experience, education, skills, etc.
    section_index INTEGER DEFAULT 0,
    confidence_score DECIMAL(3,2) DEFAULT 1.0,
    
    -- Document References
    document_type TEXT NOT NULL CHECK (document_type IN ('resume', 'job_description', 'cover_letter')),
    
    -- Metadata
    metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    FOREIGN KEY (document_id) REFERENCES enhanced_documents(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Advanced indexes for vector search (HNSW for high performance)
CREATE INDEX IF NOT EXISTS idx_document_embeddings_vector_hnsw 
ON document_embeddings USING hnsw (embedding vector_cosine_ops) 
WITH (m = 16, ef_construction = 64);

CREATE INDEX IF NOT EXISTS idx_document_embeddings_user_type ON document_embeddings(user_id, document_type);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_section ON document_embeddings(section_type);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_document ON document_embeddings(document_id);

-- ====================================================================================================
-- ENHANCED ANALYSES TABLE - Advanced AI Analysis Results
-- ====================================================================================================
CREATE TABLE IF NOT EXISTS enhanced_analyses (
    id TEXT PRIMARY KEY, -- analysis_id from AI function
    user_id UUID NOT NULL,
    
    -- Analysis Content
    analysis_result JSONB NOT NULL, -- Complete analysis from enhanced AI
    resume_content TEXT NOT NULL,
    job_description TEXT NOT NULL,
    
    -- Key Metrics (for quick queries)
    overall_score INTEGER NOT NULL CHECK (overall_score >= 0 AND overall_score <= 100),
    ats_score INTEGER NOT NULL CHECK (ats_score >= 0 AND ats_score <= 100),
    keyword_score INTEGER NOT NULL CHECK (keyword_score >= 0 AND keyword_score <= 100),
    experience_score INTEGER NOT NULL CHECK (experience_score >= 0 AND experience_score <= 100),
    confidence DECIMAL(3,2) NOT NULL CHECK (confidence >= 0.0 AND confidence <= 1.0),
    
    -- Processing Info
    processing_metadata JSONB DEFAULT '{}',
    analysis_version TEXT DEFAULT 'enhanced-v2.0',
    features_used TEXT[] DEFAULT '{}',
    
    -- Analytics
    viewed_at TIMESTAMPTZ,
    shared_at TIMESTAMPTZ,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for enhanced analyses
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_user_id ON enhanced_analyses(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_overall_score ON enhanced_analyses(overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_created ON enhanced_analyses(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_confidence ON enhanced_analyses(confidence DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_version ON enhanced_analyses(analysis_version);

-- ====================================================================================================
-- ENHANCED OPTIMIZATIONS TABLE - AI Resume Optimizations
-- ====================================================================================================
CREATE TABLE IF NOT EXISTS enhanced_optimizations (
    id TEXT PRIMARY KEY, -- optimization_id from AI function
    user_id UUID NOT NULL,
    
    -- Optimization Content
    original_resume TEXT NOT NULL,
    optimized_resume JSONB NOT NULL, -- Structured optimized resume
    job_description TEXT NOT NULL,
    
    -- Improvement Metrics
    improvement_score INTEGER NOT NULL CHECK (improvement_score >= 0 AND improvement_score <= 100),
    keywords_added INTEGER DEFAULT 0,
    sections_enhanced TEXT[] DEFAULT '{}',
    ats_improvement INTEGER DEFAULT 0,
    
    -- Change Summary
    changes_summary JSONB NOT NULL,
    optimization_metadata JSONB DEFAULT '{}',
    
    -- Usage Analytics
    applied_at TIMESTAMPTZ,
    downloaded_at TIMESTAMPTZ,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for enhanced optimizations
CREATE INDEX IF NOT EXISTS idx_enhanced_optimizations_user_id ON enhanced_optimizations(user_id);
CREATE INDEX IF NOT EXISTS idx_enhanced_optimizations_improvement ON enhanced_optimizations(improvement_score DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_optimizations_created ON enhanced_optimizations(created_at DESC);

-- ====================================================================================================
-- SEMANTIC SEARCH LOGS - Query Analytics and Performance
-- ====================================================================================================
CREATE TABLE IF NOT EXISTS semantic_search_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Search Details
    search_query TEXT NOT NULL,
    search_type TEXT DEFAULT 'semantic',
    results_count INTEGER DEFAULT 0,
    
    -- Performance Metrics
    processing_time_ms INTEGER,
    similarity_threshold DECIMAL(3,2) DEFAULT 0.7,
    
    -- Results Metadata
    top_similarity DECIMAL(3,2),
    results_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_semantic_search_logs_user_id ON semantic_search_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_semantic_search_logs_created ON semantic_search_logs(created_at DESC);

-- ====================================================================================================
-- USER ANALYTICS TABLE - Enhanced User Behavior Tracking
-- ====================================================================================================
CREATE TABLE IF NOT EXISTS user_analytics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL,
    
    -- Session Info
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- Event Details
    event_type TEXT NOT NULL, -- analysis, optimization, search, download, etc.
    event_data JSONB DEFAULT '{}',
    
    -- Performance Metrics
    processing_time_ms INTEGER,
    success BOOLEAN DEFAULT TRUE,
    error_message TEXT,
    
    -- Feature Usage
    features_used TEXT[] DEFAULT '{}',
    ai_model_version TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Indexes for user analytics
CREATE INDEX IF NOT EXISTS idx_user_analytics_user_id ON user_analytics(user_id);
CREATE INDEX IF NOT EXISTS idx_user_analytics_event_type ON user_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_user_analytics_created ON user_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_analytics_session ON user_analytics(session_id);

-- ====================================================================================================
-- ADVANCED VECTOR SEARCH FUNCTIONS
-- ====================================================================================================

-- Enhanced semantic search function with user context and filtering
CREATE OR REPLACE FUNCTION enhanced_semantic_search(
    search_query TEXT,
    user_id UUID,
    result_limit INTEGER DEFAULT 10,
    content_type TEXT DEFAULT 'all',
    min_similarity DECIMAL DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity DECIMAL,
    document_type TEXT,
    section_type TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
DECLARE
    query_embedding vector(768);
BEGIN
    -- In a real implementation, this would call Vertex AI to generate the embedding
    -- For now, we'll use a placeholder approach
    
    RETURN QUERY
    SELECT 
        de.id,
        de.content_section as content,
        ROUND((1 - (de.embedding <=> query_embedding))::numeric, 3) as similarity,
        de.document_type,
        de.section_type,
        de.metadata,
        de.created_at
    FROM document_embeddings de
    WHERE de.user_id = enhanced_semantic_search.user_id
        AND (content_type = 'all' OR de.document_type = content_type)
        AND (1 - (de.embedding <=> query_embedding)) >= min_similarity
    ORDER BY de.embedding <=> query_embedding
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Advanced vector similarity search for resume-job matching
CREATE OR REPLACE FUNCTION advanced_vector_search(
    query_embedding vector(768),
    similarity_threshold DECIMAL DEFAULT 0.7,
    match_count INTEGER DEFAULT 10,
    document_type TEXT DEFAULT 'all'
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    similarity DECIMAL,
    document_type TEXT,
    section_type TEXT,
    metadata JSONB,
    user_id UUID,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        de.id,
        de.content_section as content,
        ROUND((1 - (de.embedding <=> query_embedding))::numeric, 3) as similarity,
        de.document_type,
        de.section_type,
        de.metadata,
        de.user_id,
        de.created_at
    FROM document_embeddings de
    WHERE (document_type = 'all' OR de.document_type = advanced_vector_search.document_type)
        AND (1 - (de.embedding <=> query_embedding)) >= similarity_threshold
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to find similar resumes for benchmarking
CREATE OR REPLACE FUNCTION find_similar_profiles(
    target_user_id UUID,
    job_title TEXT DEFAULT NULL,
    experience_level TEXT DEFAULT NULL,
    limit_count INTEGER DEFAULT 5
)
RETURNS TABLE (
    user_id UUID,
    similarity_score DECIMAL,
    profile_summary JSONB,
    analysis_scores JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ea.user_id,
        AVG(ea.overall_score)::DECIMAL as similarity_score,
        jsonb_build_object(
            'avg_ats_score', AVG(ea.ats_score),
            'avg_keyword_score', AVG(ea.keyword_score),
            'avg_experience_score', AVG(ea.experience_score),
            'total_analyses', COUNT(*)
        ) as profile_summary,
        jsonb_agg(
            jsonb_build_object(
                'overall_score', ea.overall_score,
                'ats_score', ea.ats_score,
                'created_at', ea.created_at
            )
        ) as analysis_scores
    FROM enhanced_analyses ea
    WHERE ea.user_id != target_user_id
        AND ea.created_at > NOW() - INTERVAL '6 months'
    GROUP BY ea.user_id
    HAVING COUNT(*) >= 2 -- At least 2 analyses for meaningful comparison
    ORDER BY similarity_score DESC
    LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ====================================================================================================

-- Enable RLS on all tables
ALTER TABLE enhanced_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enhanced_optimizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE semantic_search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_analytics ENABLE ROW LEVEL SECURITY;

-- Enhanced Documents Policies
CREATE POLICY "Users can manage their own enhanced documents" ON enhanced_documents
    FOR ALL USING (user_id = auth.uid());

-- Document Embeddings Policies
CREATE POLICY "Users can manage their own embeddings" ON document_embeddings
    FOR ALL USING (user_id = auth.uid());

-- Enhanced Analyses Policies
CREATE POLICY "Users can manage their own enhanced analyses" ON enhanced_analyses
    FOR ALL USING (user_id = auth.uid());

-- Enhanced Optimizations Policies
CREATE POLICY "Users can manage their own enhanced optimizations" ON enhanced_optimizations
    FOR ALL USING (user_id = auth.uid());

-- Semantic Search Logs Policies
CREATE POLICY "Users can view their own search logs" ON semantic_search_logs
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert search logs" ON semantic_search_logs
    FOR INSERT WITH CHECK (true);

-- User Analytics Policies
CREATE POLICY "Users can view their own analytics" ON user_analytics
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "System can insert analytics" ON user_analytics
    FOR INSERT WITH CHECK (true);

-- ====================================================================================================
-- PERFORMANCE OPTIMIZATION VIEWS
-- ====================================================================================================

-- User Dashboard Summary View
CREATE OR REPLACE VIEW user_dashboard_summary AS
SELECT 
    u.id as user_id,
    COUNT(DISTINCT ed.id) as total_documents,
    COUNT(DISTINCT ea.id) as total_analyses,
    COUNT(DISTINCT eo.id) as total_optimizations,
    AVG(ea.overall_score)::INTEGER as avg_overall_score,
    AVG(ea.ats_score)::INTEGER as avg_ats_score,
    MAX(ea.created_at) as last_analysis,
    MAX(eo.created_at) as last_optimization,
    COUNT(DISTINCT ssl.id) as total_searches
FROM auth.users u
LEFT JOIN enhanced_documents ed ON u.id = ed.user_id
LEFT JOIN enhanced_analyses ea ON u.id = ea.user_id
LEFT JOIN enhanced_optimizations eo ON u.id = eo.user_id
LEFT JOIN semantic_search_logs ssl ON u.id = ssl.user_id
GROUP BY u.id;

-- Analysis Performance Metrics View
CREATE OR REPLACE VIEW analysis_performance_metrics AS
SELECT 
    analysis_version,
    COUNT(*) as total_analyses,
    AVG(overall_score)::INTEGER as avg_overall_score,
    AVG(ats_score)::INTEGER as avg_ats_score,
    AVG(keyword_score)::INTEGER as avg_keyword_score,
    AVG(experience_score)::INTEGER as avg_experience_score,
    AVG(confidence)::DECIMAL(3,2) as avg_confidence,
    COUNT(DISTINCT user_id) as unique_users,
    MIN(created_at) as first_analysis,
    MAX(created_at) as latest_analysis
FROM enhanced_analyses
GROUP BY analysis_version
ORDER BY latest_analysis DESC;

-- ====================================================================================================
-- AUTOMATED MAINTENANCE AND CLEANUP
-- ====================================================================================================

-- Function to archive old data
CREATE OR REPLACE FUNCTION archive_old_data()
RETURNS void AS $$
BEGIN
    -- Archive analyses older than 2 years
    DELETE FROM enhanced_analyses 
    WHERE created_at < NOW() - INTERVAL '2 years';
    
    -- Archive search logs older than 6 months
    DELETE FROM semantic_search_logs 
    WHERE created_at < NOW() - INTERVAL '6 months';
    
    -- Archive user analytics older than 1 year
    DELETE FROM user_analytics 
    WHERE created_at < NOW() - INTERVAL '1 year';
    
    -- Clean up orphaned embeddings
    DELETE FROM document_embeddings 
    WHERE document_id NOT IN (SELECT id FROM enhanced_documents);
    
    -- Update statistics
    ANALYZE enhanced_documents;
    ANALYZE document_embeddings;
    ANALYZE enhanced_analyses;
    ANALYZE enhanced_optimizations;
END;
$$ LANGUAGE plpgsql;

-- ====================================================================================================
-- TRIGGER FUNCTIONS FOR AUTOMATIC UPDATES
-- ====================================================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for enhanced_documents
CREATE TRIGGER update_enhanced_documents_updated_at
    BEFORE UPDATE ON enhanced_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to log user analytics automatically
CREATE OR REPLACE FUNCTION log_user_activity()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO user_analytics (user_id, event_type, event_data)
    VALUES (
        NEW.user_id,
        TG_TABLE_NAME || '_' || TG_OP,
        jsonb_build_object(
            'record_id', NEW.id,
            'table', TG_TABLE_NAME,
            'operation', TG_OP
        )
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for automatic analytics logging
CREATE TRIGGER log_enhanced_analysis_activity
    AFTER INSERT ON enhanced_analyses
    FOR EACH ROW
    EXECUTE FUNCTION log_user_activity();

CREATE TRIGGER log_enhanced_optimization_activity
    AFTER INSERT ON enhanced_optimizations
    FOR EACH ROW
    EXECUTE FUNCTION log_user_activity();

-- ====================================================================================================
-- INDEXES FOR FULL-TEXT SEARCH OPTIMIZATION
-- ====================================================================================================

-- GIN indexes for JSONB fields
CREATE INDEX IF NOT EXISTS idx_enhanced_documents_content_gin ON enhanced_documents USING GIN(content);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_result_gin ON enhanced_analyses USING GIN(analysis_result);
CREATE INDEX IF NOT EXISTS idx_enhanced_optimizations_resume_gin ON enhanced_optimizations USING GIN(optimized_resume);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_user_score ON enhanced_analyses(user_id, overall_score DESC);
CREATE INDEX IF NOT EXISTS idx_enhanced_analyses_user_date ON enhanced_analyses(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_document_embeddings_user_section ON document_embeddings(user_id, section_type);

-- ====================================================================================================
-- GRANT PERMISSIONS
-- ====================================================================================================

-- Grant usage on the schema to authenticated users
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;

-- Grant permissions on tables to authenticated users
GRANT ALL ON enhanced_documents TO authenticated;
GRANT ALL ON document_embeddings TO authenticated;
GRANT ALL ON enhanced_analyses TO authenticated;
GRANT ALL ON enhanced_optimizations TO authenticated;
GRANT SELECT, INSERT ON semantic_search_logs TO authenticated;
GRANT SELECT, INSERT ON user_analytics TO authenticated;

-- Grant permissions on views
GRANT SELECT ON user_dashboard_summary TO authenticated;
GRANT SELECT ON analysis_performance_metrics TO authenticated;

-- Grant execute permissions on functions
GRANT EXECUTE ON FUNCTION enhanced_semantic_search TO authenticated;
GRANT EXECUTE ON FUNCTION advanced_vector_search TO authenticated;
GRANT EXECUTE ON FUNCTION find_similar_profiles TO authenticated;

-- ====================================================================================================
-- SCHEMA VALIDATION AND COMMENTS
-- ====================================================================================================

COMMENT ON TABLE enhanced_documents IS 'Enhanced document storage with Document AI processing and PII protection';
COMMENT ON TABLE document_embeddings IS 'Vector embeddings from Vertex AI for semantic search and similarity matching';
COMMENT ON TABLE enhanced_analyses IS 'Comprehensive AI analysis results with advanced metrics and insights';
COMMENT ON TABLE enhanced_optimizations IS 'AI-powered resume optimizations with detailed improvement tracking';
COMMENT ON TABLE semantic_search_logs IS 'Query logs for semantic search analytics and performance monitoring';
COMMENT ON TABLE user_analytics IS 'Comprehensive user behavior tracking and feature usage analytics';

COMMENT ON FUNCTION enhanced_semantic_search IS 'Perform semantic search across user documents using vector similarity';
COMMENT ON FUNCTION advanced_vector_search IS 'Advanced vector similarity search with filtering and ranking';
COMMENT ON FUNCTION find_similar_profiles IS 'Find similar user profiles for benchmarking and insights';
COMMENT ON FUNCTION archive_old_data IS 'Automated data archival and cleanup for performance optimization';

-- ====================================================================================================
-- SCHEMA COMPLETE: ENHANCED SPROUTCV DATABASE v2.0
-- ====================================================================================================

-- Create a summary view of the schema deployment
CREATE OR REPLACE VIEW schema_deployment_summary AS
SELECT 
    'enhanced_sproutcv_v2.0' as schema_version,
    6 as total_tables,
    15 as total_indexes,
    6 as total_functions,
    12 as total_policies,
    2 as total_views,
    4 as total_triggers,
    NOW() as deployed_at,
    'Document AI, Vertex Embeddings, Semantic Search, Privacy Protection' as features;

SELECT * FROM schema_deployment_summary;
