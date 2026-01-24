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

  const filteredRecipes = allRecipes?.filter(recipe => {
    const matchesMealType = !selectedMealType || recipe.meal_type === selectedMealType;
    const matchesSearch = !searchQuery || 
      recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      recipe.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesMealType && matchesSearch;
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
    <div className="space-y-4">
      <div className="flex gap-2">
        <Input
          placeholder="Search recipes or describe what you want..."
          value={searchQuery}
          onChange={(e) => {
            setSearchQuery(e.target.value);
            setSearchResults(null);
          }}
          onKeyPress={(e) => e.key === 'Enter' && handleSmartSearch()}
          className="flex-1"
        />
        <Button
          onClick={handleSmartSearch}
          disabled={isSearching || !searchQuery.trim()}
          className="bg-violet-600 hover:bg-violet-700"
        >
          {isSearching ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
        </Button>
      </div>

      {searchQuery && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setSearchQuery('');
            setSearchResults(null);
          }}
          className="text-xs"
        >
          Clear search
        </Button>
      )}

      <div className="max-h-96 overflow-y-auto space-y-2">
        {displayRecipes.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            {searchQuery ? 'No recipes found. Try a different search.' : 'Start typing to search recipes'}
          </div>
        ) : (
          displayRecipes.map((recipe) => (
            <button
              key={recipe.id}
              onClick={() => onSelectRecipe(recipe)}
              className="w-full p-3 bg-slate-50 hover:bg-slate-100 rounded-lg text-left transition-colors"
            >
              <div className="flex gap-3">
                {recipe.image_url && (
                  <img
                    src={recipe.image_url}
                    alt={recipe.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h4 className="font-semibold text-slate-900 truncate">
                      {recipe.name}
                      {isFavorite(recipe.id) && (
                        <Star className="w-3 h-3 inline ml-1 text-amber-500 fill-amber-500" />
                      )}
                    </h4>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {recipe.meal_type}
                    </Badge>
                  </div>
                  {recipe.description && (
                    <p className="text-xs text-slate-500 line-clamp-1 mb-2">
                      {recipe.description}
                    </p>
                  )}
                  <div className="flex items-center gap-3 text-xs text-slate-600">
                    <span className="flex items-center gap-1">
                      <Flame className="w-3 h-3 text-orange-500" />
                      {recipe.calories} kcal
                    </span>
                    {recipe.prep_time_mins && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {recipe.prep_time_mins + (recipe.cook_time_mins || 0)} min
                      </span>
                    )}
                    <span>P: {recipe.protein_g}g</span>
                    <span>C: {recipe.carbs_g}g</span>
                    <span>F: {recipe.fat_g}g</span>
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