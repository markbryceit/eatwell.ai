import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, BookOpen, CheckCircle2, Clock, MessageCircle, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';
import LessonModal from '@/components/learn/LessonModal';
import CoachChat from '@/components/learn/CoachChat';

export default function Learn() {
  const queryClient = useQueryClient();
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [showCoach, setShowCoach] = useState(false);

  const { data: lessons, isLoading } = useQuery({
    queryKey: ['lessons'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.DailyLesson.filter({ created_by: currentUser.email });
    }
  });

  const markComplete = useMutation({
    mutationFn: async (lessonId) => {
      await base44.entities.DailyLesson.update(lessonId, {
        completed: true,
        completion_date: new Date().toISOString().split('T')[0]
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['lessons'] })
  });

  const categoryColors = {
    mindful_eating: 'bg-purple-100 text-purple-700',
    habit_formation: 'bg-blue-100 text-blue-700',
    nutrition_science: 'bg-emerald-100 text-emerald-700',
    emotional_eating: 'bg-rose-100 text-rose-700',
    meal_prep: 'bg-amber-100 text-amber-700'
  };

  const completedCount = lessons?.filter(l => l.completed).length || 0;
  const totalCount = lessons?.length || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-purple-50/20">
      <LessonModal
        lesson={selectedLesson}
        isOpen={!!selectedLesson}
        onClose={() => setSelectedLesson(null)}
        onMarkComplete={(lessonId) => {
          markComplete.mutate(lessonId);
          setSelectedLesson(null);
        }}
      />

      <CoachChat
        isOpen={showCoach}
        onClose={() => setShowCoach(false)}
      />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button variant="ghost" size="icon" className="rounded-xl">
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Daily Lessons</h1>
              <p className="text-slate-500">
                {completedCount} of {totalCount} lessons completed
              </p>
            </div>
          </div>
          <Button
            onClick={() => setShowCoach(true)}
            className="bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 rounded-xl"
          >
            <MessageCircle className="w-5 h-5 mr-2" />
            Talk to Coach
          </Button>
        </div>

        {/* Progress Card */}
        <Card className="bg-gradient-to-br from-purple-500 to-violet-600 text-white rounded-2xl shadow-lg mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold mb-1">Your Learning Journey</h3>
                <p className="text-purple-100 text-sm">
                  {Math.round((completedCount / totalCount) * 100)}% complete
                </p>
              </div>
              <Sparkles className="w-10 h-10 text-purple-200" />
            </div>
            <div className="w-full bg-purple-400/30 rounded-full h-3">
              <div
                className="bg-white rounded-full h-3 transition-all"
                style={{ width: `${(completedCount / totalCount) * 100}%` }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lessons Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {lessons?.map((lesson, index) => (
            <motion.div
              key={lesson.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`rounded-2xl shadow-sm border-0 cursor-pointer hover:shadow-lg transition-all ${
                lesson.completed ? 'bg-white' : 'bg-gradient-to-br from-white to-slate-50'
              }`}
                onClick={() => setSelectedLesson(lesson)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between mb-2">
                    <Badge className={categoryColors[lesson.category]}>
                      {lesson.category.replace('_', ' ')}
                    </Badge>
                    {lesson.completed && (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    )}
                  </div>
                  <CardTitle className="text-lg">{lesson.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {lesson.duration_mins} min
                    </span>
                    <span className="flex items-center gap-1">
                      <BookOpen className="w-4 h-4" />
                      Day {lesson.day_number}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}