import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Loader2, Target, Ruler, Scale, Activity, Utensils, AlertCircle } from "lucide-react";

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

const eatingStyles = [
  "Low Carb", "High Protein", "Keto", "Vegan", "Vegetarian", 
  "Paleo", "Mediterranean", "Pescatarian", "Flexitarian", "No Preference"
];

const commonAllergies = [
  "Gluten", "Dairy", "Shellfish", "Nuts", "Peanuts", 
  "Eggs", "Soy", "Fish"
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
    meals_per_day: 3,
    eating_style: [],
    allergies: [],
    disliked_foods: []
  });
  
  const [dislikedFoodInput, setDislikedFoodInput] = useState("");

  const [heightUnit, setHeightUnit] = useState("cm");
  const [heightFeet, setHeightFeet] = useState("");
  const [heightInches, setHeightInches] = useState("");
  const [weightUnit, setWeightUnit] = useState("kg");

  const totalSteps = 6;

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

  const convertHeightToCm = (feet, inches) => {
    const totalInches = parseFloat(feet || 0) * 12 + parseFloat(inches || 0);
    return Math.round(totalInches * 2.54 * 10) / 10;
  };

  const convertWeightToKg = (value, unit) => {
    if (unit === "kg") return parseFloat(value);
    if (unit === "lbs") return Math.round(parseFloat(value) * 0.453592 * 10) / 10;
    if (unit === "stone") return Math.round(parseFloat(value) * 6.35029 * 10) / 10;
    return parseFloat(value);
  };

  const handleHeightChange = (value) => {
    if (heightUnit === "cm") {
      updateField("height_cm", value);
    } else {
      // Feet/inches - update when both are set
      const cm = convertHeightToCm(heightFeet, heightInches);
      if (cm > 0) updateField("height_cm", cm);
    }
  };

  const handleWeightChange = (value) => {
    const kg = convertWeightToKg(value, weightUnit);
    updateField("weight_kg", kg);
  };

  const toggleEatingStyle = (style) => {
    const current = formData.eating_style;
    if (style === "No Preference") {
      updateField("eating_style", current.includes(style) ? [] : ["No Preference"]);
    } else {
      const filtered = current.filter(s => s !== "No Preference");
      if (filtered.includes(style)) {
        updateField("eating_style", filtered.filter(s => s !== style));
      } else {
        updateField("eating_style", [...filtered, style]);
      }
    }
  };

  const toggleAllergy = (allergy) => {
    const current = formData.allergies;
    if (current.includes(allergy)) {
      updateField("allergies", current.filter(a => a !== allergy));
    } else {
      updateField("allergies", [...current, allergy]);
    }
  };

  const addDislikedFood = () => {
    const food = dislikedFoodInput.trim().toLowerCase();
    if (food && !formData.disliked_foods.includes(food)) {
      updateField("disliked_foods", [...formData.disliked_foods, food]);
      setDislikedFoodInput("");
    }
  };

  const removeDislikedFood = (food) => {
    updateField("disliked_foods", formData.disliked_foods.filter(f => f !== food));
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
      case 5:
        return true;
      default:
        return false;
    }
  };

  const stepIcons = [Ruler, Scale, Activity, Target, Utensils, AlertCircle];
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
              {[1, 2, 3, 4, 5, 6].map((s) => (
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
                {step === 4 && "Meal Preferences"}
                {step === 5 && "Eating Style"}
                {step === 6 && "Allergies & Dislikes"}
              </h2>
              <p className="text-slate-500 text-sm">
                {step === 1 && "Help us understand you better"}
                {step === 2 && "For accurate calorie calculation"}
                {step === 3 && "Customize your nutrition plan"}
                {step === 4 && "How many meals do you prefer per day?"}
                {step === 5 && "How do you prefer to eat?"}
                {step === 6 && "Help us avoid what you can't or won't eat"}
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
                    <Label className="text-slate-700 mb-3 block">Height</Label>
                    <div className="flex gap-3">
                      <Select value={heightUnit} onValueChange={setHeightUnit}>
                        <SelectTrigger className="w-32 h-14 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="cm">cm</SelectItem>
                          <SelectItem value="ft">ft/in</SelectItem>
                        </SelectContent>
                      </Select>
                      {heightUnit === "cm" ? (
                        <Input
                          type="number"
                          placeholder="e.g., 175"
                          value={formData.height_cm}
                          onChange={(e) => {
                            updateField("height_cm", e.target.value);
                          }}
                          className="flex-1 h-14 rounded-xl text-lg"
                        />
                      ) : (
                        <>
                          <Input
                            type="number"
                            placeholder="Feet"
                            value={heightFeet}
                            onChange={(e) => {
                              setHeightFeet(e.target.value);
                              const cm = convertHeightToCm(e.target.value, heightInches);
                              if (cm > 0) updateField("height_cm", cm);
                            }}
                            className="flex-1 h-14 rounded-xl text-lg"
                          />
                          <Input
                            type="number"
                            placeholder="Inches"
                            value={heightInches}
                            onChange={(e) => {
                              setHeightInches(e.target.value);
                              const cm = convertHeightToCm(heightFeet, e.target.value);
                              if (cm > 0) updateField("height_cm", cm);
                            }}
                            className="flex-1 h-14 rounded-xl text-lg"
                          />
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <Label className="text-slate-700 mb-3 block">Weight</Label>
                    <div className="flex gap-3">
                      <Select value={weightUnit} onValueChange={setWeightUnit}>
                        <SelectTrigger className="w-32 h-14 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="kg">kg</SelectItem>
                          <SelectItem value="lbs">lbs</SelectItem>
                          <SelectItem value="stone">stone</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input
                        type="number"
                        placeholder={weightUnit === "kg" ? "e.g., 70" : weightUnit === "lbs" ? "e.g., 154" : "e.g., 11"}
                        onChange={(e) => handleWeightChange(e.target.value)}
                        className="flex-1 h-14 rounded-xl text-lg"
                      />
                    </div>
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
                  <Label className="text-slate-700 mb-4 block">How many meals per day?</Label>
                  <div className="space-y-3">
                    {[
                      { value: 2, label: "2 Meals", description: "Breakfast + Dinner (Intermittent Fasting)" },
                      { value: 3, label: "3 Meals", description: "Breakfast + Lunch + Dinner (Recommended)" },
                      { value: 4, label: "4 Meals", description: "3 Meals + 1 Snack (Most Flexibility)" }
                    ].map((option) => (
                      <label
                        key={option.value}
                        className={`flex items-center p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.meals_per_day === option.value
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <input
                          type="radio"
                          name="meals"
                          value={option.value}
                          checked={formData.meals_per_day === option.value}
                          onChange={() => updateField("meals_per_day", option.value)}
                          className="sr-only"
                        />
                        <div>
                          <div className="font-medium text-slate-900">{option.label}</div>
                          <div className="text-sm text-slate-500">{option.description}</div>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div>
                  <Label className="text-slate-700 mb-4 block">Select all that apply</Label>
                  <div className="grid grid-cols-2 gap-3">
                    {eatingStyles.map((style) => (
                      <label
                        key={style}
                        className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-all ${
                          formData.eating_style.includes(style)
                            ? 'border-emerald-500 bg-emerald-50'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <Checkbox
                          checked={formData.eating_style.includes(style)}
                          onCheckedChange={() => toggleEatingStyle(style)}
                        />
                        <span className="text-sm font-medium">{style}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  {/* Allergies */}
                  <div>
                    <Label className="text-slate-700 mb-3 block">Food Allergies</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {commonAllergies.map((allergy) => (
                        <label
                          key={allergy}
                          className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
                            formData.allergies.includes(allergy)
                              ? 'border-red-500 bg-red-50'
                              : 'border-slate-200 hover:border-slate-300'
                          }`}
                        >
                          <Checkbox
                            checked={formData.allergies.includes(allergy)}
                            onCheckedChange={() => toggleAllergy(allergy)}
                          />
                          <span className="text-sm font-medium">{allergy}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Dislikes */}
                  <div>
                    <Label className="text-slate-700 mb-3 block">Foods You Don't Like</Label>
                    <div className="flex gap-2 mb-3">
                      <Input
                        placeholder="e.g., mushrooms, olives..."
                        value={dislikedFoodInput}
                        onChange={(e) => setDislikedFoodInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addDislikedFood())}
                        className="h-12 rounded-xl"
                      />
                      <Button
                        type="button"
                        onClick={addDislikedFood}
                        className="h-12 rounded-xl"
                      >
                        Add
                      </Button>
                    </div>
                    {formData.disliked_foods.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {formData.disliked_foods.map((food) => (
                          <div
                            key={food}
                            className="flex items-center gap-2 px-3 py-2 bg-slate-100 text-slate-700 rounded-lg text-sm"
                          >
                            <span>{food}</span>
                            <button
                              type="button"
                              onClick={() => removeDislikedFood(food)}
                              className="text-slate-400 hover:text-slate-600"
                            >
                              ×
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
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