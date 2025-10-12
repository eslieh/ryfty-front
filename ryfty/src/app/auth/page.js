"use client";

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import WelcomeStep from '@/components/auth/steps/WelcomeStep';
import EmailStep from '@/components/auth/steps/EmailStep';
import PasswordStep from '@/components/auth/steps/PasswordStep';
import SignupDetailsStep from '@/components/auth/steps/SignupDetailsStep';
import ProfilePhotoStep from '@/components/auth/steps/ProfilePhotoStep';
import VerificationStep from '@/components/auth/steps/VerificationStep';
import ForgotPasswordStep from '@/components/auth/steps/ForgotPasswordStep';
import ResetPasswordStep from '@/components/auth/steps/ResetPasswordStep';
import PhoneAuth from '@/components/auth/PhoneAuth';
import config from '@/config';
import '../../styles/auth.css';

function AuthContent() {
  const [currentStep, setCurrentStep] = useState('welcome'); 
  // Steps: 'welcome', 'email', 'password', 'signup-details', 'profile-photo', 'verification', 'forgot-password', 'reset-password', 'phone'
  const [authMode, setAuthMode] = useState('login'); // 'login' or 'signup'
  const [resetEmail, setResetEmail] = useState(''); // For password reset flow
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    phone: '',
    userType: 'customer', // 'customer' or 'provider'
    profilePhoto: null
  });
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    // Check if user is already authenticated
    if (isAuthenticated) {
      const redirect = searchParams.get('redirect') || '/';
      router.push(redirect);
    }

    // Check URL parameters for initial setup
    const mode = searchParams.get('mode');
    const type = searchParams.get('type');
    const step = searchParams.get('step');

    if (mode === 'signup' || mode === 'register') {
      setAuthMode('signup');
    }
    
    if (type && ['customer', 'provider'].includes(type)) {
      setFormData(prev => ({ ...prev, userType: type }));
    }

    if (step && ['welcome', 'email', 'password', 'signup-details', 'profile-photo', 'verification', 'forgot-password', 'reset-password', 'phone'].includes(step)) {
      setCurrentStep(step);
    } else if (mode === 'phone') {
      setCurrentStep('phone');
    }
  }, [isAuthenticated, router, searchParams]);

  if (loading) {
    return (
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    );
  }

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = (step) => {
    setCurrentStep(step);
    updateURL({ step });
  };

  const previousStep = () => {
    const stepFlow = {
      'email': 'welcome',
      'password': 'email',
      'signup-details': 'email',
      'profile-photo': 'signup-details'
    };
    
    const prevStep = stepFlow[currentStep] || 'welcome';
    setCurrentStep(prevStep);
    updateURL({ step: prevStep });
  };

  const updateURL = (params) => {
    const url = new URL(window.location);
    Object.entries(params).forEach(([key, value]) => {
      if (value) {
        url.searchParams.set(key, value);
      } else {
        url.searchParams.delete(key);
      }
    });
    window.history.pushState({}, '', url);
  };

  const setMode = (mode) => {
    setAuthMode(mode);
    updateURL({ mode });
  };

  const handleGoogleSuccess = () => {
    // Google auth is handled in the GoogleAuth component
    // Redirect will be handled by the auth context
  };

  const renderCurrentStep = () => {
    const stepProps = {
      formData,
      updateFormData,
      nextStep,
      previousStep,
      setMode,
      onGoogleSuccess: handleGoogleSuccess
    };

    switch (currentStep) {
      case 'welcome':
        return <WelcomeStep {...stepProps} />;
      case 'email':
        return <EmailStep {...stepProps} authMode={authMode} />;
      case 'password':
        return <PasswordStep {...stepProps} />;
      case 'signup-details':
        return <SignupDetailsStep {...stepProps} />;
      case 'profile-photo':
        return <ProfilePhotoStep {...stepProps} />;
      case 'verification':
        return <VerificationStep {...stepProps} email={formData.email} />;
      case 'forgot-password':
        return <ForgotPasswordStep 
          onNext={(email) => {
            setResetEmail(email);
            nextStep('reset-password');
          }}
          onBack={() => nextStep('password')}
        />;
      case 'reset-password':
        return <ResetPasswordStep 
          email={resetEmail}
          onSuccess={(message) => {
            // Show success and redirect to login
            alert(message); // You might want to use a better notification system
            setCurrentStep('welcome');
            setAuthMode('login');
          }}
          onBack={() => nextStep('forgot-password')}
        />;
      case 'phone':
        return <PhoneAuth userType={formData.userType} />;
      default:
        return <WelcomeStep {...stepProps} />;
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-background">
        <div className="auth-background-overlay"></div>
      </div>
      
      <div className="auth-content">
        <motion.div 
          className="auth-card step-based"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Progress Indicator */}
          {currentStep !== 'welcome' && currentStep !== 'phone' && currentStep !== 'forgot-password' && currentStep !== 'reset-password' && (
            <div className="step-progress">
              <button 
                className="back-button"
                onClick={previousStep}
                type="button"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                  <path d="M19 12H5M12 19L5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
              
              <div className="progress-dots">
                {(() => {
                  const steps = authMode === 'login' 
                    ? ['email', 'password'] 
                    : ['email', 'signup-details', 'profile-photo', 'verification'];
                  
                  return steps.map((step, index) => (
                    <div 
                      key={step}
                      className={`progress-dot ${
                        steps.indexOf(currentStep) >= index ? 'active' : ''
                      }`}
                    />
                  ));
                })()}
              </div>
            </div>
          )}

          {/* Step Content */}
          <div className="step-content">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {renderCurrentStep()}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="auth-loading">
        <div className="loading-spinner"></div>
        <p>Loading...</p>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}
