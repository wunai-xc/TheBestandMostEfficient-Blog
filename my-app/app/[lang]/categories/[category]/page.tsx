import { notFound } from "next/navigation";

import { EMPTY_PARAM, getAllCategories, getPostsByCategory, type Lang } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  const categories = getAllCategories(params.lang as Lang);
  // 空数组会让 output: "export" 构建失败，用占位值兑成 notFound()
  if (!categories.length) return [{ category: EMPTY_PARAM }];
  return categories.map((category) => ({ category }));
}

export default async function CategoryPage({ params }: { params: Promise<{ lang: string; category: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const category = decodeURIComponent(p.category);
  if (category === EMPTY_PARAM) notFound();
  const posts = getPostsByCategory(lang, category);
  return (
    <div className="container">
      <h1 className="page-title" style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>
        {category} <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>({posts.length})</span>
      </h1>
      {posts.map((p) => (
        <div key={p.slug} className="archive-item">
          <span className="archive-date">{p.date}</span>
          <a href={`/${lang}/posts/${encodeURIComponent(p.slug)}/`}>{p.title}</a>
        </div>
      ))}
    </div>
  );
}
