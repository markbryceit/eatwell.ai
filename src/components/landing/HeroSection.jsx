import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";
import { motion } from "framer-motion";

export default function HeroSection({ onGetStarted }) {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-slate-50 via-white to-emerald-50/30">
      {/* Abstract background shapes */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-emerald-100/40 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-32 w-80 h-80 bg-amber-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-rose-100/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-100 rounded-full text-emerald-700 text-sm font-medium mb-8">
            <Sparkles className="w-4 h-4" />
            <span>AI-Powered Personalized Nutrition</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-5xl md:text-7xl font-light tracking-tight text-slate-900 mb-6"
        >
          Your perfect
          <span className="block font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
            meal plan awaits
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-lg md:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed"
        >
          Personalized weekly meal plans that adapt to your body, goals, and preferences. 
          Science-backed nutrition that evolves with you.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-slate-900 hover:bg-slate-800 text-white px-8 py-6 text-lg rounded-full shadow-xl shadow-slate-900/10 transition-all hover:shadow-2xl hover:shadow-slate-900/20 hover:-translate-y-0.5"
          >
            Start Your Journey
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="mt-20 grid grid-cols-3 gap-8 max-w-xl mx-auto"
        >
          {[
            { value: "500+", label: "Curated Recipes" },
            { value: "±250", label: "Calorie Precision" },
            { value: "Weekly", label: "Adaptive Plans" }
          ].map((stat, i) => (
            <div key={i} className="text-center">
              <div className="text-3xl font-semibold text-slate-900">{stat.value}</div>
              <div className="text-sm text-slate-500 mt-1">{stat.label}</div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}