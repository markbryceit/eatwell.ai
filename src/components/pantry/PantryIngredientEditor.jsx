import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Plus, X, ShoppingBag, Loader2, Camera } from 'lucide-react';
import { toast } from 'sonner';
import PantryPhotoScanner from './PantryPhotoScanner';

export default function PantryIngredientEditor({ pantry, isLoading, onUpdated }) {
  const [newIngredient, setNewIngredient] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  const ingredients = pantry?.ingredients || [];

  const save = async (updated) => {
    setIsSaving(true);
    try {
      if (pantry?.id) {
        await base44.entities.Pantry.update(pantry.id, { ingredients: updated });
      } else {
        await base44.entities.Pantry.create({ ingredients: updated });
      }
      onUpdated?.();
    } catch {
      toast.error('Failed to update pantry');
    }
    setIsSaving(false);
  };

  const handleAdd = async () => {
    const val = newIngredient.trim();
    if (!val) return;
    if (ingredients.map(i => i.toLowerCase()).includes(val.toLowerCase())) {
      toast.error('Already in your pantry');
      return;
    }
    await save([...ingredients, val]);
    setNewIngredient('');
  };

  const handleRemove = (ingredient) => {
    save(ingredients.filter(i => i !== ingredient));
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
  };

  const handlePhotoIngredients = async (newIngredients) => {
    const existingLower = ingredients.map(i => i.toLowerCase());
    const toAdd = newIngredients.filter(i => !existingLower.includes(i.toLowerCase()));
    if (toAdd.length > 0) {
      await save([...ingredients, ...toAdd]);
    }
    // Note: success toast is shown by PantryPhotoScanner after this resolves
  };

  return (
    <>
    {showScanner && (
      <PantryPhotoScanner
        existingIngredients={ingredients}
        onAddIngredients={handlePhotoIngredients}
        onClose={() => setShowScanner(false)}
      />
    )}
    <Card className="border-0 shadow-sm bg-white rounded-2xl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-slate-800">My Pantry</span>
            {ingredients.length > 0 && (
              <Badge className="bg-emerald-100 text-emerald-700 border-0">{ingredients.length}</Badge>
            )}
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowScanner(true)}
            className="rounded-lg text-xs gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
          >
            <Camera className="w-3.5 h-3.5" />
            Scan Photo
          </Button>
        </div>
        <p className="text-xs text-slate-400 mt-1">
          What's in your kitchen right now?
        </p>
      </CardHeader>
      <CardContent className="pt-0 space-y-3">
        {/* Add ingredient */}
        <div className="flex gap-2">
          <Input
            placeholder="e.g. chicken breast"
            value={newIngredient}
            onChange={e => setNewIngredient(e.target.value)}
            onKeyDown={handleKeyDown}
            className="rounded-lg text-sm"
            disabled={isSaving}
          />
          <Button
            size="icon"
            onClick={handleAdd}
            disabled={!newIngredient.trim() || isSaving}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-lg shrink-0"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </Button>
        </div>

        {/* Ingredient tags */}
        {isLoading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-slate-300" />
          </div>
        ) : ingredients.length === 0 ? (
          <p className="text-center text-slate-300 text-sm py-6">
            No ingredients yet — add some above!
          </p>
        ) : (
          <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
            {ingredients.map((ing, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 text-xs font-medium px-3 py-1.5 rounded-full group"
              >
                {ing}
                <button
                  onClick={() => handleRemove(ing)}
                  className="text-slate-400 hover:text-red-500 transition-colors ml-1"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
}