import React from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import HeroSection from '@/components/landing/HeroSection';
import BenefitsSection from '@/components/landing/BenefitsSection';
import HowItWorksSection from '@/components/landing/HowItWorksSection';
import CTASection from '@/components/landing/CTASection';
import FAQSection from '@/components/landing/FAQSection';

export default function Home() {
  const handleGetStarted = async () => {
    base44.analytics.track({ eventName: 'cta_get_started_clicked', properties: { source: 'landing_page' } });
    const isAuth = await base44.auth.isAuthenticated();
    if (isAuth) {
      window.location.href = createPageUrl('Dashboard');
    } else {
      await base44.auth.redirectToLogin(createPageUrl('Dashboard'));
    }
  };

  const handleSignIn = () => {
    base44.analytics.track({ eventName: 'sign_in_clicked', properties: { source: 'landing_page' } });
    base44.auth.redirectToLogin(createPageUrl('Dashboard'));
  };

  return (
    <div className="min-h-screen">
      <HeroSection onGetStarted={handleGetStarted} onSignIn={handleSignIn} />
      <BenefitsSection />
      <HowItWorksSection />
      <FAQSection />
      <CTASection onGetStarted={handleGetStarted} />
      
      <footer className="bg-slate-900 py-16 border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid md:grid-cols-3 gap-10 mb-10">
            <div>
              <div className="text-2xl font-bold bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent mb-3">
                Dialled In Nutrition
              </div>
              <p className="text-slate-400 text-sm leading-relaxed">
                AI-powered meal planning and nutrition coaching, personalised to you. Lose weight, build muscle, or simply eat better — starting today.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Features</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>AI Meal Plans</li>
                <li>Macro & Calorie Tracking</li>
                <li>500+ Recipes</li>
                <li>AI Nutrition Coach</li>
                <li>Barcode Scanner</li>
                <li>Dining Out Analyser</li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">Get Started</h4>
              <ul className="space-y-2 text-slate-400 text-sm">
                <li>Free to use — no credit card needed</li>
                <li>Works on mobile & desktop</li>
                <li>Supports all major dietary preferences</li>
                <li>Personalised from day one</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-500 text-sm">© {new Date().getFullYear()} Dialled In Nutrition. All rights reserved.</p>
            <p className="text-slate-600 text-xs">AI-powered nutrition coaching for real people with real goals.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}