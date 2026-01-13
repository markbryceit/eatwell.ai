import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { X, Printer, Download, Truck, ShoppingBag } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import GroceryDeliveryOptions from './GroceryDeliveryOptions';
import MealSelector from './MealSelector';

const categorizeIngredient = (ingredient) => {
    const lower = ingredient.toLowerCase();
    if (lower.includes('chicken') || lower.includes('beef') || lower.includes('pork') || 
        lower.includes('fish') || lower.includes('turkey') || lower.includes('salmon')) {
      return 'Protein';
    }
    if (lower.includes('lettuce') || lower.includes('tomato') || lower.includes('onion') || 
        lower.includes('carrot') || lower.includes('pepper') || lower.includes('spinach') ||
        lower.includes('broccoli') || lower.includes('cucumber')) {
      return 'Vegetables';
    }
    if (lower.includes('apple') || lower.includes('banana') || lower.includes('orange') || 
        lower.includes('berry') || lower.includes('grape') || lower.includes('lemon')) {
      return 'Fruits';
    }
    if (lower.includes('milk') || lower.includes('cheese') || lower.includes('yogurt') || 
        lower.includes('butter') || lower.includes('cream')) {
      return 'Dairy';
    }
    if (lower.includes('rice') || lower.includes('bread') || lower.includes('pasta') || 
        lower.includes('flour') || lower.includes('oats')) {
      return 'Grains';
    }
    return 'Other';
  };

export default function ShoppingList({ isOpen, onClose, mealPlan, recipes, selectedMeals }) {
  const [checkedItems, setCheckedItems] = useState({});
  const [activeTab, setActiveTab] = useState('select');
  const [finalSelectedMeals, setFinalSelectedMeals] = useState(selectedMeals || {});
  const [showList, setShowList] = useState(false);

  const shoppingList = useMemo(() => {
    if (!mealPlan || !recipes || !showList) return {};

    const ingredients = {};

    mealPlan.days.forEach((day, dayIndex) => {
      ['breakfast', 'lunch', 'dinner', 'snack'].forEach(mealType => {
        const key = `${dayIndex}-${mealType}`;
        // Only include selected meals
        if (!finalSelectedMeals[key]) return;

        const recipeId = day[`${mealType}_recipe_id`];
        if (recipeId) {
          const recipe = recipes.find(r => r.id === recipeId);
          if (recipe?.ingredients) {
            recipe.ingredients.forEach(ingredient => {
              const ingKey = ingredient.toLowerCase().trim();
              if (ingredients[ingKey]) {
                ingredients[ingKey].count++;
              } else {
                ingredients[ingKey] = {
                  name: ingredient,
                  count: 1,
                  category: categorizeIngredient(ingredient)
                };
              }
            });
          }
        }
      });
    });

    // Group by category
    const grouped = {};
    Object.values(ingredients).forEach(item => {
      if (!grouped[item.category]) {
        grouped[item.category] = [];
      }
      grouped[item.category].push(item);
    });

    return grouped;
  }, [mealPlan, recipes, finalSelectedMeals, showList]);

  const handleGenerateList = (selections) => {
    setFinalSelectedMeals(selections);
    setShowList(true);
    setActiveTab('list');
  };

  const toggleItem = (ingredient) => {
    setCheckedItems(prev => ({
      ...prev,
      [ingredient]: !prev[ingredient]
    }));
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    let text = '🛒 Shopping List\n\n';
    Object.entries(shoppingList).forEach(([category, items]) => {
      text += `${category}:\n`;
      items.forEach(item => {
        text += `  • ${item.name}${item.count > 1 ? ` (needed ${item.count}x)` : ''}\n`;
      });
      text += '\n';
    });

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'shopping-list.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalItems = Object.values(shoppingList).reduce((sum, items) => sum + items.length, 0);
  const checkedCount = Object.values(checkedItems).filter(Boolean).length;

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-3xl max-h-[85vh] overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-slate-200">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Shopping List</h2>
              <p className="text-slate-500 mt-1">
                {checkedCount} of {totalItems} items
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={handlePrint}>
                <Printer className="w-5 h-5" />
              </Button>
              <Button variant="outline" size="icon" onClick={handleDownload}>
                <Download className="w-5 h-5" />
              </Button>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="mx-6 mt-4">
              <TabsTrigger value="select" className="flex-1 flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" />
                Select Meals
              </TabsTrigger>
              <TabsTrigger value="list" className="flex-1" disabled={!showList}>My List</TabsTrigger>
              <TabsTrigger value="delivery" className="flex-1 flex items-center gap-2" disabled={!showList}>
                <Truck className="w-4 h-4" />
                Order Online
              </TabsTrigger>
            </TabsList>

            {/* Content */}
            <TabsContent value="select" className="p-6 overflow-y-auto flex-1">
              <MealSelector
                mealPlan={mealPlan}
                recipes={recipes}
                onGenerateList={handleGenerateList}
              />
            </TabsContent>

            <TabsContent value="list" className="p-6 overflow-y-auto flex-1">
            {totalItems > 0 ? (
              <div className="space-y-6">
                {Object.entries(shoppingList).map(([category, items]) => (
                  <div key={category}>
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      {category}
                      <Badge variant="outline">{items.length}</Badge>
                    </h3>
                    <div className="space-y-2">
                      {items.map((item) => (
                        <div
                          key={item.name}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors"
                        >
                          <Checkbox
                            checked={checkedItems[item.name] || false}
                            onCheckedChange={() => toggleItem(item.name)}
                          />
                          <span className={`flex-1 ${
                            checkedItems[item.name] ? 'line-through text-slate-400' : 'text-slate-700'
                          }`}>
                            {item.name}
                          </span>
                          {item.count > 1 && (
                            <Badge variant="secondary" className="text-xs">
                              {item.count}x
                            </Badge>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🛒</div>
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Items Yet</h3>
                <p className="text-slate-500">
                  Add some recipes to your meal plan to generate a shopping list
                </p>
              </div>
            )}
            </TabsContent>

            <TabsContent value="delivery" className="p-6 overflow-y-auto flex-1">
              <GroceryDeliveryOptions 
                shoppingList={shoppingList}
                onClose={onClose}
              />
            </TabsContent>
          </Tabs>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}