import { getAllCategories, type Lang } from "@/lib/content";

export default async function CategoriesPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const cats = getAllCategories(lang);
  return (
    <div className="container">
      <h1 style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>{lang === "zh" ? "分类" : "Categories"}</h1>
      <div className="term-cloud">
        {cats.map((c) => (
          <a key={c} href={`/${lang}/categories/${encodeURIComponent(c)}/`} className="term-item">
            {c}
          </a>
        ))}
      </div>
    </div>
  );
}
