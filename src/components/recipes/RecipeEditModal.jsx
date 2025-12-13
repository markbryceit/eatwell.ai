import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X, Plus, Minus, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const MEAL_TYPES = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
];

const DIETARY_TAGS = ['vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'keto', 'paleo', 'low-carb', 'high-protein'];

export default function RecipeEditModal({ recipe, isOpen, onClose, onSave, isSaving }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    meal_type: 'breakfast',
    calories: 0,
    protein_g: 0,
    carbs_g: 0,
    fat_g: 0,
    fiber_g: 0,
    prep_time_mins: 0,
    cook_time_mins: 0,
    servings: 1,
    ingredients: [''],
    instructions: [''],
    dietary_tags: [],
    image_url: ''
  });

  useEffect(() => {
    if (recipe) {
      setFormData({
        name: recipe.name || '',
        description: recipe.description || '',
        meal_type: recipe.meal_type || 'breakfast',
        calories: recipe.calories || 0,
        protein_g: recipe.protein_g || 0,
        carbs_g: recipe.carbs_g || 0,
        fat_g: recipe.fat_g || 0,
        fiber_g: recipe.fiber_g || 0,
        prep_time_mins: recipe.prep_time_mins || 0,
        cook_time_mins: recipe.cook_time_mins || 0,
        servings: recipe.servings || 1,
        ingredients: recipe.ingredients?.length > 0 ? recipe.ingredients : [''],
        instructions: recipe.instructions?.length > 0 ? recipe.instructions : [''],
        dietary_tags: recipe.dietary_tags || [],
        image_url: recipe.image_url || ''
      });
    }
  }, [recipe]);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleArrayChange = (field, index, value) => {
    const newArray = [...formData[field]];
    newArray[index] = value;
    setFormData(prev => ({ ...prev, [field]: newArray }));
  };

  const addArrayItem = (field) => {
    setFormData(prev => ({ ...prev, [field]: [...prev[field], ''] }));
  };

  const removeArrayItem = (field, index) => {
    if (formData[field].length > 1) {
      const newArray = formData[field].filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, [field]: newArray }));
    }
  };

  const toggleDietaryTag = (tag) => {
    setFormData(prev => ({
      ...prev,
      dietary_tags: prev.dietary_tags.includes(tag)
        ? prev.dietary_tags.filter(t => t !== tag)
        : [...prev.dietary_tags, tag]
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Filter out empty ingredients and instructions
    const cleanedData = {
      ...formData,
      ingredients: formData.ingredients.filter(i => i.trim() !== ''),
      instructions: formData.instructions.filter(i => i.trim() !== ''),
      calories: parseFloat(formData.calories) || 0,
      protein_g: parseFloat(formData.protein_g) || 0,
      carbs_g: parseFloat(formData.carbs_g) || 0,
      fat_g: parseFloat(formData.fat_g) || 0,
      fiber_g: parseFloat(formData.fiber_g) || 0,
      prep_time_mins: parseInt(formData.prep_time_mins) || 0,
      cook_time_mins: parseInt(formData.cook_time_mins) || 0,
      servings: parseInt(formData.servings) || 1
    };
    onSave(cleanedData);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-4xl my-8"
        >
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <h2 className="text-2xl font-bold text-slate-900">
                {recipe ? 'Edit Recipe' : 'Create Recipe'}
              </h2>
              <button type="button" onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Form Content */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Basic Info */}
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">Recipe Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleChange('name', e.target.value)}
                    placeholder="e.g., Grilled Chicken Salad"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleChange('description', e.target.value)}
                    placeholder="Brief description of the dish"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="meal_type">Meal Type *</Label>
                    <Select value={formData.meal_type} onValueChange={(value) => handleChange('meal_type', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {MEAL_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="servings">Servings</Label>
                    <Input
                      id="servings"
                      type="number"
                      min="1"
                      value={formData.servings}
                      onChange={(e) => handleChange('servings', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Nutrition */}
              <div>
                <h3 className="font-semibold text-slate-900 mb-3">Nutrition (per serving) *</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="calories">Calories</Label>
                    <Input
                      id="calories"
                      type="number"
                      min="0"
                      value={formData.calories}
                      onChange={(e) => handleChange('calories', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="protein_g">Protein (g)</Label>
                    <Input
                      id="protein_g"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.protein_g}
                      onChange={(e) => handleChange('protein_g', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="carbs_g">Carbs (g)</Label>
                    <Input
                      id="carbs_g"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.carbs_g}
                      onChange={(e) => handleChange('carbs_g', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fat_g">Fat (g)</Label>
                    <Input
                      id="fat_g"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.fat_g}
                      onChange={(e) => handleChange('fat_g', e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="fiber_g">Fiber (g)</Label>
                    <Input
                      id="fiber_g"
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.fiber_g}
                      onChange={(e) => handleChange('fiber_g', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="prep_time_mins">Prep Time (mins)</Label>
                  <Input
                    id="prep_time_mins"
                    type="number"
                    min="0"
                    value={formData.prep_time_mins}
                    onChange={(e) => handleChange('prep_time_mins', e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="cook_time_mins">Cook Time (mins)</Label>
                  <Input
                    id="cook_time_mins"
                    type="number"
                    min="0"
                    value={formData.cook_time_mins}
                    onChange={(e) => handleChange('cook_time_mins', e.target.value)}
                  />
                </div>
              </div>

              {/* Dietary Tags */}
              <div>
                <Label>Dietary Tags</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {DIETARY_TAGS.map(tag => (
                    <Badge
                      key={tag}
                      variant={formData.dietary_tags.includes(tag) ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => toggleDietaryTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Ingredients */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Ingredients</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem('ingredients')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.ingredients.map((ingredient, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        value={ingredient}
                        onChange={(e) => handleArrayChange('ingredients', index, e.target.value)}
                        placeholder={`Ingredient ${index + 1}`}
                      />
                      {formData.ingredients.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeArrayItem('ingredients', index)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Instructions */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label>Instructions</Label>
                  <Button type="button" size="sm" variant="outline" onClick={() => addArrayItem('instructions')}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Step
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.instructions.map((instruction, index) => (
                    <div key={index} className="flex gap-2">
                      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center text-sm font-medium mt-1">
                        {index + 1}
                      </div>
                      <Textarea
                        value={instruction}
                        onChange={(e) => handleArrayChange('instructions', index, e.target.value)}
                        placeholder={`Step ${index + 1}`}
                        rows={2}
                      />
                      {formData.instructions.length > 1 && (
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => removeArrayItem('instructions', index)}
                        >
                          <Minus className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Image URL */}
              <div>
                <Label htmlFor="image_url">Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url}
                  onChange={(e) => handleChange('image_url', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving} className="bg-emerald-600 hover:bg-emerald-700">
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Recipe'
                )}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}