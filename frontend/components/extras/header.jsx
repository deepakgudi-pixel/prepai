"use client";

import { useState, useEffect, useCallback, useSyncExternalStore } from "react";
import Image from "next/image";
import { motion, AnimatePresence, useScroll, useMotionValueEvent, useReducedMotion } from "framer-motion";
import { useLenis } from "lenis/react";
import { SignOutButton, useUser } from "@clerk/nextjs";
import { Soup, ArrowUpRight } from "lucide-react";
import Link from "next/link";

const navSections = [
  {
    title: null,
    items: [
      { href: "/", label: "Home", public: true },
    ]
  },
  {
    title: "FOOD",
    items: [
      { href: "/pantry", label: "Pantry", public: false },
      { href: "/recipes", label: "Recipes", public: false },
      { href: "/curated", label: "Curated", public: false },
      { href: "/meal-planner", label: "Meal Plan", public: false },
    ]
  },
  {
    title: "FITNESS",
    items: [
      { href: "/fitness-profile", label: "Profile", public: false },
      { href: "/nutrition", label: "Nutrition", public: false },
      { href: "/body-tracking", label: "Body", public: false },
      { href: "/supplements", label: "Supplements", public: false },
      { href: "/progress", label: "Progress", public: false },
    ]
  }
];

export default function Header() {
  const { user, isLoaded, isSignedIn } = useUser();
  const [isOpen, setIsOpen] = useState(false);
  const [hidden, setHidden] = useState(false);
  const isHydrated = useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
  const { scrollY } = useScroll();
  const prefersReducedMotion = useReducedMotion();

  const showSignedIn = isLoaded && isSignedIn;

  // Filter nav items based on sign-in status
  const visibleNavSections = navSections.map(section => ({
    ...section,
    items: section.items.filter(item => item.public || showSignedIn)
  })).filter(section => section.items.length > 0);

  useMotionValueEvent(scrollY, "change", (latest) => {
    const nextHidden = latest > 100;

    setHidden((currentValue) => (
      currentValue === nextHidden ? currentValue : nextHidden
    ));

    if (nextHidden) {
      setIsOpen((currentValue) => (currentValue ? false : currentValue));
    }
  });

  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);
  const menuTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 0.5 };
  const headerTransition = prefersReducedMotion
    ? { duration: 0 }
    : {
        duration: 1.2,
        ease: [0.22, 1, 0.36, 1],
        opacity: { delay: hidden ? 0.3 : 0, duration: 0.6 },
        delay: isOpen ? 0 : (hidden ? 0 : 0.1),
      };

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
          maxWidth: hidden && !isOpen ? "64px" : "500px",
          height: isOpen ? "auto" : "64px",
          borderRadius: isOpen ? "22px" : "32px",
          backgroundColor: isOpen ? "rgba(255, 255, 255, 0.98)" : "rgba(255, 255, 255, 0.85)",
        }}
        transition={headerTransition}
        className="fixed left-1/2 top-6 z-[100] -translate-x-1/2 flex flex-col items-center border border-white/40 backdrop-blur-md shadow-2xl overflow-hidden px-4 py-4 sm:px-5"
        style={{
          willChange: "width, height, background-color, border-radius, transform, opacity",
        }}
      >
        {/* Top Row (Always Visible) */}
        <motion.div 
          animate={{ opacity: hidden && !isOpen ? 0 : 1 }}
          transition={{ duration: 0.3 }}
          className="flex w-[calc(100vw-5rem)] max-w-[460px] items-center justify-between shrink-0 h-[28px]"
        >
          {/* Left: Dynamic Action Based on Auth */}
          <div className="flex-1 flex justify-start">
            {showSignedIn ? (
              <Link
                href="/curated"
                className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#222] hover:text-[#555] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Curated
              </Link>
            ) : (
              <Link
                href="/sign-up"
                className="text-[0.65rem] sm:text-xs font-semibold uppercase tracking-[0.2em] text-[#222] hover:text-[#555] transition-colors"
                onClick={() => setIsOpen(false)}
              >
                Get Started
              </Link>
            )}
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
                    transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
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
            {showSignedIn && user && (
              <div className="size-8 rounded-full border border-[#111]/10 overflow-hidden shrink-0">
                <Image
                  src={user.imageUrl}
                  alt={user.fullName || "User"}
                  width={32}
                  height={32}
                  className="size-full object-cover"
                  unoptimized
                />
              </div>
            )}
            <button
              onClick={toggleMenu}
              disabled={!isHydrated}
              aria-label={isOpen ? "Close menu" : "Open menu"}
              className="group flex size-10 items-center justify-center disabled:cursor-default"
            >
              <div className="flex flex-col gap-[5px] w-5 sm:w-6">
                <motion.span
                  animate={isOpen ? { rotate: 45, y: 6.5 } : { rotate: 0, y: 0 }}
                  transition={menuTransition}
                  className="h-[1.5px] w-full bg-[#222] block origin-center"
                />
                <motion.span
                  animate={isOpen ? { opacity: 0, scaleX: 0 } : { opacity: 1, scaleX: 1 }}
                  transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.2 }}
                  className="h-[1.5px] w-full bg-[#222] block origin-center"
                />
                <motion.span
                  animate={isOpen ? { rotate: -45, y: -6.5 } : { rotate: 0, y: 0 }}
                  transition={menuTransition}
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
              className="flex-1 flex max-h-[min(72vh,520px)] w-[calc(100vw-5rem)] max-w-[460px] flex-col overflow-y-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              data-lenis-prevent
            >
              <nav className="flex flex-col gap-3 pt-4">
                {visibleNavSections.map((section, sectionIndex) => (
                  <div key={sectionIndex} className="rounded-2xl border border-[#111]/10 bg-[#F4F3F0]/70 p-2">
                    {section.title && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        transition={{ duration: 0.4, delay: sectionIndex * 0.1 }}
                        className="px-2 pb-2"
                      >
                        <p className="text-[0.6rem] uppercase text-[#777] font-semibold">
                          {section.title}
                        </p>
                      </motion.div>
                    )}
                    <div className={`grid gap-2 ${section.items.length > 1 ? "grid-cols-2" : ""}`}>
                      {section.items.map((item, i) => (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 8 }}
                          transition={{ duration: 0.3, delay: (sectionIndex * 0.06) + (i * 0.03) + 0.08 }}
                        >
                          <Link
                            href={item.href}
                            onClick={toggleMenu}
                            className="flex min-h-11 items-center rounded-xl bg-white/50 px-3 py-2 text-sm font-semibold text-[#111] transition-colors hover:bg-white hover:text-[#555]"
                          >
                            {item.label}
                          </Link>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </nav>

              {/* Footer CTA */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3, delay: 0.2 }}
              className="mt-4 flex justify-end border-[#111]/10 pt-1"
            >
                {showSignedIn ? (
                  <SignOutButton>
                    <button className="bg-[#111] text-[#EAE8E3] rounded-full px-5 py-2.5 text-[0.65rem] sm:text-xs uppercase flex items-center gap-2 hover:bg-black transition-colors duration-300">
                      SIGN OUT <ArrowUpRight className="size-4" />
                    </button>
                  </SignOutButton>
                ) : (
                  <Link
                    href="/sign-in"
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-2 rounded-full bg-[#111] px-5 py-2.5 text-[0.65rem] uppercase text-[#EAE8E3] transition-colors duration-300 hover:bg-black sm:text-xs"
                  >
                    SIGN IN <ArrowUpRight className="size-4" />
                  </Link>
                )}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>
    </>
  );
}
