"use client";

import { useEffect, useRef, useState } from "react";

import { COOKIE_NAME, createTranslator, Locale, LOCALES } from "@/lib/i18n";

interface LanguageToggleProps {
  locale: Locale;
}

export function LanguageToggle({ locale }: LanguageToggleProps) {
  const [value, setValue] = useState<Locale>(locale);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const t = createTranslator(locale);

  useEffect(() => {
    setValue(locale);
  }, [locale]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (event: MouseEvent) => {
      if (!wrapperRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  const handleSelect = (next: Locale) => {
    setValue(next);
    setOpen(false);
    document.cookie = `${COOKIE_NAME}=${next}; path=/; max-age=31536000`;
    window.location.reload();
  };

  return (
    <div className="lang-toggle" ref={wrapperRef}>
      <button
        type="button"
        className="lang-toggle__button"
        onClick={() => setOpen((prev) => !prev)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className="lang-toggle__label">{t("nav.language")}</span>
        <span className="lang-toggle__value">{value === "en" ? "EN" : "PT-BR"}</span>
      </button>
      {open ? (
        <div
          className="lang-toggle__menu"
          role="menu"
          aria-label={t("nav.language")}
        >
          {LOCALES.map((option) => {
            const isActive = option === value;
            return (
              <button
                key={option}
                type="button"
                className="lang-toggle__option"
                role="menuitemradio"
                aria-checked={isActive}
                onClick={() => handleSelect(option)}
              >
                <span
                  className={`lang-toggle__dot${isActive ? " is-active" : ""}`}
                />
                <span className="lang-toggle__text">
                  {option === "en" ? "English" : "Português (Brasil)"}
                </span>
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
