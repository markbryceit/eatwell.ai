import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Plus, TrendingDown, TrendingUp, Award, Camera, Ruler, Utensils, Dumbbell } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart, ComposedChart } from 'recharts';
import { format, subDays, parseISO } from 'date-fns';
import WeightEntryModal from '@/components/progress/WeightEntryModal';
import ExerciseEntryModal from '@/components/progress/ExerciseEntryModal';
import BodyMeasurementModal from '@/components/progress/BodyMeasurementModal';
import MacroDistribution from '@/components/progress/MacroDistribution';
import InsightsPanel from '@/components/progress/InsightsPanel';
import StreakTracker from '@/components/progress/StreakTracker';
import FoodLogModal from '@/components/nutrition/FoodLogModal';

export default function Progress() {
  const queryClient = useQueryClient();
  const [showWeightEntry, setShowWeightEntry] = useState(false);
  const [showExerciseEntry, setShowExerciseEntry] = useState(false);
  const [showBodyMeasurement, setShowBodyMeasurement] = useState(false);
  const [showFoodLog, setShowFoodLog] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const { data: weightLogs } = useQuery({
    queryKey: ['weightLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.WeightLog.filter({ created_by: currentUser.email }, '-date');
    },
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: exerciseLogs } = useQuery({
    queryKey: ['exerciseLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.ExerciseLog.filter({ created_by: currentUser.email }, '-date');
    },
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: calorieLogs } = useQuery({
    queryKey: ['calorieLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.CalorieLog.filter({ created_by: currentUser.email }, '-date');
    },
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: profiles } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserProfile.filter({ created_by: currentUser.email });
    },
    staleTime: 10 * 60 * 1000,
    cacheTime: 30 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: bodyMeasurements } = useQuery({
    queryKey: ['bodyMeasurements'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.BodyMeasurement.filter({ created_by: currentUser.email }, '-date');
    },
    staleTime: 3 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const { data: foodLogs } = useQuery({
    queryKey: ['foodLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FoodLog.filter({ created_by: currentUser.email }, '-date');
    },
    staleTime: 2 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  const profile = profiles?.[0];
  const latestBodyMeasurement = bodyMeasurements?.[0];

  // Weight progress calculations
  const latestWeight = weightLogs?.[0]?.weight_kg;
  const startWeight = weightLogs?.[weightLogs.length - 1]?.weight_kg;
  const weightChange = latestWeight && startWeight ? latestWeight - startWeight : 0;

  // Chart data
  const weightChartData = weightLogs?.slice(0, 30).reverse().map(log => ({
    date: format(parseISO(log.date), 'MMM d'),
    weight: log.weight_kg
  })) || [];

  const calorieChartData = calorieLogs?.slice(0, 14).reverse().map(log => ({
    date: format(parseISO(log.date), 'MMM d'),
    consumed: log.calories_consumed,
    target: log.calorie_target
  })) || [];

  const exerciseChartData = exerciseLogs?.slice(0, 7).reverse().map(log => ({
    date: format(parseISO(log.date), 'MMM d'),
    duration: log.duration_mins,
    calories: log.calories_burned || 0
  })) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <WeightEntryModal
        isOpen={showWeightEntry}
        onClose={() => setShowWeightEntry(false)}
      />

      <ExerciseEntryModal
        isOpen={showExerciseEntry}
        onClose={() => setShowExerciseEntry(false)}
      />

      <BodyMeasurementModal
        isOpen={showBodyMeasurement}
        onClose={() => setShowBodyMeasurement(false)}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ['bodyMeasurements'] });
          setShowBodyMeasurement(false);
        }}
      />

      <FoodLogModal
        isOpen={showFoodLog}
        onClose={() => setShowFoodLog(false)}
        onFoodLogged={() => {
          queryClient.invalidateQueries({ queryKey: ['foodLogs'] });
          queryClient.invalidateQueries({ queryKey: ['calorieLogs'] });
        }}
        selectedDate={selectedDate}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Progress Tracking</h1>
              <p className="text-slate-500">Your journey at a glance</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setShowFoodLog(true)}
              className="rounded-xl border-violet-200 text-violet-600 hover:bg-violet-50"
            >
              <Utensils className="w-4 h-4 mr-2" />
              Log Meal
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowExerciseEntry(true)}
              className="rounded-xl border-blue-200 text-blue-600 hover:bg-blue-50"
            >
              <Dumbbell className="w-4 h-4 mr-2" />
              Exercise
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowBodyMeasurement(true)}
              className="rounded-xl"
            >
              <Camera className="w-4 h-4 mr-2" />
              Body Scan
            </Button>
            <Button
              onClick={() => setShowWeightEntry(true)}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Weight
            </Button>
          </div>
        </div>

        {/* Insights and Streaks */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <div className="md:col-span-2">
            <InsightsPanel
              weightLogs={weightLogs}
              calorieLogs={calorieLogs}
              exerciseLogs={exerciseLogs}
              profile={profile}
            />
          </div>
          <StreakTracker calorieLogs={calorieLogs} />
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Current Weight</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {latestWeight ? `${latestWeight} kg` : 'No data'}
              </div>
              {weightChange !== 0 && (
                <div className={`flex items-center gap-1 mt-2 text-sm ${
                  weightChange < 0 ? 'text-emerald-600' : 'text-amber-600'
                }`}>
                  {weightChange < 0 ? <TrendingDown className="w-4 h-4" /> : <TrendingUp className="w-4 h-4" />}
                  {Math.abs(weightChange).toFixed(1)} kg
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">Daily Target</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {profile?.daily_calorie_target || 2000} kcal
              </div>
              <p className="text-sm text-slate-500 mt-2">{profile?.health_goal?.replace('_', ' ')}</p>
            </CardContent>
          </Card>

          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-slate-500">This Week</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-slate-900">
                {exerciseLogs?.slice(0, 7).reduce((sum, log) => sum + log.duration_mins, 0) || 0} min
              </div>
              <p className="text-sm text-slate-500 mt-2">Exercise time</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-sm border-0 text-white">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Body Fat</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {latestBodyMeasurement?.body_fat_percentage ? `${latestBodyMeasurement.body_fat_percentage.toFixed(1)}%` : 'No data'}
              </div>
              {latestBodyMeasurement && (
                <p className="text-sm text-blue-100 mt-2">
                  {format(parseISO(latestBodyMeasurement.date), 'MMM d, yyyy')}
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Weight Chart */}
        {weightChartData.length > 0 && (
          <Card className="bg-white rounded-2xl shadow-sm border-0 mb-6">
            <CardHeader>
              <CardTitle>Weight Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={weightChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Area type="monotone" dataKey="weight" stroke="#10b981" fill="#10b98120" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Calorie and Macro Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Calorie Chart */}
          {calorieChartData.length > 0 && (
            <Card className="bg-white rounded-2xl shadow-sm border-0">
              <CardHeader>
                <CardTitle>Calorie Tracking (Last 2 Weeks)</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={calorieChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip />
                    <Bar dataKey="consumed" fill="#3b82f6" name="Consumed" />
                    <Line type="monotone" dataKey="target" stroke="#10b981" strokeWidth={2} name="Target" />
                  </ComposedChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}
          
          {/* Macro Distribution */}
          <MacroDistribution foodLogs={foodLogs} />
        </div>

        {/* Exercise Chart */}
        {exerciseChartData.length > 0 && (
          <Card className="bg-white rounded-2xl shadow-sm border-0 mb-6">
            <CardHeader>
              <CardTitle>Exercise Activity (Last 7 Days)</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={exerciseChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="duration" fill="#8b5cf6" name="Minutes" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        )}

        {/* Body Measurements History */}
        {bodyMeasurements && bodyMeasurements.length > 0 && (
          <Card className="bg-white rounded-2xl shadow-sm border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Ruler className="w-5 h-5 text-blue-600" />
                Body Measurements History
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bodyMeasurements.slice(0, 10).map((measurement) => (
                  <div key={measurement.id} className="flex gap-4 p-4 bg-slate-50 rounded-xl">
                    <img
                      src={measurement.photo_url}
                      alt="Body measurement"
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-semibold text-slate-900">
                          {format(parseISO(measurement.date), 'MMM d, yyyy')}
                        </p>
                        <div className="text-2xl font-bold text-blue-600">
                          {measurement.body_fat_percentage.toFixed(1)}%
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-sm">
                        <div>
                          <span className="text-slate-500">Chest:</span>{' '}
                          <span className="font-medium">{measurement.measurements?.chest_inches?.toFixed(1)}"</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Waist:</span>{' '}
                          <span className="font-medium">{measurement.measurements?.waist_inches?.toFixed(1)}"</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Hips:</span>{' '}
                          <span className="font-medium">{measurement.measurements?.hips_inches?.toFixed(1)}"</span>
                        </div>
                      </div>
                      {measurement.notes && (
                        <p className="text-sm text-slate-500 mt-2">{measurement.notes}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}