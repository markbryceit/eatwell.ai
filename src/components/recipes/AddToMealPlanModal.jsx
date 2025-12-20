import React, { useState } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, addDays } from 'date-fns';

const mealTypes = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
];

export default function AddToMealPlanModal({ recipe, isOpen, onClose, onAddToMealPlan, currentPlan }) {
  const [selectedDay, setSelectedDay] = useState(0);
  const [selectedMealType, setSelectedMealType] = useState('lunch');

  if (!isOpen || !recipe) return null;

  const weekStart = currentPlan?.week_start_date 
    ? new Date(currentPlan.week_start_date)
    : startOfWeek(new Date(), { weekStartsOn: 1 });

  const days = Array.from({ length: 7 }, (_, i) => ({
    index: i,
    name: format(addDays(weekStart, i), 'EEEE'),
    date: format(addDays(weekStart, i), 'MMM d')
  }));

  const handleAdd = () => {
    onAddToMealPlan(selectedDay, selectedMealType);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-lg overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Add to Meal Plan</h2>
                <p className="text-sm text-slate-500 mt-1">{recipe.name}</p>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Select Day */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Day
              </label>
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => (
                  <button
                    key={day.index}
                    onClick={() => setSelectedDay(day.index)}
                    className={`p-2 rounded-xl text-center transition-all ${
                      selectedDay === day.index
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    <div className="text-xs font-medium">{day.name.slice(0, 3)}</div>
                    <div className="text-xs mt-0.5">{day.date.split(' ')[1]}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Select Meal Type */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-3">
                Select Meal
              </label>
              <div className="grid grid-cols-2 gap-3">
                {mealTypes.map((mealType) => (
                  <button
                    key={mealType.value}
                    onClick={() => setSelectedMealType(mealType.value)}
                    className={`p-4 rounded-xl text-center font-medium transition-all ${
                      selectedMealType === mealType.value
                        ? 'bg-emerald-500 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {mealType.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 border-t border-slate-100 flex gap-3">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1 h-12 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdd}
              className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
            >
              <CalendarIcon className="w-4 h-4 mr-2" />
              Add to Plan
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}