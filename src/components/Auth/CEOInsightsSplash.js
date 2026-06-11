"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

import { Orbitron, Poppins } from "next/font/google";

/* ================= FONTS ================= */

const orbitron = Orbitron({
  subsets: ["latin"],
  weight: ["700", "800"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

/* ================= COMPONENT ================= */

export default function CEOInsightsSplash({ onComplete }) {
  const slides = [
    {
      image: "/image1.png",
      
    },
    {
      image: "/image2.png",
      title: "CREATIVE TECHNOLOGY",
      
    },
    {
      image: "/image3.png",
      title: "FUTURE DRIVEN",
      
    },
  ];

  const [current, setCurrent] = useState(0);
  const audioRef = useRef(null);

  /* ================= PRELOAD ================= */

  useEffect(() => {
    slides.forEach((slide) => {
      const img = document.createElement("img");
      img.src = slide.image;
    });
  }, []);

  /* ================= AUTO SLIDER ================= */

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  /* ================= AUTO COMPLETE ================= */

  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 11000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  /* ================= MUSIC ================= */

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.15;

      audioRef.current.play().catch(() => {
        console.log("Autoplay blocked");
      });
    }
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#040816]">

      {/* ================= AUDIO ================= */}

      <audio ref={audioRef} autoPlay loop>
        <source src="/soft.mp3" type="audio/mpeg" />
      </audio>

      {/* ================= HRA BACKGROUND ================= */}

      {/* Animated Gradient */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 16,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          absolute
          inset-0
          bg-[linear-gradient(-45deg,#050816,#111827,#1d1f48,#111827,#060816)]
          bg-[length:400%_400%]
        "
      />

      {/* HRA Purple Glow */}
      <motion.div
        animate={{
          x: [0, 60, 0],
          y: [0, -30, 0],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          top-[-100px]
          left-[-100px]
          w-[260px]
          sm:w-[380px]
          md:w-[500px]
          h-[260px]
          sm:h-[380px]
          md:h-[500px]
          rounded-full
          bg-[#6C63FF]/25
          blur-[120px]
        "
      />

      {/* HRA Orange Glow */}
      <motion.div
        animate={{
          x: [0, -60, 0],
          y: [0, 40, 0],
          scale: [1, 1.15, 1],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="
          absolute
          bottom-[-120px]
          right-[-100px]
          w-[260px]
          sm:w-[380px]
          md:w-[500px]
          h-[260px]
          sm:h-[380px]
          md:h-[500px]
          rounded-full
          bg-[#FF6A4D]/20
          blur-[120px]
        "
      />

      {/* Grid */}
      <motion.div
        animate={{
          backgroundPosition: ["0px 0px", "0px 100px"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          absolute
          inset-0
          opacity-[0.04]
          bg-[linear-gradient(rgba(255,255,255,0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.2)_1px,transparent_1px)]
          bg-[size:40px_40px]
        "
      />

      {/* Floating Particles */}
      {[...Array(20)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: ["110vh", "-10vh"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 5 + i,
            repeat: Infinity,
            delay: i * 0.25,
            ease: "linear",
          }}
          className="absolute w-[2px] h-[2px] rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            background:
              i % 2 === 0 ? "#161447" : "#f05d40",
          }}
        />
      ))}

      {/* ================= CENTER ================= */}

      <div
        className="
          relative
          z-20
          flex
          items-center
          justify-center
          w-full
          h-full
          px-3
          sm:px-5
        "
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={current}
            initial={{
              opacity: 0,
              scale: 0.92,
              y: 30,
            }}
            animate={{
              opacity: 1,
              scale: 1,
              y: 0,
            }}
            exit={{
              opacity: 0,
              scale: 1.04,
            }}
            transition={{
              duration: 0.8,
            }}
            className="
              relative
              w-full
              max-w-[96vw]
              sm:max-w-[720px]
              md:max-w-[980px]
              lg:max-w-[1200px]
              h-[72vh]
              sm:h-[78vh]
              md:h-[84vh]
              overflow-hidden
              rounded-[24px]
              sm:rounded-[34px]
              border
              border-white/10
              bg-white/[0.03]
              backdrop-blur-2xl
              shadow-[0_0_50px_rgba(108,99,255,0.15)]
            "
          >

            {/* IMAGE */}
            <motion.div
              animate={{
                scale: [1, 1.02, 1],
              }}
              transition={{
                duration: 7,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              className="relative w-full h-full"
            >
              <Image
                src={slides[current].image}
                alt="slide"
                fill
                priority
                quality={100}
                unoptimized
                sizes="100vw"
                className="
                  object-contain
                  object-center
                "
              />
            </motion.div>

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/25" />

            {/* Scan Light */}
            <motion.div
              animate={{
                x: ["-120%", "120%"],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                ease: "linear",
              }}
              className="
                absolute
                top-0
                left-0
                h-full
                w-[30%]
                rotate-12
                bg-white/10
                blur-2xl
              "
            />

            {/* ================= TEXT ================= */}

            <div
              className="
                absolute
                bottom-0
                left-0
                w-full
                px-4
                sm:px-8
                py-6
                sm:py-10
                bg-gradient-to-t
                from-black/90
                via-black/40
                to-transparent
                text-center
              "
            >

              {/* TITLE */}
              <motion.h1
                animate={{
                  opacity: [0.7, 1, 0.7],
                  letterSpacing: ["2px", "7px", "2px"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className={`
                  ${orbitron.className}
                  text-[22px]
                  sm:text-4xl
                  md:text-5xl
                  lg:text-6xl
                  font-extrabold
                  uppercase
                  leading-tight
                  tracking-[5px]
                `}
                style={{
                  background:
                    "linear-gradient(90deg,#6C63FF,#8DEBFF,#FF6A4D)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  textShadow:
                    "0px 0px 25px rgba(108,99,255,0.35)",
                }}
              >
                {slides[current].title}
              </motion.h1>

              {/* SUBTITLE */}
              <p
                className={`
                  ${poppins.className}
                  mt-3
                  text-[10px]
                  sm:text-sm
                  md:text-base
                  uppercase
                  tracking-[4px]
                  text-white/75
                `}
              >
                {slides[current].subtitle}
              </p>

              {/* LOADING DOTS */}
              <div className="mt-5 flex justify-center gap-2">
                {[0, 1, 2].map((dot) => (
                  <motion.div
                    key={dot}
                    animate={{
                      y: [0, -8, 0],
                      opacity: [0.3, 1, 0.3],
                    }}
                    transition={{
                      duration: 0.8,
                      repeat: Infinity,
                      delay: dot * 0.2,
                    }}
                    className="
                      w-2.5
                      h-2.5
                      rounded-full
                    "
                    style={{
                      background:
                        dot % 2 === 0
                          ? "#6C63FF"
                          : "#FF6A4D",
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Top Light */}
            <motion.div
              animate={{
                opacity: [0.2, 1, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="
                absolute
                top-0
                left-0
                w-28
                sm:w-40
                h-[2px]
                bg-[#6C63FF]
              "
            />

            {/* Bottom Light */}
            <motion.div
              animate={{
                opacity: [0.2, 1, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1,
              }}
              className="
                absolute
                bottom-0
                right-0
                w-28
                sm:w-40
                h-[2px]
                bg-[#FF6A4D]
              "
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ================= INDICATORS ================= */}

      <div
        className="
          absolute
          bottom-5
          left-1/2
          -translate-x-1/2
          z-40
          flex
          gap-3
        "
      >
        {slides.map((_, index) => (
          <motion.div
            key={index}
            animate={{
              width: current === index ? 42 : 10,
              opacity: current === index ? 1 : 0.3,
            }}
            transition={{
              duration: 0.4,
            }}
            className="h-[3px] rounded-full"
            style={{
              background:
                current === index
                  ? "linear-gradient(90deg,#6C63FF,#FF6A4D)"
                  : "#ffffff",
            }}
          />
        ))}
      </div>
    </div>
  );
}