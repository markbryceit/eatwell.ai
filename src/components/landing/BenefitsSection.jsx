import React from 'react';
import { motion } from "framer-motion";

export default function BenefitsSection() {
  return (
    <section className="py-24 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-20"
        >
          <h2 className="text-4xl md:text-6xl font-bold text-slate-900 mb-6">
            Nutrition Coaching
            <span className="block mt-2 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Your Way
            </span>
          </h2>
          <p className="text-xl text-slate-600 max-w-3xl mx-auto">
            Mix, match, and tailor nutrition plans to meet your unique needs — all effortlessly within Dialled In Nutrition.
          </p>
        </motion.div>

        {/* Features Grid */}
        <div className="grid lg:grid-cols-2 gap-12 items-center mb-20">
          {/* Feature 1 */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <img
              src="https://images.unsplash.com/photo-1498837167922-ddd27525d352?q=80&w=800"
              alt="Structured meal planning"
              className="rounded-3xl shadow-2xl w-full h-[400px] object-cover"
            />
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h3 className="text-3xl font-bold text-slate-900 mb-4">Structured Meal Plans</h3>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Get detailed meal plans with precise macronutrient breakdowns for each meal, 
              ensuring you stay on track without guesswork.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Personalized to your calorie targets</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Weekly adaptive planning</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <span>Full macro tracking integration</span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Feature 2 - Reversed */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-2 lg:order-1"
          >
            <h3 className="text-3xl font-bold text-slate-900 mb-4">AI-Powered Recommendations</h3>
            <p className="text-lg text-slate-600 mb-6 leading-relaxed">
              Smart recipe suggestions based on your favorites, dietary preferences, and nutritional goals. 
              Find the perfect alternatives with one click.
            </p>
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Learn from your preferences</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Filter by dietary restrictions</span>
              </div>
              <div className="flex items-center gap-3 text-slate-700">
                <div className="w-2 h-2 rounded-full bg-teal-500" />
                <span>Rate recipes to refine suggestions</span>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="order-1 lg:order-2"
          >
            <img
              src="https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=800"
              alt="AI-powered recommendations"
              className="rounded-3xl shadow-2xl w-full h-[400px] object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}