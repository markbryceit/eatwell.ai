import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2, Star, Clock, Flame } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function RecipeDiscovery({ onSelectRecipe, selectedMealType }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState(null);
  const [isSearching, setIsSearching] = useState(false);

  const { data: allRecipes } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list(),
    staleTime: 10 * 60 * 1000
  });

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FavoriteRecipe.filter({ created_by: currentUser.email });
    },
    staleTime: 5 * 60 * 1000
  });

  // Show favorites first, then filter by meal type and search
  const filteredRecipes = allRecipes?.filter(recipe => {
    const matchesMealType = !selectedMealType || recipe.meal_type === selectedMealType;
    const matchesSearch = !searchQuery || 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMealType && matchesSearch;
  }).sort((a, b) => {
    const aIsFav = favorites?.some(f => f.recipe_id === a.id);
    const bIsFav = favorites?.some(f => f.recipe_id === b.id);
    if (aIsFav && !bIsFav) return -1;
    if (!aIsFav && bIsFav) return 1;
    return 0;
  }).slice(0, 20) || [];

  const handleSmartSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    try {
      const { data } = await base44.functions.invoke('smartRecipeSearch', {
        query: searchQuery,
        meal_type: selectedMealType
      });
      setSearchResults(data.recipes || []);
    } catch (error) {
      console.error('Smart search failed:', error);
      setSearchResults([]);
    }
    setIsSearching(false);
  };

  const displayRecipes = searchResults || filteredRecipes;
  const isFavorite = (recipeId) => favorites?.some(f => f.recipe_id === recipeId);

  return (
    <div className="space-y-3">
      <Input
        placeholder="Search recipes..."
        value={searchQuery}
        onChange={(e) => {
          setSearchQuery(e.target.value);
          setSearchResults(null);
        }}
        onKeyPress={(e) => e.key === 'Enter' && searchQuery.trim() && handleSmartSearch()}
        className="w-full"
      />

      <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
        {displayRecipes.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            {searchQuery ? 'No recipes found' : `Search or browse ${selectedMealType || 'recipes'}`}
          </div>
        ) : (
          displayRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className="w-full p-3 bg-white border border-slate-200 hover:border-violet-300 hover:bg-violet-50/50 rounded-xl text-left transition-all group"
            >
              <div className="flex gap-3">
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-14 h-14 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 text-sm group-hover:text-violet-700 transition-colors">
                      {recipe.name}
                      {isFavorite(recipe.id) && (
                        <Star className="w-3 h-3 inline ml-1 text-amber-500 fill-amber-500" />
                      )}
                    </h4>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1 font-medium text-orange-600">
                      <Flame className="w-3 h-3" />
                      {recipe.calories}
                    </span>
                    <span>P:{recipe.protein_g}g</span>
                    <span>C:{recipe.carbs_g}g</span>
                    <span>F:{recipe.fat_g}g</span>
                  </div>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}