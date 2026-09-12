"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * 滚动到位后渐入。
 *
 * 初始为隐藏态（服务端渲染出来的 HTML 就是隐藏的），由 IntersectionObserver
 * 在元素进入视口时加上 is-shown。隐藏态写在 CSS 里、且组件内附带 <noscript>
 * 兜底样式，避免禁用 JS 时内容永久不可见（对静态导出站点尤为重要）。
 */
export default function ScrollReveal({
  children,
  id,
  className,
}: {
  children: ReactNode;
  id?: string;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // 极老的浏览器没有 IntersectionObserver：直接显示，不做动画
    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setShown(true);
          observer.disconnect();
        }
      },
      // 露出约一成、且底部留一点余量时才触发，避免刚露头就闪出来
      { threshold: 0.1, rootMargin: "0px 0px -8% 0px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const classes = ["reveal"];
  if (shown) classes.push("is-shown");
  if (className) classes.push(className);

  return (
    <div ref={ref} id={id} className={classes.join(" ")}>
      <noscript
        dangerouslySetInnerHTML={{
          __html: "<style>.reveal{opacity:1 !important;transform:none !important}</style>",
        }}
      />
      {children}
    </div>
  );
}
