import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X, Plus, Trash2 } from 'lucide-react';
import { format, addMonths } from 'date-fns';

export default function GoalModal({ isOpen, onClose, onSave, goal, userProfile }) {
  const [formData, setFormData] = useState({
    title: '',
    category: 'weight_loss',
    description: '',
    target_value: '',
    current_value: '',
    start_value: '',
    unit: 'kg',
    start_date: format(new Date(), 'yyyy-MM-dd'),
    target_date: format(addMonths(new Date(), 3), 'yyyy-MM-dd'),
    milestones: [],
    notes: ''
  });

  useEffect(() => {
    if (goal) {
      setFormData(goal);
    } else if (userProfile) {
      // Pre-fill with user data
      setFormData(prev => ({
        ...prev,
        current_value: userProfile.weight_kg || '',
        start_value: userProfile.weight_kg || ''
      }));
    }
  }, [goal, userProfile]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave({
      ...formData,
      target_value: parseFloat(formData.target_value),
      current_value: parseFloat(formData.current_value),
      start_value: parseFloat(formData.start_value),
      status: goal?.status || 'active'
    });
  };

  const addMilestone = () => {
    setFormData(prev => ({
      ...prev,
      milestones: [
        ...prev.milestones,
        { value: '', label: '', achieved: false }
      ]
    }));
  };

  const removeMilestone = (index) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== index)
    }));
  };

  const updateMilestone = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      milestones: prev.milestones.map((m, i) => 
        i === index ? { ...m, [field]: value } : m
      )
    }));
  };

  const categoryUnits = {
    weight_loss: 'kg',
    weight_gain: 'kg',
    muscle_gain: 'kg',
    endurance: 'minutes',
    healthy_eating: 'days/week',
    calorie_tracking: 'days/week',
    exercise_consistency: 'days/week',
    water_intake: 'liters',
    sleep_quality: 'hours',
    custom: 'units'
  };

  const handleCategoryChange = (category) => {
    setFormData(prev => ({
      ...prev,
      category,
      unit: categoryUnits[category]
    }));
  };

  if (!isOpen) return null;

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
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-slate-900">
                {goal ? 'Edit Goal' : 'Create New Goal'}
              </h2>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="space-y-6">
              {/* Title */}
              <div className="space-y-2">
                <Label>Goal Title *</Label>
                <Input
                  placeholder="e.g., Lose 10kg in 3 months"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>

              {/* Category */}
              <div className="space-y-2">
                <Label>Category *</Label>
                <Select value={formData.category} onValueChange={handleCategoryChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weight_loss">Weight Loss</SelectItem>
                    <SelectItem value="weight_gain">Weight Gain</SelectItem>
                    <SelectItem value="muscle_gain">Muscle Gain</SelectItem>
                    <SelectItem value="endurance">Improved Endurance</SelectItem>
                    <SelectItem value="healthy_eating">Healthy Eating Habits</SelectItem>
                    <SelectItem value="calorie_tracking">Calorie Tracking</SelectItem>
                    <SelectItem value="exercise_consistency">Exercise Consistency</SelectItem>
                    <SelectItem value="water_intake">Water Intake</SelectItem>
                    <SelectItem value="sleep_quality">Sleep Quality</SelectItem>
                    <SelectItem value="custom">Custom Goal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe your goal and why it's important to you..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              {/* Values */}
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Value *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Start"
                    value={formData.start_value}
                    onChange={(e) => setFormData({ ...formData, start_value: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Current Value *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Current"
                    value={formData.current_value}
                    onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Value *</Label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Target"
                    value={formData.target_value}
                    onChange={(e) => setFormData({ ...formData, target_value: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Unit */}
              <div className="space-y-2">
                <Label>Unit of Measurement</Label>
                <Input
                  placeholder="e.g., kg, days, hours"
                  value={formData.unit}
                  onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                />
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date *</Label>
                  <Input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Target Date *</Label>
                  <Input
                    type="date"
                    value={formData.target_date}
                    onChange={(e) => setFormData({ ...formData, target_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Milestones (Optional)</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={addMilestone}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Milestone
                  </Button>
                </div>
                {formData.milestones.map((milestone, index) => (
                  <div key={index} className="flex gap-2 items-start p-3 bg-slate-50 rounded-lg">
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="Value"
                        value={milestone.value}
                        onChange={(e) => updateMilestone(index, 'value', e.target.value)}
                      />
                      <Input
                        placeholder="Label (e.g., First 5kg)"
                        value={milestone.label}
                        onChange={(e) => updateMilestone(index, 'label', e.target.value)}
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeMilestone(index)}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>

              {/* Notes */}
              <div className="space-y-2">
                <Label>Notes / Motivation</Label>
                <Textarea
                  placeholder="Add any motivational notes or strategies..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={2}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-6 pt-6 border-t border-slate-100">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                className="flex-1 h-12 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700"
              >
                {goal ? 'Update Goal' : 'Create Goal'}
              </Button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}