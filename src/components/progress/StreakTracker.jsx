import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Flame, Calendar } from 'lucide-react';
import { format, parseISO, differenceInDays, subDays } from 'date-fns';

export default function StreakTracker({ calorieLogs }) {
  // Calculate current streak
  const calculateStreak = () => {
    if (!calorieLogs || calorieLogs.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if there's a log for today or yesterday
    const sortedLogs = [...calorieLogs].sort((a, b) => 
      new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const mostRecentLog = parseISO(sortedLogs[0].date);
    const daysDiff = differenceInDays(today, mostRecentLog);

    // If last log is more than 1 day ago, streak is broken
    if (daysDiff > 1) return 0;

    // Count consecutive days
    for (let i = 0; i < sortedLogs.length; i++) {
      const currentDate = parseISO(sortedLogs[i].date);
      const expectedDate = subDays(today, i + (daysDiff === 1 ? 1 : 0));
      expectedDate.setHours(0, 0, 0, 0);
      
      if (differenceInDays(expectedDate, currentDate) === 0) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  };

  const currentStreak = calculateStreak();
  const longestStreak = calorieLogs?.length || 0;

  return (
    <Card className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-sm border-0 text-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-white flex items-center gap-2">
          <Flame className="w-5 h-5" />
          Tracking Streak
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <div className="text-5xl font-bold mb-2">{currentStreak}</div>
          <p className="text-orange-100 text-sm mb-4">
            {currentStreak === 1 ? 'day' : 'days'} in a row!
          </p>
          
          <div className="flex items-center justify-center gap-2 text-sm text-orange-100">
            <Calendar className="w-4 h-4" />
            <span>Best: {longestStreak} days</span>
          </div>
        </div>
        
        {currentStreak === 0 && (
          <div className="mt-4 p-3 bg-white/20 backdrop-blur-sm rounded-lg text-center text-sm">
            Start a new streak by logging your meals today!
          </div>
        )}
        
        {currentStreak >= 7 && (
          <div className="mt-4 p-3 bg-white/20 backdrop-blur-sm rounded-lg text-center text-sm">
            🔥 You're on fire! Keep it going!
          </div>
        )}
      </CardContent>
    </Card>
  );
}