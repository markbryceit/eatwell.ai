import React, { useState } from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Scale, Activity, Target, Loader2, RefreshCw } from "lucide-react";

const activityLevels = [
  { value: "sedentary", label: "Sedentary" },
  { value: "light", label: "Light" },
  { value: "moderate", label: "Moderate" },
  { value: "active", label: "Active" },
  { value: "very_active", label: "Very Active" }
];

const goals = [
  { value: "lose_weight", label: "Lose Weight" },
  { value: "maintain", label: "Maintain" },
  { value: "gain_muscle", label: "Build Muscle" }
];

export default function WeeklyCheckin({ currentProfile, onComplete, isLoading }) {
  const [formData, setFormData] = useState({
    weight_kg: currentProfile?.weight_kg || "",
    height_cm: currentProfile?.height_cm || "",
    age: currentProfile?.age || "",
    activity_level: currentProfile?.activity_level || "moderate",
    health_goal: currentProfile?.health_goal || "maintain"
  });

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSubmit = () => {
    onComplete(formData);
  };

  const canSubmit = formData.weight_kg && formData.height_cm && formData.age;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50"
    >
      <Card className="w-full max-w-lg bg-white rounded-3xl shadow-2xl">
        <CardHeader className="text-center pb-2">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-emerald-100 flex items-center justify-center">
            <RefreshCw className="w-8 h-8 text-emerald-600" />
          </div>
          <CardTitle className="text-2xl font-semibold">Weekly Check-in</CardTitle>
          <p className="text-slate-500 mt-2">
            Let's update your stats to optimize your new meal plan
          </p>
        </CardHeader>
        <CardContent className="space-y-6 p-6">
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="weight" className="text-slate-600 text-sm mb-2 block">
                <Scale className="w-4 h-4 inline mr-1" />
                Weight (kg)
              </Label>
              <Input
                id="weight"
                type="number"
                value={formData.weight_kg}
                onChange={(e) => updateField("weight_kg", e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="height" className="text-slate-600 text-sm mb-2 block">
                Height (cm)
              </Label>
              <Input
                id="height"
                type="number"
                value={formData.height_cm}
                onChange={(e) => updateField("height_cm", e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
            <div>
              <Label htmlFor="age" className="text-slate-600 text-sm mb-2 block">
                Age
              </Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => updateField("age", e.target.value)}
                className="h-12 rounded-xl"
              />
            </div>
          </div>

          <div>
            <Label className="text-slate-600 text-sm mb-3 block">
              <Activity className="w-4 h-4 inline mr-1" />
              Activity Level
            </Label>
            <div className="flex flex-wrap gap-2">
              {activityLevels.map((level) => (
                <button
                  key={level.value}
                  onClick={() => updateField("activity_level", level.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    formData.activity_level === level.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {level.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <Label className="text-slate-600 text-sm mb-3 block">
              <Target className="w-4 h-4 inline mr-1" />
              Health Goal
            </Label>
            <div className="grid grid-cols-3 gap-3">
              {goals.map((goal) => (
                <button
                  key={goal.value}
                  onClick={() => updateField("health_goal", goal.value)}
                  className={`p-3 rounded-xl text-sm font-medium transition-all ${
                    formData.health_goal === goal.value
                      ? 'bg-emerald-500 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {goal.label}
                </button>
              ))}
            </div>
          </div>

          <Button
            onClick={handleSubmit}
            disabled={!canSubmit || isLoading}
            className="w-full h-14 rounded-xl bg-slate-900 hover:bg-slate-800 text-lg"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Generate New Meal Plan"
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}