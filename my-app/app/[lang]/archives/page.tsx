import { getArchives, type Lang } from "@/lib/content";

export default async function ArchivesPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const byYear = getArchives(lang);
  const years = Object.keys(byYear).sort((a, b) => b.localeCompare(a));
  return (
    <div className="container">
      <h1 style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>{lang === "zh" ? "归档" : "Archives"}</h1>
      {years.map((year) => (
        <div key={year}>
          <div className="archive-year">{year}</div>
          {byYear[year].map((p) => (
            <div key={p.slug} className="archive-item">
              <span className="archive-date">{p.date.slice(5)}</span>
              <a href={`/${lang}/posts/${encodeURIComponent(p.slug)}/`}>{p.title}</a>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
