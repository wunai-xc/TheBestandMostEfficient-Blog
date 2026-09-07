import { SITE } from "../lib/content";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div>© {new Date().getFullYear()} {SITE.title} · Powered by Next.js · Hosted on Cloudflare</div>
    </footer>
  );
}
