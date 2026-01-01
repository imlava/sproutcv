import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userProfile: any;
  loading: boolean;
  signUp: (email: string, password: string, fullName: string, captchaToken?: string, referralCode?: string) => Promise<{ error: any }>;
  signIn: (email: string, password: string, captchaToken?: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  syncCredits: () => Promise<number>;
  ensureProfileExists: (userId: string, email: string, fullName?: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Get the proper domain for redirects
const getRedirectUrl = () => {
  // In production, use the actual domain
  if (process.env.NODE_ENV === 'production') {
    return 'https://sproutcv.app';
  }
  // In development, use localhost
  return window.location.origin;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserProfile = async (userId: string, retryCount = 0): Promise<any> => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY = 500;
    
    try {
      // Strategy 1: Use secure profile access function
      const { data, error } = await supabase.rpc('get_user_profile_safe', {
        target_user_id: userId
      });
      
      if (data && !error && data.length > 0) {
        console.log('✅ Profile loaded via RPC:', userId, 'Credits:', data[0].credits);
        setUserProfile(data[0]);
        return data[0];
      }
      
      // Strategy 2: Direct table access
      const { data: directData, error: directError } = await supabase
        .from('profiles')
        .select('id, email, full_name, phone, credits, status, subscription_tier, created_at, last_login, two_factor_enabled, email_verified, is_active')
        .eq('id', userId)
        .single();
      
      if (directData && !directError) {
        console.log('✅ Profile loaded directly:', userId, 'Credits:', directData.credits);
        setUserProfile(directData);
        return directData;
      }
      
      // Strategy 3: Profile not found - trigger auto-creation
      if (directError?.code === 'PGRST116' || !directData) {
        console.log('⚠️ Profile not found, triggering auto-creation for:', userId);
        
        // Get user email from auth
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser?.email) {
          const created = await ensureProfileExists(userId, authUser.email, authUser.user_metadata?.full_name);
          if (created && retryCount < MAX_RETRIES) {
            // Wait and retry
            await new Promise(resolve => setTimeout(resolve, RETRY_DELAY));
            return fetchUserProfile(userId, retryCount + 1);
          }
        }
      }
      
      console.error('Error fetching user profile:', error || directError);
      return null;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      
      // Retry on transient errors
      if (retryCount < MAX_RETRIES) {
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY * (retryCount + 1)));
        return fetchUserProfile(userId, retryCount + 1);
      }
      return null;
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  // Ensure profile exists with welcome credits
  const ensureProfileExists = async (userId: string, email: string, fullName?: string): Promise<boolean> => {
    try {
      console.log('🔄 Ensuring profile exists for:', userId);
      
      // Check if profile already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('id, credits')
        .eq('id', userId)
        .single();
      
      if (existingProfile) {
        console.log('✅ Profile already exists with credits:', existingProfile.credits);
        return true;
      }
      
      // Create profile with welcome credits
      const referralCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      const { error: createError } = await supabase
        .from('profiles')
        .insert({
          id: userId,
          email: email,
          full_name: fullName || 'User',
          credits: 5,
          email_verified: false,
          referral_code: referralCode,
          subscription_tier: 'free',
          status: 'active',
          is_active: true
        });
      
      if (createError) {
        // Handle duplicate key (profile was created between check and insert)
        if (createError.code === '23505') {
          console.log('✅ Profile created by concurrent process');
          return true;
        }
        console.error('❌ Profile creation error:', createError);
        return false;
      }
      
      // Log welcome credits in ledger
      await supabase
        .from('credits_ledger')
        .insert({
          user_id: userId,
          transaction_type: 'bonus',
          credits_amount: 5,
          balance_after: 5,
          description: 'Welcome bonus credits (auto-created)'
        });
      
      console.log('✅ Profile created successfully with 5 welcome credits');
      return true;
    } catch (error) {
      console.error('❌ Error ensuring profile exists:', error);
      return false;
    }
  };

  // Sync credits from database (useful after payments)
  const syncCredits = async (): Promise<number> => {
    if (!user) return 0;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('credits')
        .eq('id', user.id)
        .single();
      
      if (data && !error) {
        setUserProfile(prev => ({ ...prev, credits: data.credits }));
        console.log('💰 Credits synced:', data.credits);
        return data.credits;
      }
      return userProfile?.credits || 0;
    } catch (error) {
      console.error('Error syncing credits:', error);
      return userProfile?.credits || 0;
    }
  };

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Clear any existing timeout
          if (timeoutId) clearTimeout(timeoutId);
          // Fetch profile after a short delay to ensure database is ready
          timeoutId = setTimeout(() => {
            fetchUserProfile(session.user.id);
          }, 100);
        } else {
          setUserProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('Initial session:', session?.user?.id);
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      }
      
      setLoading(false);
    });

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
    };
  }, []);

  const signUp = async (email: string, password: string, fullName: string, captchaToken?: string, referralCode?: string) => {
    try {
      // Use /auth/callback to properly handle email confirmation tokens
      const redirectUrl = `${getRedirectUrl()}/auth/callback`;
      
      console.log('🚀 Starting signup for:', email);
      console.log('📧 Email redirect URL:', redirectUrl);
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            full_name: fullName,
          },
          captchaToken
        }
      });
      
      if (error) {
        console.error('❌ Signup error:', error);
        return { error };
      }
      
      // CRITICAL: Ensure profile and welcome credits exist
      if (data.user && !error) {
        console.log('✅ Auth user created:', data.user.id);
        
        // Strategy 1: Try robust-email-verification (handles profile + credits)
        let profileCreated = false;
        try {
          console.log('📧 Starting robust email verification...');
          const response = await supabase.functions.invoke('robust-email-verification', {
            body: {
              email: email,
              userId: data.user.id,
              retryCount: 0,
              forceVerify: false
            }
          });
          
          if (response.error) {
            console.warn('⚠️ Robust verification had issues:', response.error);
          } else {
            console.log('✅ Robust verification successful:', response.data);
            profileCreated = true;
          }
        } catch (verificationError) {
          console.error('⚠️ Robust verification failed:', verificationError);
        }
        
        // Strategy 2: Fallback - directly create profile if not created
        if (!profileCreated) {
          console.log('🔄 Fallback: Creating profile directly...');
          const created = await ensureProfileExists(data.user.id, email, fullName);
          if (created) {
            console.log('✅ Profile created via fallback');
          } else {
            // Strategy 3: Schedule retry via edge function
            console.log('🔄 Scheduling profile creation retry...');
            try {
              await supabase.functions.invoke('ensure-user-profile', {
                body: { userId: data.user.id, email, fullName }
              });
            } catch (e) {
              console.warn('Retry scheduling failed (non-critical):', e);
            }
          }
        }
        
        // Handle referral if provided (non-blocking)
        if (referralCode) {
          try {
            console.log('🎁 Processing referral code:', referralCode);
            await supabase.functions.invoke('process-referral', {
              body: { userId: data.user.id, referralCode }
            });
          } catch (referralError) {
            console.warn('⚠️ Referral processing failed (non-critical):', referralError);
          }
        }
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('❌ Signup exception:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      console.log('🔐 Signing in user:', email);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken
        }
      });
      
      if (error) {
        console.error('❌ Signin error:', error);
        return { error };
      }
      
      console.log('✅ Signin successful');
      
      // Ensure profile exists (handles edge case where profile was missing)
      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        
        // If no profile found, create one
        if (!profile) {
          console.log('⚠️ No profile found on signin, creating...');
          await ensureProfileExists(data.user.id, email, data.user.user_metadata?.full_name);
          await fetchUserProfile(data.user.id);
        }
        
        // Update last login timestamp
        await supabase
          .from('profiles')
          .update({ last_login: new Date().toISOString() })
          .eq('id', data.user.id);
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('❌ Signin exception:', error);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      console.log('Signing out user');
      await supabase.auth.signOut();
    } catch (error) {
      console.error('Signout error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      session,
      userProfile,
      loading,
      signUp,
      signIn,
      signOut,
      refreshProfile,
      syncCredits,
      ensureProfileExists
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
