import { SITE, type Lang } from "@/lib/content";
import { getFriendLinks, friendText, friendHost } from "@/lib/links";

export default async function LinksPage({ params }: { params: Promise<{ lang: string }> }) {
  const p = await params; const lang = p.lang as Lang;
  const t = SITE.i18n[lang];
  const links = getFriendLinks();

  return (
    <div className="container">
      <h1 style={{ fontSize: "1.6rem", margin: "24px 0 12px" }}>{t.links}</h1>
      <p className="links-intro">{t.linksIntro}</p>

      <div className="friend-grid">
        {links.map((link) => (
          <a
            key={link.url}
            className="friend-card"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
          >
            {link.avatar ? (
              // 友链图片可能是任意域名，用原生 img：next/image 需要预先声明
              // remotePatterns，无法覆盖任意来源；这里也不需要优化
              // eslint-disable-next-line @next/next/no-img-element
              <img className="friend-avatar" src={link.avatar} alt="" loading="lazy" decoding="async" />
            ) : (
              // 没填图片时用名称首字占位，避免出现碎图
              <span className="friend-avatar friend-avatar-fallback" aria-hidden="true">
                {link.name.slice(0, 1)}
              </span>
            )}
            <span className="friend-info">
              <span className="friend-name">{link.name}</span>
              {/* 没写介绍时回退显示域名，而不是留一行空白 */}
              <span className="friend-desc">{friendText(link.description, lang) || friendHost(link.url)}</span>
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
