"use client";

import { ReactLenis } from "lenis/react";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function SmoothScroll({ children }) {
  const prefersReducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");

  if (prefersReducedMotion) {
    return children;
  }

  return (
    <ReactLenis root options={{ lerp: 0.08, duration: 1.5, smoothWheel: true }}>
      {children}
    </ReactLenis>
  );
}
