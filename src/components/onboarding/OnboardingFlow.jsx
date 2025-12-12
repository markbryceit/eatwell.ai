import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ArrowRight, Loader2, Target, Ruler, Scale, Activity, Utensils } from "lucide-react";

const activityLevels = [
  { value: "sedentary", label: "Sedentary", description: "Little to no exercise" },
  { value: "light", label: "Light", description: "Light exercise 1-3 days/week" },
  { value: "moderate", label: "Moderate", description: "Moderate exercise 3-5 days/week" },
  { value: "active", label: "Active", description: "Hard exercise 6-7 days/week" },
  { value: "very_active", label: "Very Active", description: "Intense exercise & physical job" }
];

const goals = [
  { value: "lose_weight", label: "Lose Weight", description: "Create a calorie deficit" },
  { value: "maintain", label: "Maintain", description: "Stay at your current weight" },
  { value: "gain_muscle", label: "Build Muscle", description: "Create a calorie surplus" }
];

const dietaryOptions = [
  "Vegetarian", "Vegan", "Gluten-Free", "Dairy-Free", 
  "Low-Carb", "Keto", "Paleo", "Nut-Free", "No Restrictions"
];

export default function OnboardingFlow({ onComplete, isLoading }) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    gender: "male",
    age: "",
    height_cm: "",
    weight_kg: "",
    activity_level: "moderate",
    health_goal: "maintain",
    dietary_preferences: []
  });

  const totalSteps = 4;

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      onComplete(formData);
    }
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const updateField = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const toggleDietary = (option) => {
    const current = formData.dietary_preferences;
    if (option === "No Restrictions") {
      updateField("dietary_preferences", current.includes(option) ? [] : ["No Restrictions"]);
    } else {
      const filtered = current.filter(p => p !== "No Restrictions");
      if (filtered.includes(option)) {
        updateField("dietary_preferences", filtered.filter(p => p !== option));
      } else {
        updateField("dietary_preferences", [...filtered, option]);
      }
    }
  };

  const canProceed = () => {
    switch (step) {
      case 1:
        return formData.gender && formData.age;
      case 2:
        return formData.height_cm && formData.weight_kg;
      case 3:
        return formData.activity_level && formData.health_goal;
      case 4:
        return true;
      default:
        return false;
    }
  };

  const stepIcons = [Ruler, Scale, Activity, Utensils];
  const StepIcon = stepIcons[step - 1];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/30 flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg"
      >
        {/* Progress */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm text-slate-500">Step {step} of {totalSteps}</span>
            <div className="flex gap-1.5">
              {[1, 2, 3, 4].map((s) => (
                <div
                  key={s}
                  className={`h-1.5 w-8 rounded-full transition-colors ${
                    s <= step ? 'bg-emerald-500' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-slate-200/50 p-8 md:p-10">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <StepIcon className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {step === 1 && "Basic Info"}
                {step === 2 && "Body Metrics"}
                {step === 3 && "Lifestyle & Goals"}
                {step === 4 && "Dietary Preferences"}
              </h2>
              <p className="text-slate-500 text-sm">
                {step === 1 && "Help us understand you better"}
                {step === 2 && "For accurate calorie calculation"}
                {step === 3 && "Customize your nutrition plan"}
                {step === 4 && "Almost there!"}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {step === 1 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-slate-700 mb-3 block">Gender</Label>
                    <RadioGroup
                      value={formData.gender}
                      onValueChange={(v) => updateField("gender", v)}
                      className="flex gap-4"
                    >
                      {["male", "female"].map((g) => (
                        <label
                          key={g}
                          className={`flex-1 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                            formData.gender === g
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <RadioGroupItem value={g} className="sr-only" />
                          <span className="block text-center font-medium capitalize">{g}</span>
                        </label>
                      ))}
                    </RadioGroup>
                  </div>
                  <div>
                    <Label htmlFor="age" className="text-slate-700 mb-3 block">Age</Label>
                    <Input
                      id="age"
                      type="number"
                      placeholder="Enter your age"
                      value={formData.age}
                      onChange={(e) => updateField("age", e.target.value)}
                      className="h-14 rounded-xl text-lg"
                    />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <Label htmlFor="height" className="text-slate-700 mb-3 block">Height (cm)</Label>
                    <Input
                      id="height"
                      type="number"
                      placeholder="e.g., 175"
                      value={formData.height_cm}
                      onChange={(e) => updateField("height_cm", e.target.value)}
                      className="h-14 rounded-xl text-lg"
                    />
                  </div>
                  <div>
                    <Label htmlFor="weight" className="text-slate-700 mb-3 block">Weight (kg)</Label>
                    <Input
                      id="weight"
                      type="number"
                      placeholder="e.g., 70"
                      value={formData.weight_kg}
                      onChange={(e) => updateField("weight_kg", e.target.value)}
                      className="h-14 rounded-xl text-lg"
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <div>
                    <Label className="text-slate-700 mb-3 block">Activity Level</Label>
                    <div className="space-y-2">
                      {activityLevels.map((level) => (
                        <label
                          key={level.value}
                          className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.activity_level === level.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="activity"
                            value={level.value}
                            checked={formData.activity_level === level.value}
                            onChange={(e) => updateField("activity_level", e.target.value)}
                            className="sr-only"
                          />
                          <div>
                            <div className="font-medium text-slate-900">{level.label}</div>
                            <div className="text-sm text-slate-500">{level.description}</div>
                          </div>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-700 mb-3 block">Health Goal</Label>
                    <div className="grid grid-cols-3 gap-3">
                      {goals.map((goal) => (
                        <label
                          key={goal.value}
                          className={`p-4 rounded-xl border-2 cursor-pointer transition-all text-center ${
                            formData.health_goal === goal.value
                              ? 'border-emerald-500 bg-emerald-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <input
                            type="radio"
                            name="goal"
                            value={goal.value}
                            checked={formData.health_goal === goal.value}
                            onChange={(e) => updateField("health_goal", e.target.value)}
                            className="sr-only"
                          />
                          <div className="font-medium text-slate-900 text-sm">{goal.label}</div>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 4 && (
                <div>
                  <Label className="text-slate-700 mb-4 block">Select all that apply</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {dietaryOptions.map((option) => (
                      <label
                        key={option}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.dietary_preferences.includes(option)
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Checkbox
                          checked={formData.dietary_preferences.includes(option)}
                          onCheckedChange={() => toggleDietary(option)}
                        />
                        <span className="text-sm font-medium">{option}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex gap-4 mt-10">
            {step > 1 && (
              <Button
                variant="outline"
                onClick={handleBack}
                className="flex-1 h-14 rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            )}
            <Button
              onClick={handleNext}
              disabled={!canProceed() || isLoading}
              className="flex-1 h-14 rounded-xl bg-slate-900 hover:bg-slate-800"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : step === totalSteps ? (
                <>
                  Generate My Plan
                  <Target className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Continue
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}