import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays, differenceInDays, parseISO } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Calendar, ChefHat, RefreshCw, BookOpen, Target, ArrowRight, Upload, Sparkles, GraduationCap, Users, TrendingUp, UtensilsCrossed } from "lucide-react";
import DaySelector from '@/components/dashboard/DaySelector';
import MealPlanCard from '@/components/dashboard/MealPlanCard';
import CalorieProgress from '@/components/dashboard/CalorieProgress';
import WeeklyCheckin from '@/components/dashboard/WeeklyCheckin';
import RecipeModal from '@/components/recipes/RecipeModal';
import AlternativeMeals from '@/components/dashboard/AlternativeMeals';
import UserMenu from '@/components/UserMenu';
import { motion } from 'framer-motion';

export default function Dashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(0);
  const [showCheckin, setShowCheckin] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showAlternatives, setShowAlternatives] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const currentUser = await base44.auth.me();
        setUser(currentUser);
      } catch (error) {
        console.log('Error fetching user:', error);
      }
    };
    fetchUser();
  }, []);

  // Fetch user profile
  const { data: profiles, isLoading: profileLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserProfile.filter({ created_by: currentUser.email });
    },
    staleTime: 5 * 60 * 1000 // 5 minutes
  });

  const profile = profiles?.[0];

  // Fetch current meal plan
  const { data: mealPlans, isLoading: planLoading } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.MealPlan.filter({ is_active: true, created_by: currentUser.email });
    },
    staleTime: 2 * 60 * 1000 // 2 minutes
  });

  const currentPlan = mealPlans?.[0];

  // Fetch all recipes
  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list(),
    staleTime: 10 * 60 * 1000 // 10 minutes
  });

  // Fetch favorites - defer until profile is loaded
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FavoriteRecipe.filter({ created_by: currentUser.email });
    },
    enabled: !!profile,
    staleTime: 2 * 60 * 1000
  });

  // Fetch calorie logs - defer until profile is loaded
  const { data: calorieLogs } = useQuery({
    queryKey: ['calorieLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.CalorieLog.filter({ created_by: currentUser.email });
    },
    enabled: !!profile,
    staleTime: 1 * 60 * 1000 // 1 minute
  });

  // Check if weekly checkin is needed
  useEffect(() => {
    if (profile?.last_checkin_date) {
      const lastCheckin = parseISO(profile.last_checkin_date);
      const daysSinceCheckin = differenceInDays(new Date(), lastCheckin);
      if (daysSinceCheckin >= 7) {
        setShowCheckin(true);
      }
    }
  }, [profile]);

  // Set selected day to today
  useEffect(() => {
    if (currentPlan?.week_start_date) {
      const weekStart = new Date(currentPlan.week_start_date);
      const today = new Date();
      const dayIndex = differenceInDays(today, weekStart);
      if (dayIndex >= 0 && dayIndex < 7) {
        setSelectedDay(dayIndex);
      }
    }
  }, [currentPlan]);

  const getRecipeById = (id) => recipes?.find(r => r.id === id);
  
  const isFavorite = (recipeId) => favorites?.some(f => f.recipe_id === recipeId);

  const toggleFavorite = useMutation({
    mutationFn: async (recipeId) => {
      const existing = favorites?.find(f => f.recipe_id === recipeId);
      if (existing) {
        await base44.entities.FavoriteRecipe.delete(existing.id);
      } else {
        await base44.entities.FavoriteRecipe.create({ recipe_id: recipeId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] })
  });

  const logMeal = useMutation({
    mutationFn: async ({ recipe, date, mealType }) => {
      const dateStr = format(date, 'yyyy-MM-dd');
      const existingLogs = calorieLogs?.filter(l => l.date === dateStr) || [];
      const existingLog = existingLogs[0];

      if (existingLog) {
        const meals = existingLog.meals_logged || [];
        const mealIndex = meals.findIndex(m => m.meal_type === mealType);
        
        if (mealIndex >= 0) {
          meals[mealIndex].completed = !meals[mealIndex].completed;
        } else {
          meals.push({
            meal_type: mealType,
            recipe_id: recipe.id,
            recipe_name: recipe.name,
            calories: recipe.calories,
            completed: true
          });
        }

        const totalCalories = meals.filter(m => m.completed).reduce((sum, m) => sum + m.calories, 0);

        await base44.entities.CalorieLog.update(existingLog.id, {
          meals_logged: meals,
          calories_consumed: totalCalories
        });
      } else {
        await base44.entities.CalorieLog.create({
          date: dateStr,
          meals_logged: [{
            meal_type: mealType,
            recipe_id: recipe.id,
            recipe_name: recipe.name,
            calories: recipe.calories,
            completed: true
          }],
          calories_consumed: recipe.calories,
          calorie_target: profile?.daily_calorie_target || 2000
        });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['calorieLogs'] })
  });

  const isMealCompleted = (dayIndex, mealType) => {
    if (!currentPlan?.week_start_date) return false;
    const date = format(addDays(new Date(currentPlan.week_start_date), dayIndex), 'yyyy-MM-dd');
    const log = calorieLogs?.find(l => l.date === date);
    return log?.meals_logged?.find(m => m.meal_type === mealType)?.completed || false;
  };

  const getTodayLog = () => {
    if (!currentPlan?.week_start_date) return null;
    const date = format(addDays(new Date(currentPlan.week_start_date), selectedDay), 'yyyy-MM-dd');
    return calorieLogs?.find(l => l.date === date);
  };

  const getWeeklyLogs = () => {
    if (!currentPlan?.week_start_date) return [];
    const weekStart = new Date(currentPlan.week_start_date);
    return Array.from({ length: 7 }, (_, i) => {
      const date = format(addDays(weekStart, i), 'yyyy-MM-dd');
      return calorieLogs?.find(l => l.date === date) || { date, calories_consumed: 0 };
    });
  };

  const handleWeeklyCheckin = async (data) => {
    setIsGenerating(true);
    try {
      // Calculate new calorie target
      const weight = parseFloat(data.weight_kg);
      const height = parseFloat(data.height_cm);
      const age = parseInt(data.age);
      
      let bmr;
      if (profile?.gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
      
      const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.9
      };
      
      const tdee = bmr * (multipliers[data.activity_level] || 1.55);
      
      let targetCalories;
      switch (data.health_goal) {
        case 'lose_weight':
          targetCalories = Math.round(tdee - 500);
          break;
        case 'gain_muscle':
          targetCalories = Math.round(tdee + 300);
          break;
        default:
          targetCalories = Math.round(tdee);
      }

      // Update profile
      await base44.entities.UserProfile.update(profile.id, {
        weight_kg: weight,
        height_cm: height,
        age: age,
        activity_level: data.activity_level,
        health_goal: data.health_goal,
        daily_calorie_target: targetCalories,
        last_checkin_date: new Date().toISOString().split('T')[0]
      });

      // Generate new meal plan
      await generateMealPlan(targetCalories);
      
      queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      setShowCheckin(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    }
    setIsGenerating(false);
  };

  const generateMealPlan = async (calorieTarget) => {
    if (!recipes || recipes.length === 0) return;

    try {
      // Call AI to generate personalized meal plan
      const { data } = await base44.functions.invoke('generateAIMealPlan', {
        calorie_target: calorieTarget
      });

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      
      // Add dates to the AI-generated days
      const daysWithDates = data.days.map((day, i) => ({
        ...day,
        date: format(addDays(weekStart, i), 'yyyy-MM-dd')
      }));

      // Deactivate old plans for this user only
      const currentUser = await base44.auth.me();
      const oldPlans = await base44.entities.MealPlan.filter({ 
        is_active: true, 
        created_by: currentUser.email 
      });
      for (const plan of oldPlans) {
        await base44.entities.MealPlan.update(plan.id, { is_active: false });
      }

      // Create new AI-generated plan
      await base44.entities.MealPlan.create({
        week_start_date: format(weekStart, 'yyyy-MM-dd'),
        daily_calorie_target: calorieTarget,
        days: daysWithDates,
        is_active: true
      });
    } catch (error) {
      console.error('Error generating AI meal plan:', error);
      throw error;
    }
  };

  const handleGenerateNewPlan = async () => {
    setIsGenerating(true);
    await generateMealPlan(profile?.daily_calorie_target || 2000);
    queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    setIsGenerating(false);
  };

  const handleSelectAlternative = async (newRecipe) => {
    if (!currentPlan || !showAlternatives) return;
    
    const { mealType, dayIndex } = showAlternatives;
    const updatedDays = [...currentPlan.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      [`${mealType}_recipe_id`]: newRecipe.id
    };

    // Recalculate total calories
    const breakfast = getRecipeById(updatedDays[dayIndex].breakfast_recipe_id);
    const lunch = getRecipeById(updatedDays[dayIndex].lunch_recipe_id);
    const dinner = getRecipeById(updatedDays[dayIndex].dinner_recipe_id);
    const snack = getRecipeById(updatedDays[dayIndex].snack_recipe_id);
    
    updatedDays[dayIndex].total_calories = 
      (breakfast?.calories || 0) +
      (lunch?.calories || 0) +
      (dinner?.calories || 0) +
      (snack?.calories || 0);

    await base44.entities.MealPlan.update(currentPlan.id, {
      days: updatedDays
    });

    queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    setShowAlternatives(null);
  };

  const isLoading = profileLoading || planLoading || recipesLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!profile) {
    navigate(createPageUrl('Onboarding'));
    return null;
  }

  const todayMeals = currentPlan?.days?.[selectedDay];
  const todayLog = getTodayLog();
  const todayConsumed = todayLog?.calories_consumed || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      {showCheckin && (
        <WeeklyCheckin 
          currentProfile={profile}
          onComplete={handleWeeklyCheckin}
          isLoading={isGenerating}
        />
      )}

      <RecipeModal
        recipe={selectedRecipe}
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        isFavorite={selectedRecipe ? isFavorite(selectedRecipe.id) : false}
        onToggleFavorite={() => {
          if (selectedRecipe) toggleFavorite.mutate(selectedRecipe.id);
        }}
      />

      {showAlternatives && (
        <AlternativeMeals
          mealType={showAlternatives.mealType}
          currentRecipe={getRecipeById(todayMeals?.[`${showAlternatives.mealType}_recipe_id`])}
          targetCalories={profile?.daily_calorie_target || 2000}
          excludeRecipeIds={Object.values(todayMeals || {})
            .filter(val => typeof val === 'string')
            .filter(id => id !== todayMeals?.[`${showAlternatives.mealType}_recipe_id`])}
          onSelectAlternative={handleSelectAlternative}
          onClose={() => setShowAlternatives(null)}
        />
      )}

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Your Meal Plan</h1>
            <p className="text-slate-500 mt-1">
              {currentPlan ? `Week of ${format(new Date(currentPlan.week_start_date), 'MMM d')}` : 'No active plan'}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <UserMenu />
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl('Learn'))}
              className="rounded-xl border-purple-200 text-purple-600 hover:bg-purple-50"
            >
              <GraduationCap className="w-4 h-4 mr-1" />
              Learn
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl('Community'))}
              className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Users className="w-4 h-4 mr-1" />
              Community
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl('Progress'))}
              className="rounded-xl border-emerald-200 text-emerald-600 hover:bg-emerald-50"
            >
              <TrendingUp className="w-4 h-4 mr-1" />
              Progress
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl('DiningOut'))}
              className="rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50"
            >
              <UtensilsCrossed className="w-4 h-4 mr-1" />
              Dining Out
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl('Discover'))}
              className="rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50"
            >
              <Sparkles className="w-4 h-4 mr-1" />
              Discover
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl('Recipes'))}
              className="rounded-xl"
            >
              <BookOpen className="w-4 h-4 mr-1" />
              Recipes
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(createPageUrl('MealPlanner'))}
              className="rounded-xl"
            >
              <Calendar className="w-4 h-4 mr-1" />
              Planner
            </Button>
            {user?.role === 'admin' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(createPageUrl('AdminRecipeUpload'))}
                className="rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50"
              >
                <Upload className="w-4 h-4 mr-1" />
                Upload
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleGenerateNewPlan}
              disabled={isGenerating}
              className="bg-slate-900 hover:bg-slate-800 rounded-xl"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-1" />
              )}
              New
            </Button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Day Selector */}
            {currentPlan && (
              <Card className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border-0 p-4">
                <DaySelector
                  weekStartDate={currentPlan.week_start_date}
                  selectedDay={selectedDay}
                  onSelectDay={setSelectedDay}
                />
              </Card>
            )}

            {/* Meals for Selected Day */}
            {currentPlan && todayMeals ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-900">
                    {todayMeals.day_name}'s Meals
                  </h2>
                  <span className="text-sm text-slate-500">
                    ~{todayMeals.total_calories?.toLocaleString()} kcal planned
                  </span>
                </div>
                
                <div className="grid sm:grid-cols-2 gap-4">
                  {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                    const recipeId = todayMeals[`${mealType}_recipe_id`];
                    const recipe = getRecipeById(recipeId);
                    
                    return (
                      <MealPlanCard
                        key={mealType}
                        recipe={recipe}
                        mealType={mealType}
                        isCompleted={isMealCompleted(selectedDay, mealType)}
                        isFavorite={recipe ? isFavorite(recipe.id) : false}
                        onToggleFavorite={() => recipe && toggleFavorite.mutate(recipe.id)}
                        onMarkComplete={() => {
                          if (recipe && currentPlan) {
                            const date = addDays(new Date(currentPlan.week_start_date), selectedDay);
                            logMeal.mutate({ recipe, date, mealType });
                          }
                        }}
                        onViewRecipe={() => recipe && setSelectedRecipe(recipe)}
                        onFindAlternatives={() => setShowAlternatives({ mealType, dayIndex: selectedDay })}
                      />
                    );
                  })}
                </div>
              </div>
            ) : (
              <Card className="bg-white rounded-2xl shadow-sm border-0 p-12 text-center">
                <ChefHat className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Meal Plan Yet</h3>
                <p className="text-slate-500 mb-6">Generate your first personalized meal plan</p>
                <Button
                  onClick={handleGenerateNewPlan}
                  disabled={isGenerating}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {isGenerating ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4 mr-2" />
                  )}
                  Generate Meal Plan
                </Button>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Calorie Progress */}
            <CalorieProgress
              dailyTarget={profile?.daily_calorie_target || 2000}
              consumed={todayConsumed}
              weeklyLogs={getWeeklyLogs()}
            />

            {/* Profile Summary */}
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-500" />
                  Your Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Daily Target</span>
                  <span className="font-semibold text-slate-900">
                    {profile?.daily_calorie_target?.toLocaleString()} kcal
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Goal</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {profile?.health_goal?.replace('_', ' ')}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Activity</span>
                  <span className="font-semibold text-slate-900 capitalize">
                    {profile?.activity_level?.replace('_', ' ')}
                  </span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowCheckin(true)}
                  className="w-full mt-2 rounded-xl"
                >
                  Update Stats
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl shadow-lg border-0 text-white">
              <CardContent className="p-6">
                <h3 className="font-semibold text-lg mb-2">Weekly Check-in</h3>
                <p className="text-emerald-100 text-sm mb-4">
                  Update your stats to keep your meal plan optimized for your goals.
                </p>
                <Button
                  variant="secondary"
                  onClick={() => setShowCheckin(true)}
                  className="w-full bg-white text-emerald-700 hover:bg-emerald-50 rounded-xl"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Check-in Now
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}