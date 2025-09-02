import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Google Gemini API Configuration
const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface RealtimeFeedbackRequest {
  resumeText: string;
  section: 'skills' | 'experience' | 'summary';
  analysisType?: string;
}

interface SectionFeedback {
  score: number;
  feedback: string;
  suggestions: string[];
  sectionAnalysis: {
    keywordDensity: number;
    technicalDepth: number;
    quantifiableResults: number;
    professionalLanguage: number;
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("🧠 GEMINI REALTIME FEEDBACK START");
    
    const body: RealtimeFeedbackRequest = await req.json();
    
    if (!body.resumeText?.trim()) {
      throw new Error("Resume text is required");
    }
    if (!body.section) {
      throw new Error("Section is required");
    }
    if (!GEMINI_API_KEY) {
      throw new Error("Google Gemini API key not configured. Please configure API key for real-time feedback.");
    }

    console.log(`🎯 Analyzing ${body.section} section in real-time`);

    // Generate section-specific feedback using Gemini
    const feedback = await generateSectionFeedback(body);

    console.log("✅ Real-time feedback completed successfully");

    return new Response(JSON.stringify({
      success: true,
      feedback,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Real-time feedback failed:", error);

    // Handle quota/rate limit explicitly with 429 and Retry-After
    const msg = String((error as any)?.message || "");
    if (msg.startsWith("RESOURCE_EXHAUSTED:")) {
      const retryAfter = msg.split(":")[1] || "60";
      return new Response(JSON.stringify({
        success: false,
        error: "Gemini quota exceeded. Please try again later.",
        retryAfter,
        timestamp: new Date().toISOString()
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": retryAfter },
        status: 429,
      });
    }
    
    return new Response(JSON.stringify({
      success: false,
      error: (error as any)?.message || 'Unknown error',
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function generateSectionFeedback(request: RealtimeFeedbackRequest): Promise<SectionFeedback> {
  const { resumeText, section } = request;
  
  // Extract section-specific content
  const sectionContent = extractSectionContent(resumeText, section);
  
  const prompt = createSectionPrompt(sectionContent, section);
  
  try {
    // Call Gemini API for real-time analysis
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 2048,
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);

      // Handle quota exceeded (429) with explicit Retry-After
      if (response.status === 429) {
        try {
          const errJson = JSON.parse(errorText);
          const retryInfo = (errJson?.error?.details || []).find((d: any) => d['@type']?.includes('RetryInfo'));
          const retryDelay = retryInfo?.retryDelay || '60s';
          const seconds = /([0-9]+)s/.exec(retryDelay)?.[1] || '60';
          throw new Error(`RESOURCE_EXHAUSTED:${seconds}`);
        } catch (_) {
          throw new Error('RESOURCE_EXHAUSTED:60');
        }
      }

      throw new Error(`Gemini API error: ${response.status}`);
    }

    const geminiResponse = await response.json();
    const analysisText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!analysisText) {
      throw new Error("No analysis content received from Gemini");
    }

    // Parse structured feedback from Gemini response
    return parseSectionFeedback(analysisText, section);

  } catch (error) {
    console.error("Section feedback generation error:", error);
    throw error;
  }
}

function extractSectionContent(resumeText: string, section: string): string {
  const lines = resumeText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  
  const sectionKeywords = {
    skills: ['skill', 'technical', 'competenc', 'proficient', 'technolog', 'programming', 'software', 'tools'],
    experience: ['experience', 'employment', 'work', 'position', 'role', 'job', 'career', 'professional'],
    summary: ['summary', 'objective', 'profile', 'overview', 'about', 'introduction']
  };
  
  const keywords = sectionKeywords[section] || [];
  
  // Find lines that likely belong to this section
  const relevantLines = [];
  let inSection = false;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].toLowerCase();
    
    // Check if this line is a section header
    const isHeader = keywords.some(keyword => 
      line.includes(keyword) && line.length < 50
    );
    
    if (isHeader) {
      inSection = true;
      continue;
    }
    
    // Stop if we hit another section
    if (inSection && line.match(/^(education|experience|skills|summary|objective|contact)/i) && 
        !keywords.some(k => line.includes(k))) {
      break;
    }
    
    if (inSection) {
      relevantLines.push(lines[i]);
    }
  }
  
  // If no specific section found, use first 500 chars as fallback
  return relevantLines.length > 0 ? relevantLines.join('\n') : resumeText.substring(0, 500);
}

function createSectionPrompt(sectionContent: string, section: string): string {
  const sectionInstructions = {
    skills: {
      focus: "technical competencies, proficiencies, and skill progression",
      criteria: "skill relevance, technical depth, industry alignment, and skill progression demonstration"
    },
    experience: {
      focus: "professional experience, achievements, and career progression", 
      criteria: "role relevance, achievement quantification, responsibility scope, and career growth"
    },
    summary: {
      focus: "professional positioning, value proposition, and career narrative",
      criteria: "clarity of value proposition, professional branding, achievement highlights, and career focus"
    }
  };

  const instruction = sectionInstructions[section];

  return `You are an expert resume analyst. Analyze this ${section} section content and provide detailed, real-time feedback.

SECTION CONTENT:
${sectionContent}

ANALYSIS FOCUS: ${instruction.focus}
SCORING CRITERIA: ${instruction.criteria}

Provide real-time feedback in EXACTLY this JSON format:

{
  "score": [0-100 integer based on professional quality and impact],
  "feedback": "Specific, actionable feedback about current content quality and effectiveness",
  "suggestions": [
    "Specific improvement suggestion 1",
    "Specific improvement suggestion 2", 
    "Specific improvement suggestion 3"
  ],
  "sectionAnalysis": {
    "keywordDensity": [0-100 - professional terminology usage],
    "technicalDepth": [0-100 - specificity and technical detail level],
    "quantifiableResults": [0-100 - measurable achievements and metrics],
    "professionalLanguage": [0-100 - action verbs and professional tone]
  }
}

Be specific, actionable, and focus on improvements that will have immediate impact.`;
}

function parseSectionFeedback(analysisText: string, section: string): SectionFeedback {
  try {
    // Extract JSON from response
    const jsonMatch = analysisText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in analysis response");
    }

    const feedbackData = JSON.parse(jsonMatch[0]);
    
    return {
      score: Math.max(0, Math.min(100, feedbackData.score || 0)),
      feedback: feedbackData.feedback || `AI analysis completed for ${section} section`,
      suggestions: Array.isArray(feedbackData.suggestions) ? feedbackData.suggestions : [`Improve ${section} section content`],
      sectionAnalysis: {
        keywordDensity: Math.max(0, Math.min(100, feedbackData.sectionAnalysis?.keywordDensity || 0)),
        technicalDepth: Math.max(0, Math.min(100, feedbackData.sectionAnalysis?.technicalDepth || 0)),
        quantifiableResults: Math.max(0, Math.min(100, feedbackData.sectionAnalysis?.quantifiableResults || 0)),
        professionalLanguage: Math.max(0, Math.min(100, feedbackData.sectionAnalysis?.professionalLanguage || 0))
      }
    };
  } catch (error) {
    console.error("Error parsing section feedback:", error);
    throw new Error(`Failed to parse ${section} section feedback`);
  }
}