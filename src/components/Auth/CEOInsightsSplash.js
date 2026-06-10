"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function CEOInsightsSplash({ onComplete }) {

  /* KEEP YOUR ORIGINAL IMAGE NAMES */
  const slides = [
    { image: "/image1.png" },
    { image: "/image2.png" },
    { image: "/image3.png" },
  ];

  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);

  /* PRELOAD ALL IMAGES */
  useEffect(() => {
    slides.forEach((slide) => {
      const img = document.createElement("img");
      img.src = slide.image;
    });
  }, []);

  /* AUTO SLIDER */
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(intervalRef.current);
  }, [slides.length]);

  /* AUTO COMPLETE */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 12000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="relative w-full h-screen overflow-hidden bg-black">

      {/* ALL SLIDES RENDERED TO FIX MOBILE ISSUE */}
      {slides.map((slide, index) => (
        <AnimatePresence key={slide.image}>

          {current === index && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 1,
                ease: "easeInOut",
              }}
              className="absolute inset-0"
            >

              {/* IMAGE WRAPPER */}
              <div className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden">

                <Image
                  src={slide.image}
                  alt={`Slide ${index + 1}`}

                  /* MOBILE SAFE */
                  width={1920}
                  height={1080}

                  /* IMPORTANT */
                  priority
                  loading="eager"
                  unoptimized

                  quality={100}
                  sizes="100vw"

                  className="
                    w-full
                    h-full
                    object-contain
                    sm:object-cover
                    object-center
                    bg-black
                  "
                />

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      ))}

      {/* DARK OVERLAY */}
      <div className="absolute inset-0 bg-black/35 z-10" />

      {/* CENTER CONTENT */}
      <div className="absolute inset-0 z-20 flex flex-col items-center justify-center px-4 text-center">

        {/* SPINNER */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            repeat: Infinity,
            duration: 1,
            ease: "linear",
          }}
          className="
            w-11 h-11
            sm:w-14 sm:h-14
            md:w-16 md:h-16
            border-[3px]
            sm:border-4
            border-white/20
            border-t-white
            rounded-full
          "
        />

        {/* TEXT */}
        <motion.p
          initial={{ opacity: 0.5 }}
          animate={{ opacity: 1 }}
          transition={{
            repeat: Infinity,
            repeatType: "reverse",
            duration: 1.2,
          }}
          className="
            mt-4
            sm:mt-5
            text-white/90
            text-[11px]
            sm:text-sm
            md:text-base
            tracking-[3px]
            sm:tracking-[4px]
            uppercase
            font-semibold
          "
        >
          Loading Dashboard
        </motion.p>

      </div>

      {/* INDICATORS */}
      <div className="absolute bottom-5 sm:bottom-8 md:bottom-10 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 sm:gap-3">

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

      {/* BOTTOM GRADIENT */}
      <div className="absolute inset-x-0 bottom-0 h-24 sm:h-32 bg-gradient-to-t from-black/60 to-transparent z-10" />

    </div>
  );
}