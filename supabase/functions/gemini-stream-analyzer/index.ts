/**
 * Gemini Streaming Resume Analyzer Edge Function
 * Provides real-time streaming analysis using Server-Sent Events (SSE)
 * State-of-the-art implementation with progressive results
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.53.0';

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent';
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface StreamRequest {
  resumeText: string;
  jobDescription: string;
  userId?: string;
  analysisType?: 'comprehensive' | 'quick' | 'keyword-only';
  metadata?: {
    requestId?: string;
    clientTimestamp?: number;
  };
}

interface StreamChunk {
  type: 'progress' | 'partial' | 'complete' | 'error';
  timestamp: number;
  data: any;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

/**
 * Create streaming prompt for Gemini
 */
function createStreamingPrompt(request: StreamRequest): string {
  const { resumeText, jobDescription, analysisType = 'comprehensive' } = request;

  const basePrompt = `You are an elite resume strategist and AI career consultant. Analyze this resume against the job description and provide progressive insights.

**STREAMING INSTRUCTIONS:**
1. Provide analysis in structured stages
2. Start with quick wins, then detailed insights
3. Each section should be actionable and specific
4. Use JSON format for easy parsing

**RESUME:**
${resumeText}

**JOB DESCRIPTION:**
${jobDescription}

**ANALYSIS STAGES:**

Stage 1 - Quick Assessment (provide immediately):
{
  "stage": "quick_assessment",
  "overall_score": <0-100>,
  "ats_score": <0-100>,
  "match_percentage": <0-100>,
  "top_strengths": [<3-5 key strengths>],
  "critical_gaps": [<3-5 immediate issues>]
}

Stage 2 - Keyword Analysis:
{
  "stage": "keyword_analysis",
  "matched_keywords": [<all matching keywords>],
  "missing_critical_keywords": [<essential missing keywords>],
  "suggested_keywords": [<keywords to add>],
  "keyword_density_score": <0-100>
}

Stage 3 - Detailed Scoring:
{
  "stage": "detailed_scoring",
  "detailed_scores": {
    "keywordMatch": <0-100>,
    "skillsAlignment": <0-100>,
    "experienceRelevance": <0-100>,
    "atsCompatibility": <0-100>,
    "formatOptimization": <0-100>
  }
}

Stage 4 - Actionable Recommendations:
{
  "stage": "recommendations",
  "actionable_recommendations": [
    {
      "priority": "high|medium|low",
      "category": "<category>",
      "action": "<specific action>",
      "impact": "<expected impact>",
      "effort": "low|medium|high",
      "estimatedImprovement": <score increase>
    }
  ],
  "quick_wins": [<easy high-impact changes>]
}

Stage 5 - Competitive Analysis:
{
  "stage": "competitive_analysis",
  "competitive_analysis": {
    "marketPosition": "<your position vs market>",
    "differentiators": [<unique strengths>],
    "gapAnalysis": [<areas to improve>],
    "recommendations": [<strategic advice>]
  }
}

Stage 6 - ATS Optimization:
{
  "stage": "ats_optimization",
  "ats_optimization": {
    "tips": [<ATS optimization tips>],
    "formattingIssues": [<formatting problems>],
    "parsingWarnings": [<potential parsing issues>],
    "compatibilityScore": <0-100>
  }
}

Provide each stage sequentially. Use clear JSON formatting.`;

  return basePrompt;
}

/**
 * Parse streaming response from Gemini
 */
function parseGeminiStreamChunk(line: string): string | null {
  if (!line.trim() || line.startsWith(':')) return null;

  try {
    const json = JSON.parse(line);
    if (json.candidates && json.candidates[0]?.content?.parts) {
      const text = json.candidates[0].content.parts
        .map((part: any) => part.text || '')
        .join('');
      return text;
    }
  } catch (e) {
    console.error('Failed to parse chunk:', e);
  }

  return null;
}

/**
 * Main streaming handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const request: StreamRequest = await req.json();

    // Validate request
    if (!request.resumeText || !request.jobDescription) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: resumeText, jobDescription' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!GEMINI_API_KEY) {
      return new Response(
        JSON.stringify({ error: 'GEMINI_API_KEY not configured' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Create SSE stream
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      async start(controller) {
        const sendChunk = (chunk: StreamChunk) => {
          const data = `data: ${JSON.stringify(chunk)}\n\n`;
          controller.enqueue(encoder.encode(data));
        };

        try {
          // Send initial progress
          sendChunk({
            type: 'progress',
            timestamp: Date.now(),
            data: { stage: 'initializing', progress: 0, message: 'Starting analysis...' },
          });

          // Call Gemini streaming API
          const prompt = createStreamingPrompt(request);
          const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}&alt=sse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }],
              generationConfig: {
                temperature: 0.3,
                topK: 40,
                topP: 0.8,
                maxOutputTokens: 8192,
              },
              safetySettings: [
                {
                  category: 'HARM_CATEGORY_HARASSMENT',
                  threshold: 'BLOCK_ONLY_HIGH',
                },
                {
                  category: 'HARM_CATEGORY_HATE_SPEECH',
                  threshold: 'BLOCK_ONLY_HIGH',
                },
              ],
            }),
          });

          if (!geminiResponse.ok) {
            const errorText = await geminiResponse.text();
            throw new Error(`Gemini API error: ${geminiResponse.status} - ${errorText}`);
          }

          // Process streaming response
          const reader = geminiResponse.body?.getReader();
          const decoder = new TextDecoder();
          let buffer = '';
          let accumulatedText = '';
          let currentStage = 1;
          const totalStages = 6;

          if (!reader) {
            throw new Error('Failed to get response reader');
          }

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              const text = parseGeminiStreamChunk(line);
              if (text) {
                accumulatedText += text;

                // Try to parse accumulated text as JSON stages
                const stageMatch = accumulatedText.match(/"stage"\s*:\s*"([^"]+)"/);
                if (stageMatch) {
                  const stageName = stageMatch[1];
                  
                  // Send progress update
                  sendChunk({
                    type: 'progress',
                    timestamp: Date.now(),
                    data: {
                      stage: stageName,
                      progress: (currentStage / totalStages) * 100,
                      message: `Analyzing: ${stageName.replace(/_/g, ' ')}...`,
                    },
                  });

                  // Try to extract complete JSON object
                  try {
                    const jsonMatch = accumulatedText.match(/\{[^{}]*"stage"[^{}]*\}/);
                    if (jsonMatch) {
                      const stageData = JSON.parse(jsonMatch[0]);
                      
                      // Send partial result
                      sendChunk({
                        type: 'partial',
                        timestamp: Date.now(),
                        data: {
                          section: stageName,
                          content: stageData,
                        },
                      });

                      currentStage++;
                    }
                  } catch (parseError) {
                    // Continue accumulating if JSON is incomplete
                  }
                }
              }
            }
          }

          // Parse final complete analysis
          try {
            // Extract all JSON objects from accumulated text
            const jsonObjects = [];
            const regex = /\{[^{}]*"stage"[^{}]*\}/g;
            let match;
            while ((match = regex.exec(accumulatedText)) !== null) {
              try {
                jsonObjects.push(JSON.parse(match[0]));
              } catch (e) {
                // Skip invalid JSON
              }
            }

            // Combine all stages into final result
            const finalResult: any = {
              overall_score: 0,
              ats_score: 0,
              match_percentage: 0,
              detailed_scores: {},
              insights: {
                strengthsAnalysis: [],
                improvementAreas: [],
                missingKeywords: [],
                suggestedKeywords: [],
              },
              top_strengths: [],
              immediate_improvements: [],
              quick_wins: [],
              matched_keywords: [],
              missing_critical_keywords: [],
              ats_optimization: { tips: [], compatibilityScore: 0 },
              actionable_recommendations: [],
              competitive_analysis: {},
              metadata: {
                analysisVersion: '2.0-streaming',
                modelUsed: 'gemini-1.5-flash',
                processingTime: Date.now() - request.metadata?.clientTimestamp || 0,
              },
            };

            // Merge stage data
            for (const stageData of jsonObjects) {
              Object.assign(finalResult, stageData);
              delete finalResult.stage; // Remove stage identifier
            }

            // Send complete result
            sendChunk({
              type: 'complete',
              timestamp: Date.now(),
              data: finalResult,
            });

            // Save to database if userId provided
            if (request.userId) {
              const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
              await supabase.from('resume_analyses').insert({
                user_id: request.userId,
                resume_text: request.resumeText,
                job_description: request.jobDescription,
                analysis_result: finalResult,
                analysis_type: 'streaming',
                created_at: new Date().toISOString(),
              });
            }

          } catch (finalError) {
            console.error('Error parsing final result:', finalError);
            sendChunk({
              type: 'error',
              timestamp: Date.now(),
              data: {
                error: 'Failed to parse complete analysis',
                retryable: true,
              },
            });
          }

        } catch (error) {
          console.error('Streaming error:', error);
          sendChunk({
            type: 'error',
            timestamp: Date.now(),
            data: {
              error: error instanceof Error ? error.message : 'Unknown streaming error',
              retryable: true,
            },
          });
        } finally {
          controller.close();
        }
      },
    });

    return new Response(stream, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });

  } catch (error) {
    console.error('Request error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error',
        retryable: false,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
