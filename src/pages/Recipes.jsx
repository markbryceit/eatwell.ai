import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Search, ArrowLeft, Star, Filter, Loader2 } from "lucide-react";
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeModal from '@/components/recipes/RecipeModal';
import { motion, AnimatePresence } from 'framer-motion';

export default function Recipes() {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('all');
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState(null);

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

  const filteredRecipes = recipes?.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMealType = selectedMealType === 'all' || recipe.meal_type === selectedMealType;
    const matchesFavorite = !showFavoritesOnly || isFavorite(recipe.id);
    
    return matchesSearch && matchesMealType && matchesFavorite;
  }) || [];

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
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
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

        {/* Search and Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-6 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search recipes..."
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

          {/* Dietary Tags */}
          {dietaryTags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {dietaryTags.slice(0, 8).map(tag => (
                <Badge 
                  key={tag} 
                  variant="outline" 
                  className="rounded-full cursor-pointer hover:bg-slate-100"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
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
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">🍽️</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No Recipes Found</h3>
            <p className="text-slate-500">
              {showFavoritesOnly 
                ? "You haven't favorited any recipes yet"
                : "Try adjusting your search or filters"
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
}