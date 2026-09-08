import { SITE, getPinnedPosts, getHomePosts, type Lang } from "@/lib/content";
import PostCard from "@/components/PostCard";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

export default async function HomePage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const t = SITE.i18n[lang];
  const info = SITE.homeInfo[lang];
  const pinned = getPinnedPosts(lang);
  const posts = getHomePosts(lang);

  return (
    <div className="container" style={{ paddingTop: 0 }}>
      <section className="hero">
        <h1>{info.title} <Icon icon={icons["mdi:hand-wave-outline"]} width="1em" height="1em" /></h1>
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
