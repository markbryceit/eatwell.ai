import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Flame, TrendingUp, TrendingDown, Minus } from "lucide-react";

export default function CalorieProgress({ dailyTarget, consumed, weeklyLogs }) {
  const percentage = dailyTarget > 0 ? Math.min((consumed / dailyTarget) * 100, 100) : 0;
  const remaining = dailyTarget - consumed;
  
  // Calculate weekly stats
  const weeklyTarget = dailyTarget * 7;
  const weeklyConsumed = weeklyLogs?.reduce((sum, log) => sum + (log.calories_consumed || 0), 0) || 0;
  const weeklyPercentage = weeklyTarget > 0 ? (weeklyConsumed / weeklyTarget) * 100 : 0;
  const weeklyDiff = weeklyConsumed - weeklyTarget;

  const getStatus = () => {
    if (percentage < 80) return { color: "text-blue-600", bg: "bg-blue-500", label: "On Track" };
    if (percentage <= 100) return { color: "text-emerald-600", bg: "bg-emerald-500", label: "Perfect" };
    if (percentage <= 110) return { color: "text-amber-600", bg: "bg-amber-500", label: "Slightly Over" };
    return { color: "text-rose-600", bg: "bg-rose-500", label: "Over Target" };
  };

  const status = getStatus();

  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0">
      <CardHeader className="pb-2">
        <CardTitle className="text-lg font-medium text-slate-700 flex items-center gap-2">
          <Flame className="w-5 h-5 text-orange-500" />
          Calorie Tracker
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Today's Progress */}
        <div>
          <div className="flex justify-between items-end mb-2">
            <div>
              <span className="text-3xl font-bold text-slate-900">{consumed.toLocaleString()}</span>
              <span className="text-slate-400 ml-1">/ {dailyTarget.toLocaleString()} kcal</span>
            </div>
            <span className={`text-sm font-medium px-3 py-1 rounded-full ${status.color} bg-opacity-10`} style={{ backgroundColor: `${status.color.replace('text-', '').replace('-600', '')}10` }}>
              {status.label}
            </span>
          </div>
          <Progress 
            value={percentage} 
            className="h-3 bg-slate-100"
          />
          <div className="flex justify-between mt-2 text-sm">
            <span className="text-slate-500">Today</span>
            <span className={remaining >= 0 ? "text-emerald-600" : "text-rose-600"}>
              {remaining >= 0 ? `${remaining.toLocaleString()} remaining` : `${Math.abs(remaining).toLocaleString()} over`}
            </span>
          </div>
        </div>

        {/* Weekly Summary */}
        <div className="pt-4 border-t border-slate-100">
          <h4 className="text-sm font-medium text-slate-600 mb-3">Weekly Summary</h4>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900">
                {weeklyConsumed.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Consumed</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-semibold text-slate-900">
                {weeklyTarget.toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">Target</div>
            </div>
            <div className="text-center">
              <div className={`text-lg font-semibold flex items-center justify-center gap-1 ${
                weeklyDiff > 0 ? 'text-rose-600' : weeklyDiff < 0 ? 'text-emerald-600' : 'text-slate-600'
              }`}>
                {weeklyDiff > 0 ? <TrendingUp className="w-4 h-4" /> : 
                 weeklyDiff < 0 ? <TrendingDown className="w-4 h-4" /> : 
                 <Minus className="w-4 h-4" />}
                {Math.abs(weeklyDiff).toLocaleString()}
              </div>
              <div className="text-xs text-slate-500">
                {weeklyDiff > 0 ? 'Over' : weeklyDiff < 0 ? 'Under' : 'On Track'}
              </div>
            </div>
          </div>
          <Progress 
            value={Math.min(weeklyPercentage, 100)} 
            className="h-2 bg-slate-100 mt-3"
          />
        </div>
      </CardContent>
    </Card>
  );
}