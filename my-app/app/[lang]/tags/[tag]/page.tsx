import { getAllTags, getPostsByTag, type Lang } from "@/lib/content";

export const dynamicParams = false;

export function generateStaticParams({ params }: { params: { lang: string } }) {
  return getAllTags(params.lang as Lang).map((tag) => ({ tag }));
}

export default async function TagPage({ params }: { params: Promise<{ lang: string; tag: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const tag = decodeURIComponent(p.tag);
  const posts = getPostsByTag(lang, tag);
  return (
    <div className="container">
      <h1 style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>
        #{tag} <span style={{ fontSize: "0.85rem", color: "var(--muted)" }}>({posts.length})</span>
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
