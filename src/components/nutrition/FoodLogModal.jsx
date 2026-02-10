import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { X, Scan, Sparkles, Loader2, Plus, Check, BookOpen } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import BarcodeScanner from './BarcodeScanner';
import MacroRing from './MacroRing';
import RecipeDiscovery from './RecipeDiscovery';

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast', color: 'amber' },
  { value: 'lunch', label: 'Lunch', color: 'emerald' },
  { value: 'dinner', label: 'Dinner', color: 'violet' },
  { value: 'snack', label: 'Snack', color: 'rose' }
];

export default function FoodLogModal({ isOpen, onClose, onFoodLogged, defaultMealType, selectedDate }) {
  // Auto-detect meal type based on time of day
  const getDefaultMealType = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'breakfast';
    if (hour >= 11 && hour < 15) return 'lunch';
    if (hour >= 15 && hour < 18) return 'snack';
    return 'dinner';
  };

  const [activeTab, setActiveTab] = useState('manual');
  const [showScanner, setShowScanner] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state
  const [foodName, setFoodName] = useState('');
  const [brand, setBrand] = useState('');
  const [servingSize, setServingSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [mealType, setMealType] = useState(defaultMealType || getDefaultMealType());
  
  // Nutritional info
  const [nutritionData, setNutritionData] = useState(null);
  const [barcode, setBarcode] = useState('');
  const [source, setSource] = useState('manual');

  if (!isOpen) return null;

  const resetForm = () => {
    setFoodName('');
    setBrand('');
    setServingSize('');
    setQuantity(1);
    setNutritionData(null);
    setBarcode('');
    setSource('manual');
  };

  const handleRecipeSelect = async (recipe) => {
    setIsLoading(true);
    
    try {
      const foodLog = {
        date: selectedDate || new Date().toISOString().split('T')[0],
        meal_type: mealType,
        food_name: recipe.name,
        serving_size: `${recipe.servings || 1} serving(s)`,
        quantity: 1,
        calories: recipe.calories,
        protein_g: recipe.protein_g,
        carbs_g: recipe.carbs_g,
        fat_g: recipe.fat_g,
        fiber_g: recipe.fiber_g || 0,
        sugar_g: 0,
        sodium_mg: 0,
        source: 'recipe'
      };

      await base44.entities.FoodLog.create(foodLog);
      toast.success(`${recipe.name} logged!`);
      onFoodLogged();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error logging recipe:', error);
      toast.error('Failed to log recipe');
    }
    
    setIsLoading(false);
  };

  const handleBarcodeDetected = async (code) => {
    setShowScanner(false);
    setIsLoading(true);
    setBarcode(code);
    
    try {
      const { data } = await base44.functions.invoke('lookupFoodByBarcode', { barcode: code });
      
      if (data.found) {
        setFoodName(data.food_name);
        setBrand(data.brand || '');
        setServingSize(data.serving_size);
        setNutritionData({
          calories: data.calories,
          protein_g: data.protein_g,
          carbs_g: data.carbs_g,
          fat_g: data.fat_g,
          fiber_g: data.fiber_g,
          sugar_g: data.sugar_g,
          sodium_mg: data.sodium_mg
        });
        setSource('barcode');
        setActiveTab('manual');
        toast.success('Product found!');
      } else {
        toast.error('Product not found. Try manual entry.');
        setActiveTab('manual');
      }
    } catch (error) {
      toast.error('Failed to lookup barcode');
    }
    
    setIsLoading(false);
  };

  const handleAIEstimate = async () => {
    if (!foodName.trim()) {
      toast.error('Please enter a food name');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data } = await base44.functions.invoke('estimateFoodNutrition', {
        food_name: foodName,
        serving_size: servingSize || null,
        brand: brand || null
      });
      
      setNutritionData({
        calories: data.calories,
        protein_g: data.protein_g,
        carbs_g: data.carbs_g,
        fat_g: data.fat_g,
        fiber_g: data.fiber_g,
        sugar_g: data.sugar_g,
        sodium_mg: data.sodium_mg
      });
      setServingSize(data.serving_size);
      setSource('ai_estimate');
      
      toast.success(`Estimated with ${data.confidence} confidence`);
    } catch (error) {
      toast.error('Failed to estimate nutrition');
    }
    
    setIsLoading(false);
  };

  const handleLogFood = async () => {
    if (!foodName || !nutritionData) {
      toast.error('Please provide food name and nutritional information');
      return;
    }

    setIsLoading(true);
    
    try {
      const dateStr = selectedDate || new Date().toISOString().split('T')[0];
      const totalCalories = nutritionData.calories * quantity;

      // Create food log entry
      const foodLog = {
        date: dateStr,
        meal_type: mealType,
        food_name: foodName,
        brand: brand || null,
        serving_size: servingSize,
        quantity: quantity,
        calories: totalCalories,
        protein_g: nutritionData.protein_g * quantity,
        carbs_g: nutritionData.carbs_g * quantity,
        fat_g: nutritionData.fat_g * quantity,
        fiber_g: (nutritionData.fiber_g || 0) * quantity,
        sugar_g: (nutritionData.sugar_g || 0) * quantity,
        sodium_mg: (nutritionData.sodium_mg || 0) * quantity,
        barcode: barcode || null,
        source: source
      };

      await base44.entities.FoodLog.create(foodLog);

      // Update calorie log for the tracker
      const existingLogs = await base44.entities.CalorieLog.filter({ date: dateStr });
      const existingLog = existingLogs?.[0];

      if (existingLog) {
        const meals = existingLog.meals_logged || [];
        meals.push({
          meal_type: mealType,
          recipe_id: null,
          recipe_name: foodName,
          calories: totalCalories,
          completed: true
        });

        await base44.entities.CalorieLog.update(existingLog.id, {
          meals_logged: meals,
          calories_consumed: existingLog.calories_consumed + totalCalories
        });
      } else {
        // Get user profile for calorie target
        const user = await base44.auth.me();
        const profiles = await base44.entities.UserProfile.filter({ created_by: user.email });
        const profile = profiles?.[0];

        await base44.entities.CalorieLog.create({
          date: dateStr,
          meals_logged: [{
            meal_type: mealType,
            recipe_id: null,
            recipe_name: foodName,
            calories: totalCalories,
            completed: true
          }],
          calories_consumed: totalCalories,
          calorie_target: profile?.daily_calorie_target || 2000
        });
      }

      toast.success('Food logged successfully!');
      onFoodLogged();
      resetForm();
      onClose();
    } catch (error) {
      console.error('Error logging food:', error);
      toast.error('Failed to log food');
    }
    
    setIsLoading(false);
  };

  return (
    <>
      <BarcodeScanner
        isOpen={showScanner}
        onClose={() => setShowScanner(false)}
        onBarcodeDetected={handleBarcodeDetected}
      />

      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-40"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Log Food</h2>
                  <p className="text-emerald-100">Track your nutrition</p>
                </div>
                <button
                  onClick={onClose}
                  className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Meal Type Selection */}
              <div className="mb-6">
                <Label className="text-sm font-medium text-slate-700 mb-2 block">Meal Type</Label>
                <div className="grid grid-cols-4 gap-3">
                  {mealTypes.map((meal) => (
                    <button
                      key={meal.value}
                      onClick={() => setMealType(meal.value)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all ${
                        mealType === meal.value
                          ? `bg-${meal.color}-500 text-white`
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {meal.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Input Method Tabs */}
              <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
                <TabsList className="w-full grid grid-cols-3">
                  <TabsTrigger value="manual">Manual</TabsTrigger>
                  <TabsTrigger value="recipe">
                    <BookOpen className="w-4 h-4 mr-1" />
                    Recipe
                  </TabsTrigger>
                  <TabsTrigger value="barcode">
                    <Scan className="w-4 h-4 mr-1" />
                    Scan
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="manual" className="space-y-4 mt-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label>Food Name</Label>
                      <Input
                        value={foodName}
                        onChange={(e) => setFoodName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && foodName && handleAIEstimate()}
                        placeholder="e.g., Chicken Breast"
                        className="mt-1"
                        autoFocus
                      />
                    </div>

                    <div>
                      <Label>Brand (Optional)</Label>
                      <Input
                        value={brand}
                        onChange={(e) => setBrand(e.target.value)}
                        placeholder="e.g., Perdue"
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label>Serving</Label>
                      <Input
                        value={servingSize}
                        onChange={(e) => setServingSize(e.target.value)}
                        placeholder="100g, 1 cup"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={handleAIEstimate}
                    disabled={isLoading || !foodName}
                    className="w-full bg-violet-600 hover:bg-violet-700"
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4 mr-2" />
                    )}
                    Estimate with AI
                  </Button>
                </TabsContent>

                <TabsContent value="recipe" className="mt-4">
                  {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-12 gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
                      <p className="text-sm text-slate-500">Logging your meal...</p>
                    </div>
                  ) : (
                    <RecipeDiscovery
                      onSelectRecipe={handleRecipeSelect}
                      selectedMealType={mealType}
                    />
                  )}
                </TabsContent>

                <TabsContent value="barcode" className="mt-4">
                  <Button
                    onClick={() => setShowScanner(true)}
                    className="w-full h-32 bg-gradient-to-br from-emerald-500 to-teal-600"
                  >
                    <div className="flex flex-col items-center gap-2">
                      <Scan className="w-12 h-12" />
                      <span className="text-lg font-semibold">Scan Product Barcode</span>
                    </div>
                  </Button>
                </TabsContent>
              </Tabs>

              {/* Nutrition Display */}
              {nutritionData && (
                <div className="space-y-4 p-4 bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-2xl border border-slate-200">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-slate-900">Nutrition Estimate</h3>
                    <Check className="w-5 h-5 text-emerald-500" />
                  </div>

                  <div className="flex items-center justify-center">
                    <MacroRing
                      protein={nutritionData.protein_g * quantity}
                      carbs={nutritionData.carbs_g * quantity}
                      fat={nutritionData.fat_g * quantity}
                      size={100}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-2 text-center">
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <div className="text-[10px] text-slate-500 uppercase">Cal</div>
                      <div className="text-base font-bold text-orange-600">{Math.round(nutritionData.calories * quantity)}</div>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <div className="text-[10px] text-slate-500 uppercase">Pro</div>
                      <div className="text-base font-bold text-blue-600">{Math.round(nutritionData.protein_g * quantity)}g</div>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <div className="text-[10px] text-slate-500 uppercase">Carb</div>
                      <div className="text-base font-bold text-amber-600">{Math.round(nutritionData.carbs_g * quantity)}g</div>
                    </div>
                    <div className="p-2.5 bg-white rounded-lg shadow-sm">
                      <div className="text-[10px] text-slate-500 uppercase">Fat</div>
                      <div className="text-base font-bold text-rose-600">{Math.round(nutritionData.fat_g * quantity)}g</div>
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs">Quantity</Label>
                    <Input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={quantity}
                      onChange={(e) => setQuantity(parseFloat(e.target.value) || 1)}
                      className="mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-slate-100 flex gap-3">
              <Button
                variant="outline"
                onClick={() => {
                  resetForm();
                  onClose();
                }}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleLogFood}
                disabled={isLoading || !nutritionData}
                className="flex-1 bg-emerald-600 hover:bg-emerald-700"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4 mr-2" />
                )}
                Log Food
              </Button>
            </div>
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </>
  );
}