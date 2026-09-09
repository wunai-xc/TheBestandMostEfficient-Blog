import { notFound } from "next/navigation";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import {
  getPost, getAllSlugs, getPrevNext, getPosts, SITE, type Lang,
} from "@/lib/content";
import { renderMarkdown, extractToc } from "@/lib/markdown";
import PostBody from "@/components/PostBody";
import PostNav from "@/components/PostNav";
import Comments from "@/components/Comments";
import PrintControls from "@/components/PrintControls";
import type { Post } from "@/lib/site";

// 重建完整 Markdown（YAML frontmatter + 正文），供下载按钮使用
function buildFullMarkdown(post: Post): string {
  const lines: string[] = [];
  lines.push("---");
  lines.push(`title: ${toYamlString(post.title)}`);
  lines.push(`date: ${post.date}`);
  lines.push(`draft: false`);
  if (post.author) lines.push(`author: ${toYamlString(post.author)}`);
  if (post.tags.length) lines.push(`tags: ${toYamlArray(post.tags)}`);
  if (post.categories.length) lines.push(`categories: ${toYamlArray(post.categories)}`);
  if (post.summary) lines.push(`summary: ${toYamlString(post.summary)}`);
  lines.push("---");
  lines.push("");
  return lines.join("\n") + post.content;
}
function toYamlString(s: string): string {
  if (/[:#"'{}\[\],&*?!|>%@`]/.test(s)) return JSON.stringify(s);
  return s;
}
function toYamlArray(arr: string[]): string {
  return `[${arr.map((s) => toYamlString(s)).join(", ")}]`;
}

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

  // 重建完整 Markdown（含 YAML frontmatter + 正文），供下载
  const mdContent = buildFullMarkdown(post);

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
          <div className="post-header-row">
            <h1>{post.title}</h1>
            <PrintControls printLabel={t.printSingle} mdDownloadLabel={t.mdDownload} mdContent={mdContent} mdFileName={post.slug} />
          </div>
          <div className="post-meta">
            <span><Icon icon={icons["mdi:calendar-month-outline"]} width="1em" height="1em" /> {post.date}</span>
            <span><Icon icon={icons["mdi:clock-outline"]} width="1em" height="1em" /> {readingTime} {t.readingTime}</span>
            <span><Icon icon={icons["mdi:file-document-outline"]} width="1em" height="1em" /> {post.wordCount} {t.words}</span>
            {post.author && (
              <span className={`author-badge ${post.isAI ? "ai" : "normal"}`}>
                {post.isAI ? <><Icon icon={icons["mdi:alert-outline"]} width="1em" height="1em" /> {t.aiWarning}</> : `作者：${post.author}`}
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

      {/* 浮动导航：左侧目录按钮 + 右侧进度条 + 回到顶部 */}
      <PostNav items={toc} />

      {/* 打印专用页眉：左侧日期 + 作者 */}
      <div className="print-header" aria-hidden="true">
        <span className="print-header-text">
          {post.date}{post.author ? `  |  ${post.isAI ? t.aiWarning : post.author}` : ""}
        </span>
      </div>

      {/* 打印专用页脚：左侧标题 + 页码（单面居中 / 双面靠右） */}
      <div className="print-footer" aria-hidden="true">
        <span className="print-footer-title">{post.title}</span>
        <span className="print-pagenum" />
      </div>

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </div>
  );
}
