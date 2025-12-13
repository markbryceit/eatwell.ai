import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Flame } from 'lucide-react';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', color: 'bg-amber-100 text-amber-700' },
  { key: 'lunch', label: 'Lunch', color: 'bg-emerald-100 text-emerald-700' },
  { key: 'dinner', label: 'Dinner', color: 'bg-violet-100 text-violet-700' },
  { key: 'snack', label: 'Snack', color: 'bg-rose-100 text-rose-700' }
];

export default function DayPlanCard({ 
  day, 
  dayIndex, 
  recipes, 
  onAddMeal, 
  onRemoveMeal,
  targetCalories 
}) {
  const getRecipeById = (id) => recipes?.find(r => r.id === id);

  const isToday = new Date(day.date).toDateString() === new Date().toDateString();

  const caloriePercentage = targetCalories ? (day.total_calories / targetCalories) * 100 : 0;
  const calorieStatus = caloriePercentage < 90 ? 'under' : caloriePercentage > 110 ? 'over' : 'perfect';

  return (
    <Card className={`rounded-2xl overflow-hidden ${isToday ? 'ring-2 ring-emerald-500' : ''}`}>
      <CardHeader className="pb-3 bg-slate-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-slate-900">{day.day_name}</h3>
            <p className="text-sm text-slate-500">{new Date(day.date).getDate()}</p>
          </div>
          {isToday && (
            <Badge className="bg-emerald-500 text-white">Today</Badge>
          )}
        </div>
        <div className="mt-3">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-slate-600">Calories</span>
            <span className={`font-semibold ${
              calorieStatus === 'perfect' ? 'text-emerald-600' :
              calorieStatus === 'under' ? 'text-amber-600' : 'text-red-600'
            }`}>
              {day.total_calories?.toLocaleString() || 0} / {targetCalories?.toLocaleString()}
            </span>
          </div>
          <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all ${
                calorieStatus === 'perfect' ? 'bg-emerald-500' :
                calorieStatus === 'under' ? 'bg-amber-500' : 'bg-red-500'
              }`}
              style={{ width: `${Math.min(caloriePercentage, 100)}%` }}
            />
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-4 space-y-3">
        {MEAL_TYPES.map(({ key, label, color }) => {
          const recipeId = day[`${key}_recipe_id`];
          const recipe = getRecipeById(recipeId);

          return (
            <div key={key} className="space-y-2">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`${color} text-xs`}>
                  {label}
                </Badge>
              </div>

              {recipe ? (
                <div className="relative group bg-slate-50 rounded-lg p-3 hover:bg-slate-100 transition-colors">
                  <button
                    onClick={() => onRemoveMeal(key)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <X className="w-4 h-4 text-slate-400 hover:text-red-500" />
                  </button>
                  <h4 className="font-medium text-slate-900 text-sm mb-1 pr-6">
                    {recipe.name}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-400" />
                      {recipe.calories} kcal
                    </span>
                    <span className="text-slate-400">•</span>
                    <span>P: {recipe.protein_g}g</span>
                  </div>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onAddMeal(key)}
                  className="w-full rounded-lg border-dashed hover:bg-slate-50"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add {label}
                </Button>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}