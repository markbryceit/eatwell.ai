import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Calendar, CheckCircle } from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

export default function ChallengeCard({ challenge }) {
  const daysRemaining = differenceInDays(new Date(challenge.end_date), new Date());

  return (
    <Card className={`rounded-2xl shadow-sm border-0 ${challenge.completed ? 'bg-gradient-to-br from-emerald-50 to-teal-50' : 'bg-white'}`}>
      <CardHeader>
        <div className="flex items-start justify-between mb-2">
          <Trophy className={`w-6 h-6 ${challenge.completed ? 'text-emerald-600' : 'text-amber-500'}`} />
          {challenge.completed && (
            <Badge className="bg-emerald-500">Completed</Badge>
          )}
        </div>
        <CardTitle className="text-lg">{challenge.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-slate-600 text-sm mb-4">{challenge.description}</p>
        
        <div className="space-y-2 text-sm text-slate-500 mb-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            {challenge.participants_count} participants
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4" />
            {format(new Date(challenge.start_date), 'MMM d')} - {format(new Date(challenge.end_date), 'MMM d')}
          </div>
        </div>

        {!challenge.completed && (
          <>
            <div className="mb-2">
              <div className="flex justify-between text-xs text-slate-500 mb-1">
                <span>Progress</span>
                <span>{challenge.progress}%</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2">
                <div
                  className="bg-blue-600 rounded-full h-2 transition-all"
                  style={{ width: `${challenge.progress}%` }}
                />
              </div>
            </div>
            <p className="text-xs text-slate-500 mb-3">
              {daysRemaining > 0 ? `${daysRemaining} days remaining` : 'Challenge ended'}
            </p>
          </>
        )}

        <Button
          variant={challenge.completed ? 'outline' : 'default'}
          className="w-full rounded-xl"
          disabled={challenge.completed}
        >
          {challenge.completed ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Completed
            </>
          ) : (
            'Join Challenge'
          )}
        </Button>
      </CardContent>
    </Card>
  );
}