import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

const COLORS = {
  protein: '#3b82f6',
  carbs: '#f59e0b',
  fat: '#10b981'
};

export default function MacroDistribution({ foodLogs }) {
  const totals = foodLogs?.reduce((acc, log) => ({
    protein: acc.protein + (log.protein_g || 0),
    carbs: acc.carbs + (log.carbs_g || 0),
    fat: acc.fat + (log.fat_g || 0)
  }), { protein: 0, carbs: 0, fat: 0 }) || { protein: 0, carbs: 0, fat: 0 };

  const totalGrams = totals.protein + totals.carbs + totals.fat;

  const data = [
    { name: 'Protein', value: totals.protein, calories: totals.protein * 4 },
    { name: 'Carbs', value: totals.carbs, calories: totals.carbs * 4 },
    { name: 'Fat', value: totals.fat, calories: totals.fat * 9 }
  ];

  const totalCalories = data.reduce((sum, item) => sum + item.calories, 0);

  if (totalGrams === 0) {
    return (
      <Card className="bg-white rounded-2xl shadow-sm border-0">
        <CardHeader>
          <CardTitle>Macro Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-slate-500 text-center py-8">
            No macro data available. Start logging your meals!
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0">
      <CardHeader>
        <CardTitle>Macro Distribution</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name.toLowerCase()]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value, name, props) => [
                `${value.toFixed(1)}g (${props.payload.calories.toFixed(0)} kcal)`,
                name
              ]}
            />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 mt-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totals.protein.toFixed(0)}g</div>
            <div className="text-sm text-slate-500">Protein</div>
            <div className="text-xs text-slate-400">{((totals.protein * 4 / totalCalories) * 100).toFixed(0)}% cal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-amber-600">{totals.carbs.toFixed(0)}g</div>
            <div className="text-sm text-slate-500">Carbs</div>
            <div className="text-xs text-slate-400">{((totals.carbs * 4 / totalCalories) * 100).toFixed(0)}% cal</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-emerald-600">{totals.fat.toFixed(0)}g</div>
            <div className="text-sm text-slate-500">Fat</div>
            <div className="text-xs text-slate-400">{((totals.fat * 9 / totalCalories) * 100).toFixed(0)}% cal</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}