"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { createTranslator, Locale } from "@/lib/i18n";
import { LanguageToggle } from "./LanguageToggle";
import { ThemeToggle } from "./ThemeToggle";

interface NavProps {
  locale: Locale;
}

export function Nav({ locale }: NavProps) {
  const pathname = usePathname();
  const t = createTranslator(locale);
  const links = [
    { href: "/", label: t("nav.overview") },
    { href: "/top-titles", label: t("nav.topTitles") },
    { href: "/genres", label: t("nav.genres") },
    { href: "/series", label: t("nav.series") },
  ];

  return (
    <header className="nav">
      <div className="nav__inner">
        <Link className="nav__brand" href="/">
          <img className="nav__logo" src="/logo.png" alt="IMDb Analytics logo" />
          <span className="nav__brand-text">IMDb Analytics</span>
        </Link>
        <div className="nav__actions">
          <nav className="nav__links">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                data-active={pathname === link.href ? "true" : "false"}
                aria-current={pathname === link.href ? "page" : undefined}
              >
                {link.label}
              </Link>
            ))}
          </nav>
          <ThemeToggle />
          <LanguageToggle locale={locale} />
        </div>
      </div>
    </header>
  );
}
