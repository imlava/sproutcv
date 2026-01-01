// Supabase client configuration
// Note: The anon key is a publishable client-side key (safe to expose)
// It only allows access based on Row Level Security (RLS) policies
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Default values for Lovable 2-way sync compatibility
// These are PUBLIC keys - all security is enforced by RLS policies
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://yucdpvnmcuokemhqpnvz.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl1Y2Rwdm5tY3Vva2VtaHFwbnZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQxMDg3OTksImV4cCI6MjA2OTY4NDc5OX0.slvx1sMBHmGrlFuLltvePeA417SFTWhZGCJIJZeYIgQ";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
});