import React from 'react';
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { motion } from "framer-motion";

export default function CTASection({ onGetStarted }) {
  return (
    <section className="py-24 bg-slate-900 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-light text-white mb-6">
            Ready to transform your
            <span className="block font-semibold text-emerald-400">relationship with food?</span>
          </h2>
          <p className="text-lg text-slate-400 mb-10 max-w-2xl mx-auto">
            Join thousands who have discovered the power of personalized nutrition. 
            Your first week is completely customized to your body and goals.
          </p>
          <Button
            onClick={onGetStarted}
            size="lg"
            className="bg-white hover:bg-slate-100 text-slate-900 px-8 py-6 text-lg rounded-full shadow-2xl transition-all hover:-translate-y-0.5"
          >
            Create Your Free Plan
            <ArrowRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-slate-500 text-sm mt-6">
            No credit card required • Takes 2 minutes
          </p>
        </motion.div>
      </div>
    </section>
  );
}