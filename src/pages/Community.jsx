import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, MessageSquare, TrendingUp, Users, Plus, Trophy } from 'lucide-react';
import CommunityPostCard from '@/components/community/CommunityPostCard';
import CreatePostModal from '@/components/community/CreatePostModal';
import ChallengeCard from '@/components/community/ChallengeCard';

export default function Community() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('posts');
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: posts } = useQuery({
    queryKey: ['communityPosts'],
    queryFn: () => base44.entities.CommunityPost.list('-created_date')
  });

  const { data: challenges } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      const currentUser = await base44.auth.me();
      return base44.entities.Challenge.filter({ created_by: currentUser.email });
    }
  });

  const filteredPosts = posts?.filter(post => 
    selectedCategory === 'all' || post.category === selectedCategory
  ) || [];

  const activeChallenges = challenges?.filter(c => !c.completed) || [];
  const completedChallenges = challenges?.filter(c => c.completed) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/20">
      <CreatePostModal
        isOpen={showCreatePost}
        onClose={() => setShowCreatePost(false)}
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
              <h1 className="text-3xl font-bold text-slate-900">Community</h1>
              <p className="text-slate-500">Connect, share, and grow together</p>
            </div>
          </div>
          {activeTab === 'posts' && (
            <Button
              onClick={() => setShowCreatePost(true)}
              className="bg-blue-600 hover:bg-blue-700 rounded-xl"
            >
              <Plus className="w-5 h-5 mr-2" />
              New Post
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-6">
          <TabsList className="bg-slate-100 p-1 rounded-xl">
            <TabsTrigger value="posts" className="rounded-lg">
              <MessageSquare className="w-4 h-4 mr-2" />
              Posts
            </TabsTrigger>
            <TabsTrigger value="challenges" className="rounded-lg">
              <Trophy className="w-4 h-4 mr-2" />
              Challenges
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {activeTab === 'posts' && (
          <>
            <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
              {['all', 'success_story', 'question', 'tip', 'motivation', 'recipe_share'].map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-xl whitespace-nowrap"
                >
                  {cat.replace('_', ' ')}
                </Button>
              ))}
            </div>

            <div className="space-y-4">
              {filteredPosts.map(post => (
                <CommunityPostCard key={post.id} post={post} />
              ))}
            </div>
          </>
        )}

        {activeTab === 'challenges' && (
          <div className="space-y-8">
            {activeChallenges.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Active Challenges</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {activeChallenges.map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              </div>
            )}

            {completedChallenges.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold text-slate-900 mb-4">Completed Challenges</h2>
                <div className="grid md:grid-cols-2 gap-4">
                  {completedChallenges.map(challenge => (
                    <ChallengeCard key={challenge.id} challenge={challenge} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}