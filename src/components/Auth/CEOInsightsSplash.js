"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export default function CEOInsightsSplash({ redirectPath, onComplete }) {
  const [countdown, setCountdown] = useState(8); // 8-second premium slide experience
  const [dragged, setDragged] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (countdown === 0) {
      onComplete();
    }
  }, [countdown, onComplete]);

  // Listen to wheel scroll events to skip countdown when user scrolls down
  useEffect(() => {
    const handleWheel = (event) => {
      if (event.deltaY > 10 && !dragged) {
        setDragged(true);
        onComplete();
      }
    };

    window.addEventListener("wheel", handleWheel);
    return () => window.removeEventListener("wheel", handleWheel);
  }, [onComplete, dragged]);

  const handleDragEnd = (event, info) => {
    const threshold = 100;
    // Trigger redirect if swiped/dragged left or right past threshold or with high velocity
    if ((Math.abs(info.offset.x) > threshold || Math.abs(info.velocity.x) > 400) && !dragged) {
      setDragged(true);
      onComplete();
    }
  };

  const progressPercent = ((8 - countdown) / 8) * 100;

  return (
    <motion.div
      drag="x"
      dragConstraints={{ left: 0, right: 0 }}
      dragElastic={0.15}
      onDragEnd={handleDragEnd}
      className="fixed inset-0 z-[100] flex flex-col justify-between w-screen h-screen overflow-hidden selection:bg-indigo-500 selection:text-white cursor-grab active:cursor-grabbing"
      title="Swipe left/right or scroll down to enter dashboard"
    >

      {/* Fullscreen Background Image (pic 1.jpeg) */}
      <div className="absolute inset-0 z-0 bg-slate-950 overflow-hidden pointer-events-none">
        <img
          src="/pic 1.jpeg"
          alt="Hemanth Pulavarthi, CEO of HRA Groups"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />
        {/* Soft dark tint (no blur) to ensure contrast for white text while keeping the picture 100% clear */}
        <div className="absolute inset-0 bg-slate-950/25 pointer-events-none z-10" />
      </div>

      {/* Top Header Row (Transparent to let the background image show through) */}
      <header className="relative w-full px-6 md:px-12 lg:px-20 py-6 flex items-center justify-between bg-transparent z-20 shrink-0 select-none pointer-events-none">
        {/* Transparent Logo at the top left */}
        <Link href="/" className="flex items-center cursor-pointer z-30 decoration-none pointer-events-auto">
          <img
            src="/logo_transparent.png"
            alt="HRA Groups Logo"
            className="h-12 w-auto object-contain drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)] drop-shadow-[0_4px_16px_rgba(255,255,255,0.7)]"
          />
        </Link>

        <div className="flex flex-col items-end text-white/90 drop-shadow-sm">
          <span className="text-xs font-black tracking-widest text-indigo-400 uppercase">EXECUTIVE PORTAL</span>
          <span className="text-[10px] font-bold text-white/70">Welcome Session</span>
        </div>
      </header>

      {/* Main Slide Body */}
      <main className="relative flex-1 flex items-start justify-center lg:justify-end px-6 md:px-12 lg:px-20 py-8 lg:pt-16 z-10 overflow-y-auto pointer-events-none">
        <div className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-start">

          {/* Left spacer to keep text on the right side and let the CEO photo background show clearly on the left */}
          <div className="hidden lg:block lg:col-span-5" />

          {/* Right side: Transparent Text details and Actions */}
          <div className="lg:col-span-7 flex flex-col gap-6 md:gap-8 justify-start bg-transparent text-white p-0 select-none">

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="flex flex-col gap-4"
            >
              <div>
                <span className="text-[10px] font-extrabold px-2.5 py-1 rounded-md bg-indigo-500/30 border border-indigo-400/40 text-indigo-200 uppercase tracking-widest w-fit block mb-3 shadow-sm">
                  CEO Vision & Insights
                </span>
                <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight drop-shadow-md">
                  Leadership Vision & <br className="hidden sm:inline" />CEO Insights
                </h1>
                <p className="text-sm md:text-base font-extrabold text-indigo-300 uppercase tracking-widest mt-2 drop-shadow-sm">
                  Hemanth Pulavarthi, CEO of HRA Groups
                </p>
              </div>

              <div className="flex flex-col gap-4 leading-relaxed text-sm md:text-base">
                <p className="font-semibold text-slate-100 border-l-4 border-indigo-500 pl-4 py-1 italic drop-shadow-sm">
                  Hemanth Pulavarthi, CEO of HRA Groups, exemplifies visionary leadership and unwavering commitment to innovation. With over a decade of experience in IT consulting, he drives the company’s mission to empower businesses through cutting-edge technology solutions and nurturing talent.
                </p>
                <p className="text-slate-350 font-medium pl-5 drop-shadow-sm">
                  His insights inspire teams to embrace agility, integrity, and excellence, fostering a culture where every challenge becomes an opportunity for growth and success.
                </p>
              </div>
            </motion.div>

            {/* Actions (Progress Bar, Countdown, Swipe instructions) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
              className="flex flex-col gap-4 border-t border-white/20 pt-6 max-w-xl w-full"
            >
              {/* Progress & Countdown */}
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs font-semibold text-slate-300">
                  <span className="inline-flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
                    Preparing operational workspace...
                  </span>
                  <span>Entering dashboard in <span className="text-white font-extrabold font-mono text-sm">{countdown}s</span></span>
                </div>
                <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full"
                    initial={{ width: "0%" }}
                    animate={{ width: `${progressPercent}%` }}
                    transition={{ duration: 1, ease: "linear" }}
                  />
                </div>
              </div>

              {/* Swipe/Scroll Guide Tip */}
              <div className="text-[11px] text-slate-400 font-semibold tracking-wide flex items-center gap-2 mt-1 drop-shadow-sm select-none">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
                <span>Swipe, scroll down, or drag anywhere to enter dashboard immediately</span>
              </div>
            </motion.div>

          </div>
        </div>
      </main>

      {/* Small extra padding space for bottom waves spacing on scroll */}
      <div className="h-6 shrink-0 z-10" />

    </motion.div>
  );
}
