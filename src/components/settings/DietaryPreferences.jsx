import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';

const eatingStyles = [
  "Low Carb", "High Protein", "Keto", "Vegan", "Vegetarian",
  "Paleo", "Mediterranean", "Pescatarian", "Flexitarian"
];

const commonAllergies = [
  "Gluten", "Dairy", "Shellfish", "Nuts", "Peanuts",
  "Eggs", "Soy", "Fish"
];

export default function DietaryPreferences({ profile, onSave }) {
  const [eatingStyle, setEatingStyle] = useState(profile?.eating_style || []);
  const [allergies, setAllergies] = useState(profile?.allergies || []);
  const [dislikedFoods, setDislikedFoods] = useState(profile?.disliked_foods || []);
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
      await onSave({
        eating_style: eatingStyle,
        allergies: allergies,
        disliked_foods: dislikedFoods
      });
      toast.success('Dietary preferences updated');
    } catch (error) {
      toast.error('Failed to update preferences');
    }
    setIsSaving(false);
  };

  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0">
      <CardHeader>
        <CardTitle>Dietary Preferences</CardTitle>
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

        {/* Save Button */}
        <Button
          onClick={handleSave}
          disabled={isSaving}
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl"
        >
          {isSaving ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Save className="w-4 h-4 mr-2" />
          )}
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
}