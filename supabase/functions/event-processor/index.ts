import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

/**
 * Event-Driven Document Processing Pipeline
 * Handles async processing of documents with Google Cloud Pub/Sub
 * Supports Document AI, Vertex Embeddings, and Privacy Protection
 */

interface ProcessingEvent {
  eventId: string
  eventType: 'document_uploaded' | 'analysis_requested' | 'optimization_requested' | 'search_requested'
  userId: string
  documentId?: string
  jobId?: string
  metadata: Record<string, any>
  timestamp: string
}

interface ProcessingResult {
  success: boolean
  eventId: string
  processingTime: number
  result?: any
  error?: string
  metadata: Record<string, any>
}

const supabase = createClient(
  Deno.env.get('SUPABASE_URL')!,
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
)

serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  try {
    // Parse Pub/Sub message
    const body = await req.json()
    const message = body.message
    
    if (!message || !message.data) {
      return new Response('Invalid Pub/Sub message', { status: 400 })
    }

    // Decode message data
    const eventData: ProcessingEvent = JSON.parse(atob(message.data))
    const startTime = Date.now()

    console.log(`Processing event: ${eventData.eventType} for user: ${eventData.userId}`)

    let result: ProcessingResult

    switch (eventData.eventType) {
      case 'document_uploaded':
        result = await handleDocumentUpload(eventData)
        break
      
      case 'analysis_requested':
        result = await handleAnalysisRequest(eventData)
        break
      
      case 'optimization_requested':
        result = await handleOptimizationRequest(eventData)
        break
      
      case 'search_requested':
        result = await handleSearchRequest(eventData)
        break
      
      default:
        throw new Error(`Unknown event type: ${eventData.eventType}`)
    }

    // Log processing result
    await logProcessingEvent(eventData, result, Date.now() - startTime)

    // Publish completion event if successful
    if (result.success) {
      await publishCompletionEvent(eventData, result)
    }

    return new Response(JSON.stringify({ success: true, result }), {
      headers: { 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('Event processing error:', error)
    
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
})

/**
 * Handle document upload event - triggers Document AI processing
 */
async function handleDocumentUpload(event: ProcessingEvent): Promise<ProcessingResult> {
  try {
    const { documentId, userId } = event
    
    // Fetch document from storage
    const { data: document, error: fetchError } = await supabase
      .from('enhanced_documents')
      .select('*')
      .eq('id', documentId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !document) {
      throw new Error(`Document not found: ${documentId}`)
    }

    // Process with Document AI (simulated - would call actual Document AI)
    const processedContent = await simulateDocumentAIProcessing(document.raw_text, document.document_type)
    
    // Generate embeddings (simulated - would call Vertex AI)
    const embeddings = await simulateVertexEmbeddings(processedContent.sections)
    
    // Apply PII protection (simulated - would call Cloud DLP)
    const protectedContent = await simulatePIIProtection(processedContent)
    
    // Update document with processed content
    const { error: updateError } = await supabase
      .from('enhanced_documents')
      .update({
        content: protectedContent,
        processing_metadata: {
          processed_at: new Date().toISOString(),
          document_ai_version: 'v1',
          embedding_model: 'textembedding-gecko@003',
          pii_protection: true
        },
        quality_score: calculateQualityScore(processedContent),
        parsing_confidence: 0.95,
        pii_detected: protectedContent.pii_detected || false,
        pii_redacted: protectedContent.pii_redacted || false,
        processed_at: new Date().toISOString()
      })
      .eq('id', documentId)

    if (updateError) throw updateError

    // Store embeddings
    await storeEmbeddings(documentId, userId, embeddings, document.document_type)

    return {
      success: true,
      eventId: event.eventId,
      processingTime: 0,
      result: {
        documentId,
        qualityScore: calculateQualityScore(processedContent),
        embeddingsCount: embeddings.length,
        piiProtected: protectedContent.pii_redacted
      },
      metadata: {
        processingSteps: ['document_ai', 'vertex_embeddings', 'pii_protection', 'storage']
      }
    }

  } catch (error) {
    return {
      success: false,
      eventId: event.eventId,
      processingTime: 0,
      error: error.message,
      metadata: { step: 'document_upload_processing' }
    }
  }
}

/**
 * Handle analysis request event - triggers enhanced AI analysis
 */
async function handleAnalysisRequest(event: ProcessingEvent): Promise<ProcessingResult> {
  try {
    const { userId, metadata } = event
    const { resumeText, jobDescription, options } = metadata

    // Call enhanced AI analysis
    const analysisResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enhanced-gemini-analyzer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        action: 'analyze',
        resumeText,
        jobDescription,
        userId,
        options
      })
    })

    if (!analysisResponse.ok) {
      throw new Error(`Analysis failed: ${analysisResponse.statusText}`)
    }

    const analysisResult = await analysisResponse.json()

    // Update user analytics
    await logAnalyticsEvent(userId, 'analysis_completed', {
      analysisId: analysisResult.analysisId,
      overallScore: analysisResult.overallScore,
      confidence: analysisResult.confidence
    })

    return {
      success: true,
      eventId: event.eventId,
      processingTime: 0,
      result: analysisResult,
      metadata: {
        analysisType: 'enhanced',
        version: 'v2.0'
      }
    }

  } catch (error) {
    return {
      success: false,
      eventId: event.eventId,
      processingTime: 0,
      error: error.message,
      metadata: { step: 'analysis_processing' }
    }
  }
}

/**
 * Handle optimization request event - triggers AI optimization
 */
async function handleOptimizationRequest(event: ProcessingEvent): Promise<ProcessingResult> {
  try {
    const { userId, metadata } = event
    const { resumeText, jobDescription, options } = metadata

    // Call enhanced AI optimization
    const optimizationResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enhanced-gemini-analyzer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        action: 'optimize',
        resumeText,
        jobDescription,
        userId,
        options
      })
    })

    if (!optimizationResponse.ok) {
      throw new Error(`Optimization failed: ${optimizationResponse.statusText}`)
    }

    const optimizationResult = await optimizationResponse.json()

    // Update user analytics
    await logAnalyticsEvent(userId, 'optimization_completed', {
      optimizationId: optimizationResult.metadata.optimizationId,
      improvementScore: optimizationResult.optimizationMetrics.improvementScore,
      keywordsAdded: optimizationResult.optimizationMetrics.keywordsAdded
    })

    return {
      success: true,
      eventId: event.eventId,
      processingTime: 0,
      result: optimizationResult,
      metadata: {
        optimizationType: 'enhanced',
        version: 'v2.0'
      }
    }

  } catch (error) {
    return {
      success: false,
      eventId: event.eventId,
      processingTime: 0,
      error: error.message,
      metadata: { step: 'optimization_processing' }
    }
  }
}

/**
 * Handle search request event - triggers semantic search
 */
async function handleSearchRequest(event: ProcessingEvent): Promise<ProcessingResult> {
  try {
    const { userId, metadata } = event
    const { query, options } = metadata

    // Call enhanced semantic search
    const searchResponse = await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/enhanced-gemini-analyzer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`
      },
      body: JSON.stringify({
        action: 'semantic_search',
        userId,
        options: { query, ...options }
      })
    })

    if (!searchResponse.ok) {
      throw new Error(`Search failed: ${searchResponse.statusText}`)
    }

    const searchResult = await searchResponse.json()

    // Log search analytics
    await logSearchEvent(userId, query, searchResult.results.length, options)

    return {
      success: true,
      eventId: event.eventId,
      processingTime: 0,
      result: searchResult,
      metadata: {
        searchType: 'semantic',
        resultsCount: searchResult.results.length
      }
    }

  } catch (error) {
    return {
      success: false,
      eventId: event.eventId,
      processingTime: 0,
      error: error.message,
      metadata: { step: 'search_processing' }
    }
  }
}

/**
 * Simulate Document AI processing (replace with actual Google Cloud Document AI)
 */
async function simulateDocumentAIProcessing(text: string, documentType: string) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 1000))
  
  const sections = text.split('\n\n').filter(section => section.trim().length > 0)
  
  return {
    documentType,
    sections: sections.map((section, index) => ({
      id: `section_${index}`,
      content: section,
      type: inferSectionType(section, documentType),
      confidence: 0.9 + Math.random() * 0.1
    })),
    entities: extractEntities(text),
    confidence: 0.95
  }
}

/**
 * Simulate Vertex AI embeddings (replace with actual Vertex AI API)
 */
async function simulateVertexEmbeddings(sections: any[]) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 500))
  
  return sections.map(section => ({
    sectionId: section.id,
    content: section.content,
    embedding: Array.from({ length: 768 }, () => Math.random() - 0.5), // Random 768-dim vector
    model: 'textembedding-gecko@003',
    dimension: 768
  }))
}

/**
 * Simulate PII protection (replace with actual Google Cloud DLP)
 */
async function simulatePIIProtection(content: any) {
  // Simulate processing delay
  await new Promise(resolve => setTimeout(resolve, 300))
  
  const piiPatterns = [
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, // Email
    /\b\d{3}-\d{3}-\d{4}\b/g, // Phone
    /\b\d{3}-\d{2}-\d{4}\b/g  // SSN
  ]
  
  let piiDetected = false
  const processedContent = { ...content }
  
  processedContent.sections = content.sections.map((section: any) => {
    let processedText = section.content
    
    piiPatterns.forEach(pattern => {
      if (pattern.test(processedText)) {
        piiDetected = true
        processedText = processedText.replace(pattern, '[REDACTED]')
      }
    })
    
    return {
      ...section,
      content: processedText
    }
  })
  
  return {
    ...processedContent,
    pii_detected: piiDetected,
    pii_redacted: piiDetected
  }
}

/**
 * Store embeddings in the database
 */
async function storeEmbeddings(documentId: string, userId: string, embeddings: any[], documentType: string) {
  const embeddingRecords = embeddings.map(emb => ({
    document_id: documentId,
    user_id: userId,
    content_section: emb.content,
    embedding: emb.embedding,
    section_type: emb.sectionId.includes('section') ? 'general' : emb.sectionId,
    document_type: documentType,
    embedding_model: emb.model,
    metadata: {
      dimension: emb.dimension,
      section_id: emb.sectionId
    }
  }))

  const { error } = await supabase
    .from('document_embeddings')
    .insert(embeddingRecords)

  if (error) {
    console.error('Error storing embeddings:', error)
    throw error
  }
}

/**
 * Log processing events for analytics
 */
async function logProcessingEvent(event: ProcessingEvent, result: ProcessingResult, processingTime: number) {
  try {
    await supabase
      .from('user_analytics')
      .insert({
        user_id: event.userId,
        event_type: `${event.eventType}_processed`,
        event_data: {
          eventId: event.eventId,
          success: result.success,
          processingTime,
          error: result.error
        },
        processing_time_ms: processingTime,
        success: result.success,
        error_message: result.error,
        features_used: ['event_driven_processing'],
        ai_model_version: 'enhanced-v2.0'
      })
  } catch (error) {
    console.error('Error logging processing event:', error)
  }
}

/**
 * Log analytics events
 */
async function logAnalyticsEvent(userId: string, eventType: string, eventData: any) {
  try {
    await supabase
      .from('user_analytics')
      .insert({
        user_id: userId,
        event_type: eventType,
        event_data: eventData,
        success: true,
        features_used: ['enhanced_ai'],
        ai_model_version: 'enhanced-v2.0'
      })
  } catch (error) {
    console.error('Error logging analytics event:', error)
  }
}

/**
 * Log search events
 */
async function logSearchEvent(userId: string, query: string, resultsCount: number, options: any) {
  try {
    await supabase
      .from('semantic_search_logs')
      .insert({
        user_id: userId,
        search_query: query,
        search_type: 'semantic',
        results_count: resultsCount,
        similarity_threshold: options.similarity_threshold || 0.7,
        results_metadata: options
      })
  } catch (error) {
    console.error('Error logging search event:', error)
  }
}

/**
 * Publish completion event to Pub/Sub
 */
async function publishCompletionEvent(originalEvent: ProcessingEvent, result: ProcessingResult) {
  try {
    // In a real implementation, this would publish to Google Cloud Pub/Sub
    console.log(`Publishing completion event for ${originalEvent.eventType}:`, {
      originalEventId: originalEvent.eventId,
      success: result.success,
      processingTime: result.processingTime
    })
    
    // Simulate notification to frontend via webhook or WebSocket
    // This could trigger real-time updates in the UI
    
  } catch (error) {
    console.error('Error publishing completion event:', error)
  }
}

/**
 * Helper functions
 */
function inferSectionType(text: string, documentType: string): string {
  const lowerText = text.toLowerCase()
  
  if (documentType === 'resume') {
    if (lowerText.includes('experience') || lowerText.includes('work')) return 'experience'
    if (lowerText.includes('education') || lowerText.includes('university')) return 'education'
    if (lowerText.includes('skill') || lowerText.includes('technology')) return 'skills'
    if (lowerText.includes('project')) return 'projects'
  }
  
  return 'general'
}

function extractEntities(text: string): any[] {
  // Simple entity extraction - would use Document AI in production
  const entities = []
  
  const emailMatch = text.match(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/)
  if (emailMatch) {
    entities.push({ type: 'EMAIL', value: emailMatch[0] })
  }
  
  const phoneMatch = text.match(/\b\d{3}-\d{3}-\d{4}\b/)
  if (phoneMatch) {
    entities.push({ type: 'PHONE', value: phoneMatch[0] })
  }
  
  return entities
}

function calculateQualityScore(content: any): number {
  let score = 0
  
  // Base score for having content
  if (content.sections && content.sections.length > 0) score += 20
  
  // Score for number of sections
  score += Math.min(content.sections.length * 10, 40)
  
  // Score for confidence
  score += content.confidence * 40
  
  return Math.min(Math.round(score), 100)
}
