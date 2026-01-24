import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, Award, Target, Flame, Zap } from 'lucide-react';

export default function InsightsPanel({ 
  weightLogs, 
  calorieLogs, 
  exerciseLogs, 
  profile 
}) {
  const insights = [];

  // Weight trend
  if (weightLogs && weightLogs.length >= 2) {
    const latest = weightLogs[0].weight_kg;
    const previous = weightLogs[1].weight_kg;
    const change = latest - previous;
    
    if (profile?.health_goal === 'lose_weight' && change < 0) {
      insights.push({
        icon: TrendingDown,
        color: 'emerald',
        title: 'Great Progress!',
        message: `You've lost ${Math.abs(change).toFixed(1)} kg since your last weigh-in. Keep it up!`
      });
    } else if (profile?.health_goal === 'gain_muscle' && change > 0) {
      insights.push({
        icon: TrendingUp,
        color: 'blue',
        title: 'Muscle Building!',
        message: `You've gained ${change.toFixed(1)} kg. Great progress towards your goal!`
      });
    }
  }

  // Calorie consistency
  if (calorieLogs && calorieLogs.length >= 7) {
    const last7Days = calorieLogs.slice(0, 7);
    const onTarget = last7Days.filter(log => 
      Math.abs(log.calories_consumed - log.calorie_target) < 200
    ).length;

    if (onTarget >= 5) {
      insights.push({
        icon: Target,
        color: 'violet',
        title: 'Consistent Tracking!',
        message: `You've hit your calorie target ${onTarget} out of 7 days this week. Excellent consistency!`
      });
    }
  }

  // Exercise streak
  if (exerciseLogs && exerciseLogs.length >= 3) {
    const last7Days = exerciseLogs.slice(0, 7);
    insights.push({
      icon: Flame,
      color: 'orange',
      title: 'Active Lifestyle!',
      message: `You've logged ${last7Days.length} workout sessions this week. Your dedication is showing!`
    });
  }

  // Motivational message
  const totalWeightChange = weightLogs && weightLogs.length >= 2
    ? weightLogs[0].weight_kg - weightLogs[weightLogs.length - 1].weight_kg
    : 0;

  if (Math.abs(totalWeightChange) >= 2) {
    insights.push({
      icon: Award,
      color: 'amber',
      title: 'Milestone Achieved!',
      message: `You've ${totalWeightChange < 0 ? 'lost' : 'gained'} ${Math.abs(totalWeightChange).toFixed(1)} kg since you started. This is a significant achievement!`
    });
  }

  // Default motivational message
  if (insights.length === 0) {
    insights.push({
      icon: Zap,
      color: 'blue',
      title: 'Keep Going!',
      message: 'Every day is a new opportunity to make progress. Stay consistent with your tracking and you\'ll see results!'
    });
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl shadow-lg border-0 text-white">
      <CardHeader>
        <CardTitle className="text-white">Insights & Motivation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight, index) => {
          const Icon = insight.icon;
          return (
            <div key={index} className="flex gap-3 p-4 bg-white/20 backdrop-blur-sm rounded-xl">
              <div className="flex-shrink-0">
                <div className={`w-10 h-10 rounded-full bg-${insight.color}-400/30 flex items-center justify-center`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-1">{insight.title}</h4>
                <p className="text-sm text-white/90">{insight.message}</p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}