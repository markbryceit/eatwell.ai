import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { MapPin, Search, Loader2, Utensils } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AppNavigation from '@/components/dashboard/AppNavigation';
import MobileNav from '@/components/dashboard/MobileNav';
import AuthGuard from '@/components/AuthGuard';

export default function DiningPlanner() {
  const [location, setLocation] = useState('');
  const [results, setResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState('');
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!location.trim()) return;

    setIsLoading(true);
    setError('');
    setResults(null);

    try {
      const { data } = await base44.functions.invoke('findDiningOptions', {
        location: location.trim()
      });
      setResults(data.results);
      setSearchedLocation(location.trim());
    } catch (err) {
      setError('Could not find results. Please try again.');
    }

    setIsLoading(false);
  };

  return (
    <AuthGuard requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 pb-20 md:pb-6">
        <div className="max-w-3xl mx-auto px-4 py-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dining Out</h1>
              <p className="text-slate-500">Find healthy restaurants near you</p>
            </div>
            <AppNavigation currentPage="Dining Out" />
          </div>

          {/* Location Search */}
          <Card className="bg-white rounded-2xl shadow-sm border-0 mb-6">
            <CardContent className="p-6">
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Enter your location
              </label>
              <p className="text-xs text-slate-400 mb-3">
                Be specific — e.g. <span className="font-medium text-slate-600">Manchester, UK</span> or <span className="font-medium text-slate-600">M1 1AE, UK</span>
              </p>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                  <Input
                    placeholder="e.g. Edinburgh, Scotland"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && !isLoading && location.trim() && handleSearch()}
                    className="pl-10 h-12 rounded-xl"
                  />
                </div>
                <Button
                  onClick={handleSearch}
                  disabled={!location.trim() || isLoading}
                  className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl shrink-0"
                >
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Search className="w-5 h-5 mr-2" />
                      Search
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Loading */}
          {isLoading && (
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardContent className="p-12 text-center">
                <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                <p className="text-slate-600 font-medium">Finding healthy restaurants in {location}...</p>
                <p className="text-slate-400 text-sm mt-1">Searching based on your dietary profile</p>
              </CardContent>
            </Card>
          )}

          {/* Error */}
          {error && (
            <Card className="bg-red-50 rounded-2xl border-0">
              <CardContent className="p-6 text-center text-red-600">
                {error}
              </CardContent>
            </Card>
          )}

          {/* Results */}
          {results && !isLoading && (
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                  <Utensils className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-slate-900">Healthy options in {searchedLocation}</h2>
                </div>
                <ReactMarkdown
                  className="prose prose-sm max-w-none text-slate-700
                    [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2
                    [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-emerald-700 [&_h3]:mt-4 [&_h3]:mb-1
                    [&_ul]:ml-4 [&_ul]:list-disc [&_li]:mb-1
                    [&_strong]:text-slate-900
                    [&_p]:mb-2"
                >
                  {results}
                </ReactMarkdown>
              </CardContent>
            </Card>
          )}

          {/* Empty state */}
          {!results && !isLoading && !error && (
            <div className="text-center py-16 text-slate-400">
              <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p>Enter a location above to find healthy dining options</p>
            </div>
          )}
        </div>

        <MobileNav currentPage="Dining Out" />
      </div>
    </AuthGuard>
  );
}