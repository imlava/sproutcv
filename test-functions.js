import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = "https://yucdpvnmcuokemhqpnvz.supabase.co";
const SUPABASE_ANON_KEY = "***REMOVED***";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testFunctions() {
  try {
    console.log('Testing Supabase connection...');
    
    // Test authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('Auth test:', { user: user?.id, error: authError });
    
    // Test the test-payment function
    console.log('\nTesting test-payment function...');
    const { data: testData, error: testError } = await supabase.functions.invoke('test-payment', {
      body: {}
    });
    console.log('Test function result:', { data: testData, error: testError });
    
    // Test the create-payment function
    console.log('\nTesting create-payment function...');
    const { data: paymentData, error: paymentError } = await supabase.functions.invoke('create-payment', {
      body: { credits: 5, amount: 500 }
    });
    console.log('Payment function result:', { data: paymentData, error: paymentError });
    
  } catch (error) {
    console.error('Test failed:', error);
  }
}

testFunctions(); 