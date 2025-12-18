import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Star, DollarSign, Clock, Heart, ExternalLink } from 'lucide-react';

export default function RestaurantCard({ restaurant, isFavorite, onToggleFavorite }) {
  const openTableUrl = `https://www.opentable.com/s?term=${encodeURIComponent(restaurant.name)}`;
  
  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <CardTitle className="text-xl">{restaurant.name}</CardTitle>
              {onToggleFavorite && (
                <button onClick={onToggleFavorite}>
                  <Heart className={`w-5 h-5 transition-colors ${isFavorite ? 'fill-rose-500 text-rose-500' : 'text-slate-300 hover:text-rose-500'}`} />
                </button>
              )}
            </div>
            <p className="text-sm text-slate-500 mt-1">{restaurant.cuisine_type}</p>
          </div>
          {restaurant.rating && (
            <div className="flex items-center gap-1 text-amber-500">
              <Star className="w-4 h-4 fill-amber-500" />
              <span className="font-semibold">{restaurant.rating}</span>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {restaurant.distance}
          </span>
          <span className="flex items-center gap-1">
            <DollarSign className="w-4 h-4" />
            {restaurant.price_range}
          </span>
        </div>

        {restaurant.recommendations?.map((rec, idx) => (
          <div key={idx} className="mb-4 p-4 bg-emerald-50 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <Badge className="bg-emerald-100 text-emerald-700">{rec.meal_type}</Badge>
            </div>
            <h4 className="font-semibold text-slate-900 mb-1">{rec.dish_name}</h4>
            <p className="text-sm text-slate-600 mb-2">{rec.description}</p>
            {rec.modifications && (
              <p className="text-xs text-emerald-700 font-medium">
                ✓ Suggested: {rec.modifications}
              </p>
            )}
            {rec.nutrition && (
              <div className="flex gap-3 text-xs text-slate-500 mt-2">
                <span>{rec.nutrition.calories} kcal</span>
                <span>P: {rec.nutrition.protein}g</span>
                <span>C: {rec.nutrition.carbs}g</span>
                <span>F: {rec.nutrition.fat}g</span>
              </div>
            )}
          </div>
        ))}

        <Button
          onClick={() => window.open(openTableUrl, '_blank')}
          className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl mt-4"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          Make Reservation on OpenTable
        </Button>
      </CardContent>
    </Card>
  );
}