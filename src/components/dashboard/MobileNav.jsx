import React from 'react';
import { createPageUrl } from '@/utils';
import { Home, ChefHat, TrendingUp, Settings, MessageSquare } from 'lucide-react';

export default function MobileNav({ currentPage }) {
  const navItems = [
    { name: 'Dashboard', icon: Home, url: createPageUrl('Dashboard') },
    { name: 'Recipes', icon: ChefHat, url: createPageUrl('Recipes') },
    { name: 'Progress', icon: TrendingUp, url: createPageUrl('Progress') },
    { name: 'AI Coach', icon: MessageSquare, url: createPageUrl('NutritionCoach') },
    { name: 'Settings', icon: Settings, url: createPageUrl('AccountSettings') }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 md:hidden z-50">
      <div className="flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.name;
          
          return (
            <a
              key={item.name}
              href={item.url}
              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                isActive 
                  ? 'text-emerald-600 bg-emerald-50' 
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.name}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}