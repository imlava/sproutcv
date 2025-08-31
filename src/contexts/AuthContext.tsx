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

  const fetchUserProfile = async (userId: string) => {
    try {
      // Use secure profile access function
      const { data, error } = await supabase.rpc('get_user_profile_safe', {
        target_user_id: userId
      });
      
      if (data && !error && data.length > 0) {
        setUserProfile(data[0]);
      } else if (error) {
        console.error('Error fetching user profile:', error);
        // Fallback to direct access for backward compatibility
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('profiles')
          .select('id, email, full_name, phone, credits, status, subscription_tier, created_at, last_login, two_factor_enabled, email_verified, is_active')
          .eq('id', userId)
          .single();
        
        if (fallbackData && !fallbackError) {
          setUserProfile(fallbackData);
        }
      }
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
    }
  };

  const refreshProfile = async () => {
    if (user) {
      await fetchUserProfile(user.id);
    }
  };

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Fetch profile after a short delay to ensure database is ready
          setTimeout(() => {
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

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, captchaToken?: string, referralCode?: string) => {
    try {
      const redirectUrl = `${getRedirectUrl()}/dashboard`;
      
      console.log('Signing up user:', email, 'with redirect:', redirectUrl);
      
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
        console.error('Signup error:', error);
        return { error };
      }
      
      // Create user profile using Edge Function
      if (data.user && !error) {
        try {
          await supabase.functions.invoke('create-user-profile', {
            body: {
              userId: data.user.id,
              email: email,
              fullName: fullName,
              referralCode: referralCode
            }
          });
          console.log('User profile created successfully');
        } catch (profileError) {
          console.error('Failed to create user profile:', profileError);
          // Don't throw error here as signup was successful
        }
        
        // Send welcome email after successful signup
        try {
          await supabase.functions.invoke('welcome-email', {
            body: {
              userId: data.user.id,
              email: email,
              fullName: fullName
            }
          });
          console.log('Welcome email sent successfully');
        } catch (emailError) {
          console.error('Failed to send welcome email:', emailError);
          // Don't throw error here as signup was successful
        }
      }
      
      return { error: null };
    } catch (error: any) {
      console.error('Signup exception:', error);
      return { error };
    }
  };

  const signIn = async (email: string, password: string, captchaToken?: string) => {
    try {
      console.log('Signing in user:', email);
      
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
        options: {
          captchaToken
        }
      });
      
      if (error) {
        console.error('Signin error:', error);
      } else {
        console.log('Signin successful');
      }
      
      return { error };
    } catch (error: any) {
      console.error('Signin exception:', error);
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
      refreshProfile
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
