import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';
import { format } from 'date-fns';

export default function CommunityPostCard({ post }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);

  React.useEffect(() => {
    const fetchUser = async () => {
      const currentUser = await base44.auth.me();
      setUser(currentUser);
    };
    fetchUser();
  }, []);

  const toggleLike = useMutation({
    mutationFn: async () => {
      const likedBy = post.liked_by || [];
      const hasLiked = likedBy.includes(user?.email);
      
      await base44.entities.CommunityPost.update(post.id, {
        liked_by: hasLiked 
          ? likedBy.filter(email => email !== user?.email)
          : [...likedBy, user?.email],
        likes: hasLiked ? post.likes - 1 : post.likes + 1
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['communityPosts'] })
  });

  const hasLiked = post.liked_by?.includes(user?.email);

  const categoryColors = {
    success_story: 'bg-emerald-100 text-emerald-700',
    question: 'bg-blue-100 text-blue-700',
    tip: 'bg-amber-100 text-amber-700',
    motivation: 'bg-rose-100 text-rose-700',
    recipe_share: 'bg-purple-100 text-purple-700'
  };

  return (
    <Card className="bg-white rounded-2xl shadow-sm border-0 hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-3">
          <div>
            <Badge className={categoryColors[post.category]}>
              {post.category.replace('_', ' ')}
            </Badge>
          </div>
          <span className="text-xs text-slate-500">
            {format(new Date(post.created_date), 'MMM d, yyyy')}
          </span>
        </div>

        <h3 className="text-lg font-semibold text-slate-900 mb-2">{post.title}</h3>
        <p className="text-slate-600 mb-4 whitespace-pre-wrap">{post.content}</p>

        <div className="flex items-center gap-4 pt-3 border-t border-slate-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => toggleLike.mutate()}
            className="gap-2"
          >
            <Heart className={`w-4 h-4 ${hasLiked ? 'fill-rose-500 text-rose-500' : ''}`} />
            {post.likes || 0}
          </Button>
          <Button variant="ghost" size="sm" className="gap-2">
            <MessageCircle className="w-4 h-4" />
            {post.comments_count || 0}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}