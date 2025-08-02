
import React, { useState } from 'react';
import { AuthFormLayout } from './AuthFormLayout';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import { ForgotPasswordForm } from './ForgotPasswordForm';

const EnhancedAuthPage = () => {
  const [currentView, setCurrentView] = useState<'signin' | 'signup' | 'forgot'>('signin');

  const getTitle = () => {
    switch (currentView) {
      case 'signin':
        return 'Welcome back';
      case 'signup':
        return 'Create your account';
      case 'forgot':
        return 'Reset your password';
      default:
        return 'Welcome';
    }
  };

  const getDescription = () => {
    switch (currentView) {
      case 'signin':
        return 'Sign in to your account to continue optimizing your resume';
      case 'signup':
        return 'Join thousands of professionals improving their resumes with AI';
      case 'forgot':
        return 'Enter your email to receive a password reset link';
      default:
        return '';
    }
  };

  const renderForm = () => {
    switch (currentView) {
      case 'signin':
        return (
          <SignInForm
            onForgotPassword={() => setCurrentView('forgot')}
            onSwitchToSignUp={() => setCurrentView('signup')}
          />
        );
      case 'signup':
        return (
          <SignUpForm
            onSwitchToSignIn={() => setCurrentView('signin')}
          />
        );
      case 'forgot':
        return (
          <ForgotPasswordForm
            onBack={() => setCurrentView('signin')}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AuthFormLayout title={getTitle()} description={getDescription()}>
      {renderForm()}
    </AuthFormLayout>
  );
};

export default EnhancedAuthPage;
