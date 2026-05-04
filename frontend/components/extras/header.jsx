"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { SignInButton, SignUpButton, SignedIn, SignedOut } from "@clerk/nextjs";
import { Soup, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import UserDropdown from "./UserDropdown";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/recipes", label: "Recipes" },
  { href: "/pantry", label: "Pantry" },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  // Background overlay when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "auto";
    }
  }, [isOpen]);

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
        initial={{ y: -100, opacity: 0 }}
        animate={{
          y: 0,
          opacity: 1,
          width: "calc(100% - 3rem)",
          maxWidth: "600px",
          height: isOpen ? "70vh" : "64px",
          borderRadius: isOpen ? "24px" : "32px",
          backgroundColor: isOpen ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.85)",
        }}
        // Delay the shrinking animation when closing so content can fade out first
        transition={{ duration: 0.8, delay: isOpen ? 0 : 0.3, ease: [0.76, 0, 0.24, 1] }}
        className="fixed left-1/2 top-6 z-[100] -translate-x-1/2 flex flex-col border border-white/40 backdrop-blur-md shadow-2xl overflow-hidden px-6 py-5"
        style={{
          willChange: "width, height, background-color, border-radius",
        }}
      >
        {/* Top Row (Always Visible) */}
        <div className="flex w-full items-center justify-between shrink-0 h-[24px]">
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
                href="/dashboard"
                className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#222] hover:text-[#555] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Dashboard
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
                    animate={{ opacity: 1, width: 70 }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.4, ease: [0.76, 0, 0.24, 1] }}
                    className="overflow-hidden whitespace-nowrap pl-2"
                  >
                    <span className="font-display text-xl text-[#111] pt-[2px] block">
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
               <div className="hidden sm:block">
                 <UserDropdown />
               </div>
            </SignedIn>
            <button
              onClick={toggleMenu}
              className="group flex items-center gap-3 text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#222]"
            >
              {isOpen ? "CLOSE" : "MENU"}
              <div className="flex flex-col gap-1 w-5 sm:w-6">
                <motion.span
                  animate={isOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                  className="h-[1.5px] w-full bg-[#222] block origin-center transition-all duration-500"
                />
                <motion.span
                  animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                  className="h-[1.5px] w-3/4 bg-[#222] block transition-all duration-500"
                />
                <motion.span
                  animate={isOpen ? { rotate: -45, y: -5, width: "100%" } : { rotate: 0, y: 0 }}
                  className="h-[1.5px] w-full bg-[#222] block origin-center transition-all duration-500"
                />
              </div>
            </button>
          </div>
        </div>

        {/* Expanded Links */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col mt-8"
            >
              <nav className="flex flex-col flex-1 justify-center px-4">
                {navItems.map((item, i) => (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.4, delay: i * 0.05 + 0.1 }}
                    className="border-b border-[#111]/10 last:border-none py-4 sm:py-6"
                  >
                    <Link
                      href={item.href}
                      onClick={toggleMenu}
                      className="block font-display text-4xl sm:text-6xl text-[#111] hover:text-[#555] transition-colors"
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
                className="mt-auto flex justify-between items-end border-t border-[#111]/10 pt-6 px-4"
              >
                <div>
                  <span className="text-[0.65rem] uppercase tracking-[0.2em] text-[#777]">
                    English
                  </span>
                </div>
                
                <SignedOut>
                  <SignInButton mode="modal">
                    <button className="bg-[#111] text-[#EAE8E3] rounded-full px-6 py-3 text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black hover:scale-105 transition-all duration-300">
                      SIGN IN <ArrowUpRight className="size-4" />
                    </button>
                  </SignInButton>
                </SignedOut>
                <SignedIn>
                  <Link href="/pantry" onClick={() => setIsOpen(false)} className="bg-[#111] text-[#EAE8E3] rounded-full px-6 py-3 text-[0.65rem] sm:text-xs uppercase tracking-[0.2em] flex items-center gap-2 hover:bg-black hover:scale-105 transition-all duration-300">
                    OPEN PANTRY <ArrowUpRight className="size-4" />
                  </Link>
                </SignedIn>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
