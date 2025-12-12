import React from 'react';
import { motion } from "framer-motion";
import { Target, Utensils, TrendingUp, Apple } from "lucide-react";

export default function HowItWorksSection() {
  return (
    <section className="py-24 px-6 bg-slate-50">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Deliver Personalized Plans
            <span className="block mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              At Scale
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Easily craft meal plans tailored to meet your macro needs and dietary preferences. 
            Empowering you with personalized nutrition is now a breeze.
          </p>
        </motion.div>

        {/* Features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
              <Utensils className="w-7 h-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Full Week Plans</h3>
            <p className="text-slate-600">
              Complete personalized meal plans based on your goals and preferences, ensuring you get the nutrition you need.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="w-14 h-14 rounded-2xl bg-teal-100 flex items-center justify-center mb-6">
              <Apple className="w-7 h-7 text-teal-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Recipe Library</h3>
            <p className="text-slate-600">
              Access hundreds of recipes approved by nutrition experts, tailored to your tastes and dietary needs.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="w-14 h-14 rounded-2xl bg-violet-100 flex items-center justify-center mb-6">
              <Target className="w-7 h-7 text-violet-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Macro Tracking</h3>
            <p className="text-slate-600">
              Set and track macro goals with ease. Seamlessly integrated reports keep you accountable.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl p-8 shadow-lg"
          >
            <div className="w-14 h-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
              <TrendingUp className="w-7 h-7 text-amber-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-3">Progress Reports</h3>
            <p className="text-slate-600">
              Track your daily intake and visualize weekly trends to stay motivated on your journey.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}