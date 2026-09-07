import { SITE, type Lang } from "../lib/content";
import ThemeToggle from "./ThemeToggle";
import FontSizeControl from "./FontSizeControl";
import LangSwitcher from "./LangSwitcher";

export default function Header({ lang }: { lang: Lang }) {
  const menu = SITE.menu[lang];
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
          <LangSwitcher />
        </div>
      </div>
    </header>
  );
}
