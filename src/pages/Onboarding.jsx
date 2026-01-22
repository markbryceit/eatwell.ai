import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { createPageUrl } from '@/utils';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { Loader2 } from 'lucide-react';

const calculateBMR = (weight, height, age, gender) => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
};

const calculateTDEE = (bmr, activityLevel) => {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9
  };
  return bmr * (multipliers[activityLevel] || 1.55);
};

const calculateTargetCalories = (tdee, goal) => {
  switch (goal) {
    case 'lose_weight':
      return Math.round(tdee - 500);
    case 'gain_muscle':
      return Math.round(tdee + 300);
    default:
      return Math.round(tdee);
  }
};

export default function Onboarding() {
  const [checkState, setCheckState] = useState('loading'); // loading, form, redirecting
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    let mounted = true;
    
    const checkProfile = async () => {
      try {
        const isAuth = await base44.auth.isAuthenticated();
        if (!isAuth) {
          if (mounted) window.location.href = createPageUrl('Home');
          return;
        }
        
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ 
          created_by: user.email 
        });
        
        if (profiles.length > 0 && profiles[0].onboarding_complete) {
          if (mounted) {
            setCheckState('redirecting');
            window.location.href = createPageUrl('Dashboard');
          }
          return;
        }
        
        if (mounted) setCheckState('form');
      } catch (error) {
        console.error('Profile check error:', error);
        if (mounted) setCheckState('form');
      }
    };

    checkProfile();
    return () => { mounted = false; };
  }, []);

  const handleComplete = async (formData) => {
    setIsSaving(true);
    try {
      const weight = parseFloat(formData.weight_kg);
      const height = parseFloat(formData.height_cm);
      const age = parseInt(formData.age);
      
      const bmr = calculateBMR(weight, height, age, formData.gender);
      const tdee = calculateTDEE(bmr, formData.activity_level);
      const targetCalories = calculateTargetCalories(tdee, formData.health_goal);

      const user = await base44.auth.me();
      
      const profileData = {
        height_cm: height,
        weight_kg: weight,
        age: age,
        gender: formData.gender,
        activity_level: formData.activity_level,
        health_goal: formData.health_goal,
        eating_style: formData.eating_style || [],
        allergies: formData.allergies || [],
        disliked_foods: formData.disliked_foods || [],
        daily_calorie_target: targetCalories,
        last_checkin_date: new Date().toISOString().split('T')[0],
        onboarding_complete: true
      };

      const existingProfiles = await base44.entities.UserProfile.filter({ 
        created_by: user.email 
      });
      
      if (existingProfiles.length > 0) {
        await base44.entities.UserProfile.update(existingProfiles[0].id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }

      window.location.href = createPageUrl('Dashboard');
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save your profile. Please try again.');
      setIsSaving(false);
    }
  };

  if (checkState !== 'form') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <OnboardingFlow onComplete={handleComplete} isLoading={isSaving} />;
}