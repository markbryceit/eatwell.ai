import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Clock, Play, Square, Timer, Flame, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';
import { differenceInHours, differenceInMinutes, format, parseISO } from 'date-fns';

export default function FastingTimer() {
  const queryClient = useQueryClient();
  const [targetHours, setTargetHours] = useState(16);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update current time every minute
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  // Fetch active fast
  const { data: fastingLogs } = useQuery({
    queryKey: ['fastingLogs'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FastingLog.filter({ 
        created_by: currentUser.email,
        status: 'active'
      });
    },
    refetchInterval: 60000 // Refetch every minute
  });

  // Fetch completed fasts for stats
  const { data: completedFasts } = useQuery({
    queryKey: ['completedFasts'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.FastingLog.filter({ 
        created_by: currentUser.email,
        status: 'completed'
      });
    }
  });

  const activeFast = fastingLogs?.[0];

  const startFast = useMutation({
    mutationFn: async () => {
      await base44.entities.FastingLog.create({
        start_time: new Date().toISOString(),
        target_hours: targetHours,
        status: 'active'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fastingLogs'] });
      toast.success(`Started ${targetHours}-hour fast`);
    }
  });

  const endFast = useMutation({
    mutationFn: async (status = 'completed') => {
      const endTime = new Date().toISOString();
      const startTime = parseISO(activeFast.start_time);
      const durationHours = differenceInHours(new Date(), startTime) + 
                           differenceInMinutes(new Date(), startTime) % 60 / 60;
      
      await base44.entities.FastingLog.update(activeFast.id, {
        end_time: endTime,
        duration_hours: Math.round(durationHours * 10) / 10,
        status: status
      });
    },
    onSuccess: (_, status) => {
      queryClient.invalidateQueries({ queryKey: ['fastingLogs'] });
      queryClient.invalidateQueries({ queryKey: ['completedFasts'] });
      toast.success(status === 'completed' ? 'Fast completed!' : 'Fast ended');
    }
  });

  const calculateProgress = () => {
    if (!activeFast) return { hours: 0, minutes: 0, percentage: 0 };
    
    const startTime = parseISO(activeFast.start_time);
    const elapsedMinutes = differenceInMinutes(currentTime, startTime);
    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    const percentage = Math.min((elapsedMinutes / (activeFast.target_hours * 60)) * 100, 100);
    
    return { hours, minutes, percentage };
  };

  const { hours, minutes, percentage } = calculateProgress();
  const avgDuration = completedFasts?.length > 0 
    ? (completedFasts.reduce((sum, f) => sum + f.duration_hours, 0) / completedFasts.length).toFixed(1)
    : 0;

  return (
    <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white rounded-2xl shadow-lg border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-6 h-6" />
          Intermittent Fasting
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {activeFast ? (
          <>
            {/* Timer Display */}
            <div className="text-center">
              <div className="text-6xl font-bold mb-2">
                {hours}:{minutes.toString().padStart(2, '0')}
              </div>
              <p className="text-orange-100">
                Target: {activeFast.target_hours} hours
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-2">
              <div className="w-full bg-white/20 rounded-full h-3">
                <div 
                  className="bg-white rounded-full h-3 transition-all duration-1000"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <p className="text-center text-sm text-orange-100">
                {percentage >= 100 ? '🎉 Target reached!' : `${percentage.toFixed(0)}% complete`}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              <Button
                onClick={() => endFast.mutate('completed')}
                className="flex-1 bg-white text-orange-600 hover:bg-orange-50"
              >
                <Square className="w-4 h-4 mr-2" />
                Complete Fast
              </Button>
              <Button
                onClick={() => endFast.mutate('broken')}
                variant="outline"
                className="flex-1 border-white text-white hover:bg-white/10"
              >
                End Early
              </Button>
            </div>
          </>
        ) : (
          <>
            {/* Start Fast */}
            <div className="space-y-4">
              <div>
                <Label className="text-white mb-2 block">Fasting Duration</Label>
                <Select value={targetHours.toString()} onValueChange={(val) => setTargetHours(parseInt(val))}>
                  <SelectTrigger className="w-full bg-white/20 border-white/30 text-white h-12 rounded-xl">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="12">12 hours</SelectItem>
                    <SelectItem value="14">14 hours</SelectItem>
                    <SelectItem value="16">16 hours</SelectItem>
                    <SelectItem value="18">18 hours</SelectItem>
                    <SelectItem value="20">20 hours</SelectItem>
                    <SelectItem value="24">24 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                onClick={() => startFast.mutate()}
                disabled={startFast.isPending}
                className="w-full h-14 bg-white text-orange-600 hover:bg-orange-50"
              >
                <Play className="w-5 h-5 mr-2" />
                Start {targetHours}-Hour Fast
              </Button>
            </div>

            {/* Stats */}
            {completedFasts?.length > 0 && (
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/20">
                <div className="text-center">
                  <div className="text-2xl font-bold">{completedFasts.length}</div>
                  <div className="text-xs text-orange-100">Fasts Completed</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold">{avgDuration}h</div>
                  <div className="text-xs text-orange-100">Avg Duration</div>
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}