"use client";

import { motion } from "framer-motion";

function AuthLayout({ children }) {
  return (
    <div className="flex min-h-dvh overflow-x-hidden bg-[#EAE8E3]">
      {/* Left side: Premium Image/Abstract Background */}
      <div
        className="relative hidden w-1/2 items-center justify-center overflow-hidden bg-[#111] lg:flex"
        aria-hidden="true"
      >
        {/* Abstract animated grain / gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#1C5042] to-[#D59032] opacity-40 mix-blend-screen" />
        <motion.div 
          className="absolute inset-0 opacity-20"
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{
            duration: 20,
            ease: "linear",
            repeat: Infinity,
            repeatType: "reverse"
          }}
          style={{
            backgroundImage: "radial-gradient(circle at center, white 1px, transparent 1px)",
            backgroundSize: "40px 40px"
          }}
        />
        
        <div className="relative z-10 max-w-2xl px-20">
           <h2 className="mb-8 font-display text-7xl leading-[0.9] text-[#EAE8E3]">
             Cleaner cooking<br />starts here.
           </h2>
           <p className="text-xl font-light text-[#aaa]">
             Turn pantry ingredients into striking, chef-led meal ideas with a calmer interface.
           </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="relative flex w-full items-center justify-center px-4 py-10 sm:p-12 lg:w-1/2">
        <motion.div 
           initial={{ x: 16 }}
           animate={{ x: 0 }}
           transition={{ duration: 0.6, ease: [0.76, 0, 0.24, 1] }}
           className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
