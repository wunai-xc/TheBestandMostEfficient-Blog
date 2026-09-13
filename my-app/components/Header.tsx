import { SITE, type Lang } from "../lib/content";
import { Icon } from "@iconify/react/offline";
import { icons } from "@/lib/icons";
import ThemeToggle from "./ThemeToggle";
import FontSizeControl from "./FontSizeControl";
import LangSwitcher from "./LangSwitcher";

/**
 * 注意：这里不能直接写 href="/settings/"，必须带语言前缀，
 * 否则会跳出 /zh 或 /en 的语言命名空间。
 */
export default function Header({ lang }: { lang: Lang }) {
  const menu = SITE.menu[lang];
  const t = SITE.i18n[lang];
  return (
    <header className="site-header">
      <div className="header-inner">
        <a href={`/${lang}/`} className="logo">{SITE.title}</a>
        <nav className="nav">
          {menu.map((item) => (
            <a
              key={item.href}
              href={item.href}
              {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            >
              {item.name}
            </a>
          ))}
        </nav>
        <div className="header-tools">
          <FontSizeControl />
          <ThemeToggle />
          <a
            href={`/${lang}/settings/`}
            className="icon-btn"
            title={t.settings}
            aria-label={t.settings}
          >
            <Icon icon={icons["mdi:cog-outline"]} width="1.2em" height="1.2em" />
          </a>
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
