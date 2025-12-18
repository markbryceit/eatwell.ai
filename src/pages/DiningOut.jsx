import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MapPin, Loader2, Download, ExternalLink, Camera, Save, Star, Bookmark } from 'lucide-react';
import { toast } from 'sonner';
import RestaurantCard from '@/components/diningout/RestaurantCard';
import MenuScanner from '@/components/diningout/MenuScanner';
import RestaurantMap from '@/components/diningout/RestaurantMap';

export default function DiningOut() {
  const queryClient = useQueryClient();
  const [isGenerating, setIsGenerating] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    hotelAddress: '',
    startDate: '',
    endDate: '',
    numDays: 1,
    mealTypes: ['breakfast', 'lunch', 'dinner']
  });
  const [recommendations, setRecommendations] = useState(null);

  // Fetch saved plans
  const { data: savedPlans } = useQuery({
    queryKey: ['diningPlans'],
    queryFn: () => base44.entities.DiningOutPlan.list()
  });

  // Fetch favorite restaurants
  const { data: favoriteRestaurants } = useQuery({
    queryKey: ['favoriteRestaurants'],
    queryFn: () => base44.entities.FavoriteRestaurant.list()
  });

  const savePlan = useMutation({
    mutationFn: async () => {
      if (!recommendations || !formData.location) return;
      
      await base44.entities.DiningOutPlan.create({
        location: formData.location,
        hotel_address: formData.hotelAddress,
        start_date: formData.startDate,
        end_date: formData.endDate,
        meal_types: formData.mealTypes,
        recommendations: recommendations.restaurants || []
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['diningPlans'] });
      toast.success('Plan saved!');
    }
  });

  const toggleFavorite = useMutation({
    mutationFn: async (restaurant) => {
      const existing = favoriteRestaurants?.find(f => f.name === restaurant.name && f.location === formData.location);
      
      if (existing) {
        await base44.entities.FavoriteRestaurant.delete(existing.id);
      } else {
        await base44.entities.FavoriteRestaurant.create({
          name: restaurant.name,
          cuisine_type: restaurant.cuisine_type,
          location: formData.location,
          rating: restaurant.rating,
          recommended_dishes: restaurant.recommendations?.map(r => r.dish_name) || []
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['favoriteRestaurants'] });
    }
  });

  const isFavorite = (restaurantName) => {
    return favoriteRestaurants?.some(f => f.name === restaurantName && f.location === formData.location);
  };

  const exportToSheets = async () => {
    try {
      const response = await base44.functions.invoke('exportToGoogleSheets', {
        planData: {
          location: formData.location,
          hotelAddress: formData.hotelAddress,
          startDate: formData.startDate,
          endDate: formData.endDate,
          restaurants: recommendations.restaurants
        }
      });
      
      if (response.data?.url) {
        window.open(response.data.url, '_blank');
        toast.success('Exported to Google Sheets!');
      }
    } catch (error) {
      toast.error('Failed to export. Make sure Google Sheets is authorized.');
      console.error(error);
    }
  };

  const handleMealTypeToggle = (mealType) => {
    setFormData(prev => ({
      ...prev,
      mealTypes: prev.mealTypes.includes(mealType)
        ? prev.mealTypes.filter(m => m !== mealType)
        : [...prev.mealTypes, mealType]
    }));
  };

  const handleGenerate = async () => {
    if (!formData.location || !formData.hotelAddress || !formData.startDate || !formData.endDate) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsGenerating(true);
    try {
      const response = await base44.functions.invoke('findHealthyRestaurants', formData);
      setRecommendations(response.data);
      toast.success('Recommendations generated!');
    } catch (error) {
      toast.error('Failed to generate recommendations');
      console.error(error);
    }
    setIsGenerating(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-teal-50/20">
      <MenuScanner isOpen={showScanner} onClose={() => setShowScanner(false)} />
      
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dining Out Planner</h1>
              <p className="text-slate-500">Find healthy restaurants while traveling</p>
            </div>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowScanner(true)}
            className="rounded-xl border-teal-200 text-teal-600 hover:bg-teal-50"
          >
            <Camera className="w-4 h-4 mr-2" />
            Scan Menu
          </Button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Input Form */}
          <Card className="lg:col-span-1 bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle>Trip Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  placeholder="e.g., New York City"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="hotelAddress">Hotel Address</Label>
                <Input
                  id="hotelAddress"
                  placeholder="Hotel name and address"
                  value={formData.hotelAddress}
                  onChange={(e) => setFormData({ ...formData, hotelAddress: e.target.value })}
                  className="mt-2"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="mt-2"
                  />
                </div>
                <div>
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div>
                <Label>Meal Types</Label>
                <div className="space-y-2 mt-2">
                  {['breakfast', 'lunch', 'dinner'].map(mealType => (
                    <div key={mealType} className="flex items-center gap-2">
                      <Checkbox
                        id={mealType}
                        checked={formData.mealTypes.includes(mealType)}
                        onCheckedChange={() => handleMealTypeToggle(mealType)}
                      />
                      <label htmlFor={mealType} className="text-sm capitalize cursor-pointer">
                        {mealType}
                      </label>
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl"
              >
                {isGenerating ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <MapPin className="w-4 h-4 mr-2" />
                )}
                Generate Plan
              </Button>

              {savedPlans && savedPlans.length > 0 && (
                <div className="pt-4 border-t border-slate-100">
                  <Label className="text-xs text-slate-500 mb-2 block">Saved Plans</Label>
                  <div className="space-y-2">
                    {savedPlans.slice(0, 3).map((plan) => (
                      <button
                        key={plan.id}
                        onClick={() => {
                          setFormData({
                            location: plan.location,
                            hotelAddress: plan.hotel_address,
                            startDate: plan.start_date,
                            endDate: plan.end_date,
                            mealTypes: plan.meal_types
                          });
                          setRecommendations({ restaurants: plan.recommendations });
                        }}
                        className="w-full text-left p-3 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                      >
                        <div className="font-medium text-sm text-slate-900">{plan.location}</div>
                        <div className="text-xs text-slate-500">{plan.start_date} to {plan.end_date}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Results */}
          <div className="lg:col-span-2">
            {!recommendations && !isGenerating && (
              <Card className="bg-white rounded-2xl shadow-sm border-0 p-12 text-center">
                <MapPin className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Plan Your Healthy Dining
                </h3>
                <p className="text-slate-500">
                  Enter your trip details to get AI-powered restaurant recommendations
                </p>
              </Card>
            )}

            {isGenerating && (
              <Card className="bg-white rounded-2xl shadow-sm border-0 p-12 text-center">
                <Loader2 className="w-16 h-16 mx-auto text-teal-600 animate-spin mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">
                  Finding the Best Options
                </h3>
                <p className="text-slate-500">
                  Analyzing restaurants and menus in your area...
                </p>
              </Card>
            )}

            {recommendations && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-slate-900">
                    {recommendations.restaurants?.length || 0} Recommendations
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={exportToSheets}
                      className="rounded-xl border-green-200 text-green-600 hover:bg-green-50"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Export to Sheets
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => savePlan.mutate()}
                      className="rounded-xl"
                    >
                      <Save className="w-4 h-4 mr-2" />
                      Save Plan
                    </Button>
                  </div>
                </div>

                {/* Map View */}
                <RestaurantMap 
                  restaurants={recommendations.restaurants} 
                  hotelAddress={formData.hotelAddress}
                />

                {/* Restaurant Cards */}
                <div className="space-y-4">
                  {recommendations.restaurants?.map((restaurant, index) => (
                    <RestaurantCard 
                      key={index} 
                      restaurant={restaurant}
                      isFavorite={isFavorite(restaurant.name)}
                      onToggleFavorite={() => toggleFavorite.mutate(restaurant)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}