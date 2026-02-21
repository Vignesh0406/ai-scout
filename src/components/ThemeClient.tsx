"use client";

import { useEffect, useState } from "react";

const MODE_KEY = "scout_mode";

export default function ThemeClient() {
  const [mode, setMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedMode = (localStorage.getItem(MODE_KEY) as "light" | "dark" | null) ?? "light";
    setMode(savedMode);
  }, []);

  useEffect(() => {
    const r = document.documentElement;
    if (mode === "dark") r.classList.add("dark");
    else r.classList.remove("dark");
    localStorage.setItem(MODE_KEY, mode);
  }, [mode]);

  return (
    <div className="flex items-center rounded-xl border border-zinc-200/80 bg-white/70 p-1 shadow-sm backdrop-blur dark:border-zinc-800/80 dark:bg-zinc-950/50">
      <button
        type="button"
        onClick={() => setMode((m) => (m === "dark" ? "light" : "dark"))}
        className={
          "h-8 rounded-lg px-2.5 text-xs font-medium transition-colors " +
          "text-zinc-700 hover:bg-zinc-100/70 hover:text-zinc-950 " +
          "dark:text-zinc-200 dark:hover:bg-zinc-900/60 dark:hover:text-white"
        }
      >
        {mode === "dark" ? "Dark" : "Light"}
      </button>
    </div>
  );
}
