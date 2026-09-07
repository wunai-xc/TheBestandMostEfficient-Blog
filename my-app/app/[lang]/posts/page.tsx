import { getPosts, type Lang } from "@/lib/content";
import PostCard from "@/components/PostCard";

export const dynamicParams = false;

export default async function PostsPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const posts = getPosts(lang);
  return (
    <div className="container">
      <h1 style={{ fontSize: "1.6rem", margin: "24px 0 16px" }}>{lang === "zh" ? "文章" : "Posts"}</h1>
      {posts.map((p) => (
        <PostCard key={p.slug} post={p} lang={lang} />
      ))}
    </div>
  );
}
