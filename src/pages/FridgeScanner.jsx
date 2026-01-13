import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Camera, Upload, Loader2, Sparkles, CheckCircle2, ChefHat } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import RecipeCard from '@/components/recipes/RecipeCard';
import RecipeModal from '@/components/recipes/RecipeModal';
import { toast } from 'sonner';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export default function FridgeScanner() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [results, setResults] = useState(null);
  const [selectedRecipe, setSelectedRecipe] = useState(null);
  const fileInputRef = useRef(null);

  const { data: favorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FavoriteRecipe.filter({ created_by: currentUser.email });
    }
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

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setResults(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      // Upload image
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: selectedImage
      });

      // Analyze fridge contents
      const { data } = await base44.functions.invoke('analyzeFridge', {
        imageUrl: file_url
      });

      setResults(data);
      toast.success(`Found ${data.ingredients.length} ingredients!`);
    } catch (error) {
      toast.error('Failed to analyze fridge');
      console.error(error);
    }
    setIsAnalyzing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <RecipeModal
        recipe={selectedRecipe}
        isOpen={!!selectedRecipe}
        onClose={() => setSelectedRecipe(null)}
        isFavorite={selectedRecipe ? isFavorite(selectedRecipe.id) : false}
        onToggleFavorite={() => {
          if (selectedRecipe) toggleFavorite.mutate(selectedRecipe.id);
        }}
      />

      <div className="max-w-6xl mx-auto px-4 py-8 w-full overflow-x-hidden box-border">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8 w-full max-w-full">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="rounded-xl"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-2">
              <Camera className="w-8 h-8 text-emerald-500" />
              Fridge Scanner
            </h1>
            <p className="text-slate-500">Find recipes based on what you have</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-6 w-full max-w-full">
          {/* Upload Section */}
          <div className="space-y-6 min-w-0">
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Upload className="w-5 h-5 text-emerald-500" />
                  Upload Fridge Photo
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageSelect}
                  className="hidden"
                />

                {!imagePreview ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer hover:border-emerald-300 hover:bg-emerald-50/50 transition-all"
                  >
                    <Camera className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                    <p className="text-slate-600 font-medium mb-2">Take or upload a photo</p>
                    <p className="text-slate-400 text-sm">Click to capture fridge contents</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-2xl overflow-hidden">
                      <img
                        src={imagePreview}
                        alt="Fridge preview"
                        className="w-full h-auto"
                      />
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => {
                          setSelectedImage(null);
                          setImagePreview(null);
                          setResults(null);
                        }}
                        className="absolute top-4 right-4 rounded-xl"
                      >
                        Change Photo
                      </Button>
                    </div>

                    <Button
                      onClick={handleAnalyze}
                      disabled={isAnalyzing}
                      className="w-full h-12 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                    >
                      {isAnalyzing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Analyze Ingredients
                        </>
                      )}
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Detected Ingredients */}
            {results && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-white rounded-2xl shadow-sm border-0">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      Detected Ingredients ({results.ingredients.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(results.categories).map(([category, items]) => (
                        items.length > 0 && (
                          <div key={category}>
                            <h4 className="text-sm font-semibold text-slate-700 mb-2 capitalize">
                              {category}
                            </h4>
                            <div className="flex flex-wrap gap-2">
                              {items.map((item, idx) => (
                                <Badge key={idx} variant="secondary" className="bg-emerald-50 text-emerald-700">
                                  {item}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>

          {/* Recipe Suggestions */}
          <div className="space-y-6 min-w-0">
            {results?.suggestedRecipes?.length > 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl border-0 mb-4">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <ChefHat className="w-8 h-8" />
                      <div>
                        <h3 className="text-xl font-bold">Recipe Suggestions</h3>
                        <p className="text-emerald-100 text-sm">
                          {results.suggestedRecipes.length} recipes you can make
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="space-y-4">
                  <AnimatePresence>
                    {results.suggestedRecipes.map((match, idx) => (
                      <motion.div
                        key={match.recipe.id}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: idx * 0.1 }}
                      >
                        <Card className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden hover:shadow-lg transition-shadow cursor-pointer">
                          <div onClick={() => setSelectedRecipe(match.recipe)}>
                            <CardContent className="p-4">
                              <div className="flex gap-4">
                                {match.recipe.image_url && (
                                  <img
                                    src={match.recipe.image_url}
                                    alt={match.recipe.name}
                                    className="w-20 h-20 rounded-xl object-cover"
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2 mb-2">
                                    <h4 className="font-semibold text-slate-900 line-clamp-1">
                                      {match.recipe.name}
                                    </h4>
                                    <Badge className="bg-emerald-100 text-emerald-700 border-0 shrink-0">
                                      {match.matchPercentage}% match
                                    </Badge>
                                  </div>
                                  <p className="text-sm text-slate-500 mb-2">
                                    {match.matchedIngredients}/{match.totalIngredients} ingredients available
                                  </p>
                                  {match.missingIngredients.length > 0 && match.missingIngredients.length <= 3 && (
                                    <p className="text-xs text-slate-400">
                                      Missing: {match.missingIngredients.slice(0, 3).join(', ')}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </motion.div>
            ) : results ? (
              <Card className="bg-white rounded-2xl shadow-sm border-0 p-12 text-center">
                <ChefHat className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Recipes Found</h3>
                <p className="text-slate-500">
                  We couldn't find recipes matching your ingredients. Try adding more items or check the recipe library.
                </p>
              </Card>
            ) : (
              <Card className="bg-white rounded-2xl shadow-sm border-0 p-12 text-center">
                <Camera className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">Upload Your Fridge</h3>
                <p className="text-slate-500">
                  Take a photo of your fridge contents and we'll suggest recipes you can make
                </p>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}