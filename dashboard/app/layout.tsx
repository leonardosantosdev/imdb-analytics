import "./globals.css";
import type { Metadata } from "next";
import { Bebas_Neue, Space_Grotesk } from "next/font/google";
import { Nav } from "./components/Nav";
import { createTranslator } from "@/lib/i18n";
import { getLocale } from "@/lib/i18n-server";

const display = Bebas_Neue({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-display"
});

const body = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body"
});

export const metadata: Metadata = {
  title: "IMDb Analytics",
  description: "IMDb analytics dashboard"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const t = createTranslator(locale);

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <body>
        <Nav locale={locale} />
        <main className="main">{children}</main>
        <footer className="footer">
          <p>{t("footer.note")}</p>
        </footer>
      </body>
    </html>
  );
}
