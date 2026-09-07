import Link from "next/link";
import type { Post } from "../lib/content";
import { SITE } from "../lib/content";

export default function PostCard({ post, lang }: { post: Post; lang: "zh" | "en" }) {
  const t = SITE.i18n[lang];
  const readingTime = Math.max(1, Math.round(post.wordCount / 400));
  return (
    <article className={`post-card${post.isAI ? " ai" : ""}`}>
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
