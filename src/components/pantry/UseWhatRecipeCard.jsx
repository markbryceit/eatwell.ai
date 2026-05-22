import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronUp, Clock, Flame, Star, CheckCircle2 } from 'lucide-react';

export default function UseWhatRecipeCard({
  recipe,
  isExpanded,
  onToggle,
  mealTypeColor,
  difficultyColor,
  pantryIngredients,
}) {
  const totalTime = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0);
  const pantryLower = pantryIngredients.map(i => i.toLowerCase());

  return (
    <Card className="border-0 shadow-sm bg-white rounded-2xl overflow-hidden">
      {/* Card Header — always visible */}
      <button
        className="w-full text-left"
        onClick={onToggle}
      >
        <CardContent className="p-5">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              {/* Badges row */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                {recipe.meal_type && (
                  <Badge className={`${mealTypeColor[recipe.meal_type] || 'bg-slate-100 text-slate-600'} border-0 text-xs font-medium`}>
                    {recipe.meal_type}
                  </Badge>
                )}
                {recipe.difficulty && (
                  <Badge className={`${difficultyColor[recipe.difficulty] || 'bg-slate-100 text-slate-600'} border-0 text-xs font-medium`}>
                    {recipe.difficulty}
                  </Badge>
                )}
                {recipe.waste_score && (
                  <div className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                    {recipe.waste_score}/5 waste score
                  </div>
                )}
              </div>

              <h3 className="font-semibold text-slate-900 text-base leading-tight mb-1">
                {recipe.name}
              </h3>
              <p className="text-slate-500 text-sm line-clamp-2">{recipe.description}</p>

              {/* Quick stats */}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-500">
                {totalTime > 0 && (
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {totalTime} min
                  </span>
                )}
                {recipe.calories && (
                  <span className="flex items-center gap-1">
                    <Flame className="w-3 h-3" />
                    {recipe.calories} kcal
                  </span>
                )}
                {recipe.ingredients_used?.length > 0 && (
                  <span className="flex items-center gap-1 text-emerald-600 font-medium">
                    <CheckCircle2 className="w-3 h-3" />
                    {recipe.ingredients_used.length} pantry items used
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-slate-400 mt-1">
              {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </div>
          </div>
        </CardContent>
      </button>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-slate-50 bg-slate-50/50">
          <div className="p-5 space-y-5">
            {/* Ingredients breakdown */}
            <div className="grid sm:grid-cols-2 gap-4">
              {recipe.ingredients_used?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    From Your Pantry ✓
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.ingredients_used.map((ing, i) => (
                      <span
                        key={i}
                        className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          pantryLower.some(p => ing.toLowerCase().includes(p) || p.includes(ing.toLowerCase()))
                            ? 'bg-emerald-100 text-emerald-700'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {recipe.extra_staples?.length > 0 && (
                <div>
                  <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
                    Basic Staples Needed
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {recipe.extra_staples.map((s, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-amber-50 text-amber-700 font-medium">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Instructions */}
            {recipe.instructions?.length > 0 && (
              <div>
                <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                  Instructions
                </h4>
                <ol className="space-y-2">
                  {recipe.instructions.map((step, i) => (
                    <li key={i} className="flex gap-3 text-sm text-slate-700">
                      <span className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-semibold text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      <span className="leading-relaxed">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  );
}