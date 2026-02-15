import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays, addWeeks, isSameWeek } from 'date-fns';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, RefreshCw, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import AppNavigation from '@/components/dashboard/AppNavigation';
import MobileNav from '@/components/dashboard/MobileNav';
import DaySelector from '@/components/dashboard/DaySelector';
import MealPlanCard from '@/components/dashboard/MealPlanCard';
import CalorieProgress from '@/components/dashboard/CalorieProgress';
import WeeklyCheckin from '@/components/dashboard/WeeklyCheckin';
import RecipeModal from '@/components/recipes/RecipeModal';
import ManualMealSelector from '@/components/dashboard/ManualMealSelector';
import FoodLogModal from '@/components/nutrition/FoodLogModal';
import AuthGuard from '@/components/AuthGuard';

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [selectedWeekStart, setSelectedWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [selectedDay, setSelectedDay] = useState(0);
  const [showCheckin, setShowCheckin] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showManualSelector, setShowManualSelector] = useState(null);
  const [showFoodLog, setShowFoodLog] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }),
    enabled: !!user
  });

  const profile = profiles?.[0];
  const isCurrentWeek = isSameWeek(selectedWeekStart, new Date(), { weekStartsOn: 1 });

  const { data: mealPlans } = useQuery({
    queryKey: ['mealPlans', user?.email, format(selectedWeekStart, 'yyyy-MM-dd')],
    queryFn: () => {
      const weekStartStr = format(selectedWeekStart, 'yyyy-MM-dd');
      return base44.entities.MealPlan.filter({ 
        week_start_date: weekStartStr,
        created_by: user.email 
      });
    },
    enabled: !!user && !!profile
  });

  const currentPlan = mealPlans?.[0];

  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list()
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites', user?.email],
    queryFn: () => base44.entities.FavoriteRecipe.filter({ created_by: user.email }),
    enabled: !!user
  });

  const { data: calorieLogs } = useQuery({
    queryKey: ['calorieLogs', user?.email],
    queryFn: () => base44.entities.CalorieLog.filter({ created_by: user.email }),
    enabled: !!user
  });

  const { data: foodLogs } = useQuery({
    queryKey: ['foodLogs', user?.email],
    queryFn: () => base44.entities.FoodLog.filter({ created_by: user.email }),
    enabled: !!user
  });

  useEffect(() => {
    if (isCurrentWeek) {
      const today = new Date();
      const daysSinceMonday = (today.getDay() + 6) % 7;
      setSelectedDay(daysSinceMonday);
    } else {
      setSelectedDay(0);
    }
  }, [selectedWeekStart, isCurrentWeek]);

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
      const existingLogs = await base44.entities.CalorieLog.filter({ created_by: user.email, date: dateStr });
      const existingLog = existingLogs?.[0];

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

        if (meals[mealIndex]?.completed) {
          await base44.entities.FoodLog.create({
            date: dateStr,
            meal_type: mealType,
            food_name: recipe.name,
            serving_size: `${recipe.servings || 1} serving(s)`,
            quantity: 1,
            calories: recipe.calories,
            protein_g: recipe.protein_g,
            carbs_g: recipe.carbs_g,
            fat_g: recipe.fat_g,
            fiber_g: recipe.fiber_g || 0,
            source: 'recipe'
          });
        }
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

        await base44.entities.FoodLog.create({
          date: dateStr,
          meal_type: mealType,
          food_name: recipe.name,
          serving_size: `${recipe.servings || 1} serving(s)`,
          quantity: 1,
          calories: recipe.calories,
          protein_g: recipe.protein_g,
          carbs_g: recipe.carbs_g,
          fat_g: recipe.fat_g,
          fiber_g: recipe.fiber_g || 0,
          source: 'recipe'
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calorieLogs'] });
      queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
    }
  });

  const isMealCompleted = (dayIndex, mealType) => {
    const date = format(addDays(selectedWeekStart, dayIndex), 'yyyy-MM-dd');
    const log = calorieLogs?.find(l => l.date === date);
    return log?.meals_logged?.find(m => m.meal_type === mealType)?.completed || false;
  };

  const getTodayLog = () => {
    const date = format(addDays(selectedWeekStart, selectedDay), 'yyyy-MM-dd');
    return calorieLogs?.find(l => l.date === date);
  };

  const getTodayMacros = () => {
    const date = format(addDays(selectedWeekStart, selectedDay), 'yyyy-MM-dd');
    const todayFoodLogs = foodLogs?.filter(f => f.date === date) || [];
    
    return todayFoodLogs.reduce((acc, food) => ({
      protein: acc.protein + (food.protein_g || 0),
      carbs: acc.carbs + (food.carbs_g || 0),
      fat: acc.fat + (food.fat_g || 0)
    }), { protein: 0, carbs: 0, fat: 0 });
  };

  const handleWeeklyCheckin = async (data) => {
    setIsGenerating(true);
    try {
      const weight = parseFloat(data.weight_kg);
      const height = parseFloat(data.height_cm);
      const age = parseInt(data.age);
      
      let bmr;
      if (data.gender === 'male') {
        bmr = 10 * weight + 6.25 * height - 5 * age + 5;
      } else {
        bmr = 10 * weight + 6.25 * height - 5 * age - 161;
      }
      
      const multipliers = {
        sedentary: 1.2,
        light: 1.375,
        moderate: 1.55,
        active: 1.725,
        very_active: 1.725
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

      const profileData = {
        weight_kg: weight,
        height_cm: height,
        age: age,
        gender: data.gender || profile?.gender || 'male',
        activity_level: data.activity_level,
        health_goal: data.health_goal,
        daily_calorie_target: targetCalories,
        last_checkin_date: new Date().toISOString().split('T')[0]
      };

      if (profile?.id) {
        await base44.entities.UserProfile.update(profile.id, profileData);
      } else {
        await base44.entities.UserProfile.create(profileData);
      }

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
    try {
      const { data } = await base44.functions.invoke('generateAIMealPlan', {
        calorie_target: calorieTarget
      });

      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const daysWithDates = data.days.map((day, i) => ({
        ...day,
        date: format(addDays(weekStart, i), 'yyyy-MM-dd')
      }));

      const weekStartStr = format(weekStart, 'yyyy-MM-dd');
      const oldPlans = await base44.entities.MealPlan.filter({ 
        week_start_date: weekStartStr,
        created_by: user.email 
      });
      
      for (const plan of oldPlans) {
        await base44.entities.MealPlan.delete(plan.id);
      }

      await base44.entities.MealPlan.create({
        week_start_date: weekStartStr,
        daily_calorie_target: calorieTarget,
        days: daysWithDates,
        is_active: true
      });
    } catch (error) {
      console.error('Error generating meal plan:', error);
    }
  };

  const handleGenerateNewPlan = async () => {
    setIsGenerating(true);
    await generateMealPlan(profile?.daily_calorie_target || 2000);
    queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    setIsGenerating(false);
  };

  const handleManualMealChange = async (newRecipe) => {
    if (!currentPlan || !showManualSelector) return;
    
    try {
      const { mealType, dayIndex } = showManualSelector;
      const updatedDays = [...currentPlan.days];
      updatedDays[dayIndex][`${mealType}_recipe_id`] = newRecipe.id;

      let totalCalories = 0;
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(meal => {
        const recipeId = updatedDays[dayIndex][`${meal}_recipe_id`];
        if (recipeId) {
          const recipe = recipes?.find(r => r.id === recipeId);
          if (recipe) totalCalories += recipe.calories || 0;
        }
      });
      
      updatedDays[dayIndex].total_calories = totalCalories;

      await base44.entities.MealPlan.update(currentPlan.id, { days: updatedDays });

      setShowManualSelector(null);
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
    } catch (error) {
      console.error('Failed to update meal:', error);
    }
  };

  const todayMeals = currentPlan?.days?.[selectedDay];
  const todayLog = getTodayLog();
  const todayConsumed = todayLog?.calories_consumed || 0;
  const todayMacros = getTodayMacros();

  return (
    <AuthGuard requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 pb-20 md:pb-8">
        {showCheckin && (
          <WeeklyCheckin 
            currentProfile={profile}
            onComplete={handleWeeklyCheckin}
            isLoading={isGenerating}
            onCancel={() => setShowCheckin(false)}
          />
        )}

        <FoodLogModal
          isOpen={showFoodLog}
          onClose={() => setShowFoodLog(false)}
          onFoodLogged={() => {
            queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
            queryClient.invalidateQueries({ queryKey: ['calorieLogs'] });
          }}
          selectedDate={format(addDays(selectedWeekStart, selectedDay), 'yyyy-MM-dd')}
        />

        <RecipeModal
          recipe={selectedRecipe}
          isOpen={!!selectedRecipe}
          onClose={() => setSelectedRecipe(null)}
          isFavorite={selectedRecipe ? isFavorite(selectedRecipe.id) : false}
          onToggleFavorite={() => {
            if (selectedRecipe) toggleFavorite.mutate(selectedRecipe.id);
          }}
        />

        {showManualSelector && (
          <ManualMealSelector
            isOpen={!!showManualSelector}
            mealType={showManualSelector.mealType}
            onSelectRecipe={handleManualMealChange}
            onClose={() => setShowManualSelector(null)}
          />
        )}

        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
              <p className="text-slate-500">Your personalized meal plan</p>
            </div>
            <AppNavigation currentPage="Dashboard" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white rounded-2xl shadow-sm border-0 p-4">
                <div className="flex items-center justify-between mb-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWeekStart(prev => addWeeks(prev, -1))}
                  >
                    <ChevronLeft className="w-4 h-4 mr-1" />
                    Previous
                  </Button>
                  <div className="text-center">
                    <p className="text-sm font-medium text-slate-900">
                      {format(selectedWeekStart, 'MMM d')} - {format(addDays(selectedWeekStart, 6), 'MMM d, yyyy')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedWeekStart(prev => addWeeks(prev, 1))}
                  >
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                {currentPlan && (
                  <DaySelector
                    weekStartDate={format(selectedWeekStart, 'yyyy-MM-dd')}
                    selectedDay={selectedDay}
                    onSelectDay={setSelectedDay}
                  />
                )}
              </Card>

              {currentPlan && todayMeals ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-900">
                      {todayMeals.day_name}'s Meals
                    </h2>
                    <Button
                      size="sm"
                      onClick={handleGenerateNewPlan}
                      disabled={isGenerating}
                      variant="outline"
                    >
                      {isGenerating ? (
                        <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="w-4 h-4 mr-1" />
                      )}
                      New Plan
                    </Button>
                  </div>
                  
                  <div className="grid sm:grid-cols-2 gap-4">
                    {['breakfast', 'lunch', 'dinner', 'snack'].map((mealType) => {
                      const recipeId = todayMeals[`${mealType}_recipe_id`];
                      if (!recipeId) return null;
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
                            if (recipe) {
                              const date = addDays(selectedWeekStart, selectedDay);
                              logMeal.mutate({ recipe, date, mealType });
                            }
                          }}
                          onViewRecipe={() => recipe && setSelectedRecipe(recipe)}
                          onChangeMeal={() => setShowManualSelector({ mealType, dayIndex: selectedDay })}
                        />
                      );
                    })}
                  </div>
                </div>
              ) : (
                <Card className="bg-white rounded-2xl shadow-sm p-12 text-center">
                  <h3 className="text-xl font-semibold text-slate-900 mb-4">No Meal Plan Yet</h3>
                  <Button
                    onClick={handleGenerateNewPlan}
                    disabled={isGenerating}
                    className="bg-emerald-600 hover:bg-emerald-700"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <RefreshCw className="w-4 h-4 mr-2" />
                    )}
                    Generate Meal Plan
                  </Button>
                </Card>
              )}
            </div>

            <div className="space-y-4">
              <CalorieProgress
                dailyTarget={profile?.daily_calorie_target || 2000}
                consumed={todayConsumed}
                macros={todayMacros}
              />

              <Card className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl shadow-lg text-white">
                <CardContent className="p-5">
                  <h3 className="font-semibold mb-2">Log Food Manually</h3>
                  <p className="text-violet-100 text-xs mb-3">
                    Track meals outside your plan
                  </p>
                  <Button
                    onClick={() => setShowFoodLog(true)}
                    className="w-full bg-white text-violet-700 hover:bg-violet-50"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Log Food
                  </Button>
                </CardContent>
              </Card>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCheckin(true)}
                className="w-full"
              >
                Update Profile
              </Button>
            </div>
          </div>
        </div>

        <MobileNav currentPage="Dashboard" />
      </div>
    </AuthGuard>
  );
}