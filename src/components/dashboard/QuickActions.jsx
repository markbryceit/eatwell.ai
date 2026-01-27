import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, RefreshCw, Sparkles } from 'lucide-react';

export default function QuickActions({ onLogFood, onGeneratePlan, onAICoach, isGenerating }) {
  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0 p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-3">Quick Actions</h3>
      <div className="grid grid-cols-3 gap-2">
        <Button
          onClick={onLogFood}
          variant="outline"
          className="flex-col h-auto py-3 rounded-xl"
          size="sm"
        >
          <Plus className="w-4 h-4 mb-1" />
          <span className="text-xs">Log Food</span>
        </Button>
        <Button
          onClick={onGeneratePlan}
          variant="outline"
          className="flex-col h-auto py-3 rounded-xl"
          size="sm"
          disabled={isGenerating}
        >
          {isGenerating ? (
            <RefreshCw className="w-4 h-4 mb-1 animate-spin" />
          ) : (
            <RefreshCw className="w-4 h-4 mb-1" />
          )}
          <span className="text-xs">New Plan</span>
        </Button>
        <Button
          onClick={onAICoach}
          variant="outline"
          className="flex-col h-auto py-3 rounded-xl"
          size="sm"
        >
          <Sparkles className="w-4 h-4 mb-1" />
          <span className="text-xs">AI Coach</span>
        </Button>
      </div>
    </Card>
  );
}