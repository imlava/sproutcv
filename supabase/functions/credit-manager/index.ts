import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface CreditTransaction {
  userId: string;
  amount: number;
  type: 'add' | 'subtract' | 'freeze' | 'unfreeze' | 'expire';
  description: string;
  source?: string;
  relatedPaymentId?: string;
  expiryDate?: string;
  metadata?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log("=== CREDIT MANAGER START ===");
    
    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();
    
    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, serviceKey);

    switch (action) {
      case 'balance':
        return await getCreditBalance(supabase, req);
      case 'history':
        return await getCreditHistory(supabase, req);
      case 'transaction':
        return await processCreditTransaction(supabase, req);
      case 'usage':
        return await recordCreditUsage(supabase, req);
      case 'bulk-expire':
        return await bulkExpireCredits(supabase, req);
      case 'stats':
        return await getCreditStats(supabase, req);
      default:
        throw new Error("Invalid action");
    }

  } catch (error) {
    console.error("Credit manager error:", error);
    return new Response(JSON.stringify({
      error: error.message
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function getCreditBalance(supabase: any, req: Request) {
  const { userId } = await req.json();
  
  if (!userId) {
    throw new Error("User ID required");
  }

  // Get current balance
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("credits, credits_frozen")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  // Get pending transactions
  const { data: pending, error: pendingError } = await supabase
    .from("credits_ledger")
    .select("credits_changed")
    .eq("user_id", userId)
    .eq("status", "pending");

  if (pendingError) throw pendingError;

  const pendingCredits = pending?.reduce((sum, t) => sum + t.credits_changed, 0) || 0;

  // Get expiring credits (next 30 days)
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  const { data: expiring, error: expiringError } = await supabase
    .from("credits_ledger")
    .select("credits_changed")
    .eq("user_id", userId)
    .eq("transaction_type", "purchase")
    .lt("expires_at", thirtyDaysFromNow.toISOString())
    .gt("expires_at", new Date().toISOString());

  if (expiringError) throw expiringError;

  const expiringCredits = expiring?.reduce((sum, t) => sum + Math.max(0, t.credits_changed), 0) || 0;

  return new Response(JSON.stringify({
    success: true,
    balance: {
      available: profile?.credits || 0,
      frozen: profile?.credits_frozen || 0,
      pending: pendingCredits,
      expiring_soon: expiringCredits,
      total: (profile?.credits || 0) + pendingCredits
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getCreditHistory(supabase: any, req: Request) {
  const { userId, limit = 50, offset = 0, type = null } = await req.json();
  
  if (!userId) {
    throw new Error("User ID required");
  }

  let query = supabase
    .from("credits_ledger")
    .select(`
      id,
      credits_before,
      credits_after,
      credits_changed,
      transaction_type,
      description,
      created_at,
      expires_at,
      status,
      related_payment_id,
      metadata
    `)
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (type) {
    query = query.eq("transaction_type", type);
  }

  const { data, error } = await query;
  if (error) throw error;

  return new Response(JSON.stringify({
    success: true,
    transactions: data || [],
    hasMore: data?.length === limit
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function processCreditTransaction(supabase: any, req: Request) {
  const transaction: CreditTransaction = await req.json();
  
  console.log(`Processing ${transaction.type} transaction for user ${transaction.userId}`);

  // Begin transaction
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("credits, credits_frozen")
    .eq("id", transaction.userId)
    .single();

  if (profileError) throw profileError;

  let currentCredits = profile?.credits || 0;
  let frozenCredits = profile?.credits_frozen || 0;
  let newCredits = currentCredits;
  let newFrozen = frozenCredits;

  // Calculate new balances based on transaction type
  switch (transaction.type) {
    case 'add':
      newCredits = currentCredits + transaction.amount;
      break;
    
    case 'subtract':
      newCredits = Math.max(0, currentCredits - transaction.amount);
      break;
    
    case 'freeze':
      const toFreeze = Math.min(transaction.amount, currentCredits);
      newCredits = currentCredits - toFreeze;
      newFrozen = frozenCredits + toFreeze;
      break;
    
    case 'unfreeze':
      const toUnfreeze = Math.min(transaction.amount, frozenCredits);
      newCredits = currentCredits + toUnfreeze;
      newFrozen = frozenCredits - toUnfreeze;
      break;
    
    case 'expire':
      // Handle credit expiration
      newCredits = Math.max(0, currentCredits - transaction.amount);
      break;
  }

  // Update user profile
  const { error: updateError } = await supabase
    .from("user_profiles")
    .update({ 
      credits: newCredits,
      credits_frozen: newFrozen,
      updated_at: new Date().toISOString()
    })
    .eq("id", transaction.userId);

  if (updateError) throw updateError;

  // Record in credits ledger
  const ledgerEntry = {
    user_id: transaction.userId,
    credits_before: currentCredits,
    credits_after: newCredits,
    credits_changed: transaction.type === 'subtract' || transaction.type === 'expire' 
      ? -transaction.amount 
      : transaction.amount,
    transaction_type: transaction.type,
    description: transaction.description,
    source: transaction.source || 'manual',
    related_payment_id: transaction.relatedPaymentId,
    expires_at: transaction.expiryDate,
    metadata: transaction.metadata,
    status: 'completed'
  };

  const { data: ledgerData, error: ledgerError } = await supabase
    .from("credits_ledger")
    .insert(ledgerEntry)
    .select()
    .single();

  if (ledgerError) throw ledgerError;

  // Send notification for significant changes
  if (Math.abs(transaction.amount) >= 10) {
    await sendCreditNotification(supabase, transaction, newCredits);
  }

  console.log(`✅ Transaction completed: ${currentCredits} → ${newCredits}`);

  return new Response(JSON.stringify({
    success: true,
    transaction: ledgerData,
    newBalance: {
      credits: newCredits,
      frozen: newFrozen
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function recordCreditUsage(supabase: any, req: Request) {
  const { userId, amount, description, analysisId, metadata } = await req.json();
  
  if (!userId || !amount || amount <= 0) {
    throw new Error("Invalid usage parameters");
  }

  // Check if user has enough credits
  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("credits")
    .eq("id", userId)
    .single();

  if (profileError) throw profileError;

  const currentCredits = profile?.credits || 0;
  if (currentCredits < amount) {
    return new Response(JSON.stringify({
      success: false,
      error: "Insufficient credits",
      available: currentCredits,
      required: amount
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }

  // Process credit usage
  const transaction: CreditTransaction = {
    userId,
    amount,
    type: 'subtract',
    description: description || 'Resume analysis',
    source: 'usage',
    metadata: {
      analysis_id: analysisId,
      ...metadata
    }
  };

  return await processCreditTransaction(supabase, 
    new Request("", { method: "POST", body: JSON.stringify(transaction) })
  );
}

async function bulkExpireCredits(supabase: any, req: Request) {
  const { beforeDate } = await req.json();
  
  if (!beforeDate) {
    throw new Error("Before date required");
  }

  console.log(`Expiring credits before: ${beforeDate}`);

  // Find credits to expire
  const { data: toExpire, error: findError } = await supabase
    .from("credits_ledger")
    .select("user_id, credits_changed, id")
    .eq("transaction_type", "purchase")
    .eq("status", "completed")
    .lt("expires_at", beforeDate)
    .gt("credits_changed", 0);

  if (findError) throw findError;

  let expiredCount = 0;
  let totalExpired = 0;

  // Process each user's expired credits
  const userCredits = new Map();
  
  for (const credit of toExpire || []) {
    if (!userCredits.has(credit.user_id)) {
      userCredits.set(credit.user_id, 0);
    }
    userCredits.set(credit.user_id, userCredits.get(credit.user_id) + credit.credits_changed);
  }

  for (const [userId, amount] of userCredits) {
    try {
      const transaction: CreditTransaction = {
        userId,
        amount,
        type: 'expire',
        description: `Credits expired on ${new Date().toLocaleDateString()}`,
        source: 'system'
      };

      await processCreditTransaction(supabase,
        new Request("", { method: "POST", body: JSON.stringify(transaction) })
      );

      expiredCount++;
      totalExpired += amount;
    } catch (error) {
      console.error(`Failed to expire credits for user ${userId}:`, error);
    }
  }

  console.log(`✅ Expired ${totalExpired} credits for ${expiredCount} users`);

  return new Response(JSON.stringify({
    success: true,
    usersAffected: expiredCount,
    creditsExpired: totalExpired
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function getCreditStats(supabase: any, req: Request) {
  const { userId, period = '30d' } = await req.json();
  
  if (!userId) {
    throw new Error("User ID required");
  }

  // Calculate date range
  const endDate = new Date();
  const startDate = new Date();
  
  switch (period) {
    case '7d':
      startDate.setDate(startDate.getDate() - 7);
      break;
    case '30d':
      startDate.setDate(startDate.getDate() - 30);
      break;
    case '90d':
      startDate.setDate(startDate.getDate() - 90);
      break;
    case '1y':
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
  }

  // Get transaction stats
  const { data: transactions, error } = await supabase
    .from("credits_ledger")
    .select("credits_changed, transaction_type, created_at")
    .eq("user_id", userId)
    .gte("created_at", startDate.toISOString())
    .lte("created_at", endDate.toISOString());

  if (error) throw error;

  // Calculate stats
  const stats = {
    totalPurchased: 0,
    totalUsed: 0,
    totalExpired: 0,
    transactionCount: transactions?.length || 0,
    dailyUsage: new Map(),
  };

  for (const transaction of transactions || []) {
    const date = new Date(transaction.created_at).toISOString().split('T')[0];
    
    switch (transaction.transaction_type) {
      case 'purchase':
      case 'add':
        stats.totalPurchased += transaction.credits_changed;
        break;
      case 'usage':
      case 'subtract':
        stats.totalUsed += Math.abs(transaction.credits_changed);
        break;
      case 'expire':
        stats.totalExpired += Math.abs(transaction.credits_changed);
        break;
    }

    // Track daily usage
    if (transaction.transaction_type === 'usage' || transaction.transaction_type === 'subtract') {
      const current = stats.dailyUsage.get(date) || 0;
      stats.dailyUsage.set(date, current + Math.abs(transaction.credits_changed));
    }
  }

  return new Response(JSON.stringify({
    success: true,
    period,
    stats: {
      ...stats,
      dailyUsage: Object.fromEntries(stats.dailyUsage)
    }
  }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

async function sendCreditNotification(supabase: any, transaction: CreditTransaction, newBalance: number) {
  try {
    await supabase.functions.invoke("send-payment-notification", {
      body: {
        userId: transaction.userId,
        type: 'credit_update',
        data: {
          transaction: transaction.type,
          amount: transaction.amount,
          newBalance,
          description: transaction.description
        }
      }
    });
  } catch (error) {
    console.error("Credit notification error:", error);
  }
}
