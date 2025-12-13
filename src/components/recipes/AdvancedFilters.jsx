import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function AdvancedFilters({ 
  filters, 
  onFiltersChange, 
  availableDietaryTags,
  onReset 
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [includeIngredient, setIncludeIngredient] = useState('');
  const [excludeIngredient, setExcludeIngredient] = useState('');

  const handleAddIngredient = (type, value) => {
    if (!value.trim()) return;
    
    const key = type === 'include' ? 'includeIngredients' : 'excludeIngredients';
    onFiltersChange({
      ...filters,
      [key]: [...filters[key], value.trim().toLowerCase()]
    });
    
    if (type === 'include') {
      setIncludeIngredient('');
    } else {
      setExcludeIngredient('');
    }
  };

  const handleRemoveIngredient = (type, ingredient) => {
    const key = type === 'include' ? 'includeIngredients' : 'excludeIngredients';
    onFiltersChange({
      ...filters,
      [key]: filters[key].filter(i => i !== ingredient)
    });
  };

  const toggleDietaryTag = (tag) => {
    const isSelected = filters.dietaryTags.includes(tag);
    onFiltersChange({
      ...filters,
      dietaryTags: isSelected 
        ? filters.dietaryTags.filter(t => t !== tag)
        : [...filters.dietaryTags, tag]
    });
  };

  const activeFiltersCount = 
    filters.includeIngredients.length +
    filters.excludeIngredients.length +
    filters.dietaryTags.length +
    (filters.maxPrepTime < 180 ? 1 : 0) +
    (filters.calorieRange[0] > 0 || filters.calorieRange[1] < 2000 ? 1 : 0);

  return (
    <Popover open={isExpanded} onOpenChange={setIsExpanded}>
      <PopoverTrigger asChild>
        <Button 
          variant="outline" 
          className="h-12 rounded-xl relative"
        >
          <Filter className="w-5 h-5 mr-2" />
          Advanced Filters
          {activeFiltersCount > 0 && (
            <Badge className="ml-2 bg-emerald-500 hover:bg-emerald-600 text-white">
              {activeFiltersCount}
            </Badge>
          )}
          {isExpanded ? (
            <ChevronUp className="w-4 h-4 ml-2" />
          ) : (
            <ChevronDown className="w-4 h-4 ml-2" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[500px] p-6" align="end">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onReset}
                className="text-slate-500 hover:text-slate-700"
              >
                Reset All
              </Button>
            )}
          </div>

          {/* Include Ingredients */}
          <div className="space-y-2">
            <Label>Must Include Ingredients</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., chicken, tomato"
                value={includeIngredient}
                onChange={(e) => setIncludeIngredient(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddIngredient('include', includeIngredient);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleAddIngredient('include', includeIngredient)}
                disabled={!includeIngredient.trim()}
              >
                Add
              </Button>
            </div>
            {filters.includeIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.includeIngredients.map((ingredient) => (
                  <Badge
                    key={ingredient}
                    variant="default"
                    className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                  >
                    {ingredient}
                    <button
                      onClick={() => handleRemoveIngredient('include', ingredient)}
                      className="ml-2 hover:text-emerald-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Exclude Ingredients */}
          <div className="space-y-2">
            <Label>Exclude Ingredients</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g., dairy, nuts"
                value={excludeIngredient}
                onChange={(e) => setExcludeIngredient(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleAddIngredient('exclude', excludeIngredient);
                  }
                }}
              />
              <Button
                type="button"
                size="sm"
                onClick={() => handleAddIngredient('exclude', excludeIngredient)}
                disabled={!excludeIngredient.trim()}
              >
                Add
              </Button>
            </div>
            {filters.excludeIngredients.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {filters.excludeIngredients.map((ingredient) => (
                  <Badge
                    key={ingredient}
                    variant="default"
                    className="bg-red-100 text-red-700 hover:bg-red-200"
                  >
                    {ingredient}
                    <button
                      onClick={() => handleRemoveIngredient('exclude', ingredient)}
                      className="ml-2 hover:text-red-900"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Dietary Tags */}
          {availableDietaryTags.length > 0 && (
            <div className="space-y-2">
              <Label>Dietary Tags</Label>
              <div className="flex flex-wrap gap-2">
                {availableDietaryTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant={filters.dietaryTags.includes(tag) ? "default" : "outline"}
                    className={`cursor-pointer ${
                      filters.dietaryTags.includes(tag)
                        ? 'bg-violet-500 hover:bg-violet-600 text-white'
                        : 'hover:bg-slate-100'
                    }`}
                    onClick={() => toggleDietaryTag(tag)}
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Preparation Time */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Max Preparation Time</Label>
              <span className="text-sm text-slate-600">
                {filters.maxPrepTime >= 180 ? 'Any' : `${filters.maxPrepTime} min`}
              </span>
            </div>
            <Slider
              value={[filters.maxPrepTime]}
              onValueChange={([value]) => onFiltersChange({ ...filters, maxPrepTime: value })}
              min={0}
              max={180}
              step={15}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>15 min</span>
              <span>1 hour</span>
              <span>3+ hours</span>
            </div>
          </div>

          {/* Calorie Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Calorie Range</Label>
              <span className="text-sm text-slate-600">
                {filters.calorieRange[0]}-{filters.calorieRange[1] >= 2000 ? '2000+' : filters.calorieRange[1]} kcal
              </span>
            </div>
            <Slider
              value={filters.calorieRange}
              onValueChange={(value) => onFiltersChange({ ...filters, calorieRange: value })}
              min={0}
              max={2000}
              step={50}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-slate-500">
              <span>0</span>
              <span>500</span>
              <span>1000</span>
              <span>1500</span>
              <span>2000+</span>
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}