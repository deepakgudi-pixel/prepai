"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { FEATURES, HOW_IT_WORKS_STEPS } from "@/lib/data";
import Marquee from "@/components/ui/Marquee";
import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { SignUpButton, SignedOut, SignedIn } from "@clerk/nextjs";

export default function Home() {
  const containerRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });

  return (
    <div className="bg-[#EAE8E3]" ref={containerRef}>
      {/* Hero Section */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center pt-32 pb-20 px-6 sm:px-12 lg:px-20 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.76, 0, 0.24, 1] }}
          className="text-center z-10 max-w-5xl mx-auto"
        >
          <p className="eyebrow mb-8">Intelligence for the Kitchen</p>
          <h1 className="display-title mb-8">
            Distilled planning.<br />
            <span className="italic text-[#777]">Differently.</span>
          </h1>
          <p className="section-copy mx-auto mb-12">
            Turn pantry ingredients into striking, chef-led meal ideas with a calmer interface, less friction, and a sharper product feel from the first screen onward.
          </p>

          <div className="flex items-center justify-center gap-6">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="magnetic group flex items-center gap-4 bg-[#222] text-[#EAE8E3] px-8 py-4 rounded-full font-semibold text-sm uppercase tracking-[0.1em] hover:bg-[#111] transition-all">
                  Start Cooking
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#EAE8E3]/20 group-hover:bg-[#EAE8E3]/30 transition-colors">
                    <ArrowRight className="size-4" />
                  </span>
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
               <Link href="/dashboard" className="magnetic group flex items-center gap-4 bg-[#222] text-[#EAE8E3] px-8 py-4 rounded-full font-semibold text-sm uppercase tracking-[0.1em] hover:bg-[#111] transition-all">
                  Open Dashboard
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#EAE8E3]/20 group-hover:bg-[#EAE8E3]/30 transition-colors">
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
            </SignedIn>
          </div>
        </motion.div>

        {/* Abstract Background Element */}
        <motion.div 
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full border border-[#D5D3CE] opacity-50 pointer-events-none"
          animate={{ rotate: 360, scale: [1, 1.05, 1] }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
        />
      </section>

      <Marquee text="CLEANER COOKING • PANTRY FIRST • ZERO WASTE • EFFORTLESS MEALS • CHEF LED IDEAS" />

      {/* Features Sticky Scroll */}
      <section className="relative mt-32 px-6 sm:px-12 lg:px-20 pb-32">
        <div className="max-w-4xl mx-auto mb-20 text-center">
          <p className="eyebrow mb-4">The Experience</p>
          <h2 className="section-title">Designed for clarity. Built for speed.</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-[1400px] mx-auto">
          {FEATURES.map((feature, i) => {
             const Icon = feature.icon;
             return (
               <motion.div
                 key={i}
                 initial={{ opacity: 0, y: 100 }}
                 whileInView={{ opacity: 1, y: 0 }}
                 viewport={{ once: true, margin: "-100px" }}
                 transition={{ duration: 0.8, delay: i * 0.1, ease: [0.76, 0, 0.24, 1] }}
                 className="glass-card p-10 flex flex-col h-[400px] justify-between group hover:border-[#aaa] transition-colors"
               >
                 <div className="flex justify-between items-start">
                   <span className="font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.2em]">0{i + 1}</span>
                   <div className="size-12 rounded-full border border-[#D5D3CE] flex items-center justify-center bg-white/50">
                     <Icon className="size-5 text-[#222]" />
                   </div>
                 </div>
                 <div>
                   <h3 className="font-display text-4xl mb-4">{feature.title}</h3>
                   <p className="text-[#555] font-light leading-relaxed">{feature.description}</p>
                 </div>
               </motion.div>
             )
          })}
        </div>
      </section>

      {/* How it Works / Parallax Section */}
      <section className="relative py-32 bg-[#111] text-[#EAE8E3] px-6 sm:px-12 lg:px-20 overflow-hidden rounded-t-[3rem]">
        <div className="max-w-4xl mx-auto mb-24 text-center">
          <h2 className="font-display text-6xl md:text-8xl mb-8">The Method</h2>
          <p className="text-xl text-[#aaa] font-light max-w-2xl mx-auto">Three steps from pantry to plate. Confident suggestions, and recipe detail that is actually useful.</p>
        </div>

        <div className="grid md:grid-cols-3 gap-12 max-w-[1400px] mx-auto relative z-10">
          {HOW_IT_WORKS_STEPS.map((step, i) => (
             <motion.div
               key={i}
               initial={{ opacity: 0, y: 50 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true, margin: "-100px" }}
               transition={{ duration: 0.8, delay: i * 0.2 }}
               className="border-t border-[#333] pt-8"
             >
                <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-8">Phase {step.step}</p>
                <h3 className="font-display text-4xl mb-4">{step.title}</h3>
                <p className="text-[#888] font-light leading-relaxed">{step.desc}</p>
             </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
