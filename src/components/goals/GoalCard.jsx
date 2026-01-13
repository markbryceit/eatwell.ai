import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Target, TrendingUp, Calendar, Edit, Trash2, CheckCircle2, Flag } from 'lucide-react';
import { format, differenceInDays, parseISO } from 'date-fns';

export default function GoalCard({ goal, onEdit, onDelete, onComplete }) {
  const progressPercentage = goal.start_value && goal.target_value
    ? Math.min(100, Math.max(0, 
        ((goal.current_value - goal.start_value) / (goal.target_value - goal.start_value)) * 100
      ))
    : 0;

  const daysRemaining = differenceInDays(parseISO(goal.target_date), new Date());
  const isOverdue = daysRemaining < 0;
  const isCompleted = goal.status === 'completed';

  const categoryColors = {
    weight_loss: 'bg-rose-100 text-rose-700',
    weight_gain: 'bg-blue-100 text-blue-700',
    muscle_gain: 'bg-purple-100 text-purple-700',
    endurance: 'bg-orange-100 text-orange-700',
    healthy_eating: 'bg-green-100 text-green-700',
    calorie_tracking: 'bg-yellow-100 text-yellow-700',
    exercise_consistency: 'bg-indigo-100 text-indigo-700',
    water_intake: 'bg-cyan-100 text-cyan-700',
    sleep_quality: 'bg-violet-100 text-violet-700',
    custom: 'bg-slate-100 text-slate-700'
  };

  const categoryIcons = {
    weight_loss: TrendingUp,
    weight_gain: TrendingUp,
    muscle_gain: Target,
    endurance: Flag,
    healthy_eating: Target,
    calorie_tracking: Target,
    exercise_consistency: Target,
    water_intake: Target,
    sleep_quality: Target,
    custom: Target
  };

  const Icon = categoryIcons[goal.category] || Target;

  return (
    <Card className={`bg-white rounded-2xl border-0 shadow-sm ${isCompleted ? 'opacity-75' : ''}`}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-start gap-3 flex-1">
            <div className={`p-3 rounded-xl ${categoryColors[goal.category]}`}>
              <Icon className="w-5 h-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-slate-900 mb-1">{goal.title}</h3>
              {goal.description && (
                <p className="text-sm text-slate-500 mb-2">{goal.description}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <Badge className={categoryColors[goal.category]}>
                  {goal.category.replace('_', ' ')}
                </Badge>
                {isCompleted && (
                  <Badge className="bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    Completed
                  </Badge>
                )}
                {!isCompleted && isOverdue && (
                  <Badge className="bg-red-100 text-red-700">
                    Overdue
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(goal)}
              className="text-slate-400 hover:text-slate-600"
            >
              <Edit className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onDelete(goal.id)}
              className="text-slate-400 hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Progress */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-600">Progress</span>
            <span className="font-semibold text-slate-900">
              {goal.current_value} / {goal.target_value} {goal.unit}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-3" />
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>{progressPercentage.toFixed(0)}% complete</span>
            {!isCompleted && (
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {isOverdue ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
              </span>
            )}
          </div>
        </div>

        {/* Milestones */}
        {goal.milestones && goal.milestones.length > 0 && (
          <div className="border-t border-slate-100 pt-4">
            <div className="text-sm font-medium text-slate-700 mb-2">Milestones</div>
            <div className="space-y-2">
              {goal.milestones.map((milestone, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <CheckCircle2 
                    className={`w-4 h-4 ${milestone.achieved ? 'text-green-500' : 'text-slate-300'}`} 
                  />
                  <span className={`text-sm ${milestone.achieved ? 'text-slate-900 line-through' : 'text-slate-600'}`}>
                    {milestone.label} ({milestone.value} {goal.unit})
                  </span>
                  {milestone.achieved && milestone.achieved_date && (
                    <span className="text-xs text-slate-400 ml-auto">
                      {format(parseISO(milestone.achieved_date), 'MMM d')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        {!isCompleted && progressPercentage >= 100 && (
          <div className="border-t border-slate-100 pt-4 mt-4">
            <Button
              onClick={() => onComplete(goal.id)}
              className="w-full bg-green-600 hover:bg-green-700 rounded-xl"
            >
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Mark as Completed
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}