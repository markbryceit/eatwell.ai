import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Lightbulb, ArrowRight, Loader2, Sparkles } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function RecipeSubstitutions({ recipe, isOpen, onClose }) {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(null);

  const loadSuggestions = async () => {
    setIsLoading(true);
    try {
      const { data } = await base44.functions.invoke('suggestRecipeSubstitutions', {
        recipe: recipe
      });
      setSuggestions(data);
    } catch (error) {
      toast.error('Failed to load suggestions');
    }
    setIsLoading(false);
  };

  React.useEffect(() => {
    if (isOpen && !suggestions) {
      loadSuggestions();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const tipIcons = {
    healthier: '🥗',
    faster: '⚡',
    budget: '💰',
    flavor: '✨'
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-3xl max-h-[90vh] overflow-hidden"
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Recipe Ideas</h2>
                  <p className="text-amber-100">Substitutions & variations for {recipe.name}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-amber-500 mb-4" />
                <p className="text-slate-600">Generating suggestions...</p>
              </div>
            ) : suggestions ? (
              <div className="space-y-6">
                {/* Substitutions */}
                {suggestions.substitutions?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <ArrowRight className="w-5 h-5 text-amber-500" />
                      Ingredient Substitutions
                    </h3>
                    <div className="space-y-3">
                      {suggestions.substitutions.map((sub, idx) => (
                        <Card key={idx} className="border-2 border-amber-100 hover:border-amber-200 transition-colors">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-3">
                              <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center flex-shrink-0">
                                <ArrowRight className="w-4 h-4 text-amber-600" />
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-2">
                                  <span className="font-medium text-slate-900">{sub.original_ingredient}</span>
                                  <ArrowRight className="w-4 h-4 text-slate-400" />
                                  <span className="font-medium text-amber-600">{sub.substitute}</span>
                                  <Badge variant="outline" className="text-xs">{sub.ratio}</Badge>
                                </div>
                                <div className="space-y-1 text-sm text-slate-600">
                                  <p><strong>Taste:</strong> {sub.taste_impact}</p>
                                  {sub.cooking_adjustments && (
                                    <p><strong>Cooking:</strong> {sub.cooking_adjustments}</p>
                                  )}
                                  {sub.nutritional_notes && (
                                    <p><strong>Nutrition:</strong> {sub.nutritional_notes}</p>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Variations */}
                {suggestions.variations?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-violet-500" />
                      Creative Variations
                    </h3>
                    <div className="grid gap-4">
                      {suggestions.variations.map((variation, idx) => (
                        <Card key={idx} className="border-2 border-violet-100 hover:border-violet-200 transition-colors">
                          <CardContent className="p-4">
                            <h4 className="font-semibold text-slate-900 mb-2">{variation.name}</h4>
                            <p className="text-sm text-slate-600 mb-3">{variation.description}</p>
                            <div className="flex flex-wrap gap-2">
                              {variation.key_changes?.map((change, i) => (
                                <Badge key={i} className="bg-violet-100 text-violet-700">
                                  {change}
                                </Badge>
                              ))}
                              {variation.difficulty_change && variation.difficulty_change !== 'same' && (
                                <Badge variant="outline">
                                  {variation.difficulty_change === 'easier' ? '✓ Easier' : '⚠ Harder'}
                                </Badge>
                              )}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}

                {/* Tips */}
                {suggestions.tips?.length > 0 && (
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                      <Lightbulb className="w-5 h-5 text-emerald-500" />
                      Pro Tips
                    </h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {suggestions.tips.map((tip, idx) => (
                        <Card key={idx} className="border-2 border-slate-100">
                          <CardContent className="p-4">
                            <div className="flex items-start gap-2">
                              <span className="text-2xl">{tipIcons[tip.category] || '💡'}</span>
                              <div>
                                <div className="text-xs font-medium text-slate-500 uppercase mb-1">
                                  {tip.category}
                                </div>
                                <p className="text-sm text-slate-700">{tip.tip}</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-slate-100">
            <Button
              onClick={onClose}
              className="w-full h-12 rounded-xl bg-slate-900 hover:bg-slate-800"
            >
              Close
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}