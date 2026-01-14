import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ArrowLeft, Loader2, ShoppingCart, Calendar, RefreshCw } from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';
import { toast } from 'sonner';
import DayPlanCard from '@/components/mealplanner/DayPlanCard';
import RecipeSelector from '@/components/mealplanner/RecipeSelector';
import ShoppingList from '@/components/mealplanner/ShoppingList';

export default function MealPlanner() {
  const queryClient = useQueryClient();
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [showRecipeSelector, setShowRecipeSelector] = useState(false);
  const [showShoppingList, setShowShoppingList] = useState(false);

  // Fetch user profile
  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserProfile.filter({ created_by: currentUser.email });
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const profile = profiles?.[0];

  // Fetch current meal plan
  const { data: mealPlans, isLoading: planLoading } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.MealPlan.filter({ is_active: true, created_by: currentUser.email });
    },
    staleTime: 5 * 60 * 1000,
    cacheTime: 15 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const currentPlan = mealPlans?.[0];

  // Fetch all recipes
  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list(),
    staleTime: 15 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const getRecipeById = (id) => recipes?.find(r => r.id === id);

  const updateMealPlan = useMutation({
    mutationFn: async (updatedDays) => {
      if (!currentPlan) {
        // Create new meal plan
        const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
        await base44.entities.MealPlan.create({
          week_start_date: format(weekStart, 'yyyy-MM-dd'),
          daily_calorie_target: profile?.daily_calorie_target || 2000,
          days: updatedDays,
          is_active: true
        });
      } else {
        await base44.entities.MealPlan.update(currentPlan.id, {
          days: updatedDays
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      toast.success('Meal plan updated');
    },
    onError: (error) => {
      toast.error('Failed to update meal plan');
    }
  });

  const handleSelectRecipe = async (recipe) => {
    if (!selectedDay || !selectedMealType) return;

    const days = currentPlan?.days || Array.from({ length: 7 }, (_, i) => {
      const date = addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), i);
      return {
        day_name: format(date, 'EEEE'),
        date: format(date, 'yyyy-MM-dd'),
        breakfast_recipe_id: null,
        lunch_recipe_id: null,
        dinner_recipe_id: null,
        snack_recipe_id: null,
        total_calories: 0
      };
    });

    const updatedDays = [...days];
    updatedDays[selectedDay] = {
      ...updatedDays[selectedDay],
      [`${selectedMealType}_recipe_id`]: recipe.id
    };

    // Recalculate total calories for the day
    const breakfast = getRecipeById(updatedDays[selectedDay].breakfast_recipe_id);
    const lunch = getRecipeById(updatedDays[selectedDay].lunch_recipe_id);
    const dinner = getRecipeById(updatedDays[selectedDay].dinner_recipe_id);
    const snack = getRecipeById(updatedDays[selectedDay].snack_recipe_id);

    updatedDays[selectedDay].total_calories = 
      (breakfast?.calories || 0) +
      (lunch?.calories || 0) +
      (dinner?.calories || 0) +
      (snack?.calories || 0);

    await updateMealPlan.mutateAsync(updatedDays);
    setShowRecipeSelector(false);
    setSelectedDay(null);
    setSelectedMealType(null);
  };

  const handleRemoveRecipe = async (dayIndex, mealType) => {
    if (!currentPlan) return;

    const updatedDays = [...currentPlan.days];
    updatedDays[dayIndex] = {
      ...updatedDays[dayIndex],
      [`${mealType}_recipe_id`]: null
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

    await updateMealPlan.mutateAsync(updatedDays);
  };

  const handleAddMeal = (dayIndex, mealType) => {
    setSelectedDay(dayIndex);
    setSelectedMealType(mealType);
    setShowRecipeSelector(true);
  };

  const initializeEmptyPlan = async () => {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
    const days = Array.from({ length: 7 }, (_, i) => {
      const date = addDays(weekStart, i);
      return {
        day_name: format(date, 'EEEE'),
        date: format(date, 'yyyy-MM-dd'),
        breakfast_recipe_id: null,
        lunch_recipe_id: null,
        dinner_recipe_id: null,
        snack_recipe_id: null,
        total_calories: 0
      };
    });

    await updateMealPlan.mutateAsync(days);
  };

  useEffect(() => {
    if (!planLoading && !currentPlan && profile) {
      initializeEmptyPlan();
    }
  }, [planLoading, currentPlan, profile]);

  if (planLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  const weekStart = currentPlan?.week_start_date 
    ? new Date(currentPlan.week_start_date)
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <RecipeSelector
        isOpen={showRecipeSelector}
        onClose={() => {
          setShowRecipeSelector(false);
          setSelectedDay(null);
          setSelectedMealType(null);
        }}
        onSelectRecipe={handleSelectRecipe}
        mealType={selectedMealType}
      />

      <ShoppingList
        isOpen={showShoppingList}
        onClose={() => setShowShoppingList(false)}
        mealPlan={currentPlan}
        recipes={recipes}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Meal Planner</h1>
              <p className="text-slate-500">
                {format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowShoppingList(true)}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            Shopping List
          </Button>
        </div>

        {/* Info Card */}
        {profile && (
          <Card className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white p-6 mb-6 rounded-2xl">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg mb-1">Your Daily Target</h3>
                <p className="text-emerald-100">
                  {profile.daily_calorie_target?.toLocaleString()} calories per day
                </p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold">{currentPlan?.days?.length || 0}/7</div>
                <div className="text-emerald-100 text-sm">Days Planned</div>
              </div>
            </div>
          </Card>
        )}

        {/* Weekly Plan */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {currentPlan?.days?.map((day, index) => (
            <DayPlanCard
              key={index}
              day={day}
              dayIndex={index}
              recipes={recipes}
              onAddMeal={(mealType) => handleAddMeal(index, mealType)}
              onRemoveMeal={(mealType) => handleRemoveRecipe(index, mealType)}
              targetCalories={profile?.daily_calorie_target || 2000}
            />
          ))}
        </div>
      </div>
    </div>
  );
}