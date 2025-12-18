import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, Camera, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function MenuScanner({ isOpen, onClose }) {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedFile) {
      toast.error('Please select a menu image');
      return;
    }

    setIsAnalyzing(true);
    try {
      // Upload the image
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });

      // Analyze the menu
      const response = await base44.functions.invoke('analyzeMenu', { imageUrl: file_url });
      setAnalysis(response.data);
      toast.success('Menu analyzed!');
    } catch (error) {
      toast.error('Failed to analyze menu');
      console.error(error);
    }
    setIsAnalyzing(false);
  };

  if (!isOpen) return null;

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
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Scan Menu</h2>
              <p className="text-sm text-slate-500 mt-1">Upload a photo to analyze healthy options</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
            {!selectedFile && (
              <label className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-12 cursor-pointer hover:border-teal-500 transition-colors">
                <Camera className="w-16 h-16 text-slate-400 mb-4" />
                <p className="text-slate-600 font-medium mb-2">Take a photo or upload menu</p>
                <p className="text-sm text-slate-400">JPG, PNG up to 10MB</p>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}

            {selectedFile && !analysis && (
              <div className="space-y-4">
                <div className="relative rounded-2xl overflow-hidden">
                  <img
                    src={URL.createObjectURL(selectedFile)}
                    alt="Menu"
                    className="w-full h-auto"
                  />
                </div>
                <Button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className="w-full bg-teal-600 hover:bg-teal-700 rounded-xl"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Menu...
                    </>
                  ) : (
                    'Analyze for Healthy Options'
                  )}
                </Button>
              </div>
            )}

            {analysis && (
              <div className="space-y-4">
                <div className="bg-emerald-50 rounded-2xl p-6">
                  <h3 className="font-semibold text-emerald-900 mb-4">Recommended Dishes</h3>
                  <div className="space-y-3">
                    {analysis.recommendations?.map((item, idx) => (
                      <div key={idx} className="bg-white rounded-xl p-4">
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-semibold text-slate-900">{item.dish_name}</h4>
                          <span className="text-sm font-medium text-emerald-600">
                            {item.health_score}/10
                          </span>
                        </div>
                        <p className="text-sm text-slate-600 mb-2">{item.reason}</p>
                        {item.modifications && (
                          <p className="text-xs text-emerald-700 font-medium">
                            ✓ Suggested: {item.modifications}
                          </p>
                        )}
                        {item.nutrition && (
                          <div className="flex gap-3 text-xs text-slate-500 mt-2">
                            <span>~{item.nutrition.calories} kcal</span>
                            <span>P: {item.nutrition.protein}g</span>
                            <span>C: {item.nutrition.carbs}g</span>
                            <span>F: {item.nutrition.fat}g</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSelectedFile(null);
                    setAnalysis(null);
                  }}
                  className="w-full rounded-xl"
                >
                  Scan Another Menu
                </Button>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}