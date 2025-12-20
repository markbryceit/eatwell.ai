import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { X, Sparkles, Plus, Trash2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

const cuisineTypes = [
  'Italian', 'Mexican', 'Asian', 'Mediterranean', 'American', 
  'Indian', 'Thai', 'French', 'Japanese', 'Middle Eastern'
];

const dietaryOptions = [
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 
  'keto', 'paleo', 'low-carb', 'high-protein'
];

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
];

export default function AIRecipeGenerator({ isOpen, onClose, onRecipeGenerated }) {
  const [ingredients, setIngredients] = useState([]);
  const [ingredientInput, setIngredientInput] = useState('');
  const [excludeIngredients, setExcludeIngredients] = useState([]);
  const [excludeInput, setExcludeInput] = useState('');
  const [selectedDietary, setSelectedDietary] = useState([]);
  const [selectedCuisine, setSelectedCuisine] = useState('');
  const [targetCalories, setTargetCalories] = useState('');
  const [selectedMealType, setSelectedMealType] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  const addIngredient = () => {
    if (ingredientInput.trim()) {
      setIngredients([...ingredients, ingredientInput.trim()]);
      setIngredientInput('');
    }
  };

  const addExclude = () => {
    if (excludeInput.trim()) {
      setExcludeIngredients([...excludeIngredients, excludeInput.trim()]);
      setExcludeInput('');
    }
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      const { data } = await base44.functions.invoke('generateRecipeWithAI', {
        ingredients: ingredients.length > 0 ? ingredients : null,
        dietary_restrictions: selectedDietary.length > 0 ? selectedDietary : null,
        cuisine_type: selectedCuisine || null,
        target_calories: targetCalories ? parseInt(targetCalories) : null,
        meal_type: selectedMealType || null,
        exclude_ingredients: excludeIngredients.length > 0 ? excludeIngredients : null
      });

      onRecipeGenerated(data.recipe);
      toast.success('Recipe generated successfully!');
    } catch (error) {
      toast.error('Failed to generate recipe');
      console.error(error);
    }
    setIsGenerating(false);
  };

  const resetForm = () => {
    setIngredients([]);
    setExcludeIngredients([]);
    setSelectedDietary([]);
    setSelectedCuisine('');
    setTargetCalories('');
    setSelectedMealType('');
  };

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
          className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI Recipe Generator</h2>
                  <p className="text-violet-100">Create custom recipes with AI</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)] space-y-6">
            {/* Ingredients to Include */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Ingredients to Include (Optional)
              </Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g., chicken, broccoli..."
                  value={ingredientInput}
                  onChange={(e) => setIngredientInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                  className="rounded-xl"
                />
                <Button onClick={addIngredient} size="icon" className="rounded-xl">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {ingredients.map((ing, idx) => (
                  <Badge key={idx} className="bg-emerald-100 text-emerald-700">
                    {ing}
                    <button
                      onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Ingredients to Exclude */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Exclude Ingredients (Optional)
              </Label>
              <div className="flex gap-2 mb-2">
                <Input
                  placeholder="e.g., nuts, dairy..."
                  value={excludeInput}
                  onChange={(e) => setExcludeInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addExclude()}
                  className="rounded-xl"
                />
                <Button onClick={addExclude} size="icon" className="rounded-xl">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {excludeIngredients.map((ing, idx) => (
                  <Badge key={idx} className="bg-red-100 text-red-700">
                    {ing}
                    <button
                      onClick={() => setExcludeIngredients(excludeIngredients.filter((_, i) => i !== idx))}
                      className="ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>

            {/* Dietary Restrictions */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Dietary Preferences (Optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {dietaryOptions.map((diet) => (
                  <button
                    key={diet}
                    onClick={() => {
                      if (selectedDietary.includes(diet)) {
                        setSelectedDietary(selectedDietary.filter(d => d !== diet));
                      } else {
                        setSelectedDietary([...selectedDietary, diet]);
                      }
                    }}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedDietary.includes(diet)
                        ? 'bg-violet-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {diet}
                  </button>
                ))}
              </div>
            </div>

            {/* Cuisine Type */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Cuisine Style (Optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {cuisineTypes.map((cuisine) => (
                  <button
                    key={cuisine}
                    onClick={() => setSelectedCuisine(selectedCuisine === cuisine ? '' : cuisine)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                      selectedCuisine === cuisine
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {cuisine}
                  </button>
                ))}
              </div>
            </div>

            {/* Meal Type */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Meal Type (Optional)
              </Label>
              <div className="grid grid-cols-4 gap-3">
                {mealTypes.map((meal) => (
                  <button
                    key={meal.value}
                    onClick={() => setSelectedMealType(selectedMealType === meal.value ? '' : meal.value)}
                    className={`p-3 rounded-xl text-sm font-medium transition-all ${
                      selectedMealType === meal.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {meal.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Calories */}
            <div>
              <Label className="text-sm font-medium text-slate-700 mb-2 block">
                Target Calories (Optional)
              </Label>
              <Input
                type="number"
                placeholder="e.g., 500"
                value={targetCalories}
                onChange={(e) => setTargetCalories(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 flex gap-3">
            <Button
              variant="outline"
              onClick={() => {
                resetForm();
                onClose();
              }}
              className="flex-1 h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="flex-1 h-12 rounded-xl bg-violet-600 hover:bg-violet-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 mr-2" />
                  Generate Recipe
                </>
              )}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}