import React from 'react';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Home, ChefHat, TrendingUp, Settings, MessageSquare, LogOut } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function AppNavigation({ currentPage }) {
  const navItems = [
    { name: 'Dashboard', icon: Home, url: createPageUrl('Dashboard') },
    { name: 'Recipes', icon: ChefHat, url: createPageUrl('Recipes') },
    { name: 'Progress', icon: TrendingUp, url: createPageUrl('Progress') },
    { name: 'AI Coach', icon: MessageSquare, url: createPageUrl('NutritionCoach') },
    { name: 'Settings', icon: Settings, url: createPageUrl('AccountSettings') }
  ];

  const handleLogout = async () => {
    await base44.auth.logout(createPageUrl('Home'));
  };

  return (
    <div className="flex items-center gap-2">
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPage === item.name;
        
        return (
          <Button
            key={item.name}
            variant={isActive ? 'default' : 'ghost'}
            size="sm"
            asChild
            className="hidden md:inline-flex"
          >
            <a href={item.url}>
              <Icon className="w-4 h-4 mr-2" />
              {item.name}
            </a>
          </Button>
        );
      })}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={handleLogout}
        className="text-red-600 hover:text-red-700 hover:bg-red-50"
      >
        <LogOut className="w-4 h-4 md:mr-2" />
        <span className="hidden md:inline">Logout</span>
      </Button>
    </div>
  );
}