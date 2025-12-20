import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Clock, Flame, Users, Star, Check, Edit, Trash2, Sparkles } from "lucide-react";
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import RatingStars from './RatingStars';

export default function RecipeModal({ recipe, isOpen, onClose, isFavorite, onToggleFavorite, onEdit, onDelete, onGenerateVariation }) {
  const queryClient = useQueryClient();
  const [userRating, setUserRating] = useState(0);

  const { data: ratings } = useQuery({
    queryKey: ['recipeRatings', recipe?.id],
    queryFn: () => base44.entities.RecipeRating.filter({ recipe_id: recipe?.id }),
    enabled: !!recipe?.id
  });

  useEffect(() => {
    if (ratings && ratings.length > 0) {
      setUserRating(ratings[0].rating);
    } else {
      setUserRating(0);
    }
  }, [ratings]);

  const ratingMutation = useMutation({
    mutationFn: async (newRating) => {
      if (ratings && ratings.length > 0) {
        await base44.entities.RecipeRating.update(ratings[0].id, { rating: newRating });
      } else {
        await base44.entities.RecipeRating.create({
          recipe_id: recipe.id,
          rating: newRating
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['recipeRatings', recipe?.id] });
    }
  });

  const handleRate = (rating) => {
    setUserRating(rating);
    ratingMutation.mutate(rating);
  };

  if (!recipe || !isOpen) return null;

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
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          {/* Header Image */}
          {recipe.image_url && (
            <div className="relative h-64">
              <img 
                src={recipe.image_url} 
                alt={recipe.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <button
                onClick={onClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <div className="absolute bottom-4 left-6 right-6">
                <h2 className="text-2xl font-bold text-white mb-2">{recipe.name}</h2>
                <div className="flex flex-wrap gap-2">
                  {recipe.dietary_tags?.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-white/20 text-white border-0">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          )}

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-16rem)]">
            {!recipe.image_url && (
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-slate-900">{recipe.name}</h2>
                <button onClick={onClose}>
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4 p-4 bg-slate-50 rounded-2xl mb-6">
              <div className="text-center">
                <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                <div className="font-semibold text-slate-900">{recipe.calories}</div>
                <div className="text-xs text-slate-500">kcal</div>
              </div>
              <div className="text-center">
                <Clock className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                <div className="font-semibold text-slate-900">
                  {(recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0)}
                </div>
                <div className="text-xs text-slate-500">mins</div>
              </div>
              <div className="text-center">
                <Users className="w-5 h-5 mx-auto text-violet-500 mb-1" />
                <div className="font-semibold text-slate-900">{recipe.servings || 1}</div>
                <div className="text-xs text-slate-500">servings</div>
              </div>
              <div className="text-center">
                <div className="w-5 h-5 mx-auto text-emerald-500 mb-1 font-bold text-sm">P</div>
                <div className="font-semibold text-slate-900">{recipe.protein_g}g</div>
                <div className="text-xs text-slate-500">protein</div>
              </div>
            </div>

            {/* Macros */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="p-3 bg-blue-50 rounded-xl text-center">
                <div className="text-sm text-blue-600 font-medium">Protein</div>
                <div className="text-lg font-bold text-blue-700">{recipe.protein_g}g</div>
              </div>
              <div className="p-3 bg-amber-50 rounded-xl text-center">
                <div className="text-sm text-amber-600 font-medium">Carbs</div>
                <div className="text-lg font-bold text-amber-700">{recipe.carbs_g}g</div>
              </div>
              <div className="p-3 bg-rose-50 rounded-xl text-center">
                <div className="text-sm text-rose-600 font-medium">Fat</div>
                <div className="text-lg font-bold text-rose-700">{recipe.fat_g}g</div>
              </div>
            </div>

            {recipe.description && (
              <div className="mb-6">
                <p className="text-slate-600 leading-relaxed">{recipe.description}</p>
              </div>
            )}

            {/* Ingredients */}
            {recipe.ingredients && recipe.ingredients.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Ingredients</h3>
                <ul className="space-y-2">
                  {recipe.ingredients.map((ingredient, index) => (
                    <li key={index} className="flex items-center gap-3 text-slate-600">
                      <div className="w-2 h-2 rounded-full bg-emerald-400" />
                      {ingredient}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Instructions */}
            {recipe.instructions && recipe.instructions.length > 0 && (
              <div className="mb-6">
                <h3 className="font-semibold text-slate-900 mb-3">Instructions</h3>
                <ol className="space-y-4">
                  {recipe.instructions.map((step, index) => (
                    <li key={index} className="flex gap-4">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <p className="text-slate-600 pt-1">{step}</p>
                    </li>
                  ))}
                </ol>
              </div>
            )}

            {/* Rating */}
            <div className="mb-6 p-4 bg-amber-50 rounded-2xl">
              <h3 className="font-semibold text-slate-900 mb-3 text-center">Rate this recipe</h3>
              <div className="flex items-center justify-center gap-3">
                <RatingStars rating={userRating} onRate={handleRate} size="lg" />
                {userRating > 0 && (
                  <span className="text-slate-600 font-medium">{userRating}/5</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3 pt-4 border-t border-slate-100">
              <Button
                variant="outline"
                className="flex-1 h-12 rounded-xl"
                onClick={onToggleFavorite}
              >
                <Star className={`w-5 h-5 mr-2 ${isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                {isFavorite ? 'Saved' : 'Save Recipe'}
              </Button>
              {onGenerateVariation && (
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50"
                  onClick={onGenerateVariation}
                >
                  <Sparkles className="w-5 h-5 mr-2" />
                  Create Variation
                </Button>
              )}
              {onEdit && (
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
                  onClick={onEdit}
                >
                  <Edit className="w-5 h-5 mr-2" />
                  Edit
                </Button>
              )}
              {onDelete && (
                <Button
                  variant="outline"
                  className="h-12 rounded-xl border-red-200 text-red-600 hover:bg-red-50"
                  onClick={onDelete}
                >
                  <Trash2 className="w-5 h-5 mr-2" />
                  Delete
                </Button>
              )}
              <Button
                className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800 mt-2"
                onClick={onClose}
              >
                <Check className="w-5 h-5 mr-2" />
                Done
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}