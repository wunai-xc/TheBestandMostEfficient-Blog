"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react";

const ICONS = {
  light: "mdi:weather-sunny",
  dark: "mdi:weather-night",
  auto: "mdi:theme-light-dark",
} as const;

export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | "auto">("auto");

  useEffect(() => {
    const t = (localStorage.getItem("theme") as any) || "auto";
    setTheme(t);
  }, []);

  function apply(t: "light" | "dark" | "auto") {
    localStorage.setItem("theme", t);
    setTheme(t);
    const dark = t === "dark" || (t === "auto" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
  }

  const next = theme === "light" ? "dark" : theme === "dark" ? "auto" : "light";

  return (
    <button
      className="icon-btn"
      onClick={() => apply(next)}
      title={`Theme: ${theme}`}
      aria-label="Toggle theme"
    >
      <Icon icon={ICONS[theme]} width="1.2em" height="1.2em" />
    </button>
  );
}
