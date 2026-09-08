"use client";

import { useEffect, useState } from "react";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

const ICONS = {
  light: icons["mdi:weather-sunny"],
  dark: icons["mdi:weather-night"],
  auto: icons["mdi:theme-light-dark"],
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
      <Icon icon={ICONS[theme]} data-icon={theme === "light" ? "mdi:weather-sunny" : theme === "dark" ? "mdi:weather-night" : "mdi:theme-light-dark"} width="1.2em" height="1.2em" />
    </button>
  );
}
