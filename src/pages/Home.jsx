import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import HeroSection from '@/components/landing/HeroSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import CTASection from '@/components/landing/CTASection';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const [isChecking, setIsChecking] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUserStatus();
  }, []);

  const checkUserStatus = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (isAuth) {
        const profiles = await base44.entities.UserProfile.list();
        if (profiles.length > 0 && profiles[0].onboarding_complete) {
          navigate(createPageUrl('Dashboard'));
          return;
        }
      }
    } catch (error) {
      console.log('Not logged in, showing landing page');
    }
    setIsChecking(false);
  };

  const handleGetStarted = () => {
    base44.auth.redirectToLogin(createPageUrl('Onboarding'));
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <HeroSection onGetStarted={handleGetStarted} />
      <BenefitsSection />
      <HowItWorksSection />
      <CTASection onGetStarted={handleGetStarted} />
      
      {/* Footer */}
      <footer className="bg-white py-12 border-t border-slate-100">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent mb-4">
            NutriPlan
          </div>
          <p className="text-slate-500 text-sm">
            Personalized nutrition for a healthier you.
          </p>
        </div>
      </footer>
    </div>
  );
}