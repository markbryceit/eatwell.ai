import React from 'react';
import { createPageUrl } from '@/utils';
import { Home, ChefHat, TrendingUp, MessageSquare, Utensils, Settings, ShoppingCart, Leaf } from 'lucide-react';

export default function MobileNav({ currentPage }) {
  const navItems = [
    { name: 'Dashboard', icon: Home, url: createPageUrl('Dashboard') },
    { name: 'Recipes', icon: ChefHat, url: createPageUrl('Recipes') },
    { name: 'Progress', icon: TrendingUp, url: createPageUrl('Progress') },
    { name: 'AI Coach', icon: MessageSquare, url: createPageUrl('NutritionCoach') },
    { name: 'GroceryList', label: 'Groceries', icon: ShoppingCart, url: createPageUrl('GroceryList') },
    { name: 'UseWhatYouHave', label: 'Use What I Have', icon: Leaf, url: createPageUrl('UseWhatYouHave') },
    { name: 'Settings', icon: Settings, url: createPageUrl('AccountSettings') },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 md:hidden z-50 safe-area-pb">
      <div className="flex items-center justify-around px-1 py-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.name;

          return (
            <a
              key={item.name}
              href={item.url}
              className={`flex flex-col items-center gap-0.5 px-2 py-2 rounded-xl transition-all min-w-0 flex-1 ${
                isActive
                  ? 'text-emerald-600'
                  : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <div className={`p-1.5 rounded-lg transition-all ${isActive ? 'bg-emerald-50' : ''}`}>
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              </div>
              <span className={`text-[10px] font-medium leading-none truncate w-full text-center ${isActive ? 'text-emerald-600' : 'text-slate-400'}`}>
                {item.label || (item.name === 'Dining Out' ? 'Dining' : item.name)}
              </span>
            </a>
          );
        })}
      </div>
    </div>
  );
}