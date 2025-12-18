import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { ArrowLeft, MapPin, Loader2, Download, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import RestaurantCard from '@/components/diningout/RestaurantCard';

export default function DiningOut() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [formData, setFormData] = useState({
    location: '',
    hotelAddress: '',
    startDate: '',
    endDate: '',
    numDays: 1,
    mealTypes: ['breakfast', 'lunch', 'dinner']
  });
  const [recommendations, setRecommendations] = useState(null);

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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-4 mb-8">
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
                  {recommendations.mapUrl && (
                    <Button
                      variant="outline"
                      onClick={() => window.open(recommendations.mapUrl, '_blank')}
                      className="rounded-xl"
                    >
                      <ExternalLink className="w-4 h-4 mr-2" />
                      View Map
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  {recommendations.restaurants?.map((restaurant, index) => (
                    <RestaurantCard key={index} restaurant={restaurant} />
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