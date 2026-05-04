"use client";

import { motion } from "framer-motion";

export default function Marquee({ text }) {
  return (
    <div className="relative flex w-full overflow-hidden border-y border-[#D5D3CE] bg-[#F4F3F0] py-4 whitespace-nowrap">
      <motion.div
        className="flex whitespace-nowrap"
        animate={{ x: [0, -1035] }}
        transition={{
          repeat: Infinity,
          ease: "linear",
          duration: 10,
        }}
      >
        <span className="font-sans text-xs font-semibold uppercase tracking-[0.2em] text-[#555] mx-8">
          {text} • {text} • {text} • {text} • {text} • {text} • {text} • {text} • 
        </span>
      </motion.div>
    </div>
  );
}
