import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Search, Heart, Clock, Users, Sparkles } from 'lucide-react';
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeModal from '@/components/recipes/RecipeModal';

const CATEGORIES = [
  { id: 'main', label: 'Main Meals', icon: '🍽️', description: 'Nutritious dinners kids will love' },
  { id: 'lunchbox', label: 'Lunch Box Ideas', icon: '🎒', description: 'Perfect for school lunches' },
  { id: 'snacks', label: 'Healthy Snacks', icon: '🍎', description: 'Quick and nutritious bites' },
  { id: 'breakfast', label: 'Breakfast', icon: '🥞', description: 'Start the day right' },
  { id: 'quick', label: 'Quick & Easy', icon: '⚡', description: 'Ready in 15-20 minutes' }
];

export default function KidsMeals() {
  const queryClient = useQueryClient();
  const [activeCategory, setActiveCategory] = useState('main');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRecipe, setSelectedRecipe] = useState(null);

  // Fetch all recipes
  const { data: recipes, isLoading } = useQuery({
    queryKey: ['recipes'],
    queryFn: () => base44.entities.Recipe.list(),
    staleTime: 10 * 60 * 1000
  });

  // Fetch favorites
  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FavoriteRecipe.filter({ created_by: currentUser.email });
    },
    staleTime: 2 * 60 * 1000
  });

  const toggleFavorite = useMutation({
    mutationFn: async (recipeId) => {
      const existing = favorites?.find(f => f.recipe_id === recipeId);
      if (existing) {
        await base44.entities.FavoriteRecipe.delete(existing.id);
      } else {
        await base44.entities.FavoriteRecipe.create({ recipe_id: recipeId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['favorites'] })
  });

  const isFavorite = (recipeId) => favorites?.some(f => f.recipe_id === recipeId);

  // Filter recipes for kid-friendly criteria
  const getKidFriendlyRecipes = () => {
    if (!recipes) return [];
    
    return recipes.filter(recipe => {
      // Basic filters for kid-friendly
      const isSimple = (recipe.prep_time_mins || 0) + (recipe.cook_time_mins || 0) <= 45;
      const notTooSpicy = !recipe.name?.toLowerCase().includes('spicy') && 
                          !recipe.description?.toLowerCase().includes('spicy');
      
      return isSimple && notTooSpicy;
    });
  };

  const filterByCategory = (recipes) => {
    if (!recipes) return [];
    
    let filtered = recipes;
    
    switch (activeCategory) {
      case 'main':
        filtered = recipes.filter(r => 
          ['lunch', 'dinner'].includes(r.meal_type) && 
          (r.protein_g || 0) >= 15
        );
        break;
      case 'lunchbox':
        filtered = recipes.filter(r => 
          ['snack', 'lunch'].includes(r.meal_type) && 
          (r.prep_time_mins || 0) + (r.cook_time_mins || 0) <= 20
        );
        break;
      case 'snacks':
        filtered = recipes.filter(r => 
          r.meal_type === 'snack' || 
          (r.calories || 0) < 250
        );
        break;
      case 'breakfast':
        filtered = recipes.filter(r => r.meal_type === 'breakfast');
        break;
      case 'quick':
        filtered = recipes.filter(r => 
          (r.prep_time_mins || 0) + (r.cook_time_mins || 0) <= 20
        );
        break;
      default:
        filtered = recipes;
    }

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(r =>
        r.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return filtered;
  };

  const kidFriendlyRecipes = getKidFriendlyRecipes();
  const filteredRecipes = filterByCategory(kidFriendlyRecipes);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50">
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        isFavorite={selectedRecipe ? isFavorite(selectedRecipe.id) : false}
        onToggleFavorite={() => {
          if (selectedRecipe) toggleFavorite.mutate(selectedRecipe.id);
        }}
      />

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
                Kid-Friendly Meals
                <span className="text-3xl">👶</span>
              </h1>
              <p className="text-slate-500 mt-1">
                Healthy recipes children will actually eat
              </p>
            </div>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white p-6 rounded-2xl border-0">
            <div className="text-3xl mb-2">🥗</div>
            <h3 className="font-semibold text-lg mb-1">Nutritious & Balanced</h3>
            <p className="text-pink-100 text-sm">
              Every recipe packed with vitamins, protein, and healthy carbs
            </p>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-violet-500 text-white p-6 rounded-2xl border-0">
            <div className="text-3xl mb-2">⚡</div>
            <h3 className="font-semibold text-lg mb-1">Quick & Simple</h3>
            <p className="text-purple-100 text-sm">
              Most recipes ready in under 30 minutes for busy parents
            </p>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white p-6 rounded-2xl border-0">
            <div className="text-3xl mb-2">😋</div>
            <h3 className="font-semibold text-lg mb-1">Kid-Approved</h3>
            <p className="text-blue-100 text-sm">
              Familiar flavors and fun presentations kids love
            </p>
          </Card>
        </div>

        {/* Search */}
        <div className="mb-6">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <Input
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 rounded-2xl bg-white border-0 shadow-sm"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="mb-8">
          <div className="flex flex-wrap gap-3">
            {CATEGORIES.map((category) => (
              <button
                key={category.id}
                onClick={() => setActiveCategory(category.id)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-medium transition-all ${
                  activeCategory === category.id
                    ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg scale-105'
                    : 'bg-white text-slate-700 hover:bg-slate-50 shadow-sm'
                }`}
              >
                <span className="text-xl">{category.icon}</span>
                <span>{category.label}</span>
              </button>
            ))}
          </div>
          <p className="text-slate-500 text-sm mt-3">
            {CATEGORIES.find(c => c.id === activeCategory)?.description}
          </p>
        </div>

        {/* Results Count */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-slate-900">
            {filteredRecipes.length} Recipes Found
          </h2>
          <Badge variant="outline" className="bg-white">
            {kidFriendlyRecipes.length} total kid-friendly recipes
          </Badge>
        </div>

        {/* Recipes Grid */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="w-12 h-12 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filteredRecipes.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredRecipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                isFavorite={isFavorite(recipe.id)}
                onToggleFavorite={() => toggleFavorite.mutate(recipe.id)}
                onCardClick={() => setSelectedRecipe(recipe)}
              />
            ))}
          </div>
        ) : (
          <Card className="bg-white rounded-2xl p-12 text-center border-0">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-slate-900 mb-2">
              No recipes found
            </h3>
            <p className="text-slate-500 mb-6">
              Try adjusting your search or selecting a different category
            </p>
            <Button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('main');
              }}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              Clear Filters
            </Button>
          </Card>
        )}

        {/* Nutrition Education for Kids */}
        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-emerald-200 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-3 flex items-center gap-2">
            <span className="text-2xl">🎓</span>
            Teach Your Kids About Nutrition
          </h3>
          <p className="text-slate-600 text-sm mb-6">
            Simple lessons to help children understand why healthy eating matters
          </p>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl">💪</span>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Food is Energy</h4>
                  <p className="text-sm text-slate-600">
                    "Food is like fuel for your body - it helps you run, jump, and play all day! Healthy foods give you more energy than sweets."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🌈</span>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Eat the Rainbow</h4>
                  <p className="text-sm text-slate-600">
                    "Different colored foods give your body different vitamins. Try to eat all the colors of the rainbow each day!"
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🦴</span>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Strong Bones & Teeth</h4>
                  <p className="text-sm text-slate-600">
                    "Milk, cheese, and yogurt have calcium that makes your bones and teeth super strong - just like a superhero!"
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🧠</span>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Brain Food</h4>
                  <p className="text-sm text-slate-600">
                    "Fish, eggs, and nuts help your brain work better - they help you think, learn, and remember things at school!"
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl">💧</span>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Water is Magic</h4>
                  <p className="text-sm text-slate-600">
                    "Your body is mostly water! Drinking water keeps you healthy, helps you focus, and is better than sugary drinks."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🍬</span>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Treats Are Sometimes Food</h4>
                  <p className="text-sm text-slate-600">
                    "Sweets and treats are okay sometimes, but healthy foods should be your everyday choice because they make you feel better."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🥕</span>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Try New Foods</h4>
                  <p className="text-sm text-slate-600">
                    "It's fun to be a food explorer! Sometimes you need to taste something a few times before you know if you like it."
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-4 border-2 border-emerald-100">
              <div className="flex items-start gap-3">
                <span className="text-3xl">🍽️</span>
                <div>
                  <h4 className="font-semibold text-slate-900 mb-1">Listen to Your Tummy</h4>
                  <p className="text-sm text-slate-600">
                    "Eat when you're hungry and stop when you're full. Your body is smart and will tell you what it needs!"
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>

        {/* Tips Section */}
        <Card className="bg-gradient-to-br from-amber-50 to-orange-50 border-amber-200 rounded-2xl p-6 mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-600" />
            Tips for Parents
          </h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-700">
            <div className="flex gap-3">
              <span className="text-xl">🎨</span>
              <div>
                <strong>Make it fun:</strong> Use cookie cutters for sandwiches and arrange food in fun shapes
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">👩‍🍳</span>
              <div>
                <strong>Involve them:</strong> Let kids help with simple tasks like mixing or arranging toppings
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">🌈</span>
              <div>
                <strong>Add color:</strong> Include colorful fruits and vegetables to make meals visually appealing
              </div>
            </div>
            <div className="flex gap-3">
              <span className="text-xl">⏰</span>
              <div>
                <strong>Meal prep:</strong> Prepare lunch box items the night before to save morning stress
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}