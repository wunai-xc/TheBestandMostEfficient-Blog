import { getAllTags, type Lang } from "@/lib/content";

export default async function TagsPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const tags = getAllTags(lang);
  return (
    <div className="container">
      <h1 style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>{lang === "zh" ? "标签" : "Tags"}</h1>
      <div className="term-cloud">
        {tags.map((tag) => (
          <a key={tag} href={`/${lang}/tags/${encodeURIComponent(tag)}/`} className="term-item">
            #{tag}
          </a>
        ))}
      </div>
    </div>
  );
}
