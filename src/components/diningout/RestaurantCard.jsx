import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Star, DollarSign, Clock } from 'lucide-react';

export default function RestaurantCard({ restaurant }) {
  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0">
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <div>
            <CardTitle className="text-xl">{restaurant.name}</CardTitle>
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
      </CardContent>
    </Card>
  );
}