import React, { useState } from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Flame, Check, Eye, Sparkles, Search } from "lucide-react";
import { motion } from "framer-motion";
import RatingPrompt from '@/components/recipes/RatingPrompt';

export default function MealPlanCard({ 
  recipe, 
  mealType, 
  isCompleted, 
  isFavorite, 
  onToggleFavorite, 
  onMarkComplete,
  onViewRecipe,
  onFindAlternatives,
  onChangeMeal,
  averageRating,
  onRatingSubmitted
}) {
  const [showRatingPrompt, setShowRatingPrompt] = useState(false);
  if (!recipe) {
    return (
      <Card className="bg-slate-50 border-dashed border-2 border-slate-200 rounded-2xl">
        <CardContent className="p-4 flex items-center justify-center h-32">
          <span className="text-slate-400">No {mealType} planned</span>
        </CardContent>
      </Card>
    );
  }

  const mealTypeColors = {
    breakfast: "bg-amber-100 text-amber-700",
    lunch: "bg-emerald-100 text-emerald-700",
    dinner: "bg-violet-100 text-violet-700",
    snack: "bg-rose-100 text-rose-700"
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <Card className={`bg-white rounded-2xl shadow-sm border-0 overflow-hidden transition-all hover:shadow-md ${isCompleted ? 'ring-2 ring-emerald-500 ring-opacity-50' : ''}`}>
        {recipe.image_url && (
          <div className="relative h-32 overflow-hidden bg-slate-100">
            <img 
              src={recipe.image_url} 
              alt={recipe.name}
              loading="lazy"
              decoding="async"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
            <Badge className={`absolute top-3 left-3 ${mealTypeColors[mealType]}`}>
              {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
            </Badge>
            {isCompleted && (
              <div className="absolute top-3 right-3 w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check className="w-5 h-5 text-white" />
              </div>
            )}
          </div>
        )}
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className={`font-semibold text-slate-900 ${isCompleted ? 'line-through text-slate-400' : ''}`}>
              {recipe.name}
            </h3>
            <button 
              onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
              className="flex-shrink-0"
            >
              <Star 
                className={`w-5 h-5 transition-colors ${
                  isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-300 hover:text-amber-400'
                }`} 
              />
            </button>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
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

          <div className="flex items-center gap-3 text-xs text-slate-500 mb-4">
            <span>P: {recipe.protein_g}g</span>
            <span>C: {recipe.carbs_g}g</span>
            <span>F: {recipe.fat_g}g</span>
          </div>

          <div className="space-y-2">
            {averageRating && (
              <div className="flex items-center gap-1 mb-2">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-slate-900">{averageRating}</span>
                <span className="text-xs text-slate-500">average rating</span>
              </div>
            )}
            <Button 
              size="sm" 
              className={`w-full rounded-xl ${isCompleted ? 'bg-emerald-500' : 'bg-slate-900 hover:bg-slate-800'}`}
              onClick={() => {
                onMarkComplete();
                if (!isCompleted) {
                  setTimeout(() => setShowRatingPrompt(true), 500);
                }
              }}
            >
              {isCompleted ? (
                <>
                  <Check className="w-4 h-4 mr-1" />
                  Logged
                </>
              ) : (
                "Log Meal"
              )}
            </Button>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl"
                onClick={onViewRecipe}
              >
                <Eye className="w-4 h-4" />
              </Button>
              {onFindAlternatives && (
                <Button 
                  variant="outline"
                  size="sm" 
                  className="rounded-xl text-violet-600 border-violet-200 hover:bg-violet-50"
                  onClick={onFindAlternatives}
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              )}
              {onChangeMeal && (
                <Button 
                  variant="outline"
                  size="sm" 
                  className="rounded-xl"
                  onClick={onChangeMeal}
                >
                  <Search className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {showRatingPrompt && (
        <RatingPrompt
          recipe={recipe}
          onClose={() => setShowRatingPrompt(false)}
          onRatingSubmitted={() => {
            setShowRatingPrompt(false);
            onRatingSubmitted?.();
          }}
        />
      )}
    </motion.div>
  );
}