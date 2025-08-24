
import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactRequest {
  name: string;
  email: string;
  subject: string;
  message: string;
}

// HTML sanitization function
function sanitizeHtml(input: string): string {
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

// Input validation function
function validateInput(data: ContactRequest): string | null {
  const { name, email, subject, message } = data;

  if (!name || !email || !subject || !message) {
    return 'All fields are required';
  }

  if (name.length > 100) {
    return 'Name must be 100 characters or less';
  }

  if (subject.length > 200) {
    return 'Subject must be 200 characters or less';
  }

  if (message.length > 5000) {
    return 'Message must be 5000 characters or less';
  }

  // Email validation
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
}

// Get client IP address
function getClientIP(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for');
  const realIP = req.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return '127.0.0.1'; // fallback
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const requestData: ContactRequest = await req.json();

    // Validate input
    const validationError = validateInput(requestData);
    if (validationError) {
      return new Response(
        JSON.stringify({ error: validationError }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    
    // Check rate limit
    const { data: rateLimitCheck, error: rateLimitError } = await supabaseClient
      .rpc('check_contact_rate_limit', { client_ip: clientIP });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    } else if (!rateLimitCheck) {
      return new Response(
        JSON.stringify({ error: 'Too many submissions. Please try again later.' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Sanitize inputs
    const sanitizedData = {
      name: sanitizeHtml(requestData.name.trim()),
      email: requestData.email.toLowerCase().trim(),
      subject: sanitizeHtml(requestData.subject.trim()),
      message: sanitizeHtml(requestData.message.trim())
    };

    // Insert contact message into database
    const { data, error } = await supabaseClient
      .from('contact_messages')
      .insert({
        ...sanitizedData,
        status: 'unread'
      })
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return new Response(
        JSON.stringify({ error: 'Failed to save message' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Contact form submitted by ${sanitizedData.email} from IP ${clientIP}. Message ID: ${data.id}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Your message has been sent successfully. We\'ll get back to you soon!' 
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'An unexpected error occurred' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
