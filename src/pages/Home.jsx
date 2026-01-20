import React from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import HeroSection from '@/components/landing/HeroSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import CTASection from '@/components/landing/CTASection';

export default function Home() {
  const navigate = useNavigate();

  const handleGetStarted = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      
      if (isAuth) {
        // Check if user has profile
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ 
          created_by: user.email 
        });
        
        if (profiles?.length > 0 && profiles[0].onboarding_complete) {
          navigate(createPageUrl('Dashboard'));
        } else {
          navigate(createPageUrl('Onboarding'));
        }
      } else {
        await base44.auth.redirectToLogin(createPageUrl('Onboarding'));
      }
    } catch (error) {
      console.error('Get started error:', error);
      await base44.auth.redirectToLogin(createPageUrl('Onboarding'));
    }
  };

  return (
    <div className="min-h-screen">
      <HeroSection onGetStarted={handleGetStarted} />
      <BenefitsSection />
      <HowItWorksSection />
      <CTASection onGetStarted={handleGetStarted} />
      
      {/* Footer */}
      <footer className="bg-slate-900 py-12 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 text-center">
          <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-4">
            Dialled In Nutrition
          </div>
          <p className="text-slate-400 text-sm">
            Smart meal planning for lasting results.
          </p>
        </div>
      </footer>
    </div>
  );
}