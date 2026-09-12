import { SITE, getAboutPost, getHomeShowcase, type Lang } from "@/lib/content";
import { renderMarkdown } from "@/lib/markdown";
import PostCard from "@/components/PostCard";
import PostBody from "@/components/PostBody";
import ScrollReveal from "@/components/ScrollReveal";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const t = SITE.i18n[lang];
  const info = SITE.homeInfo[lang];
  // 「关于」文章（frontmatter about: true）的正文直接作为首屏；没有则退回站点简介
  const about = getAboutPost(lang);
  const aboutHtml = about ? await renderMarkdown(about) : null;
  // 展示位：已用作「关于」的文章不再重复出现
  const showcase = getHomeShowcase(lang);

  const scrollHint = (
    <a className="scroll-hint" href="#home-posts" title={t.scrollDown} aria-label={t.scrollDown}>
      <Icon icon={icons["mdi:chevron-down"]} width="1.6em" height="1.6em" />
    </a>
  );

  return (
    <div className="container" style={{ paddingTop: 0 }}>
      {about && aboutHtml ? (
        /* 首屏：关于文章的完整正文，2s 渐入（左对齐，正文样式复用 .article） */
        <section className="home-about">
          <h1 className="home-about-title">
            {about.title} <Icon icon={icons["mdi:hand-wave-outline"]} width="1em" height="1em" />
          </h1>
          <PostBody html={aboutHtml} slug={about.slug} />
          {scrollHint}
        </section>
      ) : (
        /* 没有「关于」文章时：退回一句站点简介，撑满一屏 */
        <section className="home-hero">
          <h1>{info.title} <Icon icon={icons["mdi:hand-wave-outline"]} width="1em" height="1em" /></h1>
          <p>{info.content}</p>
          {scrollHint}
        </section>
      )}

      {/* 向下滚动后：最多 3 篇，进入视口时渐入 */}
      <ScrollReveal id="home-posts" className="home-posts">
        {showcase.map((post) => (
          <PostCard key={post.slug} post={post} lang={lang} hidePinnedBadge />
        ))}
      </ScrollReveal>
    </div>
  );
}
