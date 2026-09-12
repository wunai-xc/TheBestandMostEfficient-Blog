import { SITE, type Lang } from "../lib/content";

export default function Footer({ lang }: { lang: Lang }) {
  const t = SITE.i18n[lang];
  const c = SITE.contact;

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <p className="footer-label">{c.label}</p>
        <p className="footer-body">{c.body}</p>

        <div className="footer-links">
          <a className="footer-link" href={`mailto:${c.email}`}>
            <span className="footer-link-label">{t.email}</span>
            <span className="footer-link-value">{c.email}</span>
          </a>
          <a
            className="footer-link"
            href={c.github}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="footer-link-label">{t.github}</span>
            <span className="footer-link-value">{c.github.replace(/^https?:\/\//, "")}</span>
          </a>
          <a
            className="footer-link"
            href={c.repo}
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="footer-link-label">{c.repoLabel}</span>
            <span className="footer-link-value">{c.repo.replace(/^https?:\/\//, "")}</span>
          </a>
        </div>

        <p className="footer-thanks">{t.thanks}</p>

        <div className="footer-copy">
          © {new Date().getFullYear()} {SITE.title} · Powered by Next.js · Hosted on Cloudflare
        </div>
      </div>
    </footer>
  );
}
