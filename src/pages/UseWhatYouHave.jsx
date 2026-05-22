import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Leaf, Clock, Flame, ChefHat, Star, Plus, X, Sparkles, PackageOpen } from 'lucide-react';
import AppNavigation from '@/components/dashboard/AppNavigation';
import MobileNav from '@/components/dashboard/MobileNav';
import AuthGuard from '@/components/AuthGuard';
import { toast } from 'sonner';
import PantryIngredientEditor from '@/components/pantry/PantryIngredientEditor';
import UseWhatRecipeCard from '@/components/pantry/UseWhatRecipeCard';

export default function UseWhatYouHave() {
  const queryClient = useQueryClient();
  const [recipes, setRecipes] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const [expandedRecipe, setExpandedRecipe] = useState(null);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: pantryRecords, isLoading: pantryLoading } = useQuery({
    queryKey: ['pantry', user?.email],
    queryFn: () => base44.entities.Pantry.filter({ created_by: user.email }),
    enabled: !!user
  });

  const pantry = pantryRecords?.[0];
  const ingredients = pantry?.ingredients || [];

  const handleGenerate = async () => {
    if (ingredients.length === 0) {
      toast.error('Add some ingredients to your pantry first!');
      return;
    }
    setIsGenerating(true);
    setHasGenerated(false);
    setRecipes([]);
    setExpandedRecipe(null);
    try {
      const response = await base44.functions.invoke('useWhatYouHave', {});
      setRecipes(response.data.recipes || []);
      setHasGenerated(true);
      toast.success(`Found ${response.data.recipes?.length || 0} recipes you can make right now!`);
    } catch (e) {
      toast.error('Failed to generate recipes');
    }
    setIsGenerating(false);
  };

  const handlePantryUpdated = () => {
    queryClient.invalidateQueries({ queryKey: ['pantry'] });
    if (hasGenerated) {
      setHasGenerated(false);
      setRecipes([]);
    }
  };

  const mealTypeColor = {
    breakfast: 'bg-amber-100 text-amber-700',
    lunch: 'bg-sky-100 text-sky-700',
    dinner: 'bg-violet-100 text-violet-700',
    snack: 'bg-rose-100 text-rose-700',
  };

  const difficultyColor = {
    easy: 'bg-emerald-100 text-emerald-700',
    medium: 'bg-yellow-100 text-yellow-700',
    hard: 'bg-red-100 text-red-700',
  };

  return (
    <AuthGuard requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                <Leaf className="w-7 h-7 text-emerald-500" />
                Use What You Have
              </h1>
              <p className="text-slate-500 mt-1">AI-powered recipes from your pantry — no store trip needed</p>
            </div>
            <AppNavigation currentPage="UseWhatYouHave" />
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Left: Pantry Editor */}
            <div className="lg:col-span-1">
              <PantryIngredientEditor
                pantry={pantry}
                isLoading={pantryLoading}
                onUpdated={handlePantryUpdated}
              />

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isGenerating || ingredients.length === 0}
                className="w-full mt-4 bg-emerald-600 hover:bg-emerald-700 rounded-xl h-12 text-base font-semibold"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Finding recipes…
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    {hasGenerated ? 'Regenerate Recipes' : 'Find Recipes I Can Make'}
                  </>
                )}
              </Button>

              {ingredients.length === 0 && !pantryLoading && (
                <p className="text-center text-slate-400 text-xs mt-2">
                  Add at least one ingredient to get started
                </p>
              )}
            </div>

            {/* Right: Recipe Results */}
            <div className="lg:col-span-2">
              {isGenerating ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                  <div className="relative">
                    <Loader2 className="w-12 h-12 animate-spin text-emerald-400" />
                    <Leaf className="w-5 h-5 text-emerald-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                  </div>
                  <p className="text-slate-500 text-sm">Analysing your pantry and crafting recipes…</p>
                </div>
              ) : !hasGenerated ? (
                <Card className="border-0 shadow-sm bg-white rounded-2xl h-full">
                  <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                    <PackageOpen className="w-16 h-16 text-slate-200 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">Ready to cook?</h3>
                    <p className="text-slate-400 max-w-xs">
                      Add your pantry ingredients on the left, then hit the button to discover what you can make right now.
                    </p>
                  </CardContent>
                </Card>
              ) : recipes.length === 0 ? (
                <Card className="border-0 shadow-sm bg-white rounded-2xl">
                  <CardContent className="flex flex-col items-center justify-center py-24 text-center">
                    <ChefHat className="w-16 h-16 text-slate-200 mb-4" />
                    <h3 className="text-xl font-semibold text-slate-700 mb-2">Not enough to cook with</h3>
                    <p className="text-slate-400 max-w-xs">
                      Try adding more ingredients to your pantry for recipe suggestions.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {/* Summary bar */}
                  <div className="flex items-center justify-between bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600" />
                      <span className="text-emerald-800 text-sm font-medium">
                        {recipes.length} recipes found using your {ingredients.length} pantry ingredients
                      </span>
                    </div>
                    <Badge className="bg-emerald-600 text-white">Zero shopping needed</Badge>
                  </div>

                  {/* Recipe cards sorted by waste_score desc */}
                  {[...recipes]
                    .sort((a, b) => (b.waste_score || 0) - (a.waste_score || 0))
                    .map((recipe, idx) => (
                      <UseWhatRecipeCard
                        key={recipe.name || idx}
                        recipe={recipe}
                        isExpanded={expandedRecipe === idx}
                        onToggle={() => setExpandedRecipe(expandedRecipe === idx ? null : idx)}
                        mealTypeColor={mealTypeColor}
                        difficultyColor={difficultyColor}
                        pantryIngredients={ingredients}
                      />
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <MobileNav currentPage="UseWhatYouHave" />
      </div>
    </AuthGuard>
  );
}