import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { X, Camera, Upload, Loader2, Sparkles, TrendingDown, Ruler } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function BodyMeasurementModal({ isOpen, onClose, onSaved }) {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [notes, setNotes] = useState('');
  const fileInputRef = useRef(null);

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
      setAnalysis(null);
    }
  };

  const handleAnalyze = async () => {
    if (!selectedImage) return;

    setIsAnalyzing(true);
    try {
      // Upload image
      const { file_url } = await base44.integrations.Core.UploadFile({
        file: selectedImage
      });

      // Analyze body measurements
      const { data } = await base44.functions.invoke('analyzeBodyMeasurements', {
        imageUrl: file_url
      });

      setAnalysis({ ...data, photo_url: file_url });
      toast.success('Analysis complete!');
    } catch (error) {
      toast.error('Failed to analyze photo');
      console.error(error);
    }
    setIsAnalyzing(false);
  };

  const handleSave = async () => {
    if (!analysis) return;

    setIsSaving(true);
    try {
      await base44.entities.BodyMeasurement.create({
        date,
        photo_url: analysis.photo_url,
        body_fat_percentage: analysis.body_fat_percentage,
        measurements: analysis.measurements,
        notes: notes || analysis.analysis_notes
      });

      toast.success('Body measurement saved!');
      onSaved();
      handleClose();
    } catch (error) {
      toast.error('Failed to save measurement');
      console.error(error);
    }
    setIsSaving(false);
  };

  const handleClose = () => {
    setSelectedImage(null);
    setImagePreview(null);
    setAnalysis(null);
    setNotes('');
    setDate(format(new Date(), 'yyyy-MM-dd'));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50"
        onClick={handleClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          onClick={(e) => e.stopPropagation()}
          className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        >
          <div className="sticky top-0 bg-white border-b border-slate-100 px-6 py-4 rounded-t-3xl flex items-center justify-between z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <Camera className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Body Measurement</h2>
                <p className="text-sm text-slate-500">AI-powered body analysis</p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 rounded-lg hover:bg-slate-100 flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-6">
            {/* Date */}
            <div>
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1"
              />
            </div>

            {/* Image Upload */}
            <div>
              <Label>Body Photo</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleImageSelect}
                className="hidden"
              />

              {!imagePreview ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="mt-1 border-2 border-dashed border-slate-200 rounded-2xl p-12 text-center cursor-pointer hover:border-blue-300 hover:bg-blue-50/50 transition-all"
                >
                  <Camera className="w-12 h-12 mx-auto text-slate-300 mb-3" />
                  <p className="text-slate-600 font-medium mb-1">Take or upload photo</p>
                  <p className="text-slate-400 text-sm">Front-facing, full body recommended</p>
                </div>
              ) : (
                <div className="mt-1 space-y-3">
                  <div className="relative rounded-2xl overflow-hidden">
                    <img
                      src={imagePreview}
                      alt="Body preview"
                      className="w-full h-auto max-h-96 object-contain bg-slate-50"
                    />
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedImage(null);
                      setImagePreview(null);
                      setAnalysis(null);
                    }}
                    className="w-full rounded-xl"
                  >
                    Change Photo
                  </Button>
                </div>
              )}
            </div>

            {/* Analyze Button */}
            {imagePreview && !analysis && (
              <Button
                onClick={handleAnalyze}
                disabled={isAnalyzing}
                className="w-full h-12 bg-blue-600 hover:bg-blue-700 rounded-xl"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Analyze Body
                  </>
                )}
              </Button>
            )}

            {/* Analysis Results */}
            {analysis && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                {/* Body Fat Percentage */}
                <div className="bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl p-6 text-white">
                  <div className="flex items-center gap-3 mb-2">
                    <TrendingDown className="w-6 h-6" />
                    <h3 className="text-lg font-semibold">Body Fat Percentage</h3>
                  </div>
                  <p className="text-4xl font-bold">{analysis.body_fat_percentage.toFixed(1)}%</p>
                </div>

                {/* Measurements */}
                <div className="bg-slate-50 rounded-2xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Ruler className="w-5 h-5 text-slate-600" />
                    <h3 className="font-semibold text-slate-900">Body Measurements</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(analysis.measurements).map(([key, value]) => (
                      <div key={key} className="bg-white rounded-xl p-3">
                        <p className="text-xs text-slate-500 capitalize mb-1">
                          {key.replace('_inches', '').replace('_', ' ')}
                        </p>
                        <p className="text-lg font-bold text-slate-900">{value.toFixed(1)}"</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <Label htmlFor="notes">Notes (optional)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder={analysis.analysis_notes || "Add any notes about this measurement..."}
                    className="mt-1 h-24"
                  />
                </div>

                {/* Save Button */}
                <Button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="w-full h-12 bg-slate-900 hover:bg-slate-800 rounded-xl"
                >
                  {isSaving ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    'Save Measurement'
                  )}
                </Button>
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}