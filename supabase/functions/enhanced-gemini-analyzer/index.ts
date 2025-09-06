import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { GoogleGenerativeAI } from 'https://esm.sh/@google/generative-ai@0.12.0'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// Enhanced AI Resume Analyzer with Advanced Features
const gemini = new GoogleGenerativeAI(Deno.env.get('GEMINI_API_KEY')!)
const model = gemini.getGenerativeModel({ 
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.3,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 8192
  }
})

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

// Enhanced Response Schemas with Advanced Structure
const ENHANCED_ANALYSIS_SCHEMA = {
  type: 'object',
  properties: {
    analysisId: { type: 'string' },
    overallScore: { type: 'number', minimum: 0, maximum: 100 },
    confidence: { type: 'number', minimum: 0, maximum: 1 },
    processingMetadata: {
      type: 'object',
      properties: {
        analysisVersion: { type: 'string' },
        processingTime: { type: 'number' },
        featuresUsed: { type: 'array', items: { type: 'string' } },
        documentQuality: { type: 'string', enum: ['excellent', 'good', 'fair', 'poor'] }
      }
    },
    atsCompatibility: {
      type: 'object',
      properties: {
        score: { type: 'number', minimum: 0, maximum: 100 },
        systemsCompatible: { type: 'array', items: { type: 'string' } },
        formatIssues: { type: 'array', items: { type: 'string' } },
        recommendations: { type: 'array', items: { type: 'string' } }
      }
    },
    keywordAnalysis: {
      type: 'object',
      properties: {
        matchScore: { type: 'number', minimum: 0, maximum: 100 },
        foundKeywords: { type: 'array', items: { type: 'string' } },
        missingKeywords: { type: 'array', items: { type: 'string' } },
        relevanceScores: { 
          type: 'object',
          additionalProperties: { type: 'number' }
        },
        semanticMatches: { type: 'array', items: { type: 'string' } }
      }
    },
    skillsAnalysis: {
      type: 'object',
      properties: {
        technicalSkills: {
          type: 'object',
          properties: {
            identified: { type: 'array', items: { type: 'string' } },
            proficiencyLevels: { 
              type: 'object',
              additionalProperties: { type: 'string' }
            },
            relevanceToJob: { 
              type: 'object',
              additionalProperties: { type: 'number' }
            }
          }
        },
        softSkills: {
          type: 'object',
          properties: {
            identified: { type: 'array', items: { type: 'string' } },
            contextualEvidence: { 
              type: 'object',
              additionalProperties: { type: 'string' }
            }
          }
        },
        gapAnalysis: {
          type: 'object',
          properties: {
            missing: { type: 'array', items: { type: 'string' } },
            emerging: { type: 'array', items: { type: 'string' } },
            recommendations: { type: 'array', items: { type: 'string' } }
          }
        }
      }
    },
    experienceAnalysis: {
      type: 'object',
      properties: {
        relevanceScore: { type: 'number', minimum: 0, maximum: 100 },
        careerProgression: { type: 'string' },
        industryAlignment: { type: 'number', minimum: 0, maximum: 100 },
        achievements: {
          type: 'object',
          properties: {
            quantified: { type: 'array', items: { type: 'string' } },
            qualitative: { type: 'array', items: { type: 'string' } },
            impact: { type: 'array', items: { type: 'string' } }
          }
        },
        gaps: { type: 'array', items: { type: 'string' } }
      }
    },
    enhancementSuggestions: {
      type: 'object',
      properties: {
        critical: { type: 'array', items: { type: 'string' } },
        important: { type: 'array', items: { type: 'string' } },
        recommended: { type: 'array', items: { type: 'string' } },
        contentOptimization: {
          type: 'object',
          properties: {
            addSections: { type: 'array', items: { type: 'string' } },
            improveSections: { type: 'array', items: { type: 'string' } },
            removeSections: { type: 'array', items: { type: 'string' } }
          }
        },
        formatting: { type: 'array', items: { type: 'string' } }
      }
    },
    industryInsights: {
      type: 'object',
      properties: {
        industryTrends: { type: 'array', items: { type: 'string' } },
        salaryInsights: {
          type: 'object',
          properties: {
            expectedRange: { type: 'string' },
            factors: { type: 'array', items: { type: 'string' } }
          }
        },
        competitiveAnalysis: { type: 'string' },
        growthPotential: { type: 'string' }
      }
    }
  },
  required: ['analysisId', 'overallScore', 'confidence', 'atsCompatibility', 'keywordAnalysis', 'skillsAnalysis', 'experienceAnalysis', 'enhancementSuggestions']
}

const ENHANCED_OPTIMIZATION_SCHEMA = {
  type: 'object',
  properties: {
    optimizedResume: {
      type: 'object',
      properties: {
        personalInfo: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            professionalTitle: { type: 'string' },
            summary: { type: 'string' },
            contact: {
              type: 'object',
              properties: {
                email: { type: 'string' },
                phone: { type: 'string' },
                location: { type: 'string' },
                linkedin: { type: 'string' },
                portfolio: { type: 'string' }
              }
            }
          }
        },
        professionalSummary: { type: 'string' },
        coreCompetencies: { type: 'array', items: { type: 'string' } },
        workExperience: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              company: { type: 'string' },
              position: { type: 'string' },
              duration: { type: 'string' },
              location: { type: 'string' },
              achievements: { type: 'array', items: { type: 'string' } },
              keyAccomplishments: { type: 'array', items: { type: 'string' } },
              technologiesUsed: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        education: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              institution: { type: 'string' },
              degree: { type: 'string' },
              field: { type: 'string' },
              graduationYear: { type: 'string' },
              relevantCoursework: { type: 'array', items: { type: 'string' } },
              honors: { type: 'array', items: { type: 'string' } }
            }
          }
        },
        technicalSkills: {
          type: 'object',
          properties: {
            programming: { type: 'array', items: { type: 'string' } },
            frameworks: { type: 'array', items: { type: 'string' } },
            databases: { type: 'array', items: { type: 'string' } },
            tools: { type: 'array', items: { type: 'string' } },
            cloud: { type: 'array', items: { type: 'string' } }
          }
        },
        certifications: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              issuer: { type: 'string' },
              date: { type: 'string' },
              credentialId: { type: 'string' }
            }
          }
        },
        projects: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              description: { type: 'string' },
              technologies: { type: 'array', items: { type: 'string' } },
              impact: { type: 'string' },
              url: { type: 'string' }
            }
          }
        }
      }
    },
    optimizationMetrics: {
      type: 'object',
      properties: {
        improvementScore: { type: 'number', minimum: 0, maximum: 100 },
        keywordsAdded: { type: 'number' },
        sectionsEnhanced: { type: 'array', items: { type: 'string' } },
        atsCompatibilityImprovement: { type: 'number' },
        readabilityScore: { type: 'number', minimum: 0, maximum: 100 }
      }
    },
    changesSummary: {
      type: 'object',
      properties: {
        major: { type: 'array', items: { type: 'string' } },
        minor: { type: 'array', items: { type: 'string' } },
        additions: { type: 'array', items: { type: 'string' } },
        improvements: { type: 'array', items: { type: 'string' } }
      }
    }
  },
  required: ['optimizedResume', 'optimizationMetrics', 'changesSummary']
}

// Enhanced processing with advanced features
serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    const { action, resumeText, jobDescription, userId, options = {} } = await req.json()

    // Validate inputs
    if (!resumeText || !jobDescription || !userId) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: resumeText, jobDescription, userId' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      )
    }

    const startTime = Date.now()

    switch (action) {
      case 'analyze': {
        const analysis = await performEnhancedAnalysis(resumeText, jobDescription, userId, options)
        
        // Store analysis with enhanced metadata
        await storeAnalysisResult(analysis, userId, resumeText, jobDescription)
        
        return new Response(JSON.stringify(analysis), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'optimize': {
        const optimization = await performEnhancedOptimization(resumeText, jobDescription, userId, options)
        
        // Store optimized resume
        await storeOptimizedResume(optimization, userId, resumeText, jobDescription)
        
        return new Response(JSON.stringify(optimization), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      case 'semantic_search': {
        const searchResults = await performSemanticSearch(options.query, userId, options)
        
        return new Response(JSON.stringify(searchResults), {
          headers: { 'Content-Type': 'application/json' }
        })
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action. Use: analyze, optimize, or semantic_search' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        )
    }

  } catch (error) {
    console.error('Enhanced AI Processing Error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'AI processing failed', 
        details: error.message,
        timestamp: new Date().toISOString()
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  }
})

/**
 * Enhanced Analysis with Advanced AI Features
 */
async function performEnhancedAnalysis(resumeText: string, jobDescription: string, userId: string, options: any = {}) {
  const analysisId = `analysis_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  
  // Enhanced prompt with advanced analysis requirements
  const enhancedPrompt = `
You are an advanced AI resume analyzer with expertise in ATS systems, industry trends, and career development. 

Perform a comprehensive analysis of this resume against the job description using these advanced capabilities:

1. **ATS COMPATIBILITY ANALYSIS**
   - Analyze format, structure, and keyword optimization
   - Identify compatibility with major ATS systems (Workday, Greenhouse, etc.)
   - Provide specific formatting recommendations

2. **SEMANTIC KEYWORD ANALYSIS**
   - Perform deep semantic matching beyond exact keywords
   - Identify industry-specific terminology and acronyms
   - Calculate relevance scores for each keyword/skill

3. **SKILLS GAP ANALYSIS**
   - Map technical and soft skills to job requirements
   - Identify proficiency levels from context
   - Suggest emerging skills for career growth

4. **EXPERIENCE RELEVANCE SCORING**
   - Analyze career progression and industry alignment
   - Quantify achievements and impact statements
   - Identify experience gaps and progression opportunities

5. **INDUSTRY INSIGHTS & TRENDS**
   - Provide salary insights and market analysis
   - Identify industry trends and growth opportunities
   - Compare candidate profile to market standards

6. **ENHANCEMENT PRIORITIZATION**
   - Categorize suggestions by impact level (critical/important/recommended)
   - Provide specific content and formatting improvements
   - Include ATS optimization recommendations

**RESUME:**
${resumeText}

**JOB DESCRIPTION:**
${jobDescription}

**ANALYSIS REQUIREMENTS:**
- Provide numerical scores (0-100) for all metrics
- Include confidence levels for AI predictions
- Use specific examples from the resume
- Prioritize actionable recommendations
- Consider industry standards and trends

Generate a comprehensive analysis following the provided schema structure.
`

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: enhancedPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: ENHANCED_ANALYSIS_SCHEMA
      }
    })

    const analysisResult = JSON.parse(result.response.text())
    
    // Add processing metadata
    analysisResult.analysisId = analysisId
    analysisResult.processingMetadata = {
      analysisVersion: 'enhanced-v2.0',
      processingTime: Date.now() - Date.now(),
      featuresUsed: ['semantic_analysis', 'ats_optimization', 'industry_insights', 'gap_analysis'],
      documentQuality: calculateDocumentQuality(resumeText),
      userId: userId,
      timestamp: new Date().toISOString()
    }

    return analysisResult

  } catch (error) {
    console.error('Enhanced analysis error:', error)
    throw new Error(`Advanced analysis failed: ${error.message}`)
  }
}

/**
 * Enhanced Optimization with Advanced AI Features
 */
async function performEnhancedOptimization(resumeText: string, jobDescription: string, userId: string, options: any = {}) {
  const optimizationPrompt = `
You are an expert resume optimizer with deep knowledge of ATS systems and industry best practices.

Create an optimized version of this resume for the target job with these advanced features:

1. **INTELLIGENT KEYWORD INTEGRATION**
   - Naturally incorporate missing keywords from job description
   - Use industry-standard terminology and acronyms
   - Maintain authentic voice while optimizing for ATS

2. **ACHIEVEMENT QUANTIFICATION**
   - Add specific metrics and numbers where possible
   - Use strong action verbs and impact statements
   - Highlight ROI and business value

3. **STRUCTURAL OPTIMIZATION**
   - Ensure ATS-friendly formatting
   - Optimize section order for maximum impact
   - Use consistent formatting and bullet structure

4. **INDUSTRY ALIGNMENT**
   - Align content with industry standards
   - Include relevant technical skills and certifications
   - Emphasize experience most relevant to target role

5. **CONTENT ENHANCEMENT**
   - Strengthen weak sections with relevant additions
   - Remove or de-emphasize irrelevant information
   - Add missing sections if beneficial

**OPTIMIZATION REQUIREMENTS:**
- Maintain factual accuracy (never fabricate experience)
- Preserve candidate's authentic voice and style
- Prioritize changes that maximize ATS scoring
- Provide clear metrics on improvements made
- Focus on job-specific optimization

**ORIGINAL RESUME:**
${resumeText}

**TARGET JOB DESCRIPTION:**
${jobDescription}

Generate an optimized resume with detailed improvement metrics and change summary.
`

  try {
    const result = await model.generateContent({
      contents: [{ parts: [{ text: optimizationPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        responseSchema: ENHANCED_OPTIMIZATION_SCHEMA
      }
    })

    const optimizationResult = JSON.parse(result.response.text())
    
    // Add metadata
    optimizationResult.metadata = {
      optimizationId: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      version: 'enhanced-v2.0',
      userId: userId,
      timestamp: new Date().toISOString(),
      originalLength: resumeText.length,
      optimizedLength: JSON.stringify(optimizationResult.optimizedResume).length
    }

    return optimizationResult

  } catch (error) {
    console.error('Enhanced optimization error:', error)
    throw new Error(`Advanced optimization failed: ${error.message}`)
  }
}

/**
 * Advanced Semantic Search Implementation
 */
async function performSemanticSearch(query: string, userId: string, options: any = {}) {
  const { limit = 10, type = 'all', similarity_threshold = 0.7 } = options

  try {
    // Use enhanced vector search with user context
    const { data, error } = await supabase
      .rpc('enhanced_semantic_search', {
        search_query: query,
        user_id: userId,
        result_limit: limit,
        content_type: type,
        min_similarity: similarity_threshold
      })

    if (error) throw error

    return {
      query,
      results: data || [],
      metadata: {
        totalResults: data?.length || 0,
        searchType: 'semantic',
        userId,
        timestamp: new Date().toISOString()
      }
    }

  } catch (error) {
    console.error('Semantic search error:', error)
    throw new Error(`Semantic search failed: ${error.message}`)
  }
}

/**
 * Enhanced storage with comprehensive metadata
 */
async function storeAnalysisResult(analysis: any, userId: string, resumeText: string, jobDescription: string) {
  try {
    const { error } = await supabase
      .from('enhanced_analyses')
      .insert({
        id: analysis.analysisId,
        user_id: userId,
        analysis_result: analysis,
        resume_content: resumeText,
        job_description: jobDescription,
        overall_score: analysis.overallScore,
        ats_score: analysis.atsCompatibility.score,
        keyword_score: analysis.keywordAnalysis.matchScore,
        experience_score: analysis.experienceAnalysis.relevanceScore,
        confidence: analysis.confidence,
        processing_metadata: analysis.processingMetadata,
        created_at: new Date().toISOString()
      })

    if (error) throw error

  } catch (error) {
    console.error('Storage error:', error)
    // Non-blocking error - analysis can still be returned
  }
}

async function storeOptimizedResume(optimization: any, userId: string, originalResume: string, jobDescription: string) {
  try {
    const { error } = await supabase
      .from('enhanced_optimizations')
      .insert({
        id: optimization.metadata.optimizationId,
        user_id: userId,
        original_resume: originalResume,
        optimized_resume: optimization.optimizedResume,
        job_description: jobDescription,
        improvement_score: optimization.optimizationMetrics.improvementScore,
        keywords_added: optimization.optimizationMetrics.keywordsAdded,
        changes_summary: optimization.changesSummary,
        optimization_metadata: optimization.metadata,
        created_at: new Date().toISOString()
      })

    if (error) throw error

  } catch (error) {
    console.error('Optimization storage error:', error)
    // Non-blocking error
  }
}

function calculateDocumentQuality(resumeText: string): string {
  const length = resumeText.length
  const sections = resumeText.split('\n\n').length
  const hasNumbers = /\d/.test(resumeText)
  const hasMetrics = /\b(\d+%|\$\d+|increased|improved|reduced)\b/i.test(resumeText)
  
  let score = 0
  if (length > 1000) score += 25
  if (sections > 4) score += 25
  if (hasNumbers) score += 25
  if (hasMetrics) score += 25
  
  if (score >= 75) return 'excellent'
  if (score >= 50) return 'good'
  if (score >= 25) return 'fair'
  return 'poor'
}
