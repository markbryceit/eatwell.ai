import React, { useState, useEffect, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Send, Loader2, Sparkles, TrendingUp, Target } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import { toast } from 'sonner';
import AppNavigation from '@/components/dashboard/AppNavigation';
import MobileNav from '@/components/dashboard/MobileNav';
import AuthGuard from '@/components/AuthGuard';

export default function NutritionCoach() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [stats, setStats] = useState(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data } = await base44.functions.invoke('getNutritionCoachResponse', {
        message: input
      });

      setStats(data.stats);
      
      const coachMessage = { role: 'assistant', content: data.response };
      setMessages(prev => [...prev, coachMessage]);
    } catch (error) {
      toast.error('Failed to get response from coach');
      console.error('Coach error:', error);
    }

    setIsLoading(false);
  };

  const handleQuickQuestion = (question) => {
    setInput(question);
  };

  const quickQuestions = [
    "What should I eat today to hit my goals?",
    "Analyze my eating habits this week",
    "Suggest healthy recipes for dinner",
    "How can I improve my nutrition?",
    "Tips for intermittent fasting"
  ];

  return (
    <AuthGuard requireProfile={true}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-emerald-50/20 pb-20 md:pb-6">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">AI Coach</h1>
              <p className="text-slate-500">Get personalized nutrition advice</p>
            </div>
            <AppNavigation currentPage="AI Coach" />
          </div>

        {/* Stats Card */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <Card className="bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-2xl border-0">
              <CardContent className="p-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <div className="text-2xl font-bold">{stats.avgCaloriesPerDay}</div>
                    <div className="text-emerald-100 text-sm">Avg Calories/Day</div>
                  </div>
                  <div>
                    <div className="text-2xl font-bold">{stats.daysTracked}</div>
                    <div className="text-emerald-100 text-sm">Days Tracked</div>
                  </div>
                  {stats.avgFastDuration > 0 && (
                    <>
                      <div>
                        <div className="text-2xl font-bold">{stats.avgFastDuration}h</div>
                        <div className="text-emerald-100 text-sm">Avg Fast</div>
                      </div>
                      <div>
                        <div className="text-2xl font-bold">{stats.fastsCompleted}</div>
                        <div className="text-emerald-100 text-sm">Fasts Done</div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Chat Area */}
        <Card className="bg-white rounded-2xl shadow-sm border-0 mb-6">
          <CardContent className="p-0">
            <div className="h-[500px] overflow-y-auto p-6 space-y-4">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center">
                  <div className="w-20 h-20 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
                    <Sparkles className="w-10 h-10 text-emerald-500" />
                  </div>
                  <h3 className="text-xl font-semibold text-slate-900 mb-2">
                    Your Personal Nutrition Coach
                  </h3>
                  <p className="text-slate-500 max-w-md mb-6">
                    I analyze your food logs, fasting data, and goals to provide personalized advice
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 w-full max-w-2xl">
                    {quickQuestions.map((q, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        onClick={() => handleQuickQuestion(q)}
                        className="text-left justify-start h-auto py-3 px-4 rounded-xl"
                      >
                        <Target className="w-4 h-4 mr-2 flex-shrink-0" />
                        <span className="text-sm">{q}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <AnimatePresence>
                  {messages.map((msg, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                          msg.role === 'user'
                            ? 'bg-slate-900 text-white'
                            : 'bg-emerald-50 text-slate-900'
                        }`}
                      >
                        {msg.role === 'assistant' ? (
                          <ReactMarkdown
                            className="prose prose-sm max-w-none [&>*:first-child]:mt-0 [&>*:last-child]:mb-0"
                            components={{
                              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                              ul: ({ children }) => <ul className="mb-2 ml-4 list-disc">{children}</ul>,
                              ol: ({ children }) => <ol className="mb-2 ml-4 list-decimal">{children}</ol>,
                              li: ({ children }) => <li className="mb-1">{children}</li>,
                              strong: ({ children }) => <strong className="font-semibold text-emerald-700">{children}</strong>
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        ) : (
                          <p className="text-sm">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-emerald-50 rounded-2xl px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-600" />
                  </div>
                </motion.div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </CardContent>
        </Card>

        {/* Input Area */}
        <Card className="bg-white rounded-2xl shadow-sm border-0">
          <CardContent className="p-4">
            <div className="flex gap-2">
              <Input
                placeholder="Ask your nutrition coach anything..."
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                disabled={isLoading}
                className="h-12 rounded-xl"
              />
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className="h-12 px-6 bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </div>
          </CardContent>
        </Card>
        </div>
        
        <MobileNav currentPage="AI Coach" />
      </div>
    </AuthGuard>
  );
}