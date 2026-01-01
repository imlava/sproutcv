import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { CheckCircle, XCircle, Loader2, Mail } from 'lucide-react';

/**
 * AuthCallback Page
 * 
 * This page handles Supabase email confirmation callbacks.
 * When a user clicks the email confirmation link, Supabase redirects here
 * with tokens in the URL hash or query params.
 * 
 * The flow:
 * 1. User clicks email confirmation link
 * 2. Supabase redirects to /auth/callback with tokens
 * 3. This page exchanges tokens for a session
 * 4. User is redirected to dashboard
 */
const AuthCallback: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verifying your email...');
  const [errorDetail, setErrorDetail] = useState<string | null>(null);

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log('🔐 AuthCallback: Processing email confirmation...');
        console.log('📍 URL:', window.location.href);
        console.log('🔗 Hash:', window.location.hash);
        console.log('❓ Search params:', Object.fromEntries(searchParams.entries()));

        // Check for error in URL params (e.g., expired link)
        const error = searchParams.get('error');
        const errorDescription = searchParams.get('error_description');
        
        if (error) {
          console.error('❌ Auth error from URL:', error, errorDescription);
          setStatus('error');
          setErrorDetail(errorDescription || error);
          
          if (error === 'access_denied' && errorDescription?.includes('expired')) {
            setMessage('Email confirmation link has expired');
          } else {
            setMessage('Email verification failed');
          }
          return;
        }

        // Check for tokens in hash fragment (Supabase default)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const type = hashParams.get('type');

        console.log('🎫 Token type:', type);
        console.log('🎫 Has access token:', !!accessToken);
        console.log('🎫 Has refresh token:', !!refreshToken);

        // If we have tokens in hash, set the session
        if (accessToken && refreshToken) {
          console.log('🔑 Setting session from URL tokens...');
          
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            setStatus('error');
            setMessage('Failed to verify email');
            setErrorDetail(sessionError.message);
            return;
          }

          if (data.session) {
            console.log('✅ Session established for user:', data.session.user.id);
            console.log('📧 User email:', data.session.user.email);
            console.log('✅ Email confirmed:', data.session.user.email_confirmed_at);
            
            // Success! Email verified
            setStatus('success');
            setMessage('Email verified successfully!');
            
            // Give user a moment to see the success message
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
            return;
          }
        }

        // Check for code in query params (PKCE flow)
        const code = searchParams.get('code');
        if (code) {
          console.log('🔑 Exchanging code for session...');
          
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('❌ Code exchange error:', exchangeError);
            setStatus('error');
            setMessage('Failed to verify email');
            setErrorDetail(exchangeError.message);
            return;
          }

          if (data.session) {
            console.log('✅ Session established via code exchange');
            setStatus('success');
            setMessage('Email verified successfully!');
            
            setTimeout(() => {
              navigate('/dashboard', { replace: true });
            }, 1500);
            return;
          }
        }

        // Check if user is already authenticated
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          console.log('✅ User already has session, redirecting...');
          setStatus('success');
          setMessage('Already signed in!');
          
          setTimeout(() => {
            navigate('/dashboard', { replace: true });
          }, 1000);
          return;
        }

        // No tokens found - might be a direct visit or expired link
        console.log('⚠️ No auth tokens found in URL');
        setStatus('error');
        setMessage('Invalid or expired confirmation link');
        setErrorDetail('Please request a new confirmation email from the sign-in page.');

      } catch (err) {
        console.error('❌ AuthCallback error:', err);
        setStatus('error');
        setMessage('An unexpected error occurred');
        setErrorDetail(err instanceof Error ? err.message : 'Unknown error');
      }
    };

    handleAuthCallback();
  }, [navigate, searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
        {/* Status Icon */}
        <div className="mb-6">
          {status === 'loading' && (
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-green-600 animate-spin" />
            </div>
          )}
          {status === 'success' && (
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center animate-bounce">
              <CheckCircle className="w-8 h-8 text-green-600" />
            </div>
          )}
          {status === 'error' && (
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
          )}
        </div>

        {/* Status Message */}
        <h1 className={`text-xl font-semibold mb-2 ${
          status === 'success' ? 'text-green-700' : 
          status === 'error' ? 'text-red-700' : 'text-gray-700'
        }`}>
          {message}
        </h1>

        {/* Loading indicator */}
        {status === 'loading' && (
          <p className="text-gray-500 text-sm">
            Please wait while we verify your email address...
          </p>
        )}

        {/* Success message */}
        {status === 'success' && (
          <p className="text-gray-500 text-sm">
            Redirecting you to your dashboard...
          </p>
        )}

        {/* Error details and actions */}
        {status === 'error' && (
          <div className="space-y-4">
            {errorDetail && (
              <p className="text-gray-500 text-sm">
                {errorDetail}
              </p>
            )}
            
            <div className="flex flex-col gap-3 mt-6">
              <button
                onClick={() => navigate('/auth')}
                className="w-full py-3 px-4 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                Go to Sign In
              </button>
              
              <button
                onClick={() => navigate('/')}
                className="w-full py-3 px-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
              >
                Back to Home
              </button>
            </div>
          </div>
        )}

        {/* Footer branding */}
        <div className="mt-8 pt-6 border-t border-gray-100">
          <p className="text-xs text-gray-400">
            🌱 SproutCV - Grow Your Career
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallback;
