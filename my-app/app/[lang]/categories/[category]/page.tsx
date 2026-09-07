import { getAllCategories, getPostsByCategory, type Lang } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return getAllCategories(params.lang as Lang).map((category) => ({ category }));
}

export default async function CategoryPage({ params }: { params: Promise<{ lang: string; category: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const category = decodeURIComponent(p.category);
  const posts = getPostsByCategory(lang, category);
  return (
    <div className="container">
      <h1 style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>
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
