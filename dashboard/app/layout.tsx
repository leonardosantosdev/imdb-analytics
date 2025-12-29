import "./globals.css";
import type { Metadata } from "next";
import Script from "next/script";
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
  description: "IMDb analytics dashboard",
  icons: {
    icon: "/logo.png"
  }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const locale = getLocale();
  const t = createTranslator(locale);

  return (
    <html lang={locale} className={`${display.variable} ${body.variable}`}>
      <head>
        <meta name="theme-color" content="#f6f4ef" />
        <Script id="theme-init" strategy="beforeInteractive">
          {`(function(){try{var stored=localStorage.getItem('theme');var prefers=window.matchMedia&&window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';var theme=stored==='light'||stored==='dark'?stored:prefers;document.documentElement.dataset.theme=theme;var meta=document.querySelector('meta[name="theme-color"]');if(!meta){meta=document.createElement('meta');meta.name='theme-color';document.head.appendChild(meta);}meta.setAttribute('content',theme==='dark'?'#0B0F14':'#f6f4ef');}catch(e){}})();`}
        </Script>
      </head>
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
