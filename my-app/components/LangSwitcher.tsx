"use client";

import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

export default function LangSwitcher() {
  const pathname = usePathname() || "/";
  // 切换语言：/zh/xxx -> /en/xxx
  const otherLang = pathname.startsWith("/en") ? "zh" : "en";
  const rest = pathname.replace(/^\/(zh|en)/, "") || "/";
  const target = `/${otherLang}${rest}`;

  return (
    <a href={target} className="icon-btn" title="Language" aria-label="Switch language">
      <Icon icon="mdi:translate" width="1.2em" height="1.2em" />
    </a>
  );
}
