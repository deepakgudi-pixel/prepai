"use client";

import { motion, useReducedMotion } from "framer-motion";
import { FEATURES, HOW_IT_WORKS_STEPS } from "@/lib/data";
import Marquee from "@/components/ui/Marquee";
import { ArrowRight, ChefHat, Dumbbell } from "lucide-react";
import Link from "next/link";
import { SignUpButton, SignedOut, SignedIn } from "@clerk/nextjs";

export default function Home() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="bg-[#EAE8E3]">
      {/* Hero Section */}
      <section className="relative flex min-h-[82svh] flex-col items-center justify-center overflow-hidden px-4 pb-16 pt-28 sm:min-h-[90vh] sm:px-12 sm:pb-20 sm:pt-32 lg:px-20">
        <motion.div
          initial={prefersReducedMotion ? false : { opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 1, ease: [0.76, 0, 0.24, 1] }}
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

          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="magnetic group flex items-center gap-3 rounded-full bg-[#222] px-6 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#EAE8E3] transition-all hover:bg-[#111] sm:gap-4 sm:px-8 sm:text-sm">
                  Start Cooking
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#EAE8E3]/20 group-hover:bg-[#EAE8E3]/30 transition-colors">
                    <ArrowRight className="size-4" />
                  </span>
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
               <Link href="/pantry" className="magnetic group flex items-center gap-3 rounded-full bg-[#222] px-6 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-[#EAE8E3] transition-all hover:bg-[#111] sm:gap-4 sm:px-8 sm:text-sm">
                  Open Pantry
                  <span className="flex size-8 items-center justify-center rounded-full bg-[#EAE8E3]/20 group-hover:bg-[#EAE8E3]/30 transition-colors">
                    <ArrowRight className="size-4" />
                  </span>
                </Link>
            </SignedIn>
          </div>
        </motion.div>

        {/* Abstract Background Element */}
        <motion.div 
          className="pointer-events-none absolute left-1/2 top-1/2 h-[120vw] max-h-[800px] w-[120vw] max-w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-[#D5D3CE] opacity-50"
          animate={prefersReducedMotion ? { rotate: 0, scale: 1 } : { rotate: 360, scale: [1, 1.05, 1] }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 40, repeat: Infinity, ease: "linear" }}
        />
      </section>

      <Marquee text="CLEANER COOKING • PANTRY FIRST • ZERO WASTE • EFFORTLESS MEALS • CHEF LED IDEAS" />

      {/* Two Paths Section */}
      <section className="relative px-4 py-20 sm:px-12 sm:py-32 lg:px-20">
        <div className="max-w-[1400px] mx-auto">
          <div className="mx-auto mb-12 max-w-4xl text-center sm:mb-20">
            <p className="eyebrow mb-4">Choose Your Path</p>
            <h2 className="section-title">Food or Fitness.<br/>Or both.</h2>
            <p className="section-copy mx-auto mt-6">
              Plan your meals with AI-powered recipes, or track your fitness journey with smart macro calculations. PrepAI does both, beautifully.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-[1200px] mx-auto">
            {/* Food Path */}
            <SignedIn>
              <Link href="/pantry">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                  className="glass-card group flex h-full min-h-[320px] cursor-pointer flex-col justify-between p-6 transition-all hover:border-[#aaa] sm:min-h-[400px] sm:p-10 lg:p-12"
                >
                  <div>
                    <div className="size-16 rounded-full bg-[#222] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      <ChefHat className="size-8 text-[#EAE8E3]" />
                    </div>
                    <h3 className="mb-4 font-display text-3xl text-[#111] sm:mb-6 sm:text-4xl lg:text-5xl">Plan Your Meals</h3>
                    <p className="text-base font-light leading-relaxed text-[#555] sm:text-lg">
                      Turn pantry ingredients into chef-led recipes. AI-powered suggestions, meal planning, and zero waste cooking.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[#111] font-semibold text-sm uppercase tracking-[0.15em] mt-8 group-hover:gap-4 transition-all">
                    Start Cooking
                    <ArrowRight className="size-5" />
                  </div>
                </motion.div>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignUpButton mode="modal">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
                  className="glass-card group flex h-full min-h-[320px] cursor-pointer flex-col justify-between p-6 transition-all hover:border-[#aaa] sm:min-h-[400px] sm:p-10 lg:p-12"
                >
                  <div>
                    <div className="size-16 rounded-full bg-[#222] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      <ChefHat className="size-8 text-[#EAE8E3]" />
                    </div>
                    <h3 className="mb-4 font-display text-3xl text-[#111] sm:mb-6 sm:text-4xl lg:text-5xl">Plan Your Meals</h3>
                    <p className="text-base font-light leading-relaxed text-[#555] sm:text-lg">
                      Turn pantry ingredients into chef-led recipes. AI-powered suggestions, meal planning, and zero waste cooking.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[#111] font-semibold text-sm uppercase tracking-[0.15em] mt-8 group-hover:gap-4 transition-all">
                    Start Cooking
                    <ArrowRight className="size-5" />
                  </div>
                </motion.div>
              </SignUpButton>
            </SignedOut>

            {/* Fitness Path */}
            <SignedIn>
              <Link href="/fitness-profile">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
                  className="glass-card group flex h-full min-h-[320px] cursor-pointer flex-col justify-between p-6 transition-all hover:border-[#aaa] sm:min-h-[400px] sm:p-10 lg:p-12"
                >
                  <div>
                    <div className="size-16 rounded-full bg-[#222] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      <Dumbbell className="size-8 text-[#EAE8E3]" />
                    </div>
                    <h3 className="mb-4 font-display text-3xl text-[#111] sm:mb-6 sm:text-4xl lg:text-5xl">Track Your Fitness</h3>
                    <p className="text-base font-light leading-relaxed text-[#555] sm:text-lg">
                      Hit your macro targets, track body composition, and monitor progress. Smart calculations for your fitness goals.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[#111] font-semibold text-sm uppercase tracking-[0.15em] mt-8 group-hover:gap-4 transition-all">
                    Start Tracking
                    <ArrowRight className="size-5" />
                  </div>
                </motion.div>
              </Link>
            </SignedIn>
            <SignedOut>
              <SignUpButton mode="modal">
                <motion.div
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
                  className="glass-card group flex h-full min-h-[320px] cursor-pointer flex-col justify-between p-6 transition-all hover:border-[#aaa] sm:min-h-[400px] sm:p-10 lg:p-12"
                >
                  <div>
                    <div className="size-16 rounded-full bg-[#222] flex items-center justify-center mb-8 group-hover:scale-110 transition-transform">
                      <Dumbbell className="size-8 text-[#EAE8E3]" />
                    </div>
                    <h3 className="mb-4 font-display text-3xl text-[#111] sm:mb-6 sm:text-4xl lg:text-5xl">Track Your Fitness</h3>
                    <p className="text-base font-light leading-relaxed text-[#555] sm:text-lg">
                      Hit your macro targets, track body composition, and monitor progress. Smart calculations for your fitness goals.
                    </p>
                  </div>
                  <div className="flex items-center gap-3 text-[#111] font-semibold text-sm uppercase tracking-[0.15em] mt-8 group-hover:gap-4 transition-all">
                    Start Tracking
                    <ArrowRight className="size-5" />
                  </div>
                </motion.div>
              </SignUpButton>
            </SignedOut>
          </div>
        </div>
      </section>

      {/* Features Sticky Scroll */}
      <section className="relative mt-20 px-4 pb-20 sm:mt-32 sm:px-12 sm:pb-32 lg:px-20">
        <div className="mx-auto mb-12 max-w-4xl text-center sm:mb-20">
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
                 className="glass-card group flex min-h-[300px] flex-col justify-between p-6 transition-colors hover:border-[#aaa] sm:p-10 md:h-[400px]"
               >
                 <div className="flex justify-between items-start">
                   <span className="font-sans text-xs font-semibold text-[#888] uppercase tracking-[0.2em]">0{i + 1}</span>
                   <div className="size-12 rounded-full border border-[#D5D3CE] flex items-center justify-center bg-white/50">
                     <Icon className="size-5 text-[#222]" />
                   </div>
                 </div>
                 <div>
                   <h3 className="mb-4 font-display text-3xl sm:text-4xl">{feature.title}</h3>
                   <p className="text-[#555] font-light leading-relaxed">{feature.description}</p>
                 </div>
               </motion.div>
             )
          })}
        </div>
      </section>

      {/* The Method + Footer */}
      <section className="relative overflow-hidden rounded-t-[2rem] bg-[#111] px-4 py-20 text-[#EAE8E3] sm:rounded-t-[3rem] sm:px-12 sm:py-32 lg:px-20">
        <div className="mx-auto mb-16 max-w-4xl text-center sm:mb-24">
          <h2 className="mb-8 font-display text-5xl md:text-8xl">The Method</h2>
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

        {/* Footer / Branding */}
        <div className="mt-32 border-t border-[#333] pt-12 max-w-[1400px] mx-auto">
          <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs uppercase tracking-[0.2em] text-[#777] mb-4">PrepAI</p>
              <h2 className="font-display text-3xl leading-tight sm:text-4xl">
                Pantry-first planning for weeknights that need to move fast.
              </h2>
            </div>
            <div className="space-y-2 text-sm text-[#777]">
              <p>AI recipe generation, pantry intelligence, and cleaner cooking decisions.</p>
              <p>© 2026 PrepAI</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
