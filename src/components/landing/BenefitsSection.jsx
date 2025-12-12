import React from 'react';
import { motion } from "framer-motion";
import { Target, RefreshCw, Heart, TrendingUp, Utensils, Calendar } from "lucide-react";

const benefits = [
  {
    icon: Target,
    title: "Precision Nutrition",
    description: "Meal plans calculated within 250 calories of your target. No more guesswork.",
    color: "emerald"
  },
  {
    icon: RefreshCw,
    title: "Adaptive Planning",
    description: "Weekly check-ins adjust your plan as your body and goals evolve.",
    color: "blue"
  },
  {
    icon: Heart,
    title: "Your Preferences Matter",
    description: "Dietary restrictions, allergies, and taste preferences all considered.",
    color: "rose"
  },
  {
    icon: TrendingUp,
    title: "Track Progress",
    description: "Log meals and watch your weekly progress toward your goals.",
    color: "amber"
  },
  {
    icon: Utensils,
    title: "Curated Recipes",
    description: "Delicious, nutritionist-approved recipes with full macro breakdowns.",
    color: "violet"
  },
  {
    icon: Calendar,
    title: "Save Favorites",
    description: "Star your favorite meals to include them in future plans.",
    color: "teal"
  }
];

const colorClasses = {
  emerald: "bg-emerald-50 text-emerald-600",
  blue: "bg-blue-50 text-blue-600",
  rose: "bg-rose-50 text-rose-600",
  amber: "bg-amber-50 text-amber-600",
  violet: "bg-violet-50 text-violet-600",
  teal: "bg-teal-50 text-teal-600"
};

export default function BenefitsSection() {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-4">
            Why <span className="font-semibold">NutriPlan</span>?
          </h2>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            A smarter approach to nutrition that puts your unique needs first.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {benefits.map((benefit, index) => (
            <motion.div
              key={benefit.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group p-8 rounded-3xl bg-slate-50/50 hover:bg-white hover:shadow-xl hover:shadow-slate-100/50 transition-all duration-300"
            >
              <div className={`w-14 h-14 rounded-2xl ${colorClasses[benefit.color]} flex items-center justify-center mb-6 transition-transform group-hover:scale-110`}>
                <benefit.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-semibold text-slate-900 mb-3">
                {benefit.title}
              </h3>
              <p className="text-slate-600 leading-relaxed">
                {benefit.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}