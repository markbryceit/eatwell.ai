import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Star, Navigation } from 'lucide-react';

// Fix for default marker icon
import L from 'leaflet';
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function RestaurantMap({ restaurants, hotelAddress }) {
  const [coordinates, setCoordinates] = useState([]);
  const [center, setCenter] = useState([40.7128, -74.0060]); // Default to NYC
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const geocodeAddresses = async () => {
      setIsLoading(true);
      const coords = [];
      
      // Geocode hotel first
      if (hotelAddress) {
        try {
          const hotelResponse = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(hotelAddress)}`
          );
          const hotelData = await hotelResponse.json();
          if (hotelData.length > 0) {
            setCenter([parseFloat(hotelData[0].lat), parseFloat(hotelData[0].lon)]);
          }
        } catch (error) {
          console.error('Error geocoding hotel:', error);
        }
      }

      // Geocode restaurants (simulate with random nearby coordinates for demo)
      // In production, you'd geocode actual addresses
      for (const restaurant of restaurants || []) {
        const lat = center[0] + (Math.random() - 0.5) * 0.02;
        const lng = center[1] + (Math.random() - 0.5) * 0.02;
        coords.push({
          name: restaurant.name,
          position: [lat, lng],
          rating: restaurant.rating,
          cuisine_type: restaurant.cuisine_type
        });
      }
      
      setCoordinates(coords);
      setIsLoading(false);
    };

    if (restaurants && restaurants.length > 0) {
      geocodeAddresses();
    }
  }, [restaurants, hotelAddress]);

  if (isLoading || coordinates.length === 0) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm border-0 p-8 text-center">
        <Navigation className="w-12 h-12 mx-auto text-slate-300 mb-2 animate-pulse" />
        <p className="text-slate-500">Loading map...</p>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0 overflow-hidden">
      <MapContainer
        center={center}
        zoom={14}
        style={{ height: '500px', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />
        {coordinates.map((coord, idx) => (
          <Marker key={idx} position={coord.position}>
            <Popup>
              <div className="p-2">
                <h3 className="font-semibold text-slate-900">{coord.name}</h3>
                <p className="text-sm text-slate-600">{coord.cuisine_type}</p>
                {coord.rating && (
                  <div className="flex items-center gap-1 mt-1">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span className="text-sm font-medium">{coord.rating}</span>
                  </div>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </Card>
  );
}