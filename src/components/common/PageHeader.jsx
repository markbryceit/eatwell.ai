import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function PageHeader({ title, subtitle, backTo = 'Dashboard', actions, showBack = true }) {
  return (
    <div className="flex items-center justify-between mb-6 md:mb-8">
      <div className="flex items-center gap-3 md:gap-4 min-w-0 flex-1">
        {showBack && (
          <Link to={createPageUrl(backTo)}>
            <Button variant="ghost" size="icon" className="rounded-xl flex-shrink-0">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 truncate">{title}</h1>
          {subtitle && <p className="text-sm md:text-base text-slate-500 mt-0.5 md:mt-1 truncate">{subtitle}</p>}
        </div>
      </div>
      {actions && <div className="flex gap-2 ml-2 flex-shrink-0">{actions}</div>}
    </div>
  );
}