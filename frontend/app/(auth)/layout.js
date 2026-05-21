"use client";

import { motion } from "framer-motion";

function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#EAE8E3] flex overflow-x-hidden">
      {/* Left side: Premium Image/Abstract Background */}
      <div className="hidden lg:flex w-1/2 relative bg-[#111] overflow-hidden items-center justify-center">
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
        
        <div className="relative z-10 px-20 max-w-2xl">
           <h1 className="font-display text-7xl text-[#EAE8E3] leading-[0.9] mb-8">
             Cleaner cooking<br/>starts here.
           </h1>
           <p className="text-[#aaa] text-xl font-light">
             Turn pantry ingredients into striking, chef-led meal ideas with a calmer interface.
           </p>
        </div>
      </div>

      {/* Right side: Auth Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-4 py-6 sm:p-12 relative">
        <motion.div 
           initial={{ opacity: 0, x: 20 }}
           animate={{ opacity: 1, x: 0 }}
           transition={{ duration: 0.8, ease: [0.76, 0, 0.24, 1] }}
           className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </div>
    </div>
  );
}

export default AuthLayout;
