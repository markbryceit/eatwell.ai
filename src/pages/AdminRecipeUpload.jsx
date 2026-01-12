import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Loader2, CheckCircle, XCircle, ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function AdminRecipeUpload() {
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && selectedFile.type === 'application/pdf') {
      setFile(selectedFile);
      setError(null);
      setResult(null);
    } else {
      setError('Please select a PDF file');
      setFile(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setResult(null);

    try {
      // First, upload the PDF file
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResult.file_url;

      setIsUploading(false);
      setIsProcessing(true);

      // Then extract recipes from the PDF
      const { data: extractionResult } = await base44.functions.invoke('extractRecipesFromPDF', {
        file_url: fileUrl
      });

      if (extractionResult.success) {
        setResult(extractionResult);
      } else {
        setError(extractionResult.error || 'Failed to extract recipes');
      }
    } catch (err) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
      setIsProcessing(false);
      setFile(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-violet-50/20">
      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('Dashboard')}>
            <Button variant="ghost" size="icon" className="rounded-xl">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Upload Recipe PDF</h1>
            <p className="text-slate-500">Admin only - Import recipes from PDF documents</p>
          </div>
        </div>

        {/* Upload Card */}
        <Card className="bg-white rounded-2xl shadow-lg border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-6 h-6 text-violet-500" />
              Upload PDF
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Input */}
            <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-violet-300 transition-colors">
              <input
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                className="hidden"
                id="pdf-upload"
                disabled={isUploading || isProcessing}
              />
              <label htmlFor="pdf-upload" className="cursor-pointer">
                <FileText className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <p className="text-slate-700 font-medium mb-1">
                  {file ? file.name : 'Click to select a PDF file'}
                </p>
                <p className="text-slate-500 text-sm">
                  PDF should contain recipe information with ingredients and instructions
                </p>
              </label>
            </div>

            {/* Upload Button */}
            <Button
              onClick={handleUpload}
              disabled={!file || isUploading || isProcessing}
              className="w-full h-14 rounded-xl bg-violet-600 hover:bg-violet-700 text-lg"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : isProcessing ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing with AI...
                </>
              ) : (
                <>
                  <Upload className="w-5 h-5 mr-2" />
                  Upload & Extract Recipes
                </>
              )}
            </Button>

            {/* Results */}
            {error && (
              <Alert className="bg-red-50 border-red-200">
                <XCircle className="h-5 w-5 text-red-600" />
                <AlertDescription className="text-red-800 ml-2">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert className="bg-emerald-50 border-emerald-200">
                  <CheckCircle className="h-5 w-5 text-emerald-600" />
                  <AlertDescription className="text-emerald-800 ml-2">
                    <strong>{result.message}</strong>
                  </AlertDescription>
                </Alert>

                {result.recipes && result.recipes.length > 0 && (
                  <div className="mt-6">
                    <h3 className="font-semibold text-slate-900 mb-4">Imported Recipes:</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {result.recipes.map((recipe, index) => (
                        <div
                          key={index}
                          className="p-3 bg-slate-50 rounded-xl flex items-center justify-between"
                        >
                          <div>
                            <p className="font-medium text-slate-900">{recipe.name}</p>
                            <p className="text-sm text-slate-500">
                              {recipe.meal_type} • {recipe.calories} kcal
                            </p>
                          </div>
                          <CheckCircle className="w-5 h-5 text-emerald-500" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Instructions */}
            <div className="mt-6 p-4 bg-violet-50 rounded-xl">
              <h4 className="font-medium text-violet-900 mb-2">How it works:</h4>
              <ol className="text-sm text-violet-700 space-y-1 list-decimal list-inside">
                <li>Upload a PDF containing recipe information</li>
                <li>AI will automatically extract recipe details</li>
                <li>Recipes will be added to the database</li>
                <li>Users will see them in their meal plans immediately</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}