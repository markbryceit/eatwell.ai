import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, Clock, Flame } from "lucide-react";
import { motion } from "framer-motion";

export default function RecipeCard({ recipe, isFavorite, onToggleFavorite, onClick, onEdit }) {
  const mealTypeColors = {
    breakfast: "bg-amber-100 text-amber-700",
    lunch: "bg-emerald-100 text-emerald-700",
    dinner: "bg-violet-100 text-violet-700",
    snack: "bg-rose-100 text-rose-700"
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
    >
      <Card 
        className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden cursor-pointer hover:shadow-lg transition-shadow"
        onClick={onClick}
      >
        <div className="relative h-40">
          {recipe.image_url ? (
            <img 
              src={recipe.image_url} 
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center">
              <span className="text-4xl">🍽️</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
          <Badge className={`absolute top-3 left-3 ${mealTypeColors[recipe.meal_type]}`}>
            {recipe.meal_type}
          </Badge>
          <button 
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="absolute top-3 right-3"
          >
            <Star 
              className={`w-6 h-6 transition-all ${
                isFavorite 
                  ? 'fill-amber-400 text-amber-400' 
                  : 'text-white/80 hover:text-amber-400'
              }`} 
            />
          </button>
        </div>
        <CardContent className="p-4">
          <h3 className="font-semibold text-slate-900 mb-2 line-clamp-1">{recipe.name}</h3>
          <div className="flex items-center gap-4 text-sm text-slate-500 mb-3">
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
          <div className="flex items-center gap-3 text-xs">
            <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg">P: {recipe.protein_g}g</span>
            <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded-lg">C: {recipe.carbs_g}g</span>
            <span className="px-2 py-1 bg-rose-50 text-rose-600 rounded-lg">F: {recipe.fat_g}g</span>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}