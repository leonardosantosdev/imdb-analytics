"use client";

import { useEffect, useState } from "react";

type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

const getPreferredTheme = () => {
  if (typeof window === "undefined") return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const updateThemeColor = (theme: Theme) => {
  const color = theme === "dark" ? "#0B0F14" : "#f6f4ef";
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) {
    meta.setAttribute("content", color);
  } else {
    const created = document.createElement("meta");
    created.setAttribute("name", "theme-color");
    created.setAttribute("content", color);
    document.head.appendChild(created);
  }
};

const applyTheme = (theme: Theme) => {
  document.documentElement.dataset.theme = theme;
  updateThemeColor(theme);
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    const datasetTheme = document.documentElement.dataset.theme;
    const next =
      stored === "light" || stored === "dark"
        ? (stored as Theme)
        : datasetTheme === "light" || datasetTheme === "dark"
          ? (datasetTheme as Theme)
          : getPreferredTheme();
    setTheme(next);
    applyTheme(next);
  }, []);

  const handleToggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={handleToggle}
      aria-pressed={theme === "dark"}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
    >
      {theme === "dark" ? (
        <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M12 18a6 6 0 1 0 0-12 6 6 0 0 0 0 12zm0-16v2m0 16v2m10-10h-2M4 12H2m15.364-6.364-1.414 1.414M7.05 16.95l-1.414 1.414m0-11.314 1.414 1.414m11.314 11.314 1.414 1.414"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ) : (
        <svg className="theme-toggle__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path
            d="M20.354 15.354A8 8 0 1 1 8.646 3.646a7 7 0 0 0 11.708 11.708z"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
    </button>
  );
}
