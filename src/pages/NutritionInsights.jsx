import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, TrendingUp, TrendingDown, Target, Award, AlertTriangle, CheckCircle2, BookOpen, Sparkles, Activity, Flag } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format, subDays, subWeeks, subMonths, parseISO, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { motion } from 'framer-motion';

export default function NutritionInsights() {
  const navigate = useNavigate();
  const [timeframe, setTimeframe] = useState('week'); // week, month, 3months

  const { data: profile } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.UserProfile.filter({ created_by: currentUser.email }).then(p => p[0]);
    }
  });

  const { data: foodLogs } = useQuery({
    queryKey: ['foodLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FoodLog.filter({ created_by: currentUser.email }, '-date');
    }
  });

  const { data: calorieLogs } = useQuery({
    queryKey: ['calorieLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.CalorieLog.filter({ created_by: currentUser.email }, '-date');
    }
  });

  const { data: exerciseLogs } = useQuery({
    queryKey: ['exerciseLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.ExerciseLog.filter({ created_by: currentUser.email }, '-date');
    }
  });

  const { data: weightLogs } = useQuery({
    queryKey: ['weightLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.WeightLog.filter({ created_by: currentUser.email }, '-date');
    }
  });

  const { data: goals } = useQuery({
    queryKey: ['goals'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Goal.filter({ created_by: currentUser.email, status: 'active' });
    }
  });

  // Calculate insights based on timeframe
  const insights = useMemo(() => {
    if (!foodLogs || !calorieLogs) return null;

    const now = new Date();
    const cutoffDate = timeframe === 'week' 
      ? format(subWeeks(now, 1), 'yyyy-MM-dd')
      : timeframe === 'month'
      ? format(subMonths(now, 1), 'yyyy-MM-dd')
      : format(subMonths(now, 3), 'yyyy-MM-dd');

    const recentFoodLogs = foodLogs.filter(log => log.date >= cutoffDate);
    const recentCalorieLogs = calorieLogs.filter(log => log.date >= cutoffDate);
    const recentExerciseLogs = exerciseLogs?.filter(log => log.date >= cutoffDate) || [];

    // Macro totals
    const totalProtein = recentFoodLogs.reduce((sum, log) => sum + (log.protein_g || 0), 0);
    const totalCarbs = recentFoodLogs.reduce((sum, log) => sum + (log.carbs_g || 0), 0);
    const totalFat = recentFoodLogs.reduce((sum, log) => sum + (log.fat_g || 0), 0);
    const totalFiber = recentFoodLogs.reduce((sum, log) => sum + (log.fiber_g || 0), 0);
    const totalCalories = recentCalorieLogs.reduce((sum, log) => sum + (log.calories_consumed || 0), 0);

    const daysTracked = recentCalorieLogs.length;
    const avgCalories = daysTracked > 0 ? Math.round(totalCalories / daysTracked) : 0;
    const avgProtein = daysTracked > 0 ? Math.round(totalProtein / daysTracked) : 0;
    const avgCarbs = daysTracked > 0 ? Math.round(totalCarbs / daysTracked) : 0;
    const avgFat = daysTracked > 0 ? Math.round(totalFat / daysTracked) : 0;
    const avgFiber = daysTracked > 0 ? Math.round(totalFiber / daysTracked) : 0;

    // Exercise stats
    const totalExerciseMins = recentExerciseLogs.reduce((sum, log) => sum + (log.duration_mins || 0), 0);
    const exerciseDays = recentExerciseLogs.length;
    const avgExerciseMins = exerciseDays > 0 ? Math.round(totalExerciseMins / exerciseDays) : 0;

    // Calorie adherence
    const targetCalories = profile?.daily_calorie_target || 2000;
    const calorieAdherence = avgCalories > 0 ? Math.round((avgCalories / targetCalories) * 100) : 0;
    const adherenceStatus = calorieAdherence >= 95 && calorieAdherence <= 105 ? 'excellent' 
      : calorieAdherence >= 85 && calorieAdherence <= 115 ? 'good' 
      : 'needs_improvement';

    // Weight progress
    const recentWeights = weightLogs?.filter(log => log.date >= cutoffDate).sort((a, b) => 
      new Date(b.date) - new Date(a.date)
    ) || [];
    const weightChange = recentWeights.length >= 2 
      ? recentWeights[0].weight_kg - recentWeights[recentWeights.length - 1].weight_kg 
      : 0;

    // Daily breakdown for charts
    const dailyData = {};
    recentCalorieLogs.forEach(log => {
      if (!dailyData[log.date]) {
        dailyData[log.date] = { date: log.date, calories: 0, protein: 0, carbs: 0, fat: 0, target: targetCalories };
      }
      dailyData[log.date].calories = log.calories_consumed || 0;
    });

    recentFoodLogs.forEach(log => {
      if (dailyData[log.date]) {
        dailyData[log.date].protein += log.protein_g || 0;
        dailyData[log.date].carbs += log.carbs_g || 0;
        dailyData[log.date].fat += log.fat_g || 0;
      }
    });

    const chartData = Object.values(dailyData)
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .map(d => ({
        ...d,
        date: format(parseISO(d.date), 'MMM d')
      }));

    return {
      avgCalories,
      avgProtein,
      avgCarbs,
      avgFat,
      avgFiber,
      totalCalories,
      daysTracked,
      calorieAdherence,
      adherenceStatus,
      weightChange,
      totalExerciseMins,
      exerciseDays,
      avgExerciseMins,
      chartData,
      macroDistribution: [
        { name: 'Protein', value: totalProtein * 4, color: '#3b82f6' },
        { name: 'Carbs', value: totalCarbs * 4, color: '#f59e0b' },
        { name: 'Fat', value: totalFat * 9, color: '#ef4444' }
      ]
    };
  }, [foodLogs, calorieLogs, exerciseLogs, weightLogs, timeframe, profile]);

  // Recommendations based on data and goals
  const recommendations = useMemo(() => {
    if (!insights || !profile) return [];
    const recs = [];

    // Goal-based recommendations
    if (goals && goals.length > 0) {
      goals.forEach(goal => {
        const progress = goal.start_value && goal.target_value
          ? ((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100
          : 0;
        
        if (progress < 25) {
          recs.push({
            type: 'info',
            title: `Goal: ${goal.title}`,
            description: `You're at ${Math.round(progress)}% progress. ${goal.notes || 'Stay focused on your goal!'}`,
            action: 'View goals',
            actionUrl: 'Goals'
          });
        }
      });
    }

    // Protein recommendation
    const proteinTarget = profile.health_goal === 'gain_muscle' ? profile.weight_kg * 2 : profile.weight_kg * 1.6;
    if (insights.avgProtein < proteinTarget * 0.8) {
      recs.push({
        type: 'warning',
        title: 'Low Protein Intake',
        description: `You're averaging ${insights.avgProtein}g protein daily. Consider increasing to ${Math.round(proteinTarget)}g for your ${profile.health_goal.replace('_', ' ')} goal.`,
        action: 'View high-protein recipes',
        actionUrl: 'Recipes'
      });
    }

    // Calorie adherence
    if (insights.adherenceStatus === 'needs_improvement') {
      const diff = insights.avgCalories - (profile.daily_calorie_target || 2000);
      recs.push({
        type: 'warning',
        title: diff > 0 ? 'Above Calorie Target' : 'Below Calorie Target',
        description: `You're ${Math.abs(diff)} kcal ${diff > 0 ? 'over' : 'under'} your daily target on average.`,
        action: 'Adjust meal plan',
        actionUrl: 'Dashboard'
      });
    }

    // Exercise consistency
    if (insights.exerciseDays < insights.daysTracked * 0.5) {
      recs.push({
        type: 'info',
        title: 'Increase Physical Activity',
        description: `You exercised ${insights.exerciseDays} out of ${insights.daysTracked} days tracked. Regular activity helps reach your goals faster.`,
        action: 'Log exercise',
        actionUrl: 'Progress'
      });
    }

    // Fiber intake
    if (insights.avgFiber < 25) {
      recs.push({
        type: 'info',
        title: 'Boost Fiber Intake',
        description: `Aim for at least 25g of fiber daily. You're currently at ${insights.avgFiber}g. Add more vegetables, fruits, and whole grains.`,
        action: 'Find high-fiber recipes',
        actionUrl: 'Recipes'
      });
    }

    // Success message
    if (insights.adherenceStatus === 'excellent' && insights.avgProtein >= proteinTarget * 0.8) {
      recs.push({
        type: 'success',
        title: 'Great Job!',
        description: `You're consistently hitting your nutrition targets. Keep up the excellent work!`,
        action: 'View progress',
        actionUrl: 'Progress'
      });
    }

    return recs;
  }, [insights, profile]);

  if (!insights) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading insights...</p>
        </div>
      </div>
    );
  }

  const COLORS = ['#3b82f6', '#f59e0b', '#ef4444'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Nutrition Insights</h1>
              <p className="text-slate-500">Comprehensive analysis of your nutrition journey</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => navigate(createPageUrl('Goals'))}
              className="rounded-xl border-amber-200 text-amber-600 hover:bg-amber-50"
            >
              <Flag className="w-4 h-4 mr-2" />
              Goals
            </Button>
            <Button
              onClick={() => navigate(createPageUrl('NutritionCoach'))}
              className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Coach
            </Button>
          </div>
        </div>

        {/* Timeframe Selector */}
        <Tabs value={timeframe} onValueChange={setTimeframe} className="mb-6">
          <TabsList className="bg-white rounded-xl p-1">
            <TabsTrigger value="week" className="rounded-lg">Last Week</TabsTrigger>
            <TabsTrigger value="month" className="rounded-lg">Last Month</TabsTrigger>
            <TabsTrigger value="3months" className="rounded-lg">Last 3 Months</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white rounded-2xl border-0">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-500">Avg Calories</span>
                <Badge variant={insights.adherenceStatus === 'excellent' ? 'default' : insights.adherenceStatus === 'good' ? 'secondary' : 'destructive'} className="text-xs">
                  {insights.calorieAdherence}%
                </Badge>
              </div>
              <div className="text-2xl font-bold text-slate-900">{insights.avgCalories}</div>
              <div className="text-xs text-slate-500 mt-1">Target: {profile?.daily_calorie_target || 2000}</div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 rounded-2xl border-0">
            <CardContent className="p-4">
              <div className="text-sm text-blue-600 mb-2">Avg Protein</div>
              <div className="text-2xl font-bold text-blue-700">{insights.avgProtein}g</div>
              <div className="text-xs text-blue-600 mt-1">{Math.round((insights.avgProtein * 4 / insights.avgCalories) * 100)}% of calories</div>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 rounded-2xl border-0">
            <CardContent className="p-4">
              <div className="text-sm text-amber-600 mb-2">Avg Carbs</div>
              <div className="text-2xl font-bold text-amber-700">{insights.avgCarbs}g</div>
              <div className="text-xs text-amber-600 mt-1">{Math.round((insights.avgCarbs * 4 / insights.avgCalories) * 100)}% of calories</div>
            </CardContent>
          </Card>

          <Card className="bg-rose-50 rounded-2xl border-0">
            <CardContent className="p-4">
              <div className="text-sm text-rose-600 mb-2">Avg Fat</div>
              <div className="text-2xl font-bold text-rose-700">{insights.avgFat}g</div>
              <div className="text-xs text-rose-600 mt-1">{Math.round((insights.avgFat * 9 / insights.avgCalories) * 100)}% of calories</div>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="mb-6 space-y-3">
            {recommendations.map((rec, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className={`rounded-2xl border-0 ${
                  rec.type === 'success' ? 'bg-emerald-50' :
                  rec.type === 'warning' ? 'bg-amber-50' :
                  'bg-blue-50'
                }`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {rec.type === 'success' ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      ) : rec.type === 'warning' ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1">
                        <h4 className="font-semibold text-slate-900 mb-1">{rec.title}</h4>
                        <p className="text-sm text-slate-600 mb-2">{rec.description}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(createPageUrl(rec.actionUrl))}
                          className="rounded-lg h-8"
                        >
                          {rec.action}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

        <div className="grid lg:grid-cols-2 gap-6 mb-6">
          {/* Calorie Trend */}
          <Card className="bg-white rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                Calorie Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={insights.chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip />
                  <Line type="monotone" dataKey="calories" stroke="#10b981" strokeWidth={2} name="Consumed" />
                  <Line type="monotone" dataKey="target" stroke="#e5e7eb" strokeWidth={2} strokeDasharray="5 5" name="Target" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Macro Distribution */}
          <Card className="bg-white rounded-2xl border-0">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                Macro Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={insights.macroDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {insights.macroDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Daily Macros Breakdown */}
        <Card className="bg-white rounded-2xl border-0 mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-violet-600" />
              Daily Macro Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={insights.chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip />
                <Legend />
                <Bar dataKey="protein" fill="#3b82f6" name="Protein (g)" />
                <Bar dataKey="carbs" fill="#f59e0b" name="Carbs (g)" />
                <Bar dataKey="fat" fill="#ef4444" name="Fat (g)" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Stats Summary */}
        <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-2xl border-0 text-white">
          <CardContent className="p-6">
            <h3 className="text-lg font-semibold mb-4">Period Summary</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <div className="text-emerald-100 text-sm mb-1">Days Tracked</div>
                <div className="text-2xl font-bold">{insights.daysTracked}</div>
              </div>
              <div>
                <div className="text-emerald-100 text-sm mb-1">Exercise Sessions</div>
                <div className="text-2xl font-bold">{insights.exerciseDays}</div>
              </div>
              <div>
                <div className="text-emerald-100 text-sm mb-1">Avg Fiber</div>
                <div className="text-2xl font-bold">{insights.avgFiber}g</div>
              </div>
              <div>
                <div className="text-emerald-100 text-sm mb-1">Weight Change</div>
                <div className="text-2xl font-bold flex items-center gap-1">
                  {insights.weightChange !== 0 ? (
                    <>
                      {insights.weightChange > 0 ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                      {Math.abs(insights.weightChange).toFixed(1)}kg
                    </>
                  ) : (
                    'N/A'
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}