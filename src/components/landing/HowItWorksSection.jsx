import React from 'react';
import { motion } from "framer-motion";

const steps = [
  {
    number: "01",
    title: "Tell Us About You",
    description: "Share your height, weight, age, activity level, and health goals. We'll calculate your optimal calorie target."
  },
  {
    number: "02",
    title: "Set Your Preferences",
    description: "Vegetarian? Gluten-free? Low-carb? Customize your meal plan to fit your lifestyle and dietary needs."
  },
  {
    number: "03",
    title: "Get Your Weekly Plan",
    description: "Receive a personalized 7-day meal plan with breakfast, lunch, dinner, and snacks—all within your calorie range."
  },
  {
    number: "04",
    title: "Track & Adapt",
    description: "Log your meals, update your progress weekly, and watch your plan evolve with your changing body."
  }
];

export default function HowItWorksSection() {
  return (
    <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-light text-slate-900 mb-4">
            How it <span className="font-semibold">works</span>
          </h2>
          <p className="text-lg text-slate-600">
            Four simple steps to transform your nutrition.
          </p>
        </motion.div>

        <div className="relative">
          {/* Connection line */}
          <div className="hidden lg:block absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-emerald-200 via-teal-200 to-emerald-200" />

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.15 }}
                className="relative text-center lg:text-left"
              >
                <div className="relative z-10 w-16 h-16 mx-auto lg:mx-0 rounded-2xl bg-white shadow-lg shadow-slate-200/50 flex items-center justify-center mb-6">
                  <span className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
                    {step.number}
                  </span>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-3">
                  {step.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}