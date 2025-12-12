import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Loader2, X, Clock, Flame, Star } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AlternativeMeals({ 
  mealType, 
  currentRecipe, 
  targetCalories,
  excludeRecipeIds,
  onSelectAlternative,
  onClose 
}) {
  const [alternatives, setAlternatives] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchAlternatives = async () => {
    setIsLoading(true);
    try {
      const response = await base44.functions.invoke('generateAIRecommendations', {
        targetCalories,
        mealType,
        excludeRecipeIds
      });
      setAlternatives(response.data.recommendations || []);
    } catch (error) {
      console.error('Error fetching alternatives:', error);
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    fetchAlternatives();
  }, [mealType]);

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
          className="bg-white rounded-3xl w-full max-w-3xl max-h-[80vh] overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold text-slate-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-violet-500" />
                Alternative {mealType.charAt(0).toUpperCase() + mealType.slice(1)} Options
              </h2>
              <p className="text-slate-500 text-sm mt-1">
                AI-powered recommendations based on your preferences
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(80vh-8rem)]">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
              </div>
            ) : alternatives.length > 0 ? (
              <div className="space-y-4">
                {alternatives.map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => onSelectAlternative(recipe)}>
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {recipe.image_url && (
                            <img 
                              src={recipe.image_url} 
                              alt={recipe.name}
                              className="w-24 h-24 rounded-xl object-cover"
                            />
                          )}
                          <div className="flex-1">
                            <h3 className="font-semibold text-slate-900 mb-1">{recipe.name}</h3>
                            <p className="text-sm text-slate-500 mb-3 line-clamp-2">{recipe.description}</p>
                            <div className="flex items-center gap-4 text-sm">
                              <span className="flex items-center gap-1 text-orange-600">
                                <Flame className="w-4 h-4" />
                                {recipe.calories} kcal
                              </span>
                              {(recipe.prep_time_mins || recipe.cook_time_mins) && (
                                <span className="flex items-center gap-1 text-slate-500">
                                  <Clock className="w-4 h-4" />
                                  {(recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0)} min
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">P: {recipe.protein_g}g</span>
                              <span className="text-xs px-2 py-1 bg-amber-50 text-amber-600 rounded-lg">C: {recipe.carbs_g}g</span>
                              <span className="text-xs px-2 py-1 bg-rose-50 text-rose-600 rounded-lg">F: {recipe.fat_g}g</span>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="bg-violet-500 hover:bg-violet-600 rounded-xl self-start"
                            onClick={(e) => {
                              e.stopPropagation();
                              onSelectAlternative(recipe);
                            }}
                          >
                            Select
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-5xl mb-4">🤔</div>
                <p className="text-slate-500">No alternatives found at the moment</p>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}