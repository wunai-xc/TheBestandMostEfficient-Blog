import type { ReactNode } from "react";
import { SITE, type Lang } from "../lib/content";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";

/* 图标 + 标签：图标来自本地打包的 MDI，不请求外部 CDN，国内可正常显示；
   鼠标悬停卡片时图标会做一段小幅动作（见 .footer-link-icon 的注释）。 */
function Label({ icon, children }: { icon: keyof typeof icons; children: ReactNode }) {
  return (
    <span className="footer-link-label">
      <Icon
        icon={icons[icon]}
        className="footer-link-icon"
        width="1.1em"
        height="1.1em"
      />
      {children}
    </span>
  );
}

export default function Footer({ lang }: { lang: Lang }) {
  const t = SITE.i18n[lang];
  const c = SITE.contact;

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-label">{t.contactLabel}</p>
        <p className="footer-body">{t.contactBody}</p>

        <div className="footer-links">
          <a className="footer-link" href={`mailto:${c.email}`}>
            <Label icon="mdi:email-outline">{t.email}</Label>
            <span className="footer-link-value">{c.email}</span>
          </a>
          <a
            className="footer-link"
            href={c.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Label icon="mdi:github">{t.github}</Label>
            <span className="footer-link-value">{c.github.replace(/^https?:\/\//, "")}</span>
          </a>
          <a
            className="footer-link"
            href={c.repo}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Label icon="mdi:source-repository">{t.repoLabel}</Label>
            <span className="footer-link-value">{c.repo.replace(/^https?:\/\//, "")}</span>
          </a>
          <a
            className="footer-link"
            href={c.bilibili}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Label icon="mdi:television-classic">{t.bilibili}</Label>
            <span className="footer-link-value">{c.bilibiliName}</span>
          </a>
          <a
            className="footer-link"
            href={c.youtube}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Label icon="mdi:youtube">{t.youtube}</Label>
            <span className="footer-link-value">{c.youtubeName}</span>
          </a>
          {/* 微信 ID 与 Discord 没有可跳转的链接，只做展示；不可点故不加 hover 抬升 */}
          <div className="footer-link footer-link-static">
            <Label icon="mdi:wechat">{t.wechat}</Label>
            <span className="footer-link-value">{c.wechat}</span>
          </div>
          <div className="footer-link footer-link-static">
            <Label icon="mdi:discord">{t.discord}</Label>
            <span className="footer-link-value">{t.discordHint}</span>
          </div>
        </div>

        <p className="footer-thanks">{t.thanks}</p>

        <div className="footer-copy">
          © {new Date().getFullYear()} {SITE.title} · Powered by Next.js · Hosted on Cloudflare
        </div>
      </div>
    </footer>
  );
}
