import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import OnboardingFlow from '@/components/onboarding/OnboardingFlow';
import { Loader2 } from 'lucide-react';

// Calculate BMR using Mifflin-St Jeor equation
const calculateBMR = (weight, height, age, gender) => {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  }
  return 10 * weight + 6.25 * height - 5 * age - 161;
};

// Calculate TDEE based on activity level
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

// Adjust calories based on goal
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
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    checkExistingProfile();
  }, []);

  const checkExistingProfile = async () => {
    try {
      const isAuth = await base44.auth.isAuthenticated();
      if (!isAuth) {
        navigate(createPageUrl('Home'));
        return;
      }
      
      const user = await base44.auth.me();
      const profiles = await base44.entities.UserProfile.filter({ 
        created_by: user.email 
      });
      
      if (profiles.length > 0 && profiles[0].onboarding_complete) {
        navigate(createPageUrl('Dashboard'));
        return;
      }
      
      // If we get here, user is authenticated but has no profile or incomplete onboarding
      // Show the onboarding form
      setIsLoading(false);
    } catch (error) {
      console.error('Error checking profile:', error);
      // Even if there's an error, show the onboarding form instead of white screen
      setIsLoading(false);
    }
  };

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

      // Navigate to Dashboard
      navigate(createPageUrl('Dashboard'));
    } catch (error) {
      console.error('Error saving profile:', error);
      alert('Failed to save your profile. Please try again.');
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return <OnboardingFlow onComplete={handleComplete} isLoading={isSaving} />;
}