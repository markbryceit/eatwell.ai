import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Loader2, ShoppingBag, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const SUGGESTIONS = [
  'chicken breast', 'eggs', 'rice', 'pasta', 'olive oil', 'garlic', 'onion',
  'tomatoes', 'spinach', 'salmon', 'Greek yogurt', 'oats', 'sweet potato',
  'broccoli', 'lemon', 'cheddar cheese', 'butter', 'milk', 'bread', 'canned tuna'
];

export default function PantryPanel({ user, onSearchPantry, isSearching, pantryResultCount }) {
  const queryClient = useQueryClient();
  const [inputValue, setInputValue] = useState('');

  const { data: pantryRecords } = useQuery({
    queryKey: ['pantry', user?.email],
    queryFn: () => base44.entities.Pantry.filter({ created_by: user.email }),
    enabled: !!user
  });

  const pantry = pantryRecords?.[0];
  const ingredients = pantry?.ingredients || [];

  const savePantry = useMutation({
    mutationFn: async (newIngredients) => {
      if (pantry?.id) {
        await base44.entities.Pantry.update(pantry.id, { ingredients: newIngredients });
      } else {
        await base44.entities.Pantry.create({ ingredients: newIngredients });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pantry'] })
  });

  const addIngredient = (name) => {
    const trimmed = name.trim().toLowerCase();
    if (!trimmed || ingredients.includes(trimmed)) return;
    const updated = [...ingredients, trimmed];
    savePantry.mutate(updated);
    setInputValue('');
  };

  const removeIngredient = (name) => {
    const updated = ingredients.filter(i => i !== name);
    savePantry.mutate(updated);
  };

  const clearAll = () => {
    savePantry.mutate([]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && inputValue.trim()) {
      addIngredient(inputValue);
    }
  };

  const unusedSuggestions = SUGGESTIONS.filter(s => !ingredients.includes(s.toLowerCase())).slice(0, 8);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-emerald-100 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-4 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <ShoppingBag className="w-5 h-5" />
            <div>
              <h3 className="font-semibold">Ingredients on Hand</h3>
              <p className="text-emerald-100 text-xs">{ingredients.length} items in your pantry</p>
            </div>
          </div>
          {ingredients.length > 0 && (
            <button
              onClick={clearAll}
              className="text-emerald-200 hover:text-white text-xs underline"
            >
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Add input */}
        <div className="flex gap-2">
          <Input
            placeholder="e.g. chicken breast, rice..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rounded-xl border-slate-200 h-10"
          />
          <Button
            size="sm"
            onClick={() => addIngredient(inputValue)}
            disabled={!inputValue.trim() || savePantry.isPending}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl h-10 px-3 shrink-0"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>

        {/* Current pantry items */}
        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {ingredients.map((ing) => (
              <Badge
                key={ing}
                variant="secondary"
                className="bg-emerald-50 text-emerald-700 border border-emerald-200 pr-1 pl-2.5 py-1 rounded-lg flex items-center gap-1"
              >
                {ing}
                <button
                  onClick={() => removeIngredient(ing)}
                  className="ml-0.5 hover:text-emerald-900 rounded-full"
                >
                  <X className="w-3 h-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        {/* Suggestions */}
        {unusedSuggestions.length > 0 && ingredients.length < 5 && (
          <div>
            <p className="text-xs text-slate-400 mb-2">Quick add:</p>
            <div className="flex flex-wrap gap-1.5">
              {unusedSuggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => addIngredient(s)}
                  className="text-xs px-2.5 py-1 rounded-lg border border-dashed border-slate-300 text-slate-500 hover:border-emerald-400 hover:text-emerald-600 transition-colors"
                >
                  + {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Search button */}
        <Button
          onClick={() => onSearchPantry(ingredients)}
          disabled={ingredients.length === 0 || isSearching}
          className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4 mr-2" />
          )}
          {pantryResultCount !== null
            ? `Showing ${pantryResultCount} pantry recipes`
            : 'Find Recipes I Can Make'}
        </Button>
      </div>
    </div>
  );
}