import { SITE, getPinnedPosts, getHomePosts, type Lang } from "@/lib/content";
import PostCard from "@/components/PostCard";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const t = SITE.i18n[lang];
  const info = SITE.homeInfo[lang];
  const pinned = getPinnedPosts(lang);
  const posts = getHomePosts(lang);

  return (
    <div className="container" style={{ paddingTop: 0 }}>
      <section className="hero">
        <h1>{info.title}</h1>
        <p>{info.content}</p>
      </section>

      {pinned.length > 0 && (
        <section>
          {pinned.map((p) => (
            <PostCard key={p.slug} post={p} lang={lang} />
          ))}
        </section>
      )}

      <section>
        {posts.map((p) => (
          <PostCard key={p.slug} post={p} lang={lang} />
        ))}
      </section>
    </div>
  );
}
