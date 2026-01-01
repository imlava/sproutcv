
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import UserDashboard from '@/components/dashboard/UserDashboard';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [processingAuth, setProcessingAuth] = useState(false);

  // Handle legacy auth tokens that might arrive at /dashboard instead of /auth/callback
  useEffect(() => {
    const handleLegacyAuthTokens = async () => {
      // Check for auth tokens in URL hash (legacy email confirmation links)
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      // Check for code in query params (PKCE flow)
      const code = searchParams.get('code');
      
      if (accessToken && refreshToken) {
        console.log('🔐 Dashboard: Processing legacy auth tokens from URL hash...');
        setProcessingAuth(true);
        
        try {
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          
          if (error) {
            console.error('❌ Dashboard: Failed to set session:', error);
            navigate('/auth/callback' + window.location.hash);
          } else if (data.session) {
            console.log('✅ Dashboard: Session established from legacy tokens');
            // Clean the URL
            window.history.replaceState({}, '', '/dashboard');
          }
        } catch (err) {
          console.error('❌ Dashboard: Error processing tokens:', err);
        }
        
        setProcessingAuth(false);
      } else if (code) {
        console.log('🔐 Dashboard: Redirecting PKCE code to auth callback...');
        navigate('/auth/callback' + window.location.search);
      }
    };

    handleLegacyAuthTokens();
  }, [navigate, searchParams]);

  useEffect(() => {
    if (!loading && !processingAuth && !user) {
      navigate('/auth');
    }
  }, [user, loading, processingAuth, navigate]);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (user && !loading) {
        try {
          // Use the has_role function instead of direct query
          const { data, error } = await supabase.rpc('has_role', {
            _user_id: user.id,
            _role: 'admin'
          });
          
          if (error) {
            console.error('Error checking admin role:', error);
            // If there's an error, we'll assume user is not admin
            return;
          }
          
          if (data) {
            navigate('/admin');
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
        }
      }
    };

    checkAdminRole();
  }, [user, loading, navigate]);

  if (loading || processingAuth) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect to auth
  }

  return <UserDashboard />;
};

export default Dashboard;
