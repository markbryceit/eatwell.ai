import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ShoppingCart, RefreshCw, Download, CheckCheck, ShoppingBag } from 'lucide-react';
import AppNavigation from '@/components/dashboard/AppNavigation';
import MobileNav from '@/components/dashboard/MobileNav';
import AuthGuard from '@/components/AuthGuard';
import { toast } from 'sonner';

export default function GroceryList() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const weekStartStr = format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');

  const { data: groceryLists, isLoading } = useQuery({
    queryKey: ['groceryList', user?.email, weekStartStr],
    queryFn: () => base44.entities.GroceryList.filter({ created_by: user.email, week_start_date: weekStartStr }),
    enabled: !!user
  });

  const groceryList = groceryLists?.[0] || null;
  const items = groceryList?.items || [];
  const purchasedCount = items.filter(i => i.purchased).length;

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await base44.functions.invoke('generateGroceryList', {});
      queryClient.invalidateQueries({ queryKey: ['groceryList'] });
      toast.success('Grocery list generated!');
    } catch (e) {
      toast.error('Failed to generate grocery list');
    }
    setIsGenerating(false);
  };

  const toggleItem = useMutation({
    mutationFn: async ({ index, purchased }) => {
      const updatedItems = items.map((item, i) =>
        i === index ? { ...item, purchased } : item
      );
      await base44.entities.GroceryList.update(groceryList.id, { items: updatedItems });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groceryList'] })
  });

  const markAllPurchased = useMutation({
    mutationFn: async () => {
      const updatedItems = items.map(item => ({ ...item, purchased: true }));
      await base44.entities.GroceryList.update(groceryList.id, { items: updatedItems });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['groceryList'] })
  });

  const syncToPantry = useMutation({
    mutationFn: async () => {
      const purchasedIngredients = items
        .filter(i => i.purchased)
        .map(i => i.ingredient);

      if (purchasedIngredients.length === 0) {
        throw new Error('No purchased items to sync');
      }

      const pantryRecords = await base44.entities.Pantry.filter({ created_by: user.email });
      const existing = pantryRecords[0];
      const currentIngredients = existing?.ingredients || [];

      // Merge without duplicates (case-insensitive)
      const lowerExisting = currentIngredients.map(i => i.toLowerCase());
      const newIngredients = purchasedIngredients.filter(
        i => !lowerExisting.includes(i.toLowerCase())
      );
      const merged = [...currentIngredients, ...newIngredients];

      if (existing) {
        await base44.entities.Pantry.update(existing.id, { ingredients: merged });
      } else {
        await base44.entities.Pantry.create({ ingredients: merged });
      }

      return newIngredients.length;
    },
    onSuccess: (added) => {
      toast.success(`Added ${added} new ingredient${added !== 1 ? 's' : ''} to your pantry!`);
    },
    onError: (e) => toast.error(e.message)
  });

  const exportList = () => {
    const unpurchased = items.filter(i => !i.purchased);
    const purchased = items.filter(i => i.purchased);
    let text = `Grocery List — Week of ${weekStartStr}\n\n`;
    text += `TO BUY (${unpurchased.length}):\n`;
    unpurchased.forEach(item => {
      text += `☐ ${item.ingredient}`;
      if (item.recipe_names?.length) text += ` (${item.recipe_names.join(', ')})`;
      text += '\n';
    });
    if (purchased.length > 0) {
      text += `\nALREADY PURCHASED (${purchased.length}):\n`;
      purchased.forEach(item => { text += `✓ ${item.ingredient}\n`; });
    }
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `grocery-list-${weekStartStr}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const unpurchasedItems = items.filter(i => !i.purchased);
  const purchasedItems = items.filter(i => i.purchased);

  return (
    <AuthGuard requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Grocery List</h1>
              <p className="text-slate-500">Missing ingredients from your meal plan</p>
            </div>
            <AppNavigation currentPage="GroceryList" />
          </div>

          {/* Action Bar */}
          <div className="flex flex-wrap gap-3 mb-6">
            <Button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
              {groceryList ? 'Regenerate' : 'Generate from Meal Plan'}
            </Button>

            {groceryList && items.length > 0 && (
              <>
                <Button
                  variant="outline"
                  onClick={() => markAllPurchased.mutate()}
                  disabled={markAllPurchased.isPending || purchasedCount === items.length}
                  className="rounded-xl"
                >
                  <CheckCheck className="w-4 h-4 mr-2" />
                  Mark All
                </Button>
                <Button
                  variant="outline"
                  onClick={exportList}
                  className="rounded-xl"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Export .txt
                </Button>
                {purchasedCount > 0 && (
                  <Button
                    onClick={() => syncToPantry.mutate()}
                    disabled={syncToPantry.isPending}
                    className="bg-teal-600 hover:bg-teal-700 rounded-xl"
                  >
                    {syncToPantry.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingBag className="w-4 h-4 mr-2" />}
                    Add Purchased to Pantry ({purchasedCount})
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Progress bar */}
          {groceryList && items.length > 0 && (
            <Card className="mb-6 border-0 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-slate-700">
                    {purchasedCount} of {items.length} items purchased
                  </span>
                  <Badge variant={purchasedCount === items.length ? 'default' : 'outline'} className={purchasedCount === items.length ? 'bg-emerald-600' : ''}>
                    {Math.round((purchasedCount / items.length) * 100)}%
                  </Badge>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className="bg-emerald-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${(purchasedCount / items.length) * 100}%` }}
                  />
                </div>
              </CardContent>
            </Card>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-slate-400" />
            </div>
          ) : !groceryList ? (
            <Card className="border-0 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-16 text-center">
                <ShoppingCart className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">No Grocery List Yet</h3>
                <p className="text-slate-400 mb-6 max-w-sm mx-auto">
                  Generate a list from your current meal plan. Items already in your pantry will be excluded automatically.
                </p>
                <Button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <ShoppingCart className="w-4 h-4 mr-2" />}
                  Generate Grocery List
                </Button>
              </CardContent>
            </Card>
          ) : items.length === 0 ? (
            <Card className="border-0 shadow-sm bg-white rounded-2xl">
              <CardContent className="p-16 text-center">
                <CheckCheck className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-slate-700 mb-2">You have everything!</h3>
                <p className="text-slate-400">All ingredients for your meal plan are already in your pantry.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* To Buy */}
              {unpurchasedItems.length > 0 && (
                <Card className="border-0 shadow-sm bg-white rounded-2xl">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <ShoppingCart className="w-5 h-5 text-emerald-600" />
                      <span className="font-semibold text-slate-800">To Buy</span>
                      <Badge className="bg-emerald-100 text-emerald-700 border-0">{unpurchasedItems.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="divide-y divide-slate-50">
                      {unpurchasedItems.map((item, idx) => {
                        const realIndex = items.indexOf(item);
                        return (
                          <div key={realIndex} className="flex items-start gap-3 py-3">
                            <Checkbox
                              checked={false}
                              onCheckedChange={(checked) => toggleItem.mutate({ index: realIndex, purchased: !!checked })}
                              className="mt-0.5"
                            />
                            <div className="flex-1 min-w-0">
                              <p className="text-slate-800 text-sm font-medium">{item.ingredient}</p>
                              {item.recipe_names?.length > 0 && (
                                <p className="text-slate-400 text-xs mt-0.5 truncate">
                                  Used in: {item.recipe_names.join(', ')}
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Purchased */}
              {purchasedItems.length > 0 && (
                <Card className="border-0 shadow-sm bg-slate-50 rounded-2xl opacity-80">
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-2">
                      <CheckCheck className="w-5 h-5 text-slate-400" />
                      <span className="font-semibold text-slate-500">Purchased</span>
                      <Badge variant="outline" className="text-slate-400">{purchasedItems.length}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="divide-y divide-slate-100">
                      {purchasedItems.map((item) => {
                        const realIndex = items.indexOf(item);
                        return (
                          <div key={realIndex} className="flex items-center gap-3 py-3">
                            <Checkbox
                              checked={true}
                              onCheckedChange={(checked) => toggleItem.mutate({ index: realIndex, purchased: !!checked })}
                            />
                            <p className="text-slate-400 text-sm line-through">{item.ingredient}</p>
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>

        <MobileNav currentPage="GroceryList" />
      </div>
    </AuthGuard>
  );
}