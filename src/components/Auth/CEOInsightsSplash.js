"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function CEOInsightsSplash({ onComplete }) {
  const slides = [
    { image: "/image6.png" },
    { image: "/image2.png" },
    { image: "/image3.png" },
  ];

  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  /* Auto Slider */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(intervalRef.current);
  }, [slides.length]);

  /* Auto Complete */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 12000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">

      {/* Background Slider */}
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0, scale: 1.03 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 1.2,
            ease: "easeInOut",
          }}
          className="absolute inset-0 flex items-center justify-center"
        >
          <Image
            src={slides[current].image}
            alt="Dashboard Loading"
            fill
            priority
            quality={100}

            /* IMPORTANT CHANGE */
            className="
              object-contain
              sm:object-cover
              bg-black
            "
          />
        </motion.div>
      </AnimatePresence>

      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-black/35 z-10" />

      {/* Center Loading Content */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-6 text-center">

        {/* Loading Spinner */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
          className="
            w-12 h-12
            sm:w-14 sm:h-14
            md:w-16 md:h-16
            border-[3px]
            sm:border-4
            border-white/20
            border-t-white
            rounded-full
          "
        />

        {/* Loading Text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1.2,
          }}
          className="
            mt-4 sm:mt-5
            text-white/80
            text-xs sm:text-sm md:text-base
            tracking-[3px]
            sm:tracking-[4px]
            uppercase
            font-medium
          "
        >
          Loading Dashboard
        </motion.p>
      </div>

      {/* Bottom Indicators */}
      <div className="absolute bottom-6 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2 sm:gap-3">

        {slides.map((_, index) => (
          <div
            key={index}
            className={`
              rounded-full
              transition-all
              duration-500
              ${
                current === index
                  ? "w-8 sm:w-10 h-2 bg-white"
                  : "w-2 h-2 bg-white/40"
              }
            `}
          />
        ))}
      </div>

      {/* Bottom Gradient */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent z-10" />
    </div>
  );
}