import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import { Loader2 } from 'lucide-react';

export default function AuthGuard({ children, requireProfile = false }) {
  const [state, setState] = useState('checking'); // checking, ready, redirecting

  useEffect(() => {
    let mounted = true;

    const check = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        
        if (!isAuth) {
          if (mounted) {
            setState('redirecting');
            await base44.auth.redirectToLogin(window.location.href);
          }
          return;
        }

        if (requireProfile) {
          const user = await base44.auth.me();
          const profiles = await base44.entities.UserProfile.filter({ 
            created_by: user.email 
          });

          if (!profiles || profiles.length === 0 || !profiles[0].onboarding_complete) {
            if (mounted) {
              setState('redirecting');
              window.location.href = createPageUrl('Onboarding');
            }
            return;
          }
        }

        if (mounted) setState('ready');
      } catch (error) {
        console.error('Auth check failed:', error);
        if (mounted) {
          setState('redirecting');
          await base44.auth.redirectToLogin(window.location.href);
        }
      }
    };

    check();
    return () => { mounted = false; };
  }, [requireProfile]);

  if (state !== 'ready') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <>{children}</>;
}