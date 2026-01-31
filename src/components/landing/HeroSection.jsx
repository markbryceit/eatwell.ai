import React from 'react';
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Zap } from "lucide-react";

export default function HeroSection({ onGetStarted }) {
  return (
    <section className="relative bg-slate-950 text-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 mb-6">
              <Zap className="w-4 h-4 text-emerald-400" />
              <span className="text-sm text-emerald-400 font-medium">AI-Powered Nutrition</span>
            </div>
            
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              Get Dialled In With
              <span className="block mt-2 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Smart Meal Plans
              </span>
            </h1>
            
            <p className="text-xl text-slate-400 mb-10 leading-relaxed">
              Personalized weekly meal plans, macro tracking, and AI-driven recommendations 
              to help you reach your nutrition goals and build lasting healthy habits.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                size="lg"
                onClick={onGetStarted}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-emerald-500/25 transition-all"
              >
                Start Your Journey Free
              </Button>
              <Button
                size="lg"
                variant="outline"
                onClick={onGetStarted}
                className="px-8 py-6 text-lg rounded-xl border-2 border-emerald-500/20 hover:bg-emerald-500/5"
              >
                Sign In
              </Button>
            </div>

            {/* Stats */}
            <div className="mt-12 grid grid-cols-3 gap-8">
              <div>
                <div className="text-3xl font-bold text-white">500+</div>
                <div className="text-sm text-slate-400 mt-1">Expert Recipes</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">AI</div>
                <div className="text-sm text-slate-400 mt-1">Recommendations</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-white">24/7</div>
                <div className="text-sm text-slate-400 mt-1">Tracking</div>
              </div>
            </div>
          </motion.div>

          {/* Right Image */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1490645935967-10de6ba17061?q=80&w=1200"
                alt="Healthy meal prep"
                className="w-full h-[600px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            </div>
            
            {/* Floating Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="absolute -bottom-6 -left-6 bg-white rounded-2xl p-6 shadow-xl"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                  <div className="text-sm text-slate-500">Daily Target</div>
                  <div className="text-2xl font-bold text-slate-900">2,000 kcal</div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}