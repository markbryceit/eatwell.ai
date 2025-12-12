import React from 'react';
import { format, addDays, isSameDay } from 'date-fns';
import { motion } from 'framer-motion';

export default function DaySelector({ weekStartDate, selectedDay, onSelectDay }) {
  const days = Array.from({ length: 7 }, (_, i) => {
    const date = addDays(new Date(weekStartDate), i);
    return {
      date,
      dayName: format(date, 'EEE'),
      dayNumber: format(date, 'd'),
      isToday: isSameDay(date, new Date())
    };
  });

  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {days.map((day, index) => {
        const isSelected = selectedDay === index;
        return (
          <motion.button
            key={index}
            onClick={() => onSelectDay(index)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className={`flex-shrink-0 w-14 py-3 rounded-2xl text-center transition-all ${
              isSelected
                ? 'bg-slate-900 text-white shadow-lg'
                : day.isToday
                ? 'bg-emerald-100 text-emerald-700'
                : 'bg-white text-slate-600 hover:bg-slate-50'
            }`}
          >
            <div className="text-xs font-medium opacity-70">{day.dayName}</div>
            <div className="text-lg font-semibold">{day.dayNumber}</div>
            {day.isToday && !isSelected && (
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full mx-auto mt-1" />
            )}
          </motion.button>
        );
      })}
    </div>
  );
}