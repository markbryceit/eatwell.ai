import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createPageUrl } from '@/utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Star, Loader2, Plus, Sparkles, X, Flame } from "lucide-react";
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeModal from '@/components/recipes/RecipeModal';
import RecipeEditModal from '@/components/recipes/RecipeEditModal';
import AdvancedFilters from '@/components/recipes/AdvancedFilters';
import AddToMealPlanModal from '@/components/recipes/AddToMealPlanModal';
import AIRecipeGenerator from '@/components/recipes/AIRecipeGenerator';
import GeneratedRecipePreview from '@/components/recipes/GeneratedRecipePreview';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { format, startOfWeek, addDays } from 'date-fns';

export default function Recipes() {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState({
    includeIngredients: [],
    excludeIngredients: [],
    dietaryTags: [],
    cuisineTypes: [],
    maxPrepTime: 180,
    calorieRange: [0, 2000]
  });
  const [smartSearchQuery, setSmartSearchQuery] = useState('');
  const [isSmartSearching, setIsSmartSearching] = useState(false);
  const [smartSearchResults, setSmartSearchResults] = useState(null);
  const [aiRecommendations, setAiRecommendations] = useState([]);
  const [showAISection, setShowAISection] = useState(true);
  const [recipeToAdd, setRecipeToAdd] = useState(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [generatedRecipe, setGeneratedRecipe] = useState(null);
  const [showGeneratedPreview, setShowGeneratedPreview] = useState(false);

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

  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list(),
    staleTime: 15 * 60 * 1000
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FavoriteRecipe.filter({ created_by: currentUser.email });
    },
    staleTime: 5 * 60 * 1000
  });

  const { data: mealPlans } = useQuery({
    queryKey: ['mealPlans'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.MealPlan.filter({ is_active: true, created_by: currentUser.email });
    },
    staleTime: 5 * 60 * 1000
  });

  const currentPlan = mealPlans?.[0];
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

  useEffect(() => {
    if (!user || !recipes || recipes.length === 0) return;

    const timer = setTimeout(() => {
      const loadAIRecommendations = async () => {
        try {
          const { data } = await base44.functions.invoke('getAIRecommendations', {});
          const recommendedRecipes = recipes.filter(r => 
            data.recommendations?.includes(r.id)
          ).slice(0, 6);
          setAiRecommendations(recommendedRecipes);
        } catch (error) {
          console.error('Failed to load AI recommendations:', error);
        }
      };

      loadAIRecommendations();
    }, 1000);

    return () => clearTimeout(timer);
  }, [user, recipes]);

  const handleSaveRecipe = async (recipeData) => {
    setIsSaving(true);
    try {
      if (editingRecipe) {
        await base44.entities.Recipe.update(editingRecipe.id, recipeData);
        toast.success('Recipe updated successfully');
      } else {
        await base44.entities.Recipe.create(recipeData);
        toast.success('Recipe created successfully');
      }
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      setEditingRecipe(null);
      setIsCreating(false);
    } catch (error) {
      toast.error(error.message || 'Failed to save recipe');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteRecipe = async (recipeId) => {
    if (!confirm('Are you sure you want to delete this recipe? This action cannot be undone.')) {
      return;
    }
    
    try {
      await base44.entities.Recipe.delete(recipeId);
      toast.success('Recipe deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
      setSelectedRecipe(null);
    } catch (error) {
      toast.error(error.message || 'Failed to delete recipe');
    }
  };

  const handleSmartSearch = async () => {
    if (!smartSearchQuery.trim()) {
      setSmartSearchResults(null);
      return;
    }

    setIsSmartSearching(true);
    try {
      const { data } = await base44.functions.invoke('smartRecipeSearch', {
        query: smartSearchQuery
      });
      setSmartSearchResults(data);
      toast.success(`Found ${data.totalResults} recipes`);
    } catch (error) {
      toast.error('Smart search failed');
      console.error(error);
    }
    setIsSmartSearching(false);
  };

  const filteredRecipes = (smartSearchResults?.recipes || recipes)?.filter(recipe => {
    if (smartSearchResults) return true;

    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMealType = selectedMealType === 'all' || recipe.meal_type === selectedMealType;
    const matchesFavorite = !showFavoritesOnly || isFavorite(recipe.id);
    
    const recipeIngredients = recipe.ingredients?.map(i => i.toLowerCase()).join(' ') || '';
    const matchesIncludeIngredients = advancedFilters.includeIngredients.length === 0 ||
      advancedFilters.includeIngredients.every(ing => recipeIngredients.includes(ing));
    const matchesExcludeIngredients = advancedFilters.excludeIngredients.length === 0 ||
      !advancedFilters.excludeIngredients.some(ing => recipeIngredients.includes(ing));
    
    const matchesDietaryTags = advancedFilters.dietaryTags.length === 0 ||
      advancedFilters.dietaryTags.some(tag => recipe.dietary_tags?.includes(tag));
    
    const matchesCuisineTypes = advancedFilters.cuisineTypes.length === 0 ||
      advancedFilters.cuisineTypes.includes(recipe.cuisine_type);
    
    const totalTime = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0);
    const matchesPrepTime = advancedFilters.maxPrepTime >= 180 || totalTime <= advancedFilters.maxPrepTime;
    
    const matchesCalories = recipe.calories >= advancedFilters.calorieRange[0] && 
      recipe.calories <= advancedFilters.calorieRange[1];
    
    return matchesSearch && matchesMealType && matchesFavorite && 
           matchesIncludeIngredients && matchesExcludeIngredients &&
           matchesDietaryTags && matchesCuisineTypes && matchesPrepTime && matchesCalories;
  }) || [];

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      includeIngredients: [],
      excludeIngredients: [],
      dietaryTags: [],
      cuisineTypes: [],
      maxPrepTime: 180,
      calorieRange: [0, 2000]
    });
    setSmartSearchResults(null);
    setSmartSearchQuery('');
  };

  const clearSmartSearch = () => {
    setSmartSearchResults(null);
    setSmartSearchQuery('');
  };

  const handleRecipeGenerated = (recipe) => {
    setGeneratedRecipe(recipe);
    setShowAIGenerator(false);
    setShowGeneratedPreview(true);
  };

  const handleSaveGeneratedRecipe = async () => {
    setIsSaving(true);
    try {
      await base44.entities.Recipe.create(generatedRecipe);
      toast.success('Recipe saved to library!');
      queryClient.invalidateQueries({ queryKey: ['recipes'] });
      setShowGeneratedPreview(false);
      setGeneratedRecipe(null);
    } catch (error) {
      toast.error('Failed to save recipe');
    }
    setIsSaving(false);
  };

  const dietaryTags = [...new Set(recipes?.flatMap(r => r.dietary_tags || []))];
  const cuisineTypes = [...new Set(recipes?.map(r => r.cuisine_type).filter(Boolean))];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        isFavorite={selectedRecipe ? isFavorite(selectedRecipe.id) : false}
        onToggleFavorite={() => {
          if (selectedRecipe) toggleFavorite.mutate(selectedRecipe.id);
        }}
        onEdit={user?.role === 'admin' ? () => {
          setEditingRecipe(selectedRecipe);
          setSelectedRecipe(null);
        } : null}
        onDelete={user?.role === 'admin' ? () => handleDeleteRecipe(selectedRecipe.id) : null}
        onGenerateVariation={async () => {
          try {
            setSelectedRecipe(null);
            toast.info('Generating recipe variation...');
            const { data } = await base44.functions.invoke('generateRecipeWithAI', {
              variation_of_recipe: selectedRecipe
            });
            handleRecipeGenerated(data.recipe);
          } catch (error) {
            toast.error('Failed to generate variation');
          }
        }}
      />

      <RecipeEditModal
        recipe={editingRecipe}
        isOpen={!!editingRecipe || isCreating}
        onClose={() => {
          setEditingRecipe(null);
          setIsCreating(false);
        }}
        onSave={handleSaveRecipe}
        isSaving={isSaving}
      />

      <AIRecipeGenerator
        isOpen={showAIGenerator}
        onClose={() => setShowAIGenerator(false)}
        onRecipeGenerated={handleRecipeGenerated}
      />

      <GeneratedRecipePreview
        recipe={generatedRecipe}
        isOpen={showGeneratedPreview}
        onClose={() => {
          setShowGeneratedPreview(false);
          setGeneratedRecipe(null);
        }}
        onSave={handleSaveGeneratedRecipe}
        onRegenerate={() => {
          setShowGeneratedPreview(false);
          setShowAIGenerator(true);
        }}
        isSaving={isSaving}
      />

      <AddToMealPlanModal
        recipe={recipeToAdd}
        isOpen={!!recipeToAdd}
        onClose={() => setRecipeToAdd(null)}
        onAddToMealPlan={(dayIndex, mealType) => {
          if (!currentPlan || !recipeToAdd) return;

          const updatedDays = [...currentPlan.days];
          updatedDays[dayIndex] = {
            ...updatedDays[dayIndex],
            [`${mealType}_recipe_id`]: recipeToAdd.id
          };

          const getRecipe = (id) => recipes?.find(r => r.id === id);
          const breakfast = getRecipe(updatedDays[dayIndex].breakfast_recipe_id);
          const lunch = getRecipe(updatedDays[dayIndex].lunch_recipe_id);
          const dinner = getRecipe(updatedDays[dayIndex].dinner_recipe_id);
          const snack = getRecipe(updatedDays[dayIndex].snack_recipe_id);
          
          updatedDays[dayIndex].total_calories = 
            (breakfast?.calories || 0) +
            (lunch?.calories || 0) +
            (dinner?.calories || 0) +
            (snack?.calories || 0);

          base44.entities.MealPlan.update(currentPlan.id, {
            days: updatedDays
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ['mealPlans'] });
            toast.success('Recipe added to meal plan');
            setRecipeToAdd(null);
          }).catch(() => {
            toast.error('Failed to add recipe to meal plan');
          });
        }}
        currentPlan={currentPlan}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 overflow-x-hidden">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8 w-full">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.location.href = createPageUrl('Dashboard')}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Recipe Library</h1>
              <p className="text-slate-500">
                {recipes?.length || 0} recipes available
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap w-full sm:w-auto">
            <Button
              onClick={() => setShowAIGenerator(true)}
              className="bg-violet-600 hover:bg-violet-700 rounded-xl"
            >
              <Sparkles className="w-5 h-5 mr-2" />
              AI Generate
            </Button>
            {user?.role === 'admin' && (
              <Button
                onClick={() => setIsCreating(true)}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                <Plus className="w-5 h-5 mr-2" />
                Create Manual
              </Button>
            )}
          </div>
        </div>

        {/* Smart Search */}
        <div className="bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl shadow-lg p-6 mb-6 text-white">
          <div className="flex items-center gap-3 mb-3">
            <Sparkles className="w-6 h-6" />
            <div>
              <h3 className="font-semibold text-lg">Smart Recipe Search</h3>
              <p className="text-violet-100 text-sm">Try: "quick vegan dinner under 400 calories" or "high protein breakfast with eggs"</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Describe what you're looking for in natural language..."
              value={smartSearchQuery}
              onChange={(e) => setSmartSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
              className="h-12 rounded-xl bg-white/20 border-white/30 text-white placeholder:text-violet-200"
            />
            <Button
              onClick={handleSmartSearch}
              disabled={isSmartSearching || !smartSearchQuery.trim()}
              className="h-12 px-6 bg-white text-violet-600 hover:bg-violet-50 rounded-xl"
            >
              {isSmartSearching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Search
                </>
              )}
            </Button>
            {smartSearchResults && (
              <Button
                variant="outline"
                onClick={clearSmartSearch}
                className="h-12 rounded-xl border-white/30 text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </Button>
            )}
          </div>
          {smartSearchResults && (
            <div className="mt-3 text-violet-100 text-sm">
              Found {smartSearchResults.totalResults} recipes matching your search
            </div>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search recipes by name or description..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (smartSearchResults) clearSmartSearch();
                }}
                className="pl-12 h-12 rounded-xl border-slate-200"
              />
            </div>
            <Button
              variant={showFavoritesOnly ? "default" : "outline"}
              onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
              className={`h-12 rounded-xl ${showFavoritesOnly ? 'bg-amber-500 hover:bg-amber-600' : ''}`}
            >
              <Star className={`w-5 h-5 mr-2 ${showFavoritesOnly ? 'fill-white' : ''}`} />
              Favorites
            </Button>
            <AdvancedFilters
              filters={advancedFilters}
              onFiltersChange={(newFilters) => {
                setAdvancedFilters(newFilters);
                if (smartSearchResults) clearSmartSearch();
              }}
              availableDietaryTags={dietaryTags}
              availableCuisines={cuisineTypes}
              onReset={resetAdvancedFilters}
            />
          </div>

          <Tabs value={selectedMealType} onValueChange={setSelectedMealType}>
            <TabsList className="bg-slate-100 p-1 rounded-xl">
              <TabsTrigger value="all" className="rounded-lg">All</TabsTrigger>
              <TabsTrigger value="breakfast" className="rounded-lg">Breakfast</TabsTrigger>
              <TabsTrigger value="lunch" className="rounded-lg">Lunch</TabsTrigger>
              <TabsTrigger value="dinner" className="rounded-lg">Dinner</TabsTrigger>
              <TabsTrigger value="snack" className="rounded-lg">Snacks</TabsTrigger>
            </TabsList>
          </Tabs>

        </div>

        {/* AI Recommendations */}
        {aiRecommendations.length > 0 && showAISection && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Card className="bg-gradient-to-r from-violet-500 to-purple-600 text-white rounded-2xl overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <Sparkles className="w-6 h-6" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">AI Recommendations</h2>
                      <p className="text-violet-100 text-sm">Based on your preferences and behavior</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAISection(false)}
                    className="text-white hover:bg-white/10"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {aiRecommendations.map((recipe) => (
                    <motion.div
                      key={recipe.id}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white/10 backdrop-blur-sm rounded-xl p-4 cursor-pointer hover:bg-white/20 transition-all"
                      onClick={() => setSelectedRecipe(recipe)}
                    >
                      <h3 className="font-semibold mb-2">{recipe.name}</h3>
                      <div className="flex items-center gap-2 text-sm">
                        <Badge className="bg-white/20 text-white border-0">
                          {recipe.meal_type}
                        </Badge>
                        <span className="flex items-center gap-1">
                          <Flame className="w-3 h-3" />
                          {recipe.calories} kcal
                        </span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Recipe Grid */}
        {recipesLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
          </div>
        ) : filteredRecipes.length > 0 ? (
          <motion.div 
            layout
            className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            <AnimatePresence>
              {filteredRecipes.map((recipe, index) => (
                <motion.div
                  key={recipe.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <RecipeCard
                    recipe={recipe}
                    isFavorite={isFavorite(recipe.id)}
                    onToggleFavorite={() => toggleFavorite.mutate(recipe.id)}
                    onClick={() => setSelectedRecipe(recipe)}
                    onEdit={user?.role === 'admin' ? (e) => {
                      e.stopPropagation();
                      setEditingRecipe(recipe);
                    } : null}
                    onAddToMealPlan={() => setRecipeToAdd(recipe)}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Recipes Found</h3>
            <p className="text-slate-500 mb-4">
              {showFavoritesOnly 
                ? "You haven't favorited any recipes yet"
                : "Try adjusting your search or filters"
              }
            </p>
            {(advancedFilters.includeIngredients.length > 0 || 
              advancedFilters.excludeIngredients.length > 0 ||
              advancedFilters.dietaryTags.length > 0 ||
              advancedFilters.maxPrepTime < 180 ||
              advancedFilters.calorieRange[0] > 0 ||
              advancedFilters.calorieRange[1] < 2000) && (
              <Button variant="outline" onClick={resetAdvancedFilters}>
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}