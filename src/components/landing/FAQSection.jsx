import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    question: "What is Dialled In Nutrition?",
    answer: "Dialled In Nutrition is an AI-powered nutrition app that creates personalised weekly meal plans based on your goals, dietary preferences, and calorie targets. It includes macro tracking, a 500+ recipe library, an AI nutrition coach, barcode scanning, and progress tracking — all in one place."
  },
  {
    question: "Is it free to get started?",
    answer: "Yes — completely free, no credit card required. You can generate your first personalised meal plan and start tracking your macros in under 2 minutes."
  },
  {
    question: "What diets and preferences does it support?",
    answer: "Low carb, high protein, keto, vegan, vegetarian, gluten-free, dairy-free, Mediterranean and more. You can also specify allergies, intolerances, and foods you simply don't like — the AI will never recommend them."
  },
  {
    question: "How does the AI meal planning actually work?",
    answer: "You complete a short setup profile — height, weight, activity level, health goal. The AI calculates your personalised TDEE and macro targets, then builds a full 7-day meal plan from recipes that match your preferences. You can regenerate the whole plan, swap individual meals, or override any meal manually at any time."
  },
  {
    question: "Can I use it to lose weight / build muscle?",
    answer: "Yes to both. For weight loss the AI sets a calorie deficit. For muscle gain it sets a controlled surplus with higher protein targets. Weekly check-ins let you update your stats and the plan adapts automatically."
  },
  {
    question: "Does it have a barcode scanner?",
    answer: "Yes. The food logging feature includes a barcode scanner so you can instantly log packaged foods with accurate nutritional data — no manual entry needed."
  }
];

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(null);

  return (
    <section className="py-24 px-6 bg-white" id="faq">
      <div className="max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Frequently Asked
            <span className="block mt-1 bg-gradient-to-r from-emerald-600 to-teal-500 bg-clip-text text-transparent">
              Questions
            </span>
          </h2>
          <p className="text-lg text-slate-500">Everything you need to know before you start.</p>
        </motion.div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="border border-slate-200 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setOpenIndex(openIndex === i ? null : i)}
                className="w-full flex items-center justify-between px-6 py-5 text-left hover:bg-slate-50 transition-colors"
              >
                <span className="font-semibold text-slate-900 pr-4">{faq.question}</span>
                <ChevronDown
                  className={`w-5 h-5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              <AnimatePresence initial={false}>
                {openIndex === i && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <div className="px-6 pb-5 text-slate-600 leading-relaxed border-t border-slate-100">
                      <p className="pt-4">{faq.answer}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}