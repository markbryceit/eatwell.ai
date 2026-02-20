import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MapPin, Search, Loader2, Utensils, ClipboardList } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import AppNavigation from '@/components/dashboard/AppNavigation';
import MobileNav from '@/components/dashboard/MobileNav';
import AuthGuard from '@/components/AuthGuard';

export default function DiningPlanner() {
  // Tab: find restaurants
  const [location, setLocation] = useState('');
  const [findResults, setFindResults] = useState(null);
  const [isFindLoading, setIsFindLoading] = useState(false);
  const [searchedLocation, setSearchedLocation] = useState('');
  const [findError, setFindError] = useState('');

  // Tab: analyse menu
  const [restaurantName, setRestaurantName] = useState('');
  const [menuText, setMenuText] = useState('');
  const [analyzeResults, setAnalyzeResults] = useState(null);
  const [isAnalyzeLoading, setIsAnalyzeLoading] = useState(false);
  const [analyzeError, setAnalyzeError] = useState('');

  const handleFindSearch = async () => {
    if (!location.trim()) return;
    setIsFindLoading(true);
    setFindError('');
    setFindResults(null);
    try {
      const { data } = await base44.functions.invoke('findDiningOptions', { location: location.trim() });
      setFindResults(data.results);
      setSearchedLocation(location.trim());
    } catch {
      setFindError('Could not find results. Please try again.');
    }
    setIsFindLoading(false);
  };

  const handleAnalyzeMenu = async () => {
    if (!restaurantName.trim() && !menuText.trim()) return;
    setIsAnalyzeLoading(true);
    setAnalyzeError('');
    setAnalyzeResults(null);
    try {
      const { data } = await base44.functions.invoke('analyzeMenuOptions', {
        restaurant_name: restaurantName.trim(),
        menu_text: menuText.trim()
      });
      setAnalyzeResults(data.results);
    } catch {
      setAnalyzeError('Could not analyse the menu. Please try again.');
    }
    setIsAnalyzeLoading(false);
  };

  const markdownClass = `prose prose-sm max-w-none text-slate-700
    [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-slate-900 [&_h2]:mt-6 [&_h2]:mb-2
    [&_h3]:text-sm [&_h3]:font-semibold [&_h3]:text-emerald-700 [&_h3]:mt-4 [&_h3]:mb-1
    [&_ul]:ml-4 [&_ul]:list-disc [&_li]:mb-1
    [&_strong]:text-slate-900
    [&_p]:mb-2`;

  return (
    <AuthGuard requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 pb-20 md:pb-6">
        <div className="max-w-3xl mx-auto px-4 py-6">

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Dining Out</h1>
              <p className="text-slate-500">Find healthy options & analyse menus</p>
            </div>
            <AppNavigation currentPage="Dining Out" />
          </div>

          <Tabs defaultValue="find">
            <TabsList className="w-full mb-6 bg-white rounded-xl shadow-sm border-0 p-1">
              <TabsTrigger value="find" className="flex-1 rounded-lg">
                <MapPin className="w-4 h-4 mr-2" /> Find Restaurants
              </TabsTrigger>
              <TabsTrigger value="analyse" className="flex-1 rounded-lg">
                <ClipboardList className="w-4 h-4 mr-2" /> Analyse a Menu
              </TabsTrigger>
            </TabsList>

            {/* ── TAB 1: Find Restaurants ── */}
            <TabsContent value="find">
              <Card className="bg-white rounded-2xl shadow-sm border-0 mb-6">
                <CardContent className="p-6">
                  <label className="block text-sm font-medium text-slate-700 mb-1">Enter your location</label>
                  <p className="text-xs text-slate-400 mb-3">
                    e.g. <span className="font-medium text-slate-600">Manchester, UK</span> or <span className="font-medium text-slate-600">SW1A 1AA</span>
                  </p>
                  <div className="flex gap-3">
                    <div className="relative flex-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                      <Input
                        placeholder="e.g. Edinburgh, Scotland"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !isFindLoading && location.trim() && handleFindSearch()}
                        className="pl-10 h-12 rounded-xl"
                      />
                    </div>
                    <Button
                      onClick={handleFindSearch}
                      disabled={!location.trim() || isFindLoading}
                      className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl shrink-0"
                    >
                      {isFindLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5 mr-2" />Search</>}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {isFindLoading && (
                <Card className="bg-white rounded-2xl shadow-sm border-0">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Finding healthy restaurants in {location}…</p>
                    <p className="text-slate-400 text-sm mt-1">Searching based on your dietary profile</p>
                  </CardContent>
                </Card>
              )}

              {findError && (
                <Card className="bg-red-50 rounded-2xl border-0">
                  <CardContent className="p-6 text-center text-red-600">{findError}</CardContent>
                </Card>
              )}

              {findResults && !isFindLoading && (
                <Card className="bg-white rounded-2xl shadow-sm border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                      <Utensils className="w-5 h-5 text-emerald-600" />
                      <h2 className="font-semibold text-slate-900">Healthy options in {searchedLocation}</h2>
                    </div>
                    <ReactMarkdown className={markdownClass}>{findResults}</ReactMarkdown>
                  </CardContent>
                </Card>
              )}

              {!findResults && !isFindLoading && !findError && (
                <div className="text-center py-16 text-slate-400">
                  <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Enter a location above to find healthy dining options</p>
                </div>
              )}
            </TabsContent>

            {/* ── TAB 2: Analyse a Menu ── */}
            <TabsContent value="analyse">
              <Card className="bg-white rounded-2xl shadow-sm border-0 mb-6">
                <CardContent className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Restaurant name</label>
                    <Input
                      placeholder="e.g. Wagamama, Nando's, The Ivy..."
                      value={restaurantName}
                      onChange={(e) => setRestaurantName(e.target.value)}
                      className="h-11 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Paste menu items <span className="text-slate-400 font-normal">(optional — improves accuracy)</span>
                    </label>
                    <textarea
                      placeholder="Paste the menu text here, e.g. copy from the restaurant's website…"
                      value={menuText}
                      onChange={(e) => setMenuText(e.target.value)}
                      rows={6}
                      className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring resize-none"
                    />
                  </div>
                  <Button
                    onClick={handleAnalyzeMenu}
                    disabled={(!restaurantName.trim() && !menuText.trim()) || isAnalyzeLoading}
                    className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                  >
                    {isAnalyzeLoading ? (
                      <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Analysing…</>
                    ) : (
                      <><ClipboardList className="w-4 h-4 mr-2" />Analyse Menu</>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {isAnalyzeLoading && (
                <Card className="bg-white rounded-2xl shadow-sm border-0">
                  <CardContent className="p-12 text-center">
                    <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto mb-4" />
                    <p className="text-slate-600 font-medium">Analysing menu for your profile…</p>
                    <p className="text-slate-400 text-sm mt-1">Finding the healthiest choices & modifications</p>
                  </CardContent>
                </Card>
              )}

              {analyzeError && (
                <Card className="bg-red-50 rounded-2xl border-0">
                  <CardContent className="p-6 text-center text-red-600">{analyzeError}</CardContent>
                </Card>
              )}

              {analyzeResults && !isAnalyzeLoading && (
                <Card className="bg-white rounded-2xl shadow-sm border-0">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-2 mb-4 pb-4 border-b border-slate-100">
                      <ClipboardList className="w-5 h-5 text-emerald-600" />
                      <h2 className="font-semibold text-slate-900">
                        Menu Analysis{restaurantName ? ` — ${restaurantName}` : ''}
                      </h2>
                    </div>
                    <ReactMarkdown className={markdownClass}>{analyzeResults}</ReactMarkdown>
                  </CardContent>
                </Card>
              )}

              {!analyzeResults && !isAnalyzeLoading && !analyzeError && (
                <div className="text-center py-16 text-slate-400">
                  <ClipboardList className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>Enter a restaurant name (and optionally paste its menu) to get personalised advice</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        <MobileNav currentPage="Dining Out" />
      </div>
    </AuthGuard>
  );
}