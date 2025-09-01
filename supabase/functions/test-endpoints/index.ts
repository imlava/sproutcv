import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== BULLETPROOF ENDPOINT TESTING START ===");
    
    const { testType = 'both', userToken } = await req.json();
    const results = [];
    
    // Environment check
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing environment variables");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // Test Headers
    const headers = userToken ? {
      "Authorization": `Bearer ${userToken}`,
      "Content-Type": "application/json"
    } : {
      "Content-Type": "application/json"
    };

    // Test create-payment function
    if (testType === 'both' || testType === 'payment') {
      console.log("🧪 Testing create-payment function...");
      
      try {
        if (!userToken) {
          results.push({
            function: 'create-payment',
            status: 'skipped',
            message: 'No user token provided - skipping auth test',
            timestamp: new Date().toISOString()
          });
        } else {
          const paymentResponse = await fetch(`${supabaseUrl}/functions/v1/create-payment`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              credits: 5,
              amount: 500,
              planType: 'starter',
              test_mode: true
            })
          });

          const paymentData = await paymentResponse.text();
          
          results.push({
            function: 'create-payment',
            status: paymentResponse.ok ? 'success' : 'error',
            statusCode: paymentResponse.status,
            message: paymentResponse.ok ? 'Function executed successfully' : 'Function returned error',
            response: paymentData.substring(0, 500),
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        results.push({
          function: 'create-payment',
          status: 'error',
          message: `Test failed: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Test analyze-resume function
    if (testType === 'both' || testType === 'analysis') {
      console.log("🧪 Testing analyze-resume function...");
      
      try {
        if (!userToken) {
          results.push({
            function: 'analyze-resume',
            status: 'skipped',
            message: 'No user token provided - skipping auth test',
            timestamp: new Date().toISOString()
          });
        } else {
          const analysisResponse = await fetch(`${supabaseUrl}/functions/v1/analyze-resume`, {
            method: "POST",
            headers,
            body: JSON.stringify({
              resumeText: "John Doe\njohndoe@email.com\n(555) 123-4567\n\nSoftware Developer with 5 years experience in JavaScript, React, Node.js, and Python. Led development of web applications and improved system performance by 30%. Managed teams of 3-5 developers.",
              jobDescription: "We are seeking a Senior Software Developer with experience in JavaScript, React, Node.js, and team leadership. Must have 3+ years experience and strong problem-solving skills.",
              jobTitle: "Senior Software Developer",
              companyName: "Test Company"
            })
          });

          const analysisData = await analysisResponse.text();
          
          results.push({
            function: 'analyze-resume',
            status: analysisResponse.ok ? 'success' : 'error',
            statusCode: analysisResponse.status,
            message: analysisResponse.ok ? 'Function executed successfully' : 'Function returned error',
            response: analysisData.substring(0, 500),
            timestamp: new Date().toISOString()
          });
        }
      } catch (error) {
        results.push({
          function: 'analyze-resume',
          status: 'error',
          message: `Test failed: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Test basic function accessibility (no auth required)
    console.log("🧪 Testing function accessibility...");
    
    const functions = ['create-payment', 'analyze-resume', 'dodo-webhook', 'verify-payment'];
    
    for (const func of functions) {
      try {
        const response = await fetch(`${supabaseUrl}/functions/v1/${func}`, {
          method: "OPTIONS"
        });
        
        results.push({
          function: `${func} (OPTIONS)`,
          status: response.ok ? 'accessible' : 'inaccessible',
          statusCode: response.status,
          message: response.ok ? 'Function is deployed and accessible' : 'Function deployment issue',
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        results.push({
          function: `${func} (OPTIONS)`,
          status: 'error',
          message: `Accessibility test failed: ${error.message}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    // Generate summary
    const successCount = results.filter(r => r.status === 'success' || r.status === 'accessible').length;
    const errorCount = results.filter(r => r.status === 'error' || r.status === 'inaccessible').length;
    const skippedCount = results.filter(r => r.status === 'skipped').length;
    
    const summary = {
      totalTests: results.length,
      successful: successCount,
      errors: errorCount,
      skipped: skippedCount,
      successRate: Math.round((successCount / (results.length - skippedCount)) * 100),
      overallStatus: errorCount === 0 ? 'healthy' : errorCount < successCount ? 'partial' : 'unhealthy'
    };

    console.log("=== ENDPOINT TESTING COMPLETED ===");
    
    return new Response(JSON.stringify({
      success: true,
      summary,
      results,
      environment: {
        supabaseUrl: !!supabaseUrl,
        serviceKey: !!serviceKey,
        dodoApiKey: !!dodoApiKey,
        hasUserToken: !!userToken
      },
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("=== TESTING ERROR ===", error);
    return new Response(JSON.stringify({ 
      error: "Testing failed",
      message: error.message,
      timestamp: new Date().toISOString()
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
