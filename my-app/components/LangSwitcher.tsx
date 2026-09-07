"use client";

import { usePathname } from "next/navigation";

export default function LangSwitcher() {
  const pathname = usePathname() || "/";
  // 切换语言：/zh/xxx -> /en/xxx
  const otherLang = pathname.startsWith("/en") ? "zh" : "en";
  const rest = pathname.replace(/^\/(zh|en)/, "") || "/";
  const target = `/${otherLang}${rest}`;

  return (
    <a href={target} className="icon-btn" title="Language" aria-label="Switch language">
      {otherLang === "zh" ? "中" : "EN"}
    </a>
  );
}
