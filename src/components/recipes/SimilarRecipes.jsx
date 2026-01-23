import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Flame, Star } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SimilarRecipes({ recipe, onSelectRecipe }) {
  const { data: allRecipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list()
  });

  const { data: ratings } = useQuery({
    queryKey: ['recipeRatings'],
    queryFn: () => base44.entities.RecipeRating.list()
  });

  const getAverageRating = (recipeId) => {
    const recipeRatings = ratings?.filter(r => r.recipe_id === recipeId) || [];
    if (recipeRatings.length === 0) return null;
    const sum = recipeRatings.reduce((acc, r) => acc + r.rating, 0);
    return (sum / recipeRatings.length).toFixed(1);
  };

  const similarRecipes = React.useMemo(() => {
    if (!allRecipes || !recipe) return [];

    // Find recipes with similar cuisine or shared ingredients
    const similar = allRecipes
      .filter(r => r.id !== recipe.id)
      .map(r => {
        let score = 0;
        
        // Same cuisine type
        if (r.cuisine_type === recipe.cuisine_type) score += 3;
        
        // Same meal type
        if (r.meal_type === recipe.meal_type) score += 2;
        
        // Shared ingredients (simple string matching)
        const recipeIngredients = recipe.ingredients?.map(i => i.toLowerCase()) || [];
        const otherIngredients = r.ingredients?.map(i => i.toLowerCase()) || [];
        const sharedCount = recipeIngredients.filter(ing => 
          otherIngredients.some(other => other.includes(ing.split(' ')[0]))
        ).length;
        score += sharedCount;
        
        // Shared dietary tags
        const sharedTags = recipe.dietary_tags?.filter(tag => 
          r.dietary_tags?.includes(tag)
        ).length || 0;
        score += sharedTags;

        return { recipe: r, score };
      })
      .filter(item => item.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map(item => item.recipe);

    return similar;
  }, [allRecipes, recipe]);

  if (!similarRecipes.length) return null;

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Similar Recipes</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {similarRecipes.map((similar) => {
          const avgRating = getAverageRating(similar.id);
          const totalTime = (similar.prep_time_mins || 0) + (similar.cook_time_mins || 0);

          return (
            <motion.div
              key={similar.id}
              whileHover={{ y: -4 }}
              onClick={() => onSelectRecipe(similar)}
              className="cursor-pointer"
            >
              <Card className="bg-white rounded-xl shadow-sm border-0 overflow-hidden hover:shadow-lg transition-all">
                {similar.image_url && (
                  <div className="relative h-24 overflow-hidden">
                    <img
                      src={similar.image_url}
                      alt={similar.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                  </div>
                )}
                <CardContent className="p-3">
                  <h4 className="font-semibold text-sm text-slate-900 mb-2 line-clamp-2">
                    {similar.name}
                  </h4>
                  
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-2">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" />
                      {similar.calories}
                    </span>
                    {totalTime > 0 && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {totalTime}m
                      </span>
                    )}
                  </div>

                  {avgRating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span className="text-sm font-semibold text-slate-900">{avgRating}</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}