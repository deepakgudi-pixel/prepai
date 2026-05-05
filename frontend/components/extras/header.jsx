"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence, useScroll, useMotionValueEvent } from "framer-motion";
import { useLenis } from "lenis/react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, SignOutButton, useUser } from "@clerk/nextjs";
import { Soup, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/pantry", label: "Pantry" },
  { href: "/recipes", label: "Recipes" },
  { href: "/curated", label: "Curated" },
];

export default function Header() {
  const { user } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const { scrollY } = useScroll();

  useMotionValueEvent(scrollY, "change", (latest) => {
    if (latest > 100) {
      setHidden(true);
      if (isOpen) setIsOpen(false);
    } else {
      setHidden(false);
    }
  });

  const toggleMenu = () => setIsOpen(!isOpen);

  // Stop Lenis smooth scrolling when the menu is open
  const lenis = useLenis();
  useEffect(() => {
    if (isOpen) {
      if (lenis) lenis.stop();
    } else {
      if (lenis) lenis.start();
    }
  }, [isOpen, lenis]);

  return (
    <>
      {/* Dimmed Backdrop - Restored backdrop-blur-sm */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4 }}
            className="fixed inset-0 z-[90] bg-[#111]/30 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Morphing Pill Header */}
      <motion.header
        initial={{ y: -50, scale: 0.8, opacity: 0, width: "64px", maxWidth: "64px" }}
        animate={{
          y: hidden && !isOpen ? -20 : 0,
          scale: hidden && !isOpen ? 0.9 : 1,
          opacity: hidden && !isOpen ? 0 : 1,
          width: hidden && !isOpen ? "64px" : "calc(100% - 3rem)",
          maxWidth: hidden && !isOpen ? "64px" : "600px",
          height: isOpen ? "auto" : "64px",
          borderRadius: isOpen ? "24px" : "32px",
          backgroundColor: isOpen ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.85)",
        }}
        transition={{ 
          duration: 1.2, 
          ease: [0.22, 1, 0.36, 1], // Cinematic ease out
          opacity: { delay: hidden ? 0.3 : 0, duration: 0.6 },
          // When opening/closing menu, or showing/hiding header, stagger slightly
          delay: isOpen ? 0 : (hidden ? 0 : 0.1)
        }}
        className="fixed left-1/2 top-6 z-[100] -translate-x-1/2 flex flex-col items-center border border-white/40 backdrop-blur-md shadow-2xl overflow-hidden px-6 py-5"
        style={{
          willChange: "width, height, background-color, border-radius, transform, opacity",
        }}
      >
        {/* Top Row (Always Visible) */}
        <motion.div 
          animate={{ opacity: hidden && !isOpen ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="flex w-[calc(100vw-6rem)] max-w-[552px] items-center justify-between shrink-0 h-[24px]"
        >
          {/* Left: Dynamic Action Based on Auth */}
          <div className="flex-1 flex justify-start">
            <SignedOut>
              <SignUpButton mode="modal">
                <button className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#222] hover:text-[#555] transition-colors">
                  Get Started
                </button>
              </SignUpButton>
            </SignedOut>
            <SignedIn>
              <Link
                href="/curated"
                className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#222] hover:text-[#555] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Curated
              </Link>
            </SignedIn>
          </div>

          {/* Center: Logo */}
          <div className="flex-1 flex justify-center items-center">
            <Link 
              href="/" 
              className="flex items-center pointer-events-auto group"
              onClick={() => setIsOpen(false)}
            >
              <Soup className="size-6 text-[#222] group-hover:scale-110 transition-transform" />
              <AnimatePresence>
                {isOpen && (
                  <motion.div 
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    className="overflow-hidden whitespace-nowrap"
                  >
                    <span className="font-display text-xl text-[#111] pt-[2px] block pl-2 pr-1">
                      PrepAI
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>
            </Link>
          </div>

          {/* Right: Menu Toggle */}
          <div className="flex-1 flex justify-end items-center gap-4">
            <SignedIn>
              {user && (
                <div className="size-8 rounded-full border border-[#111]/10 overflow-hidden shrink-0">
                  <img 
                    src={user.imageUrl} 
                    alt={user.fullName || "User"} 
                    className="size-full object-cover"
                  />
                </div>
              )}
            </SignedIn>
            <button
              onClick={toggleMenu}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              className="group flex items-center justify-center size-10"
            >
              <div className="flex flex-col gap-[5px] w-5 sm:w-6">
                <motion.span
                  animate={isOpen ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="h-[1.5px] w-full bg-[#222] block origin-center"
                />
                <motion.span
                  animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                  transition={{ duration: 0.2 }}
                  className="h-[1.5px] w-full bg-[#222] block origin-center"
                />
                <motion.span
                  animate={isOpen ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }}
                  transition={{ duration: 0.5 }}
                  className="h-[1.5px] w-full bg-[#222] block origin-center"
                />
              </div>
            </button>
          </div>
        </motion.div>

        {/* Expanded Links */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col mt-4 w-[calc(100vw-6rem)] max-w-[552px]"
            >
              <nav className="flex flex-col flex-1 justify-center px-4">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.4, delay: i * 0.05 + 0.1 }}
                    className="border-b border-[#111]/10 last:border-none py-3 sm:py-4"
                  >
                    <Link
                      href={item.href}
                      onClick={toggleMenu}
                      className="block font-display text-3xl sm:text-5xl text-[#111] hover:text-[#555] transition-colors"
                    >
                      {item.label}
                    </Link>
                  </motion.div>
                ))}
              </nav>

              {/* Footer CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="mt-6 flex justify-between items-end border-t border-[#111]/10 pt-5 px-4"
              >
                <div></div>
                
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-[#111] text-[#EAE8E3] rounded-full px-6 py-3 text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black hover:scale-105 transition-all duration-300">
                      SIGN IN <ArrowUpRight className="size-4" />
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <SignOutButton>
                    <button className="bg-[#111] text-[#EAE8E3] rounded-full px-6 py-3 text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black hover:scale-105 transition-all duration-300">
                      SIGN OUT <ArrowUpRight className="size-4" />
                    </button>
                  </SignOutButton>
                </SignedIn>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
