import React from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export default function EmptyState({ 
  icon: Icon, 
  title, 
  description, 
  actionLabel, 
  onAction,
  className = ""
}) {
  return (
    <Card className={`bg-white rounded-2xl shadow-sm border-0 p-12 text-center ${className}`}>
      {Icon && <Icon className="w-16 h-16 mx-auto text-slate-300 mb-4" />}
      <h3 className="text-xl font-semibold text-slate-900 mb-2">{title}</h3>
      <p className="text-slate-500 mb-6 max-w-md mx-auto">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="bg-emerald-600 hover:bg-emerald-700 rounded-xl">
          {actionLabel}
        </Button>
      )}
    </Card>
  );
}