"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function CEOInsightsSplash({ onComplete }) {
  const slides = [
    { image: "/image5.png" },
    { image: "/image2.png" },
    { image: "/image3.png" },
  ];

  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  /* Auto Slider - 4 Seconds */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000); // changed from 3000 to 4000

    return () => clearInterval(intervalRef.current);
  }, [slides.length]);

  /* Auto Complete */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 12000); // adjusted for 4 sec per slide

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">
      {/* Background Slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.08 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.5,
            ease: "easeInOut",
          }}
          className="absolute inset-0"
        >
          <Image
            src={slides[current].image}
            alt="Dashboard Loading"
            fill
            priority
            quality={100}
            className="object-cover"
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/35 z-10" />

      {/* Loading Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center">
        
        {/* Loading Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
          className="w-14 h-14 border-4 border-white/20 border-t-white rounded-full"
        />

        {/* Small Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1.2,
          }}
          className="mt-5 text-white/80 text-sm tracking-[4px] uppercase"
        >
          Loading Dashboard
        </motion.p>
      </div>

      {/* Bottom Slider Indicator */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {slides.map((_, index) => (
          <div
            key={index}
            className={`h-2 rounded-full transition-all duration-500 ${
              current === index
                ? "w-10 bg-white"
                : "w-2 bg-white/40"
            }`}
          />
        ))}
      </div>
    </div>
  );
}