import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { X, CheckCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function LessonModal({ lesson, isOpen, onClose, onMarkComplete }) {
  if (!lesson || !isOpen) return null;

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
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">{lesson.title}</h2>
              <p className="text-sm text-slate-500 mt-1">
                Day {lesson.day_number} • {lesson.duration_mins} min read
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full hover:bg-slate-100 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-12rem)]">
            <ReactMarkdown className="prose prose-slate max-w-none">
              {lesson.content}
            </ReactMarkdown>
          </div>

          <div className="p-6 border-t border-slate-100 flex justify-end gap-3">
            <Button variant="outline" onClick={onClose} className="rounded-xl">
              Close
            </Button>
            {!lesson.completed && (
              <Button
                onClick={() => onMarkComplete(lesson.id)}
                className="bg-emerald-600 hover:bg-emerald-700 rounded-xl"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark Complete
              </Button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}