import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Star, Filter, Loader2, Plus, Edit, Trash2 } from "lucide-react";
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeModal from '@/components/recipes/RecipeModal';
import RecipeEditModal from '@/components/recipes/RecipeEditModal';
import AdvancedFilters from '@/components/recipes/AdvancedFilters';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';

export default function Recipes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({
    includeIngredients: [],
    excludeIngredients: [],
    dietaryTags: [],
    maxPrepTime: 180,
    calorieRange: [0, 2000]
  });

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

  // Fetch all recipes
  const { data: recipes, isLoading: recipesLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list()
  });

  // Fetch favorites
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.FavoriteRecipe.list()
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

  const filteredRecipes = recipes?.filter(recipe => {
    // Basic filters
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMealType = selectedMealType === 'all' || recipe.meal_type === selectedMealType;
    const matchesFavorite = !showFavoritesOnly || isFavorite(recipe.id);
    
    // Advanced filters - ingredients
    const recipeIngredients = recipe.ingredients?.map(i => i.toLowerCase()).join(' ') || '';
    const matchesIncludeIngredients = advancedFilters.includeIngredients.length === 0 ||
      advancedFilters.includeIngredients.every(ing => recipeIngredients.includes(ing));
    const matchesExcludeIngredients = advancedFilters.excludeIngredients.length === 0 ||
      !advancedFilters.excludeIngredients.some(ing => recipeIngredients.includes(ing));
    
    // Advanced filters - dietary tags
    const matchesDietaryTags = advancedFilters.dietaryTags.length === 0 ||
      advancedFilters.dietaryTags.some(tag => recipe.dietary_tags?.includes(tag));
    
    // Advanced filters - prep time
    const totalTime = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0);
    const matchesPrepTime = advancedFilters.maxPrepTime >= 180 || totalTime <= advancedFilters.maxPrepTime;
    
    // Advanced filters - calorie range
    const matchesCalories = recipe.calories >= advancedFilters.calorieRange[0] && 
      recipe.calories <= advancedFilters.calorieRange[1];
    
    return matchesSearch && matchesMealType && matchesFavorite && 
           matchesIncludeIngredients && matchesExcludeIngredients &&
           matchesDietaryTags && matchesPrepTime && matchesCalories;
  }) || [];

  const resetAdvancedFilters = () => {
    setAdvancedFilters({
      includeIngredients: [],
      excludeIngredients: [],
      dietaryTags: [],
      maxPrepTime: 180,
      calorieRange: [0, 2000]
    });
  };

  const dietaryTags = [...new Set(recipes?.flatMap(r => r.dietary_tags || []))];

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

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Recipe Library</h1>
              <p className="text-slate-500">
                {recipes?.length || 0} recipes available
              </p>
            </div>
          </div>
          {user?.role === 'admin' && (
            <Button
              onClick={() => setIsCreating(true)}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Recipe
            </Button>
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
              onFiltersChange={setAdvancedFilters}
              availableDietaryTags={dietaryTags}
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