import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Save, Loader2, X, ChefHat, Clock, Utensils } from 'lucide-react';
import { toast } from 'sonner';

const eatingStyles = [
  "Low Carb", "High Protein", "Keto", "Vegan", "Vegetarian",
  "Paleo", "Mediterranean", "Pescatarian", "Flexitarian", "Whole 30", "Carnivore"
];

const commonAllergies = [
  "Gluten", "Dairy", "Shellfish", "Nuts", "Peanuts",
  "Eggs", "Soy", "Fish", "Sesame"
];

const commonIntolerances = [
  "Lactose", "Fructose", "Histamine", "Sulfites", "FODMAPs"
];

const kitchenEquipment = [
  "Oven", "Microwave", "Air Fryer", "Instant Pot", "Slow Cooker",
  "Blender", "Food Processor", "Grill", "Toaster Oven"
];

const cuisineTypes = [
  "Italian", "Mexican", "Chinese", "Indian", "Thai", "Japanese",
  "Mediterranean", "American", "French", "Greek", "Middle Eastern", "Korean"
];

export default function DietaryPreferences({ profile, onSave }) {
  const [eatingStyle, setEatingStyle] = useState(profile?.eating_style || []);
  const [allergies, setAllergies] = useState(profile?.allergies || []);
  const [intolerances, setIntolerances] = useState(profile?.intolerances || []);
  const [dislikedFoods, setDislikedFoods] = useState(profile?.disliked_foods || []);
  const [cookingSkillLevel, setCookingSkillLevel] = useState(profile?.cooking_skill_level || 'intermediate');
  const [maxCookingTime, setMaxCookingTime] = useState(profile?.max_cooking_time_mins || 45);
  const [equipment, setEquipment] = useState(profile?.kitchen_equipment || []);
  const [cuisinePrefs, setCuisinePrefs] = useState(profile?.cuisine_preferences || []);
  const [mealsPerDay, setMealsPerDay] = useState(profile?.meals_per_day || 3);
  const [dislikedInput, setDislikedInput] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const toggleEatingStyle = (style) => {
    if (eatingStyle.includes(style)) {
      setEatingStyle(eatingStyle.filter(s => s !== style));
    } else {
      setEatingStyle([...eatingStyle, style]);
    }
  };

  const toggleAllergy = (allergy) => {
    if (allergies.includes(allergy)) {
      setAllergies(allergies.filter(a => a !== allergy));
    } else {
      setAllergies([...allergies, allergy]);
    }
  };

  const toggleIntolerance = (intolerance) => {
    if (intolerances.includes(intolerance)) {
      setIntolerances(intolerances.filter(i => i !== intolerance));
    } else {
      setIntolerances([...intolerances, intolerance]);
    }
  };

  const toggleEquipment = (item) => {
    if (equipment.includes(item)) {
      setEquipment(equipment.filter(e => e !== item));
    } else {
      setEquipment([...equipment, item]);
    }
  };

  const toggleCuisine = (cuisine) => {
    if (cuisinePrefs.includes(cuisine)) {
      setCuisinePrefs(cuisinePrefs.filter(c => c !== cuisine));
    } else {
      setCuisinePrefs([...cuisinePrefs, cuisine]);
    }
  };

  const addDislikedFood = () => {
    const food = dislikedInput.trim().toLowerCase();
    if (food && !dislikedFoods.includes(food)) {
      setDislikedFoods([...dislikedFoods, food]);
      setDislikedInput('');
    }
  };

  const removeDislikedFood = (food) => {
    setDislikedFoods(dislikedFoods.filter(f => f !== food));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await onSave({
        eating_style: eatingStyle,
        allergies: allergies,
        intolerances: intolerances,
        disliked_foods: dislikedFoods,
        cooking_skill_level: cookingSkillLevel,
        max_cooking_time_mins: maxCookingTime,
        kitchen_equipment: equipment,
        cuisine_preferences: cuisinePrefs,
        meals_per_day: mealsPerDay
      });
      await result;
      toast.success('Preferences updated successfully');
    } catch (error) {
      console.error('Save error:', error);
      toast.error('Failed to update preferences');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Dietary Restrictions */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Utensils className="w-5 h-5 text-emerald-600" />
            Dietary Restrictions
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Eating Style */}
          <div>
            <Label className="text-slate-700 mb-3 block">Eating Style</Label>
            <div className="grid grid-cols-3 gap-2">
              {eatingStyles.map((style) => (
                <label
                  key={style}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    eatingStyle.includes(style)
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={eatingStyle.includes(style)}
                    onCheckedChange={() => toggleEatingStyle(style)}
                  />
                  <span className="text-sm font-medium">{style}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Allergies */}
          <div>
            <Label className="text-slate-700 mb-3 block">Food Allergies</Label>
            <div className="grid grid-cols-4 gap-2">
              {commonAllergies.map((allergy) => (
                <label
                  key={allergy}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    allergies.includes(allergy)
                      ? 'border-red-500 bg-red-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={allergies.includes(allergy)}
                    onCheckedChange={() => toggleAllergy(allergy)}
                  />
                  <span className="text-sm font-medium">{allergy}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Intolerances */}
          <div>
            <Label className="text-slate-700 mb-3 block">Food Intolerances</Label>
            <div className="grid grid-cols-3 gap-2">
              {commonIntolerances.map((intolerance) => (
                <label
                  key={intolerance}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    intolerances.includes(intolerance)
                      ? 'border-orange-500 bg-orange-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={intolerances.includes(intolerance)}
                    onCheckedChange={() => toggleIntolerance(intolerance)}
                  />
                  <span className="text-sm font-medium">{intolerance}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Dislikes */}
          <div>
            <Label className="text-slate-700 mb-3 block">Foods You Don't Like</Label>
            <div className="flex gap-2 mb-3">
              <Input
                placeholder="e.g., mushrooms, olives, cilantro..."
                value={dislikedInput}
                onChange={(e) => setDislikedInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDislikedFood())}
                className="flex-1"
              />
              <Button
                type="button"
                onClick={addDislikedFood}
                disabled={!dislikedInput.trim()}
              >
                Add
              </Button>
            </div>
            {dislikedFoods.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {dislikedFoods.map((food) => (
                  <Badge
                    key={food}
                    variant="secondary"
                    className="px-3 py-2 bg-slate-100 text-slate-700"
                  >
                    {food}
                    <button
                      type="button"
                      onClick={() => removeDislikedFood(food)}
                      className="ml-2 text-slate-400 hover:text-slate-600"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cooking Preferences */}
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="w-5 h-5 text-violet-600" />
            Cooking Preferences
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Meals Per Day */}
          <div>
            <Label className="text-slate-700 mb-3 block">Meals Per Day</Label>
            <Select value={mealsPerDay.toString()} onValueChange={(val) => setMealsPerDay(parseInt(val))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2">2 Meals - Breakfast & Dinner</SelectItem>
                <SelectItem value="3">3 Meals - Breakfast, Lunch & Dinner</SelectItem>
                <SelectItem value="4">4 Meals - Breakfast, Lunch, Dinner & Snack</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Cooking Skill Level */}
          <div>
            <Label className="text-slate-700 mb-3 block">Cooking Skill Level</Label>
            <Select value={cookingSkillLevel} onValueChange={setCookingSkillLevel}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="beginner">Beginner - Simple recipes with few ingredients</SelectItem>
                <SelectItem value="intermediate">Intermediate - Moderate complexity</SelectItem>
                <SelectItem value="advanced">Advanced - Complex techniques welcome</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Max Cooking Time */}
          <div>
            <Label className="text-slate-700 mb-3 block flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Maximum Cooking Time: {maxCookingTime} minutes
            </Label>
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={maxCookingTime}
              onChange={(e) => setMaxCookingTime(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-slate-500 mt-1">
              <span>15 min</span>
              <span>120 min</span>
            </div>
          </div>

          {/* Kitchen Equipment */}
          <div>
            <Label className="text-slate-700 mb-3 block">Available Kitchen Equipment</Label>
            <div className="grid grid-cols-3 gap-2">
              {kitchenEquipment.map((item) => (
                <label
                  key={item}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    equipment.includes(item)
                      ? 'border-violet-500 bg-violet-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={equipment.includes(item)}
                    onCheckedChange={() => toggleEquipment(item)}
                  />
                  <span className="text-sm font-medium">{item}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Cuisine Preferences */}
          <div>
            <Label className="text-slate-700 mb-3 block">Favorite Cuisines</Label>
            <div className="grid grid-cols-4 gap-2">
              {cuisineTypes.map((cuisine) => (
                <label
                  key={cuisine}
                  className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    cuisinePrefs.includes(cuisine)
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <Checkbox
                    checked={cuisinePrefs.includes(cuisine)}
                    onCheckedChange={() => toggleCuisine(cuisine)}
                  />
                  <span className="text-sm font-medium">{cuisine}</span>
                </label>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={isSaving}
        className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12"
      >
        {isSaving ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        Save All Preferences
      </Button>
    </div>
  );
}