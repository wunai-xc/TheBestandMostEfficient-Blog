import Search from "@/components/Search";
import { getAllTags, type Lang } from "@/lib/content";

export default async function SearchPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params;
  return (
    <div className="container">
      <h1 className="page-title" style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>{p.lang === 'zh' ? "搜索" : "Search"}</h1>
      <Search lang={p.lang} tags={getAllTags(p.lang as Lang)} />
    </div>
  );
}
