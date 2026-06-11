"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function CEOInsightsSplash({ onComplete }) {
  const slides = [
    {
      image: "/image1.png",
     
    },
    {
      image: "/image2.png",
      title: "Creative Technology",
    },
    {
      image: "/image3.png",
      title: "Future Driven",
    },
  ];

  const [current, setCurrent] = useState(0);
  const audioRef = useRef(null);

  /* PRELOAD IMAGES */
  useEffect(() => {
    slides.forEach((slide) => {
      const img = document.createElement("img");
      img.src = slide.image;
    });
  }, []);

  /* AUTO SLIDER */
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 3500);

    return () => clearInterval(interval);
  }, []);

  /* AUTO COMPLETE */
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onComplete) onComplete();
    }, 11000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  /* MUSIC */
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 0.18;

      audioRef.current.play().catch(() => {
        console.log("Autoplay blocked");
      });
    }
  }, []);

  return (
    <div className="relative w-full h-[100dvh] overflow-hidden bg-[#030712]">
      {/* AUDIO */}
      <audio ref={audioRef} autoPlay loop>
        <source src="/soft.mp3" type="audio/mpeg" />
      </audio>

      {/* ================= BACKGROUND ================= */}

      {/* Animated Gradient */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          absolute
          inset-0
          opacity-80
          bg-[linear-gradient(-45deg,#020617,#111827,#0f172a,#1e293b,#0f172a)]
          bg-[length:400%_400%]
        "
      />

      {/* Moving Grid */}
      <motion.div
        animate={{
          backgroundPosition: ["0px 0px", "0px 120px"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "linear",
        }}
        className="
          absolute
          inset-0
          opacity-[0.04]
          bg-[linear-gradient(rgba(255,255,255,0.15)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.15)_1px,transparent_1px)]
          bg-[size:50px_50px]
        "
      />

      {/* Glow Light Left */}
      <motion.div
        animate={{
          x: [0, 80, 0],
          y: [0, -40, 0],
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
          w-[250px]
          sm:w-[350px]
          md:w-[450px]
          h-[250px]
          sm:h-[350px]
          md:h-[450px]
          rounded-full
          bg-cyan-500/20
          blur-[120px]
        "
      />

      {/* Glow Light Right */}
      <motion.div
        animate={{
          x: [0, -70, 0],
          y: [0, 50, 0],
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
          w-[250px]
          sm:w-[350px]
          md:w-[450px]
          h-[250px]
          sm:h-[350px]
          md:h-[450px]
          rounded-full
          bg-fuchsia-500/20
          blur-[120px]
        "
      />

      {/* Floating Particles */}
      {[...Array(18)].map((_, i) => (
        <motion.div
          key={i}
          animate={{
            y: ["110vh", "-10vh"],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: 6 + i,
            repeat: Infinity,
            delay: i * 0.25,
            ease: "linear",
          }}
          className="
            absolute
            w-[2px]
            h-[2px]
            rounded-full
            bg-white
          "
          style={{
            left: `${Math.random() * 100}%`,
          }}
        />
      ))}

      {/* ================= CENTER CARD ================= */}

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
              ease: "easeOut",
            }}
            className="
              relative
              w-full
              max-w-[95vw]
              sm:max-w-[700px]
              md:max-w-[950px]
              lg:max-w-[1200px]
              h-[70vh]
              sm:h-[78vh]
              md:h-[82vh]
              overflow-hidden
              rounded-[22px]
              sm:rounded-[30px]
              border
              border-white/10
              bg-white/[0.03]
              backdrop-blur-xl
              shadow-[0_0_50px_rgba(255,255,255,0.08)]
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
                loading="eager"
                unoptimized
                sizes="100vw"
                className="
                  object-contain
                  object-center
                "
              />
            </motion.div>

            {/* Soft Overlay */}
            <div className="absolute inset-0 bg-black/10" />

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

            {/* Bottom Content */}
            <div
              className="
                absolute
                bottom-0
                left-0
                w-full
                px-4
                sm:px-6
                py-5
                sm:py-7
                bg-gradient-to-t
                from-black/80
                via-black/40
                to-transparent
                text-center
              "
            >
              {/* TITLE */}
              <motion.h1
                animate={{
                  opacity: [0.7, 1, 0.7],
                  letterSpacing: ["2px", "6px", "2px"],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                }}
                className="
                  text-white
                  text-[20px]
                  sm:text-4xl
                  md:text-5xl
                  lg:text-6xl
                  font-extralight
                  uppercase
                  leading-tight
                "
              >
                {slides[current].title}
              </motion.h1>

              {/* LOADING DOTS */}
              <div className="mt-4 sm:mt-6 flex justify-center gap-2">
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
                      bg-white
                    "
                  />
                ))}
              </div>
            </div>

            {/* Top Edge Light */}
            <motion.div
              animate={{
                opacity: [0.2, 0.9, 0.2],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
              className="
                absolute
                top-0
                left-0
                w-20
                sm:w-32
                h-[2px]
                bg-white
              "
            />

            {/* Bottom Edge Light */}
            <motion.div
              animate={{
                opacity: [0.2, 0.9, 0.2],
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
                w-20
                sm:w-32
                h-[2px]
                bg-white
              "
            />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* SLIDER INDICATORS */}
      <div
        className="
          absolute
          bottom-5
          sm:bottom-7
          left-1/2
          -translate-x-1/2
          z-40
          flex
          gap-2
          sm:gap-3
        "
      >
        {slides.map((_, index) => (
          <motion.div
            key={index}
            animate={{
              width: current === index ? 40 : 10,
              opacity: current === index ? 1 : 0.3,
            }}
            transition={{
              duration: 0.4,
            }}
            className="
              h-[3px]
              rounded-full
              bg-white
            "
          />
        ))}
      </div>
    </div>
  );
}