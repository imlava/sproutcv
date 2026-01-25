import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { getCorsHeaders } from '../_shared/cors.ts'

console.log("Gemini Analyze function loaded - v2.0")

const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY')

// Gemini API configuration
const GEMINI_CONFIG = {
  // Using gemini-1.5-flash for fast, cost-effective responses
  model: 'gemini-1.5-flash',
  baseUrl: 'https://generativelanguage.googleapis.com/v1beta/models',
  maxRetries: 3,
  retryDelay: 1000,
}

// Request types for different AI operations
interface AnalyzeRequest {
  prompt: string;
  type?: 'text' | 'json';
  temperature?: number;
  maxTokens?: number;
}

// Helper function to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Helper function to call Gemini API with retry logic
async function callGeminiAPI(
  prompt: string, 
  options: { 
    temperature?: number;
    maxTokens?: number;
    jsonMode?: boolean;
  } = {}
): Promise<string> {
  const { 
    temperature = 0.3, // Lower temperature for more consistent JSON output
    maxTokens = 8192,
    jsonMode = false 
  } = options

  let lastError: Error | null = null

  for (let attempt = 1; attempt <= GEMINI_CONFIG.maxRetries; attempt++) {
    try {
      console.log(`Gemini API call attempt ${attempt}/${GEMINI_CONFIG.maxRetries}`)

      const requestBody: any = {
        contents: [
          {
            parts: [
              {
                text: prompt
              }
            ]
          }
        ],
        generationConfig: {
          temperature,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: maxTokens,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
        ]
      }

      // Enable JSON mode for structured output
      if (jsonMode) {
        requestBody.generationConfig.responseMimeType = "application/json"
      }

      const response = await fetch(
        `${GEMINI_CONFIG.baseUrl}/${GEMINI_CONFIG.model}:generateContent?key=${GEMINI_API_KEY}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        }
      )

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Gemini API error (${response.status}):`, errorText)
        
        // Retry on 5xx errors or rate limits (429)
        if (response.status >= 500 || response.status === 429) {
          throw new Error(`Gemini API error: ${response.status}`)
        }
        
        // Don't retry on 4xx errors (except 429)
        throw new Error(`Gemini API error: ${response.status} ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
        console.error('Invalid Gemini response:', JSON.stringify(data))
        throw new Error('Invalid response format from Gemini API')
      }

      const result = data.candidates[0].content.parts[0].text
      console.log(`Gemini response received, length: ${result.length}`)
      return result

    } catch (error) {
      lastError = error as Error
      console.error(`Attempt ${attempt} failed:`, error.message)
      
      if (attempt < GEMINI_CONFIG.maxRetries) {
        const waitTime = GEMINI_CONFIG.retryDelay * attempt // Exponential backoff
        console.log(`Retrying in ${waitTime}ms...`)
        await delay(waitTime)
      }
    }
  }

  throw lastError || new Error('Failed to call Gemini API after all retries')
}

// Clean JSON response from markdown code blocks
function cleanJsonResponse(response: string): string {
  return response
    .replace(/```json\n?/gi, '')
    .replace(/```\n?/gi, '')
    .trim()
}

// Parse JSON safely with fallback
function safeParseJSON<T>(text: string, fallback: T): T {
  try {
    const cleaned = cleanJsonResponse(text)
    return JSON.parse(cleaned)
  } catch (error) {
    console.error('JSON parse error:', error, 'Text:', text.substring(0, 200))
    return fallback
  }
}

serve(async (req) => {
  const origin = req.headers.get('origin')
  const corsHeaders = getCorsHeaders(origin)
  
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY not configured. Please set it in Supabase secrets.')
    }

    const body = await req.json()
    const { prompt, type = 'text', temperature, maxTokens } = body as AnalyzeRequest

    if (!prompt) {
      throw new Error('Prompt is required')
    }

    console.log(`Processing ${type} request, prompt length: ${prompt.length}`)

    // Determine if we should use JSON mode
    const jsonMode = type === 'json' || prompt.toLowerCase().includes('return.*json')
    
    // Call Gemini with appropriate settings
    const analysis = await callGeminiAPI(prompt, {
      temperature: temperature ?? (jsonMode ? 0.2 : 0.7),
      maxTokens: maxTokens ?? 8192,
      jsonMode,
    })

    // Return response
    return new Response(
      JSON.stringify({ 
        analysis,
        success: true,
        model: GEMINI_CONFIG.model,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    )

  } catch (error) {
    console.error('Function error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred'
    const isConfigError = errorMessage.includes('GEMINI_API_KEY')
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        success: false,
        retryable: !isConfigError,
        timestamp: new Date().toISOString()
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: isConfigError ? 503 : 500,
      }
    )
  }
})
