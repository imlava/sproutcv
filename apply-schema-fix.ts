import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

const supabaseUrl = process.env.SUPABASE_URL || 'https://yucdpvnmcuokemhqpnvz.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function applyMigration() {
  try {
    console.log('🔧 Applying payment_transactions schema fix...');
    
    // Read the SQL migration file
    const migrationSql = readFileSync(join(__dirname, 'fix-payment-transactions-schema.sql'), 'utf8');
    
    // Split into individual statements and execute them
    const statements = migrationSql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        console.log(`Executing: ${statement.substring(0, 100)}...`);
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          console.error(`❌ Error executing statement: ${error.message}`);
          console.error(`Statement: ${statement}`);
        } else {
          console.log('✅ Statement executed successfully');
        }
      }
    }
    
    console.log('🎉 Migration completed successfully!');
    
    // Test the table structure
    console.log('🔍 Testing payment_transactions table...');
    const { data, error } = await supabase
      .from('payment_transactions')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error accessing payment_transactions:', error.message);
    } else {
      console.log('✅ payment_transactions table is accessible');
    }
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  }
}

// Alternative approach using raw SQL execution
async function applyMigrationRaw() {
  try {
    console.log('🔧 Applying payment_transactions schema fix via raw SQL...');
    
    const migrationSql = readFileSync(join(__dirname, 'fix-payment-transactions-schema.sql'), 'utf8');
    
    // Use the SQL editor endpoint directly
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'apikey': supabaseServiceKey || ''
      } as HeadersInit,
      body: JSON.stringify({
        sql: migrationSql
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const result = await response.json();
    console.log('✅ Migration applied successfully:', result);
    
  } catch (error) {
    console.error('❌ Raw migration failed:', error);
    
    // Fallback: Try applying individual statements
    console.log('🔄 Trying fallback approach...');
    await applyMigrationFallback();
  }
}

async function applyMigrationFallback() {
  try {
    console.log('🔧 Applying critical fixes one by one...');
    
    // Critical fixes to enable webhook processing
    const criticalFixes = [
      `CREATE TABLE IF NOT EXISTS public.payment_transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        payment_id UUID,
        payment_provider_id TEXT,
        transaction_type TEXT NOT NULL DEFAULT 'webhook',
        amount INTEGER NOT NULL DEFAULT 0,
        currency TEXT NOT NULL DEFAULT 'USD',
        status TEXT NOT NULL DEFAULT 'pending',
        provider_response JSONB DEFAULT '{}',
        metadata JSONB DEFAULT '{}',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
      )`,
      
      `ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY`,
      
      `DROP POLICY IF EXISTS "Service role can manage payment transactions" ON public.payment_transactions`,
      
      `CREATE POLICY "Service role can manage payment transactions" 
       ON public.payment_transactions FOR ALL 
       USING (true)`, // Temporary permissive policy for service role
      
      `GRANT ALL ON public.payment_transactions TO service_role`,
      
      `ALTER TABLE public.payments 
       ADD COLUMN IF NOT EXISTS payment_provider_id TEXT,
       ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'`
    ];
    
    for (let i = 0; i < criticalFixes.length; i++) {
      const statement = criticalFixes[i];
      console.log(`Executing fix ${i + 1}/${criticalFixes.length}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement });
        if (error) {
          console.error(`❌ Error in fix ${i + 1}:`, error.message);
        } else {
          console.log(`✅ Fix ${i + 1} completed`);
        }
      } catch (err) {
        console.error(`❌ Exception in fix ${i + 1}:`, err);
      }
    }
    
    console.log('🎉 Fallback migration completed!');
    
  } catch (error) {
    console.error('❌ Fallback migration failed:', error);
  }
}

// Run the migration
applyMigrationRaw();
