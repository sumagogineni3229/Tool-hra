"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const [theme, setTheme] = useState("light");

  useEffect(() => {
    // Check local storage or document element class on mount
    const isDark = document.documentElement.classList.contains("dark");
    setTheme(isDark ? "dark" : "light");
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    if (nextTheme === "dark") {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  return (
    <button
      onClick={toggleTheme}
      type="button"
      className="relative p-2 rounded-xl transition-all duration-300 ease-in-out border border-slate-200 hover:bg-slate-100 hover:border-slate-300 dark:border-slate-800 dark:hover:bg-slate-800 dark:hover:border-slate-700 text-slate-600 dark:text-slate-350 cursor-pointer overflow-hidden group shadow-sm flex items-center justify-center w-9 h-9 shrink-0"
      aria-label="Toggle theme"
      title={theme === "light" ? "Switch to Dark Mode" : "Switch to Light Mode"}
    >
      <div className="relative w-5 h-5 flex items-center justify-center">
        {/* Sun Icon */}
        <span className={`absolute transform transition-all duration-500 ease-out ${
          theme === "dark" ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}>
          <Sun className="w-5 h-5 text-amber-500 fill-amber-100 dark:fill-none" />
        </span>
        {/* Moon Icon */}
        <span className={`absolute transform transition-all duration-500 ease-out ${
          theme === "light" ? "-rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        }`}>
          <Moon className="w-5 h-5 text-indigo-400 fill-indigo-950/20" />
        </span>
      </div>
    </button>
  );
}
