import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import MacroRing from './MacroRing';

export default function MacroBreakdown({ protein, carbs, fat, title = "Macro Breakdown" }) {
  const total = protein + carbs + fat;
  const proteinPercent = total > 0 ? ((protein / total) * 100).toFixed(0) : 0;
  const carbsPercent = total > 0 ? ((carbs / total) * 100).toFixed(0) : 0;
  const fatPercent = total > 0 ? ((fat / total) * 100).toFixed(0) : 0;

  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-medium text-slate-700">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-center mb-4">
          <MacroRing protein={protein} carbs={carbs} fat={fat} size={140} />
        </div>

        <div className="space-y-3">
          {/* Protein */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500" />
              <span className="text-sm text-slate-600">Protein</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-900">{protein}g</div>
              <div className="text-xs text-slate-500">{proteinPercent}%</div>
            </div>
          </div>

          {/* Carbs */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-amber-500" />
              <span className="text-sm text-slate-600">Carbs</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-900">{carbs}g</div>
              <div className="text-xs text-slate-500">{carbsPercent}%</div>
            </div>
          </div>

          {/* Fat */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-sm text-slate-600">Fat</span>
            </div>
            <div className="text-right">
              <div className="font-semibold text-slate-900">{fat}g</div>
              <div className="text-xs text-slate-500">{fatPercent}%</div>
            </div>
          </div>
        </div>

        {/* Calorie calculation */}
        <div className="mt-4 pt-4 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-700">Total Calories</span>
            <span className="text-lg font-bold text-slate-900">
              {(protein * 4 + carbs * 4 + fat * 9).toFixed(0)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}