import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { X, Search, Loader2, Flame, Clock } from 'lucide-react';

export default function RecipeSelector({ isOpen, onClose, onSelectRecipe, mealType }) {
  const [searchQuery, setSearchQuery] = useState('');

  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list()
  });

  const filteredRecipes = recipes?.filter(recipe => {
    const matchesSearch = recipe.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMealType = !mealType || recipe.meal_type === mealType;
    return matchesSearch && matchesMealType;
  }) || [];

  const mealTypeColors = {
    breakfast: "bg-amber-100 text-amber-700",
    lunch: "bg-emerald-100 text-emerald-700",
    dinner: "bg-violet-100 text-violet-700",
    snack: "bg-rose-100 text-rose-700"
  };

  if (!isOpen) return null;

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
          className="bg-white rounded-3xl w-full max-w-4xl max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Select a Recipe</h2>
              {mealType && (
                <p className="text-slate-500 mt-1">
                  Choose a recipe for {mealType}
                </p>
              )}
            </div>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-slate-200">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <Input
                placeholder="Search recipes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 h-12 rounded-xl"
              />
            </div>
          </div>

          {/* Recipe List */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-220px)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
              </div>
            ) : filteredRecipes.length > 0 ? (
              <div className="grid sm:grid-cols-2 gap-4">
                {filteredRecipes.map((recipe) => (
                  <motion.div
                    key={recipe.id}
                    whileHover={{ scale: 1.02 }}
                    className="bg-slate-50 rounded-2xl p-4 cursor-pointer hover:bg-slate-100 transition-colors"
                    onClick={() => onSelectRecipe(recipe)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-semibold text-slate-900 flex-1">
                        {recipe.name}
                      </h3>
                      <Badge className={`${mealTypeColors[recipe.meal_type]} ml-2`}>
                        {recipe.meal_type}
                      </Badge>
                    </div>

                    {recipe.description && (
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">
                        {recipe.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center gap-1">
                        <Flame className="w-4 h-4 text-orange-400" />
                        {recipe.calories} kcal
                      </span>
                      {(recipe.prep_time_mins || recipe.cook_time_mins) && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {(recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0)} min
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-2 mt-3">
                      <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">
                        P: {recipe.protein_g}g
                      </span>
                      <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-lg">
                        C: {recipe.carbs_g}g
                      </span>
                      <span className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded-lg">
                        F: {recipe.fat_g}g
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🍽️</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Recipes Found</h3>
                <p className="text-slate-500">Try adjusting your search</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}