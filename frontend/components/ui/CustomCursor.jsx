"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

export default function CustomCursor() {
  const [isTouch, setIsTouch] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);

  const springConfig = { damping: 25, stiffness: 300, mass: 0.5 };
  const cursorX = useSpring(mouseX, springConfig);
  const cursorY = useSpring(mouseY, springConfig);

  useEffect(() => {
    // Detect touch devices
    const mql = window.matchMedia("(pointer: coarse)");
    setIsTouch(mql.matches);
    const onChange = (e) => setIsTouch(e.matches);
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  useEffect(() => {
    if (isTouch) return;

    const moveCursor = (e) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e) => {
      const target = e.target;
      if (
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("magnetic")
      ) {
        setIsHovering(true);
      } else {
        setIsHovering(false);
      }
    };

    window.addEventListener("mousemove", moveCursor);
    window.addEventListener("mouseover", handleMouseOver);

    return () => {
      window.removeEventListener("mousemove", moveCursor);
      window.removeEventListener("mouseover", handleMouseOver);
    };
  }, [mouseX, mouseY, isTouch]);

  if (isTouch) return null;

  return (
    <motion.div
      className="pointer-events-none fixed left-0 top-0 z-[99999] rounded-full mix-blend-difference hidden lg:block"
      style={{
        x: cursorX,
        y: cursorY,
        translateX: "-50%",
        translateY: "-50%",
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
