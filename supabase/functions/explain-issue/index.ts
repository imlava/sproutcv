import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const openAIApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openAIApiKey) {
      return new Response(
        JSON.stringify({ error: "OPENAI_API_KEY not set in Supabase Edge Function secrets" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { issue, resume_text, job_description, job_title, company_name } = await req.json();

    const system = `You are a world-class resume coach and ATS expert. Explain with first principles why an issue matters and provide precise, actionable fixes.
- Keep it concise but substantial (150-220 words)
- Use bullet points and numbered steps when helpful
- Avoid generic fluff; be concrete and tailored
- Emphasize impact on recruiter scan and ATS parsing
- If severity is critical, highlight urgency`;

    const user = `Context:
- Job Title: ${job_title || "(unknown)"}
- Company: ${company_name || "(unknown)"}
- Job Description (short excerpt): ${typeof job_description === 'string' ? job_description.slice(0, 800) : "(missing)"}
- Resume Text (short excerpt): ${typeof resume_text === 'string' ? resume_text.slice(0, 800) : "(missing)"}

Issue to explain:
- Title: ${issue?.title}
- Category: ${issue?.category}
- Severity: ${issue?.severity}
- Why (model hint): ${issue?.why}
- HowToImprove (model hint): ${issue?.howToImprove || "(not provided)"}

Task: Explain why this matters for this candidate and role, and provide concrete steps to fix. Return clear markdown with sections:
1) Why it matters
2) How to fix (3-5 steps)
3) Quick example (1-2 bullet points)`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${openAIApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.4,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("OpenAI error:", errText);
      return new Response(JSON.stringify({ error: "OpenAI request failed", details: errText }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await response.json();
    const explanation = data?.choices?.[0]?.message?.content || "Unable to generate explanation at this time.";

    return new Response(JSON.stringify({ explanation }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("explain-issue error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
