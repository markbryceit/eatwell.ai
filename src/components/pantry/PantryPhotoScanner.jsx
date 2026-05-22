import React, { useState, useRef } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Camera, X, Loader2, Check, RefreshCw, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function PantryPhotoScanner({ existingIngredients, onAddIngredients, onClose }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [detected, setDetected] = useState(null); // array of strings
  const [selected, setSelected] = useState(new Set());
  const fileInputRef = useRef(null);

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setDetected(null);
    setSelected(new Set());
    setImageUrl(null);

    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setImageUrl(file_url);
      await analyseImage(file_url);
    } catch {
      toast.error('Failed to upload image');
    }
    setIsUploading(false);
  };

  const analyseImage = async (url) => {
    setIsAnalysing(true);
    try {
      const result = await base44.integrations.Core.InvokeLLM({
        prompt: `You are a food recognition AI. Carefully examine this image of a fridge, pantry, or kitchen shelves.

Identify every distinct food item, ingredient, condiment, drink, or cooking ingredient visible.
Be specific but concise — use common names a home cook would recognise (e.g. "chicken breast", "cheddar cheese", "soy sauce", "broccoli").
Do not include packaging, containers, or non-food items.
List each unique item only once.
If you cannot clearly identify something, skip it.`,
        file_urls: [url],
        response_json_schema: {
          type: 'object',
          properties: {
            ingredients: {
              type: 'array',
              items: { type: 'string' }
            },
            confidence_note: { type: 'string' }
          }
        }
      });

      const found = result.ingredients || [];
      // Filter out ones already in pantry
      const existingLower = existingIngredients.map(i => i.toLowerCase());
      const newOnes = found.filter(i => !existingLower.includes(i.toLowerCase()));
      const alreadyHave = found.filter(i => existingLower.includes(i.toLowerCase()));

      setDetected({ new: newOnes, existing: alreadyHave, note: result.confidence_note });
      // Pre-select all new ones
      setSelected(new Set(newOnes));
    } catch {
      toast.error('Failed to analyse image');
    }
    setIsAnalysing(false);
  };

  const toggleItem = (item) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(item)) next.delete(item);
      else next.add(item);
      return next;
    });
  };

  const handleAdd = () => {
    const toAdd = [...selected];
    if (toAdd.length === 0) return;
    onAddIngredients(toAdd);
    toast.success(`Added ${toAdd.length} ingredient${toAdd.length > 1 ? 's' : ''} to pantry`);
    onClose();
  };

  const isLoading = isUploading || isAnalysing;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <div>
            <h2 className="font-semibold text-slate-900 text-lg">Scan Your Pantry</h2>
            <p className="text-slate-400 text-xs mt-0.5">Upload a photo and AI will detect ingredients</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* Upload area */}
          <div
            onClick={() => !isLoading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl flex flex-col items-center justify-center gap-3 transition-all cursor-pointer
              ${isLoading ? 'border-slate-200 bg-slate-50 cursor-not-allowed' : 'border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/40 bg-white'}
              ${imageUrl ? 'min-h-[180px]' : 'min-h-[140px] py-8'}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              className="hidden"
              onChange={handleFileChange}
            />

            {imageUrl ? (
              <img
                src={imageUrl}
                alt="Pantry photo"
                className="w-full max-h-56 object-cover rounded-lg"
              />
            ) : (
              <>
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <Camera className="w-7 h-7 text-emerald-600" />
                </div>
                <div className="text-center">
                  <p className="font-medium text-slate-700 text-sm">Take a photo or upload an image</p>
                  <p className="text-slate-400 text-xs mt-1">Fridge, pantry shelves, or countertop</p>
                </div>
              </>
            )}
          </div>

          {/* Re-upload button when image is shown */}
          {imageUrl && !isLoading && (
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl"
              onClick={() => fileInputRef.current?.click()}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Use a different photo
            </Button>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              <p className="text-sm text-slate-500">
                {isUploading ? 'Uploading photo…' : 'AI is scanning for ingredients…'}
              </p>
            </div>
          )}

          {/* Results */}
          {detected && !isLoading && (
            <div className="space-y-3">
              {detected.note && (
                <p className="text-xs text-slate-400 italic">{detected.note}</p>
              )}

              {detected.new.length > 0 ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-slate-700">
                      Detected ingredients ({detected.new.length})
                    </p>
                    <button
                      onClick={() => setSelected(new Set(detected.new))}
                      className="text-xs text-emerald-600 hover:underline"
                    >
                      Select all
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {detected.new.map((ing, i) => (
                      <button
                        key={i}
                        onClick={() => toggleItem(ing)}
                        className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${
                          selected.has(ing)
                            ? 'bg-emerald-100 border-emerald-300 text-emerald-800'
                            : 'bg-white border-slate-200 text-slate-500'
                        }`}
                      >
                        {selected.has(ing) && <Check className="w-3 h-3" />}
                        {ing}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-sm text-slate-400 text-center py-2">
                  No new ingredients detected — they may already be in your pantry.
                </p>
              )}

              {detected.existing.length > 0 && (
                <div>
                  <p className="text-xs text-slate-400 mb-2">Already in your pantry:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {detected.existing.map((ing, i) => (
                      <span key={i} className="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-400 line-through">
                        {ing}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {detected && !isLoading && selected.size > 0 && (
          <div className="p-5 border-t border-slate-100">
            <Button
              onClick={handleAdd}
              className="w-full bg-emerald-600 hover:bg-emerald-700 rounded-xl h-11 font-semibold"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add {selected.size} ingredient{selected.size > 1 ? 's' : ''} to Pantry
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}