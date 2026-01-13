import React, { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Circle, ShoppingCart } from 'lucide-react';

const MEAL_TYPES = [
  { key: 'breakfast', label: 'Breakfast', color: 'bg-amber-100 text-amber-700' },
  { key: 'lunch', label: 'Lunch', color: 'bg-blue-100 text-blue-700' },
  { key: 'dinner', label: 'Dinner', color: 'bg-purple-100 text-purple-700' },
  { key: 'snack', label: 'Snack', color: 'bg-green-100 text-green-700' }
];

export default function MealSelector({ mealPlan, recipes, onGenerateList }) {
  const [selectedMeals, setSelectedMeals] = useState({});

  const getRecipeById = (id) => recipes?.find(r => r.id === id);

  const toggleDay = (dayIndex) => {
    const day = mealPlan.days[dayIndex];
    const hasAllMeals = MEAL_TYPES.every(mt => {
      const recipeId = day[`${mt.key}_recipe_id`];
      return !recipeId || selectedMeals[`${dayIndex}-${mt.key}`];
    });

    const newSelections = { ...selectedMeals };
    MEAL_TYPES.forEach(mealType => {
      const recipeId = day[`${mealType.key}_recipe_id`];
      if (recipeId) {
        const key = `${dayIndex}-${mealType.key}`;
        newSelections[key] = !hasAllMeals;
      }
    });
    setSelectedMeals(newSelections);
  };

  const toggleMeal = (dayIndex, mealType) => {
    const key = `${dayIndex}-${mealType}`;
    setSelectedMeals(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const selectedCount = Object.values(selectedMeals).filter(Boolean).length;
  const totalMealsPlanned = useMemo(() => {
    let count = 0;
    mealPlan?.days?.forEach((day) => {
      MEAL_TYPES.forEach(mt => {
        if (day[`${mt.key}_recipe_id`]) count++;
      });
    });
    return count;
  }, [mealPlan]);

  const isDayFullySelected = (dayIndex) => {
    const day = mealPlan.days[dayIndex];
    return MEAL_TYPES.every(mt => {
      const recipeId = day[`${mt.key}_recipe_id`];
      return !recipeId || selectedMeals[`${dayIndex}-${mt.key}`];
    });
  };

  const handleSelectAll = () => {
    if (selectedCount === totalMealsPlanned) {
      setSelectedMeals({});
    } else {
      const newSelections = {};
      mealPlan?.days?.forEach((day, dayIndex) => {
        MEAL_TYPES.forEach(mealType => {
          const recipeId = day[`${mealType.key}_recipe_id`];
          if (recipeId) {
            newSelections[`${dayIndex}-${mealType.key}`] = true;
          }
        });
      });
      setSelectedMeals(newSelections);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-slate-900">Select Meals to Shop For</h3>
          <p className="text-slate-500 text-sm mt-1">
            {selectedCount} of {totalMealsPlanned} meals selected
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          className="rounded-xl"
        >
          {selectedCount === totalMealsPlanned ? 'Deselect All' : 'Select All'}
        </Button>
      </div>

      {/* Days List */}
      <div className="space-y-3">
        {mealPlan?.days?.map((day, dayIndex) => {
          const dayHasMeals = MEAL_TYPES.some(mt => day[`${mt.key}_recipe_id`]);
          if (!dayHasMeals) return null;

          return (
            <motion.div
              key={dayIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: dayIndex * 0.05 }}
            >
              <Card className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
                {/* Day Header */}
                <button
                  onClick={() => toggleDay(dayIndex)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                      {isDayFullySelected(dayIndex) ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      ) : (
                        <Circle className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                    <div className="text-left">
                      <h4 className="font-semibold text-slate-900">{day.day_name}</h4>
                      <p className="text-xs text-slate-500">{day.date}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-slate-100">
                    {MEAL_TYPES.filter(mt => day[`${mt.key}_recipe_id`]).length} meals
                  </Badge>
                </button>

                {/* Meals List */}
                <div className="px-4 pb-4 space-y-2">
                  {MEAL_TYPES.map(mealType => {
                    const recipeId = day[`${mealType.key}_recipe_id`];
                    if (!recipeId) return null;

                    const recipe = getRecipeById(recipeId);
                    if (!recipe) return null;

                    const key = `${dayIndex}-${mealType.key}`;
                    const isSelected = selectedMeals[key];

                    return (
                      <button
                        key={mealType.key}
                        onClick={() => toggleMeal(dayIndex, mealType.key)}
                        className={`w-full p-3 rounded-xl border-2 transition-all text-left ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => {}}
                            className="pointer-events-none"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <Badge className={`text-xs ${mealType.color}`}>
                                {mealType.label}
                              </Badge>
                              <span className="text-sm font-medium text-slate-900 truncate">
                                {recipe.name}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500">
                              {recipe.ingredients?.length || 0} ingredients
                            </p>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Generate Button */}
      <Button
        onClick={() => onGenerateList(selectedMeals)}
        disabled={selectedCount === 0}
        className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        Generate Shopping List ({selectedCount} meals)
      </Button>
    </div>
  );
}