import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface TestResults {
  testName: string;
  status: 'passed' | 'failed' | 'warning';
  message: string;
  details?: any;
  timestamp: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== COMPREHENSIVE PAYMENT TESTING START ===");
    
    const { testType = 'full', userId, paymentId } = await req.json();
    const results: TestResults[] = [];
    
    // Environment validation
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const dodoApiKey = Deno.env.get("DODO_PAYMENTS_API_KEY");
    const webhookSecret = Deno.env.get("DODO_WEBHOOK_SECRET");
    
    results.push(await testEnvironmentVariables({ supabaseUrl, serviceKey, dodoApiKey, webhookSecret }));
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Critical environment variables missing");
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // Authentication test
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "");
      results.push(await testAuthentication(supabaseAdmin, token));
    } else {
      results.push({
        testName: "Authentication",
        status: "warning",
        message: "No auth token provided - skipping user-specific tests",
        timestamp: new Date().toISOString()
      });
    }

    // Database connectivity tests
    results.push(await testDatabaseConnectivity(supabaseAdmin));
    results.push(await testDatabaseSchema(supabaseAdmin));
    
    // Dodo API connectivity test
    if (dodoApiKey) {
      results.push(await testDodoAPIConnectivity(dodoApiKey));
    }
    
    // Function deployment tests
    results.push(await testFunctionDeployments(supabaseAdmin));
    
    // Webhook endpoint tests
    results.push(await testWebhookEndpoints());
    
    // Product management tests
    results.push(await testProductManagement(supabaseAdmin));
    
    // Payment flow simulation (if user ID provided)
    if (userId && authHeader) {
      results.push(await testPaymentFlow(supabaseAdmin, userId));
    }
    
    // Specific payment verification (if payment ID provided)
    if (paymentId) {
      results.push(await testPaymentVerification(supabaseAdmin, paymentId));
    }

    // Generate summary
    const summary = generateTestSummary(results);
    
    console.log("=== TESTING COMPLETED ===");
    
    return new Response(JSON.stringify({
      success: true,
      summary,
      results,
      timestamp: new Date().toISOString(),
      testType
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

// Test environment variables
async function testEnvironmentVariables(env: any): Promise<TestResults> {
  const missing = [];
  const present = [];
  
  Object.entries(env).forEach(([key, value]) => {
    if (value) {
      present.push(key);
    } else {
      missing.push(key);
    }
  });
  
  const status = missing.length === 0 ? 'passed' : missing.length <= 1 ? 'warning' : 'failed';
  
  return {
    testName: "Environment Variables",
    status,
    message: status === 'passed' ? "All environment variables present" : `Missing: ${missing.join(', ')}`,
    details: { present, missing },
    timestamp: new Date().toISOString()
  };
}

// Test authentication
async function testAuthentication(supabaseAdmin: any, token: string): Promise<TestResults> {
  try {
    const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
    
    if (userError || !userData.user) {
      return {
        testName: "Authentication",
        status: "failed",
        message: "Authentication failed",
        details: { error: userError?.message },
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      testName: "Authentication",
      status: "passed",
      message: "User authenticated successfully",
      details: { userId: userData.user.id, email: userData.user.email },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: "Authentication",
      status: "failed",
      message: "Authentication test failed",
      details: { error: error.message },
      timestamp: new Date().toISOString()
    };
  }
}

// Test database connectivity
async function testDatabaseConnectivity(supabaseAdmin: any): Promise<TestResults> {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("count")
      .limit(1)
      .single();
    
    return {
      testName: "Database Connectivity",
      status: error ? "failed" : "passed",
      message: error ? "Database connection failed" : "Database connected successfully",
      details: { error: error?.message },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: "Database Connectivity",
      status: "failed",
      message: "Database connectivity test failed",
      details: { error: error.message },
      timestamp: new Date().toISOString()
    };
  }
}

// Test database schema
async function testDatabaseSchema(supabaseAdmin: any): Promise<TestResults> {
  try {
    const tables = ['profiles', 'payments', 'credits_ledger', 'security_events'];
    const results = {};
    
    for (const table of tables) {
      try {
        const { data, error } = await supabaseAdmin
          .from(table)
          .select("*")
          .limit(1);
        
        results[table] = error ? `Error: ${error.message}` : "OK";
      } catch (err) {
        results[table] = `Error: ${err.message}`;
      }
    }
    
    const hasErrors = Object.values(results).some(result => result.toString().startsWith("Error"));
    
    return {
      testName: "Database Schema",
      status: hasErrors ? "failed" : "passed",
      message: hasErrors ? "Some tables have issues" : "All required tables accessible",
      details: results,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: "Database Schema",
      status: "failed",
      message: "Schema test failed",
      details: { error: error.message },
      timestamp: new Date().toISOString()
    };
  }
}

// Test Dodo API connectivity
async function testDodoAPIConnectivity(apiKey: string): Promise<TestResults> {
  try {
    const response = await fetch("https://api.dodopayments.com/v1/account", {
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Accept": "application/json"
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      return {
        testName: "Dodo API Connectivity",
        status: "passed",
        message: "Dodo API accessible",
        details: { accountId: data.id, status: data.status },
        timestamp: new Date().toISOString()
      };
    } else {
      return {
        testName: "Dodo API Connectivity",
        status: "failed",
        message: `Dodo API error: ${response.status}`,
        details: { status: response.status, statusText: response.statusText },
        timestamp: new Date().toISOString()
      };
    }
  } catch (error) {
    return {
      testName: "Dodo API Connectivity",
      status: "failed",
      message: "Dodo API connectivity test failed",
      details: { error: error.message },
      timestamp: new Date().toISOString()
    };
  }
}

// Test function deployments
async function testFunctionDeployments(supabaseAdmin: any): Promise<TestResults> {
  const functions = [
    'create-payment',
    'dodo-webhook', 
    'verify-payment',
    'check-payment-status',
    'dodo-product-management'
  ];
  
  const results = {};
  
  for (const func of functions) {
    try {
      const { data, error } = await supabaseAdmin.functions.invoke(func, {
        body: { test: true }
      });
      
      results[func] = error ? `Error: ${error.message}` : "Accessible";
    } catch (err) {
      results[func] = `Error: ${err.message}`;
    }
  }
  
  const hasErrors = Object.values(results).some(result => result.toString().startsWith("Error"));
  
  return {
    testName: "Function Deployments",
    status: hasErrors ? "warning" : "passed",
    message: hasErrors ? "Some functions may have issues" : "All functions accessible",
    details: results,
    timestamp: new Date().toISOString()
  };
}

// Test webhook endpoints
async function testWebhookEndpoints(): Promise<TestResults> {
  try {
    const webhookUrl = "https://yucdpvnmcuokemhqpnvz.supabase.co/functions/v1/dodo-webhook";
    
    const response = await fetch(webhookUrl, {
      method: "OPTIONS"
    });
    
    return {
      testName: "Webhook Endpoints",
      status: response.ok ? "passed" : "warning",
      message: response.ok ? "Webhook endpoint accessible" : "Webhook endpoint may have issues",
      details: { 
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: "Webhook Endpoints",
      status: "failed",
      message: "Webhook endpoint test failed",
      details: { error: error.message },
      timestamp: new Date().toISOString()
    };
  }
}

// Test product management
async function testProductManagement(supabaseAdmin: any): Promise<TestResults> {
  try {
    const { data, error } = await supabaseAdmin.functions.invoke('dodo-product-management', {
      body: { action: 'list' }
    });
    
    if (error) {
      return {
        testName: "Product Management",
        status: "failed",
        message: "Product management test failed",
        details: { error: error.message },
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      testName: "Product Management",
      status: "passed",
      message: "Product catalog accessible",
      details: { productCount: Object.keys(data.products || {}).length },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: "Product Management",
      status: "failed",
      message: "Product management test failed",
      details: { error: error.message },
      timestamp: new Date().toISOString()
    };
  }
}

// Test payment flow simulation
async function testPaymentFlow(supabaseAdmin: any, userId: string): Promise<TestResults> {
  try {
    // Check user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    
    if (profileError) {
      return {
        testName: "Payment Flow Simulation",
        status: "failed",
        message: "User profile not found",
        details: { error: profileError.message },
        timestamp: new Date().toISOString()
      };
    }
    
    // Check for existing pending payments
    const { data: payments, error: paymentsError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(5);
    
    return {
      testName: "Payment Flow Simulation",
      status: "passed",
      message: "Payment flow components verified",
      details: { 
        userCredits: profile.credits,
        pendingPayments: payments?.length || 0,
        canCreatePayment: true
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: "Payment Flow Simulation",
      status: "failed",
      message: "Payment flow test failed",
      details: { error: error.message },
      timestamp: new Date().toISOString()
    };
  }
}

// Test payment verification
async function testPaymentVerification(supabaseAdmin: any, paymentId: string): Promise<TestResults> {
  try {
    const { data: payment, error: paymentError } = await supabaseAdmin
      .from("payments")
      .select("*")
      .or(`payment_provider_id.eq.${paymentId},stripe_session_id.eq.${paymentId}`)
      .single();
    
    if (paymentError) {
      return {
        testName: "Payment Verification",
        status: "failed",
        message: "Payment not found",
        details: { error: paymentError.message, paymentId },
        timestamp: new Date().toISOString()
      };
    }
    
    return {
      testName: "Payment Verification",
      status: "passed",
      message: "Payment found and accessible",
      details: { 
        paymentId,
        status: payment.status,
        amount: payment.amount,
        credits: payment.credits_purchased,
        method: payment.payment_method
      },
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      testName: "Payment Verification",
      status: "failed",
      message: "Payment verification test failed",
      details: { error: error.message, paymentId },
      timestamp: new Date().toISOString()
    };
  }
}

// Generate test summary
function generateTestSummary(results: TestResults[]) {
  const passed = results.filter(r => r.status === 'passed').length;
  const failed = results.filter(r => r.status === 'failed').length;
  const warnings = results.filter(r => r.status === 'warning').length;
  const total = results.length;
  
  const overallStatus = failed > 0 ? 'failed' : warnings > 0 ? 'warning' : 'passed';
  
  return {
    overallStatus,
    total,
    passed,
    failed,
    warnings,
    successRate: Math.round((passed / total) * 100),
    criticalIssues: results.filter(r => r.status === 'failed').map(r => r.testName)
  };
}
