import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Sparkles, Loader2, Heart, TrendingUp, Clock, Flame, Star } from 'lucide-react';
import { motion } from 'framer-motion';
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeModal from '@/components/recipes/RecipeModal';
import { toast } from 'sonner';

export default function Discover() {
  const queryClient = useQueryClient();
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [isLoadingRecommendations, setIsLoadingRecommendations] = useState(false);

  // Fetch user profile
  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserProfile.filter({ created_by: currentUser.email });
    }
  });

  const profile = profiles?.[0];

  // Fetch all recipes (shared resource)
  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list()
  });

  // Fetch favorites
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FavoriteRecipe.filter({ created_by: currentUser.email });
    }
  });

  // Fetch ratings
  const { data: ratings } = useQuery({
    queryKey: ['ratings'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.RecipeRating.filter({ created_by: currentUser.email });
    }
  });

  // Fetch meal plans
  const { data: mealPlans } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.MealPlan.filter({ created_by: currentUser.email });
    }
  });

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

  // Load AI recommendations - defer to avoid blocking initial render
  useEffect(() => {
    if (!profile || !recipes || recipes.length === 0) return;

    const timer = setTimeout(() => {
      const loadAIRecommendations = async () => {
        setIsLoadingRecommendations(true);
        try {
          const { data } = await base44.functions.invoke('getAIRecommendations', {});
          const recommendedRecipes = recipes.filter(r => 
            data.recommendations?.includes(r.id)
          );
          setAiRecommendations(recommendedRecipes);
        } catch (error) {
          console.error('Failed to load AI recommendations:', error);
        }
        setIsLoadingRecommendations(false);
      };

      loadAIRecommendations();
    }, 500);

    return () => clearTimeout(timer);
  }, [profile, recipes]);

  // Get personalized recommendations
  const getPersonalizedRecommendations = () => {
    if (!recipes || !profile) return [];

    const favoriteIds = favorites?.map(f => f.recipe_id) || [];
    const favoriteRecipes = recipes.filter(r => favoriteIds.includes(r.id));
    
    // Get recipes from meal plans
    const mealPlanRecipeIds = new Set();
    mealPlans?.forEach(plan => {
      plan.days?.forEach(day => {
        ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
          const recipeId = day[`${mealType}_recipe_id`];
          if (recipeId) mealPlanRecipeIds.add(recipeId);
        });
      });
    });

    // Get highly rated recipes
    const highRatedIds = ratings?.filter(r => r.rating >= 4).map(r => r.recipe_id) || [];

    // Score recipes based on multiple factors
    const scored = recipes.map(recipe => {
      let score = 0;

      // Match dietary preferences
      const matchesDiet = profile.dietary_preferences?.some(pref => 
        recipe.dietary_tags?.some(tag => tag.toLowerCase().includes(pref.toLowerCase()))
      );
      if (matchesDiet) score += 3;

      // Similar to favorites (same meal type or tags)
      const similarToFavorites = favoriteRecipes.some(fav => 
        fav.meal_type === recipe.meal_type ||
        fav.dietary_tags?.some(tag => recipe.dietary_tags?.includes(tag))
      );
      if (similarToFavorites && !favoriteIds.includes(recipe.id)) score += 2;

      // Used in meal plans
      if (mealPlanRecipeIds.has(recipe.id)) score += 1;

      // Highly rated
      if (highRatedIds.includes(recipe.id)) score += 2;

      // Exclude disliked ingredients
      const hasDislikedIngredient = profile.disliked_ingredients?.some(disliked =>
        recipe.ingredients?.some(ing => 
          ing.toLowerCase().includes(disliked.toLowerCase())
        )
      );
      if (hasDislikedIngredient) score -= 10;

      // Calorie match
      const caloriePerMeal = (profile.daily_calorie_target || 2000) / 4;
      const calorieDiff = Math.abs(recipe.calories - caloriePerMeal);
      if (calorieDiff < 150) score += 1;

      return { recipe, score };
    });

    // Filter out already favorited recipes and sort by score
    return scored
      .filter(s => !favoriteIds.includes(s.recipe.id) && s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map(s => s.recipe);
  };

  const getTrendingRecipes = () => {
    if (!recipes || !ratings) return [];

    const recipeRatings = recipes.map(recipe => {
      const recipeRatings = ratings.filter(r => r.recipe_id === recipe.id);
      const avgRating = recipeRatings.length > 0
        ? recipeRatings.reduce((sum, r) => sum + r.rating, 0) / recipeRatings.length
        : 0;
      return { recipe, avgRating, count: recipeRatings.length };
    });

    return recipeRatings
      .filter(r => r.count >= 1)
      .sort((a, b) => b.avgRating - a.avgRating || b.count - a.count)
      .slice(0, 6)
      .map(r => r.recipe);
  };

  const getQuickRecipes = () => {
    return recipes
      ?.filter(r => (r.prep_time_mins || 0) + (r.cook_time_mins || 0) <= 20)
      .sort((a, b) => {
        const aTime = (a.prep_time_mins || 0) + (a.cook_time_mins || 0);
        const bTime = (b.prep_time_mins || 0) + (b.cook_time_mins || 0);
        return aTime - bTime;
      })
      .slice(0, 6) || [];
  };

  const handleAiDiscover = async () => {
    if (!aiPrompt.trim()) {
      toast.error('Please enter what you\'re craving');
      return;
    }

    setIsGenerating(true);
    try {
      const { data } = await base44.functions.invoke('discoverRecipesWithAI', {
        prompt: aiPrompt,
        dietary_preferences: profile?.dietary_preferences || [],
        disliked_ingredients: profile?.disliked_ingredients || [],
        calorie_target: profile?.daily_calorie_target || 2000
      });

      if (data.suggestions) {
        setAiSuggestions(data.suggestions);
        toast.success(`Found ${data.suggestions.length} recipe ideas!`);
      }
    } catch (error) {
      toast.error('Failed to generate suggestions');
    }
    setIsGenerating(false);
  };

  const collections = [
    {
      title: 'AI Picks Just For You',
      icon: Sparkles,
      color: 'from-violet-500 to-purple-500',
      recipes: aiRecommendations,
      isAI: true
    },
    {
      title: 'For You',
      icon: Heart,
      color: 'from-rose-500 to-pink-500',
      recipes: getPersonalizedRecommendations()
    },
    {
      title: 'Top Rated',
      icon: Star,
      color: 'from-amber-500 to-orange-500',
      recipes: getTrendingRecipes()
    },
    {
      title: 'Quick & Easy',
      icon: Clock,
      color: 'from-emerald-500 to-teal-500',
      recipes: getQuickRecipes()
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/20">
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        isFavorite={selectedRecipe ? isFavorite(selectedRecipe.id) : false}
        onToggleFavorite={() => {
          if (selectedRecipe) toggleFavorite.mutate(selectedRecipe.id);
        }}
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
              <h1 className="text-3xl font-bold text-slate-900">Discover Recipes</h1>
              <p className="text-slate-500">Find your next favorite meal</p>
            </div>
          </div>
        </div>

        {/* AI Discovery */}
        <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-3xl mb-8 overflow-hidden">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">AI Recipe Discovery</h2>
                <p className="text-violet-100">Tell us what you're craving</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Input
                placeholder="e.g., Something with chicken and vegetables, healthy dinner..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleAiDiscover()}
                className="flex-1 h-14 bg-white/10 backdrop-blur-sm border-white/20 text-white placeholder:text-violet-200 rounded-xl"
              />
              <Button
                onClick={handleAiDiscover}
                disabled={isGenerating}
                className="h-14 px-8 bg-white text-violet-600 hover:bg-violet-50 rounded-xl"
              >
                {isGenerating ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Discover
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* AI Suggestions */}
        {aiSuggestions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-violet-500" />
              AI Suggestions
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {aiSuggestions.map((suggestion, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="bg-white rounded-2xl shadow-sm hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                      <h3 className="font-semibold text-slate-900 mb-2">{suggestion.recipe_name}</h3>
                      <p className="text-sm text-slate-600 mb-4">{suggestion.description}</p>
                      <div className="flex items-center gap-3 text-xs">
                        <Badge className="bg-violet-100 text-violet-700">
                          {suggestion.meal_type}
                        </Badge>
                        <span className="flex items-center gap-1 text-slate-500">
                          <Flame className="w-3 h-3 text-orange-400" />
                          ~{suggestion.estimated_calories} kcal
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Curated Collections */}
        {collections.map((collection, idx) => {
          const Icon = collection.icon;
          if (collection.recipes.length === 0 && !collection.isAI) return null;
          if (collection.isAI && isLoadingRecommendations) {
            return (
              <div key={idx} className="mb-12">
                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${collection.color} flex items-center justify-center`}>
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-slate-900">{collection.title}</h2>
                    <p className="text-slate-500">Loading personalized recommendations...</p>
                  </div>
                </div>
              </div>
            );
          }
          if (collection.isAI && collection.recipes.length === 0) return null;

          return (
            <div key={idx} className="mb-12">
              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${collection.color} flex items-center justify-center`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">{collection.title}</h2>
                  <p className="text-slate-500">
                    {collection.isAI ? 'Powered by AI based on your preferences' : `${collection.recipes.length} recipes`}
                  </p>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {collection.recipes.map((recipe) => (
                  <RecipeCard
                    key={recipe.id}
                    recipe={recipe}
                    isFavorite={isFavorite(recipe.id)}
                    onToggleFavorite={() => toggleFavorite.mutate(recipe.id)}
                    onClick={() => setSelectedRecipe(recipe)}
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}