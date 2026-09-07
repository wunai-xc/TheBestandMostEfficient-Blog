"use client";

import { useRef, type MouseEvent } from "react";
import Link from "next/link";
import type { Post } from "../lib/site";
import { SITE } from "../lib/site";

export default function PostCard({ post, lang }: { post: Post; lang: "zh" | "en" }) {
  const t = SITE.i18n[lang];
  const readingTime = Math.max(1, Math.round(post.wordCount / 400));
  const cardRef = useRef<HTMLElement>(null);

  // 鼠标跟踪 3D 倾斜：基于指针位置计算 rotateX/rotateY
  function handleMouseMove(e: MouseEvent<HTMLElement>) {
    const el = cardRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const cx = rect.width / 2;
    const cy = rect.height / 2;
    // 旋转角度：指针偏移量 × 灵敏度系数
    const rotateY = ((x - cx) / cx) * 6;
    const rotateX = -((y - cy) / cy) * 6;
    el.style.transform = `perspective(800px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-4px) scale(1.005)`;
    // 动态光源位置：雾团跟随鼠标
    el.style.setProperty("--mx", `${(x / rect.width) * 100}%`);
    el.style.setProperty("--my", `${(y / rect.height) * 100}%`);
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "";
    el.style.removeProperty("--mx");
    el.style.removeProperty("--my");
  }

  return (
    <article
      ref={cardRef}
      className={`post-card${post.isAI ? " ai" : ""}`}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <h2>
        <Link href={`/${lang}/posts/${encodeURIComponent(post.slug)}/`}>{post.title}</Link>
        {post.pinned && <span className="pinned-badge">{t.pinned}</span>}
      </h2>
      <div className="meta">
        <span>{post.date}</span>
        <span>{readingTime} {t.readingTime}</span>
        <span>{post.wordCount} {t.words}</span>
        {post.author && <span>✍️ {post.author}</span>}
      </div>
      {post.summary && <p className="summary">{post.summary}</p>}
    </article>
  );
}
