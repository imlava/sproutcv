
import React, { useState, useEffect } from 'react';
import { AuthFormLayout } from './AuthFormLayout';
import { SignInForm } from './SignInForm';
import { SignUpForm } from './SignUpForm';
import ForgotPasswordForm from './ForgotPasswordForm';

const EnhancedAuthPage = () => {
  const [currentView, setCurrentView] = useState<'signin' | 'signup' | 'forgot'>('signin');

  useEffect(() => {
    console.log('EnhancedAuthPage mounted');
  }, []);

  const getTitle = () => {
    switch (currentView) {
      case 'signin':
        return 'Welcome back to SproutCV';
      case 'signup':
        return 'Start growing your career';
      case 'forgot':
        return 'Reset your password';
      default:
        return 'Welcome to SproutCV';
    }
  };

  const getDescription = () => {
    switch (currentView) {
      case 'signin':
        return 'Sign in to continue optimizing your resume and accelerating your career growth';
      case 'signup':
        return 'Join thousands of professionals who\'ve transformed their careers with AI-powered resume optimization';
      case 'forgot':
        return 'Enter your email address and we\'ll send you a secure link to reset your password';
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
