import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { 
  Menu, X, TrendingUp, Sparkles, Users, 
  UtensilsCrossed, Camera, Target, BookOpen, Calendar, Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import UserMenu from '@/components/UserMenu';

export default function AppNavigation({ user }) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const menuItems = [
    { label: 'Insights', icon: TrendingUp, page: 'NutritionInsights', color: 'text-purple-600' },
    { label: 'AI Coach', icon: Sparkles, page: 'NutritionCoach', color: 'text-emerald-600' },
    { label: 'Goals', icon: Target, page: 'Goals', color: 'text-amber-600' },
    { label: 'Progress', icon: TrendingUp, page: 'Progress', color: 'text-emerald-600' },
    { label: 'Recipes', icon: BookOpen, page: 'Recipes', color: 'text-slate-700' },
    { label: 'Kids Meals', icon: null, page: 'KidsMeals', color: 'text-pink-600', emoji: '👶' },
    { label: 'Discover', icon: Sparkles, page: 'Discover', color: 'text-violet-600' },
    { label: 'Planner', icon: Calendar, page: 'MealPlanner', color: 'text-slate-700' },
    { label: 'Fridge Scanner', icon: Camera, page: 'FridgeScanner', color: 'text-teal-600' },
    { label: 'Dining Out', icon: UtensilsCrossed, page: 'DiningOut', color: 'text-teal-600' },
    { label: 'Community', icon: Users, page: 'Community', color: 'text-blue-600' },
  ];

  if (user?.role === 'admin') {
    menuItems.push({ 
      label: 'Upload Recipes', 
      icon: Upload, 
      page: 'AdminRecipeUpload', 
      color: 'text-violet-600' 
    });
  }

  const handleNavigate = (page) => {
    navigate(createPageUrl(page), { replace: true });
    setIsOpen(false);
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <UserMenu />
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(true)}
          className="rounded-xl border-slate-200 hover:border-slate-300"
        >
          <Menu className="w-5 h-5 mr-1" />
          Menu
        </Button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            />

            {/* Side Menu */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-80 bg-white shadow-2xl z-50 overflow-y-auto"
            >
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-xl font-bold text-slate-900">Navigation</h2>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-xl hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-slate-600" />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="space-y-2">
                  {menuItems.map((item, index) => {
                    const Icon = item.icon;
                    return (
                      <motion.button
                        key={item.page}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        onClick={() => handleNavigate(item.page)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
                      >
                        <div className={`p-2 rounded-lg bg-slate-50 group-hover:bg-white transition-colors ${item.color}`}>
                          {item.emoji ? (
                            <span className="text-xl">{item.emoji}</span>
                          ) : (
                            <Icon className="w-5 h-5" />
                          )}
                        </div>
                        <span className="font-medium text-slate-700 group-hover:text-slate-900">
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}