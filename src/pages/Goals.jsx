import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { ArrowLeft, Plus, Target, TrendingUp, Trophy, Clock } from 'lucide-react';
import GoalCard from '@/components/goals/GoalCard';
import GoalModal from '@/components/goals/GoalModal';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import AuthGuard from '@/components/AuthGuard';

export default function Goals() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [activeTab, setActiveTab] = useState('active');

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
    staleTime: 30 * 60 * 1000
  });

  const { data: profile } = useQuery({
    queryKey: ['userProfile', user?.email],
    queryFn: () => base44.entities.UserProfile.filter({ created_by: user.email }).then(p => p[0]),
    enabled: !!user,
    staleTime: 10 * 60 * 1000
  });

  const { data: goals, isLoading } = useQuery({
    queryKey: ['goals', user?.email],
    queryFn: () => base44.entities.Goal.filter({ created_by: user.email }, '-created_date'),
    enabled: !!user,
    staleTime: 5 * 60 * 1000
  });

  const createGoalMutation = useMutation({
    mutationFn: (goalData) => base44.entities.Goal.create(goalData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowModal(false);
      setEditingGoal(null);
      toast.success('Goal created successfully!');
    }
  });

  const updateGoalMutation = useMutation({
    mutationFn: ({ id, data }) => base44.entities.Goal.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      setShowModal(false);
      setEditingGoal(null);
      toast.success('Goal updated successfully!');
    }
  });

  const deleteGoalMutation = useMutation({
    mutationFn: (id) => base44.entities.Goal.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['goals'] });
      toast.success('Goal deleted');
    }
  });

  const handleSaveGoal = (goalData) => {
    if (editingGoal) {
      updateGoalMutation.mutate({ id: editingGoal.id, data: goalData });
    } else {
      createGoalMutation.mutate(goalData);
    }
  };

  const handleCompleteGoal = (goalId) => {
    const goal = goals?.find(g => g.id === goalId);
    if (goal) {
      updateGoalMutation.mutate({
        id: goalId,
        data: { ...goal, status: 'completed' }
      });
    }
  };

  const handleEditGoal = (goal) => {
    setEditingGoal(goal);
    setShowModal(true);
  };

  const activeGoals = goals?.filter(g => g.status === 'active') || [];
  const completedGoals = goals?.filter(g => g.status === 'completed') || [];
  const allGoals = goals || [];

  const stats = {
    total: allGoals.length,
    active: activeGoals.length,
    completed: completedGoals.length,
    avgProgress: activeGoals.length > 0
      ? Math.round(activeGoals.reduce((sum, g) => {
          const progress = g.start_value && g.target_value
            ? Math.min(100, Math.max(0, 
                ((g.current_value - g.start_value) / (g.target_value - g.start_value)) * 100
              ))
            : 0;
          return sum + progress;
        }, 0) / activeGoals.length)
      : 0
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-500">Loading goals...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthGuard requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl('Dashboard')}>
              <Button
                variant="ghost"
                size="icon"
                className="rounded-xl"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-slate-900">My Goals</h1>
              <p className="text-slate-500">Set and track your health and fitness goals</p>
            </div>
          </div>
          <Button
            onClick={() => {
              setEditingGoal(null);
              setShowModal(true);
            }}
            className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
          >
            <Plus className="w-5 h-5 mr-2" />
            New Goal
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-4 gap-4 mb-6">
          <Card className="bg-white rounded-2xl border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-slate-100">
                  <Target className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">{stats.total}</div>
                  <div className="text-sm text-slate-500">Total Goals</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-blue-50 rounded-2xl border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-blue-100">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700">{stats.active}</div>
                  <div className="text-sm text-blue-600">Active</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-green-50 rounded-2xl border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-green-100">
                  <Trophy className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-700">{stats.completed}</div>
                  <div className="text-sm text-green-600">Completed</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-emerald-50 rounded-2xl border-0">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-xl bg-emerald-100">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-700">{stats.avgProgress}%</div>
                  <div className="text-sm text-emerald-600">Avg Progress</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Goals List */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-white rounded-xl p-1 mb-6">
            <TabsTrigger value="active" className="rounded-lg">
              Active ({stats.active})
            </TabsTrigger>
            <TabsTrigger value="completed" className="rounded-lg">
              Completed ({stats.completed})
            </TabsTrigger>
            <TabsTrigger value="all" className="rounded-lg">
              All ({stats.total})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {activeGoals.length === 0 ? (
              <Card className="bg-white rounded-2xl border-0 p-12 text-center">
                <Target className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Active Goals</h3>
                <p className="text-slate-500 mb-6">Start your journey by creating your first goal</p>
                <Button
                  onClick={() => setShowModal(true)}
                  className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Your First Goal
                </Button>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {activeGoals.map((goal, idx) => (
                  <motion.div
                    key={goal.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <GoalCard
                      goal={goal}
                      onEdit={handleEditGoal}
                      onDelete={deleteGoalMutation.mutate}
                      onComplete={handleCompleteGoal}
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            {completedGoals.length === 0 ? (
              <Card className="bg-white rounded-2xl border-0 p-12 text-center">
                <Trophy className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-xl font-semibold text-slate-900 mb-2">No Completed Goals Yet</h3>
                <p className="text-slate-500">Keep working towards your active goals!</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-6">
                {completedGoals.map((goal) => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    onEdit={handleEditGoal}
                    onDelete={deleteGoalMutation.mutate}
                    onComplete={handleCompleteGoal}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="all">
            <div className="grid md:grid-cols-2 gap-6">
              {allGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  onEdit={handleEditGoal}
                  onDelete={deleteGoalMutation.mutate}
                  onComplete={handleCompleteGoal}
                />
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <GoalModal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        goal={editingGoal}
        userProfile={profile}
      />
    </div>
    </AuthGuard>
  );
}