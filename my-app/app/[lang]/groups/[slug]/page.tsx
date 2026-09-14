import { notFound } from "next/navigation";
import { EMPTY_PARAM, getGroup, getGroups, SITE, readingMinutes, type Lang } from "@/lib/content";
import PostCard from "@/components/PostCard";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  const groups = getGroups(params.lang as Lang);
  // 还没有任何卡组时不能返回空数组，否则 output: "export" 会直接构建失败；
  // 给一个占位值，页面里查不到就走 notFound()
  if (!groups.length) return [{ slug: EMPTY_PARAM }];
  return groups.map((g) => ({ slug: g.slug }));
}

/** 卡组详情：组内文章按 order / 文件名前缀的顺序列出 */
export default async function GroupPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const p = await params;
  const lang = p.lang as Lang;
  const t = SITE.i18n[lang];
  const group = getGroup(lang, decodeURIComponent(p.slug));
  if (!group) notFound();

  return (
    <div className="container">
      <nav className="breadcrumbs">
        <a href={`/${lang}/`}>{t.home}</a>
        <span>/</span>
        <a href={`/${lang}/posts/`}>{t.posts}</a>
        <span>/</span>
        <span>{group.title}</span>
      </nav>

      <header className="group-header">
        <div className="group-head">
          <span className="collection-badge">
            <Icon icon={icons["mdi:folder-multiple-outline"]} width="1em" height="1em" />
            {group.posts.length} {t.groupCount}
          </span>
          <span className="collection-kind">{t.groupLabel}</span>
        </div>
        <h1 className="page-title">{group.title}</h1>
        {group.description && <p className="group-description">{group.description}</p>}
        <div className="collection-meta">
          <span>{readingMinutes(group.wordCount)} {t.readingTime}</span>
          <span>{group.wordCount} {t.words}</span>
        </div>
      </header>

      {/* 组内文章按顺序列出，序号用列表序号体现 */}
      <ol className="group-posts">
        {group.posts.map((post, i) => (
          <li key={post.slug} data-index={i + 1}>
            <PostCard post={post} lang={lang} />
          </li>
        ))}
      </ol>

      <a className="group-back" href={`/${lang}/posts/`}>
        <Icon icon={icons["mdi:arrow-left"]} width="1em" height="1em" />
        {t.groupBack}
      </a>
    </div>
  );
}
