import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY");
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

interface FeedbackRequest {
  resumeText: string;
  section: 'skills' | 'experience' | 'summary';
  jobDescription?: string;
}

interface FeedbackResponse {
  score: number;
  feedback: string;
  suggestions: string[];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("⚡ REAL-TIME FEEDBACK START");
    
    const body: FeedbackRequest = await req.json();
    
    if (!body.resumeText?.trim()) {
      throw new Error("Resume text is required");
    }
    
    if (!GEMINI_API_KEY) {
      // Fallback to intelligent analysis without API
      console.log("📋 Using fallback analysis");
      return new Response(JSON.stringify({
        success: true,
        data: generateFallbackFeedback(body)
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Generate quick feedback using Gemini Flash
    const feedback = await generateQuickFeedback(body);

    console.log("✅ Real-time feedback completed");

    return new Response(JSON.stringify({
      success: true,
      data: feedback
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("❌ Feedback generation failed:", error);
    
    // Always return fallback on error
    const body: FeedbackRequest = await req.json().catch(() => ({ resumeText: '', section: 'skills' as const }));
    
    return new Response(JSON.stringify({
      success: true,
      data: generateFallbackFeedback(body)
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  }
});

async function generateQuickFeedback(request: FeedbackRequest): Promise<FeedbackResponse> {
  const { resumeText, section, jobDescription = '' } = request;
  
  const prompt = createSectionPrompt(resumeText, section, jobDescription);
  
  try {
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
          temperature: 0.2,
          topK: 20,
          topP: 0.8,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const geminiResponse = await response.json();
    const feedbackText = geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!feedbackText) {
      throw new Error("No feedback received from Gemini");
    }

    return parseFeedbackResponse(feedbackText, request);

  } catch (error) {
    console.error("Gemini feedback error:", error);
    return generateFallbackFeedback(request);
  }
}

function createSectionPrompt(resumeText: string, section: string, jobDescription: string): string {
  const sectionText = extractSectionText(resumeText, section);
  
  return `Analyze this ${section} section from a resume and provide quick feedback. Be specific and actionable.

SECTION CONTENT:
${sectionText}

${jobDescription ? `JOB CONTEXT: ${jobDescription.substring(0, 500)}` : ''}

Provide a JSON response with:
{
  "score": [0-100 integer],
  "feedback": "Brief assessment of the ${section} section",
  "suggestions": ["Specific actionable suggestion 1", "Specific actionable suggestion 2", "Specific actionable suggestion 3"]
}

Focus on:
- ${section === 'skills' ? 'Technical and soft skills relevance, missing key skills, skills presentation' : ''}
- ${section === 'experience' ? 'Quantifiable achievements, impact statements, career progression' : ''}
- ${section === 'summary' ? 'Value proposition clarity, keywords, professional positioning' : ''}
- ATS optimization and keyword usage
- Professional presentation and formatting

Be critical but constructive. Provide specific, actionable suggestions.`;
}

function extractSectionText(resumeText: string, section: string): string {
  const lines = resumeText.split('\n');
  const sectionKeywords = {
    skills: ['skill', 'technical', 'competenc', 'proficient', 'technologies', 'programming', 'software'],
    experience: ['experience', 'employment', 'work', 'position', 'role', 'company', 'achievements'],
    summary: ['summary', 'objective', 'profile', 'overview', 'about']
  };
  
  const keywords = sectionKeywords[section as keyof typeof sectionKeywords] || [];
  
  // Find section headers
  const sectionStartIdx = lines.findIndex(line => 
    keywords.some(keyword => line.toLowerCase().includes(keyword)) &&
    (line.trim().length < 50 || /^[A-Z\s]+$/.test(line.trim()))
  );
  
  if (sectionStartIdx === -1) {
    // If no section header found, return relevant content based on patterns
    const relevantLines = lines.filter(line => {
      if (section === 'skills') {
        return /\b(javascript|python|java|react|node|sql|aws|docker|kubernetes|agile|git)\b/i.test(line) ||
               /\b(programming|development|technical|software|engineering)\b/i.test(line);
      } else if (section === 'experience') {
        return /\b(company|corporation|inc|ltd|years?|months?|managed|developed|implemented|achieved)\b/i.test(line) ||
               /\d+.*(?:years?|months?|%|\$|million|thousand)/.test(line);
      } else if (section === 'summary') {
        return line.length > 30 && line.length < 200 && 
               /\b(professional|experienced|skilled|expertise|passionate|driven)\b/i.test(line);
      }
      return false;
    });
    
    return relevantLines.length > 0 ? relevantLines.join('\n') : resumeText.substring(0, 800);
  }
  
  // Find next section or end
  const nextSectionIdx = lines.findIndex((line, idx) => 
    idx > sectionStartIdx + 1 &&
    /^[A-Z\s]{2,}$/.test(line.trim()) &&
    line.trim().length < 30
  );
  
  const endIdx = nextSectionIdx === -1 ? lines.length : nextSectionIdx;
  const sectionLines = lines.slice(sectionStartIdx, endIdx);
  
  return sectionLines.join('\n');
}

function parseFeedbackResponse(feedbackText: string, request: FeedbackRequest): FeedbackResponse {
  try {
    // Extract JSON from response
    const jsonMatch = feedbackText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      return {
        score: Math.max(0, Math.min(100, parsed.score || 75)),
        feedback: parsed.feedback || `Your ${request.section} section is being analyzed...`,
        suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions.slice(0, 3) : [
          `Improve ${request.section} section content`,
          'Add more specific details',
          'Include relevant keywords'
        ]
      };
    }
    
    throw new Error("No valid JSON in response");
  } catch (error) {
    console.error("Parse error:", error);
    return generateFallbackFeedback(request);
  }
}

function generateFallbackFeedback(request: FeedbackRequest): FeedbackResponse {
  const { resumeText, section } = request;
  const sectionText = extractSectionText(resumeText, section);
  
  // Intelligent analysis based on content
  const wordCount = sectionText.split(/\s+/).filter(w => w.length > 0).length;
  const hasQuantifiableResults = /\d+[%$k]|\d+\s*(years?|months?|percent|dollar|thousand|million)/.test(sectionText);
  const hasActionVerbs = /(achieved|implemented|developed|managed|created|improved|optimized|delivered|led|designed|built|launched|increased|reduced|streamlined)/gi.test(sectionText);
  const hasTechnicalTerms = /(javascript|python|react|node|sql|aws|api|database|framework|agile|scrum)/gi.test(sectionText);
  
  let score = 60; // Base score
  
  // Scoring logic
  if (wordCount > 50) score += 10;
  if (wordCount > 100) score += 5;
  if (hasQuantifiableResults) score += 15;
  if (hasActionVerbs) score += 10;
  if (hasTechnicalTerms && (section === 'skills' || section === 'experience')) score += 10;
  if (section === 'summary' && wordCount > 20 && wordCount < 150) score += 10;
  
  // Penalties
  if (wordCount < 20) score -= 15;
  if (!hasActionVerbs && section !== 'skills') score -= 10;
  
  score = Math.max(25, Math.min(95, score));
  
  const getSectionFeedback = () => {
    switch (section) {
      case 'skills':
        return `Skills section ${score >= 80 ? 'demonstrates strong technical capabilities' : score >= 60 ? 'shows adequate skill coverage' : 'needs significant enhancement'}. ${hasTechnicalTerms ? 'Good use of technical terminology.' : 'Consider adding more specific technical skills.'} ${wordCount < 30 ? 'Expand with more relevant skills.' : ''}`;
      
      case 'experience':
        return `Experience section ${score >= 80 ? 'effectively showcases professional impact' : score >= 60 ? 'presents solid work history' : 'requires substantial improvement'}. ${hasQuantifiableResults ? 'Excellent use of metrics and achievements.' : 'Missing quantifiable results that demonstrate impact.'} ${hasActionVerbs ? 'Strong action-oriented language.' : 'Needs more dynamic action verbs.'}`;
      
      case 'summary':
        return `Professional summary ${score >= 80 ? 'creates compelling professional narrative' : score >= 60 ? 'provides adequate professional overview' : 'needs significant strengthening'}. ${wordCount > 100 ? 'Consider condensing for better impact.' : wordCount < 40 ? 'Expand to better showcase your value proposition.' : 'Good length for professional summary.'}`;
      
      default:
        return `Section analysis complete with score of ${score}/100.`;
    }
  };
  
  const getSuggestions = () => {
    const suggestions = [];
    
    if (!hasQuantifiableResults && section !== 'summary') {
      suggestions.push("Add specific numbers, percentages, and measurable results");
    }
    
    if (!hasActionVerbs && section === 'experience') {
      suggestions.push("Use strong action verbs like 'achieved', 'implemented', 'optimized'");
    }
    
    if (section === 'skills' && !hasTechnicalTerms) {
      suggestions.push("Include specific technical skills and tools relevant to your field");
    }
    
    if (wordCount < 30) {
      suggestions.push("Expand section with more detailed and relevant content");
    }
    
    if (section === 'summary' && wordCount > 120) {
      suggestions.push("Condense summary to 3-4 impactful sentences for better readability");
    }
    
    suggestions.push("Optimize keywords for ATS compatibility");
    
    if (suggestions.length < 3) {
      suggestions.push("Review job description and align content with requirements");
    }
    
    return suggestions.slice(0, 3);
  };
  
  return {
    score,
    feedback: getSectionFeedback(),
    suggestions: getSuggestions()
  };
}