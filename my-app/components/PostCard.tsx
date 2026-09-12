"use client";

import { useRef, type MouseEvent } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import type { Post } from "../lib/site";
import { SITE, readingMinutes } from "../lib/site";

export default function PostCard({
  post,
  lang,
  hidePinnedBadge = false,
}: {
  post: Post;
  lang: "zh" | "en";
  /* 首页展示位不再强调“置顶”字样，由调用方传入 */
  hidePinnedBadge?: boolean;
}) {
  const t = SITE.i18n[lang];
  const readingTime = readingMinutes(post.wordCount);
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
  }

  function handleMouseLeave() {
    const el = cardRef.current;
    if (!el) return;
    el.style.transform = "";
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
        {post.pinned && !hidePinnedBadge && <span className="pinned-badge">{t.pinned}</span>}
      </h2>
      <div className="meta">
        <span>{post.date}</span>
        <span>{readingTime} {t.readingTime}</span>
        <span>{post.wordCount} {t.words}</span>
        {post.author && <span><Icon icon={icons["mdi:account-outline"]} width="1em" height="1em" /> {post.author}</span>}
      </div>
      {post.summary && <p className="summary">{post.summary}</p>}
    </article>
  );
}
