import { SITE, getHomeShowcase, type Lang } from "@/lib/content";
import PostCard from "@/components/PostCard";
import ScrollReveal from "@/components/ScrollReveal";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const t = SITE.i18n[lang];
  const info = SITE.homeInfo[lang];
  // 有置顶取置顶，否则取最新的 3 篇非 AI 文章（AI 文不占首页位）
  const showcase = getHomeShowcase(lang);

  return (
    <div className="container" style={{ paddingTop: 0 }}>
      {/* 首屏：只有博客介绍，2s 渐入 */}
      <section className="home-hero">
        <h1>{info.title} <Icon icon={icons["mdi:hand-wave-outline"]} width="1em" height="1em" /></h1>
        <p>{info.content}</p>
        <a className="scroll-hint" href="#home-posts" title={t.scrollDown} aria-label={t.scrollDown}>
          <Icon icon={icons["mdi:chevron-down"]} width="1.6em" height="1.6em" />
        </a>
      </section>

      {/* 向下滚动后：最多 3 篇，进入视口时渐入 */}
      <ScrollReveal id="home-posts" className="home-posts">
        {showcase.map((post) => (
          <PostCard key={post.slug} post={post} lang={lang} hidePinnedBadge />
        ))}
      </ScrollReveal>
    </div>
  );
}
