import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Clock, Flame, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function ManualMealSelector({ isOpen, onClose, mealType, onSelectRecipe }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: recipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list(),
    enabled: isOpen
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FavoriteRecipe.filter({ created_by: currentUser.email });
    },
    enabled: isOpen
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserProfile.filter({ created_by: currentUser.email }).then(p => p[0]);
    },
    enabled: isOpen
  });

  if (!isOpen) return null;

  const favoriteRecipeIds = favorites?.map(f => f.recipe_id) || [];
  const dislikedRecipeIds = profile?.disliked_recipes || [];

  const filteredRecipes = recipes?.filter(recipe => {
    // Filter by meal type
    if (recipe.meal_type !== mealType) return false;
    
    // Filter out disliked recipes
    if (dislikedRecipeIds.includes(recipe.id)) return false;
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        recipe.name.toLowerCase().includes(query) ||
        recipe.description?.toLowerCase().includes(query) ||
        recipe.dietary_tags?.some(tag => tag.toLowerCase().includes(query))
      );
    }
    
    return true;
  }) || [];

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden flex flex-col"
        >
          {/* Header */}
          <div className="p-6 border-b border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900 capitalize">
                Choose {mealType}
              </h2>
              <button
                onClick={onClose}
                className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 rounded-xl"
              />
            </div>
          </div>

          {/* Recipe List */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid md:grid-cols-2 gap-4">
              {filteredRecipes.map((recipe) => {
                const isFavorite = favoriteRecipeIds.includes(recipe.id);
                const totalTime = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0);

                return (
                  <motion.div
                    key={recipe.id}
                    whileHover={{ y: -2 }}
                    className="bg-white border-2 border-slate-200 rounded-2xl p-4 cursor-pointer hover:border-emerald-500 transition-all"
                    onClick={() => {
                      onSelectRecipe(recipe);
                      onClose();
                    }}
                  >
                    <div className="flex gap-4">
                      {recipe.image_url && (
                        <img
                          src={recipe.image_url}
                          alt={recipe.name}
                          className="w-24 h-24 rounded-xl object-cover"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <h3 className="font-semibold text-slate-900 truncate">
                            {recipe.name}
                          </h3>
                          {isFavorite && (
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400 flex-shrink-0" />
                          )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                          <div className="flex items-center gap-1 text-sm text-slate-600">
                            <Flame className="w-4 h-4 text-orange-500" />
                            <span className="font-medium">{recipe.calories}</span>
                          </div>
                          {totalTime > 0 && (
                            <div className="flex items-center gap-1 text-sm text-slate-600">
                              <Clock className="w-4 h-4 text-blue-500" />
                              <span>{totalTime}m</span>
                            </div>
                          )}
                        </div>

                        {recipe.dietary_tags && recipe.dietary_tags.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {recipe.dietary_tags.slice(0, 3).map((tag) => (
                              <Badge
                                key={tag}
                                variant="secondary"
                                className="text-xs"
                              >
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {filteredRecipes.length === 0 && (
              <div className="text-center py-12">
                <p className="text-slate-500">No recipes found</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}