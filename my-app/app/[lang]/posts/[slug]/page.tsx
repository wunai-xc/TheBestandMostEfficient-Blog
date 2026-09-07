import { notFound } from "next/navigation";
import {
  getPost, getAllSlugs, getPrevNext, getPosts, SITE, type Lang,
} from "@/lib/content";
import { renderMarkdown, extractToc } from "@/lib/markdown";
import PostBody from "@/components/PostBody";
import Toc from "@/components/Toc";
import Comments from "@/components/Comments";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return getAllSlugs(params.lang as Lang).map((slug) => ({ slug }));
}

export default async function PostPage({ params }: { params: Promise<{ lang: string; slug: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const decodedSlug = decodeURIComponent(p.slug);
  const post = getPost(lang, decodedSlug);
  if (!post) notFound();

  const html = await renderMarkdown(post);
  const toc = extractToc(html);
  const { prev, next } = getPrevNext(lang, decodedSlug);
  const t = SITE.i18n[lang];
  const readingTime = Math.max(1, Math.round(post.wordCount / 400));
  const allPosts = getPosts(lang);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.summary,
    keywords: post.tags,
    wordCount: post.wordCount,
    inLanguage: lang === "zh" ? "zh-CN" : "en-US",
    datePublished: post.date,
    author: { "@type": "Person", name: post.author || SITE.author },
    mainEntityOfPage: { "@type": "WebPage", "@id": `${SITE.url}/${lang}/posts/${encodeURIComponent(post.slug)}/` },
    publisher: { "@type": "Organization", name: SITE.title },
  };

  return (
    <div className="post-layout">
      {/* 左栏：全部文章导航 */}
      <aside className="sidebar-col">
        <div className="toc">
          <h4>{t.allPosts}</h4>
          <ul>
            {allPosts.map((p) => (
              <li key={p.slug}>
                <a
                  href={`/${lang}/posts/${encodeURIComponent(p.slug)}/`}
                  className={p.slug === post.slug ? "active" : ""}
                >
                  {p.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      </aside>

      {/* 中栏：文章内容 */}
      <article className="post-content">
        <nav className="breadcrumbs">
          <a href={`/${lang}/`}>{t.home}</a>
          <span>/</span>
          <a href={`/${lang}/posts/`}>{t.posts}</a>
          <span>/</span>
          <span>{post.title}</span>
        </nav>

        <header className="post-header">
          <h1>{post.title}</h1>
          <div className="post-meta">
            <span>📅 {post.date}</span>
            <span>⏱️ {readingTime} {t.readingTime}</span>
            <span>📝 {post.wordCount} {t.words}</span>
            {post.author && (
              <span className={`author-badge ${post.isAI ? "ai" : "normal"}`}>
                {post.isAI ? `⚠️ ${t.aiWarning}` : `作者：${post.author}`}
              </span>
            )}
          </div>
          {post.tags.length > 0 && (
            <div className="post-tags">
              {post.tags.map((tag) => (
                <a key={tag} href={`/${lang}/tags/${encodeURIComponent(tag)}/`} className="tag">
                  #{tag}
                </a>
              ))}
            </div>
          )}
        </header>

        <PostBody html={html} slug={post.slug} />

        {/* 上下篇 */}
        <nav className="post-nav">
          {prev ? (
            <a href={`/${lang}/posts/${encodeURIComponent(prev.slug)}/`}>
              <div className="label">← {t.prev}</div>
              <div className="title">{prev.title}</div>
            </a>
          ) : <span />}
          {next ? (
            <a href={`/${lang}/posts/${encodeURIComponent(next.slug)}/`} style={{ textAlign: "right" }}>
              <div className="label">{t.next} →</div>
              <div className="title">{next.title}</div>
            </a>
          ) : <span />}
        </nav>

        <Comments />
      </article>

      {/* 右栏：TOC */}
      <aside className="sidebar-col">
        {toc.length > 0 && <Toc items={toc} />}
      </aside>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
