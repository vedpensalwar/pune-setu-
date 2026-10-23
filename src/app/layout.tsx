import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import { Inter, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme/theme-provider";
import { ToastProvider } from "@/components/ui/toast";
import { LanguageProvider, Language } from "@/components/language/language-provider";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  variable: "--font-devanagari",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "PuneSetu (पुणे सेतू) — Civic Grievance Platform Foundation",
  description:
    "Connecting Citizens. Empowering Communities. Improving Pune. Official foundation and design system for Pune's civic grievance redressal platform.",
  authors: [{ name: "PuneSetu Engineering Team" }],
  keywords: ["PuneSetu", "Pune", "Civic Tech", "Grievance Redressal", "PMC", "PCMC", "Smart City"],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F7F8FA" },
    { media: "(prefers-color-scheme: dark)", color: "#0B1320" },
  ],
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const rawLocale = cookieStore.get("punesetu_locale")?.value;
  const initialLang: Language =
    rawLocale === "mr" || rawLocale === "hi" ? (rawLocale as Language) : "en";

  return (
    <html lang={initialLang} data-theme="light" suppressHydrationWarning className={`${inter.variable} ${notoSansDevanagari.variable}`}>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var migrated = localStorage.getItem("punesetu-theme-default-light-v11-final");
                  if (!migrated) {
                    localStorage.setItem("punesetu-theme-default-light-v11-final", "true");
                    localStorage.setItem("punesetu-theme-preference", "light");
                    document.documentElement.setAttribute("data-theme", "light");
                    return;
                  }
                  var theme = localStorage.getItem("punesetu-theme-preference");
                  if (theme === "dark" || theme === "high-contrast") {
                    document.documentElement.setAttribute("data-theme", theme);
                  } else {
                    document.documentElement.setAttribute("data-theme", "light");
                  }

                  var lang = localStorage.getItem("punesetu-lang-preference");
                  if (!lang) {
                    var match = document.cookie.match(/(?:^|; )punesetu_locale=([^;]*)/);
                    if (match) lang = match[1];
                  }
                  if (lang === "mr" || lang === "hi" || lang === "en") {
                    document.documentElement.lang = lang;
                  }
                } catch (e) {
                  document.documentElement.setAttribute("data-theme", "light");
                }
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased font-sans">
        <ThemeProvider>
          <LanguageProvider initialLanguage={initialLang}>
            <ToastProvider>
              {children}
            </ToastProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
