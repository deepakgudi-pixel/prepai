"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function CustomCursor() {
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  const hoverStateRef = useRef(false);
  const isCoarsePointer = useMediaQuery("(pointer: coarse)", true);
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    if (isCoarsePointer || prefersReducedMotion) {
      return undefined;
    }

    const moveCursor = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);

      const target = e.target instanceof Element ? e.target : null;
      const nextHoverState = Boolean(target?.closest("a, button, .magnetic"));

      if (hoverStateRef.current !== nextHoverState) {
        hoverStateRef.current = nextHoverState;
        setIsHovering(nextHoverState);
      }
    };

    const resetCursor = () => {
      hoverStateRef.current = false;
      setIsHovering(false);
      mouseX.set(-100);
      mouseY.set(-100);
    };

    window.addEventListener("pointermove", moveCursor, { passive: true });
    window.addEventListener("pointerleave", resetCursor);

    return () => {
      window.removeEventListener("pointermove", moveCursor);
      window.removeEventListener("pointerleave", resetCursor);
    };
  }, [isCoarsePointer, mouseX, mouseY, prefersReducedMotion]);

  if (isCoarsePointer || prefersReducedMotion) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[99999] rounded-full mix-blend-difference hidden lg:block"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
        willChange: "transform, width, height",
      }}
      initial={false}
      animate={{
        width: isHovering ? 60 : 16,
        height: isHovering ? 60 : 16,
        backgroundColor: isHovering ? "rgba(255, 255, 255, 0.1)" : "rgba(255, 255, 255, 1)",
        backdropFilter: isHovering ? "blur(4px)" : "blur(0px)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
    />
  );
}
