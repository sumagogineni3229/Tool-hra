"use client";

import Image from "next/image";

export default function LoadingSplash({ fadeExit }) {
  return (
    <div className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/40 backdrop-blur-sm transition-opacity duration-200 ease-in-out ${fadeExit ? "opacity-0" : "opacity-100"}`}>
      {/* Subtle light pulse background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.06),transparent_60%)] pointer-events-none" />

      <div className="relative flex flex-col items-center gap-6">
        {/* Glowing logo / text area */}
        <div className="flex items-center gap-3.5 animate-pulse duration-[2000ms]">
          <div className="relative h-12 w-32 flex items-center">
            <Image
              src="/logo.png"
              alt="HRA Groups Logo"
              fill
              priority
              className="object-contain object-left"
            />
          </div>
          <div className="border-l-2 border-slate-200 pl-4 py-1">
            <span className="font-extrabold text-2xl tracking-tight text-slate-800 block uppercase">Connect</span>
            <span className="block text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-0.5">People Portal</span>
          </div>
        </div>

        {/* Minimalist animated tracking bar */}
        <div className="w-48 h-[2px] bg-slate-100 rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-24 bg-gradient-to-r from-indigo-600 to-indigo-400 rounded-full animate-[loadingBar_1.5s_infinite_ease-in-out]" />
        </div>

        <span className="text-[10px] text-slate-400 font-bold tracking-widest uppercase mt-2">Initializing Portal...</span>
      </div>
    </div>
  );
}
