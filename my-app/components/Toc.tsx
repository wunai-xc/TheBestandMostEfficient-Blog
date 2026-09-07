"use client";

import { useEffect, useState } from "react";

interface TocItem { id: string; text: string; level: number; }

export default function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string>("");

  useEffect(() => {
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter(Boolean) as HTMLElement[];
    if (!headings.length) return;
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length) {
          setActive(visible[visible.length - 1].target.id);
        }
      },
      { rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );
    headings.forEach((h) => observer.observe(h));
    return () => observer.disconnect();
  }, [items]);

  return (
    <div className="toc">
      <h4>On this page</h4>
      <ul>
        {items.map((it) => (
          <li key={it.id} className={`lvl-${it.level}`}>
            <a href={`#${it.id}`} className={active === it.id ? "active" : ""}>
              {it.text}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
