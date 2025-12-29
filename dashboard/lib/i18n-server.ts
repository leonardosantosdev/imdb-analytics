import { cookies, headers } from "next/headers";

import { COOKIE_NAME, DEFAULT_LOCALE, isLocale, Locale } from "./i18n";

export function getLocale(): Locale {
  const stored = cookies().get(COOKIE_NAME)?.value;
  if (isLocale(stored)) {
    return stored;
  }

  const acceptLanguage = headers().get("accept-language") || "";
  const lowered = acceptLanguage.toLowerCase();
  if (lowered.includes("pt")) {
    return "pt-BR";
  }

  return DEFAULT_LOCALE;
}
