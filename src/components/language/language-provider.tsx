"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import {
  type Language,
  translate,
  formatLocalizedDate,
  formatLocalizedNumber,
} from "@/lib/i18n";

export type { Language };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (dateStr: string | number | Date, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
}

const LANGUAGE_STORAGE_KEY = "punesetu-lang-preference";
export const LANGUAGE_COOKIE_NAME = "punesetu_locale";

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function getInitialLanguage(fallback: Language): Language {
  if (typeof window === "undefined") {
    return fallback;
  }
  try {
    const stored = localStorage.getItem(LANGUAGE_STORAGE_KEY) as Language | null;
    if (stored === "en" || stored === "mr" || stored === "hi") {
      return stored;
    }
    const match = document.cookie.match(new RegExp(`(?:^|; )${LANGUAGE_COOKIE_NAME}=([^;]*)`));
    if (match && (match[1] === "en" || match[1] === "mr" || match[1] === "hi")) {
      return match[1] as Language;
    }
  } catch {
    // Storage access error fallback
  }
  return fallback;
}

export function LanguageProvider({
  children,
  initialLanguage = "en",
}: {
  children: React.ReactNode;
  initialLanguage?: Language;
}) {
  const [language, setLanguageState] = useState<Language>(() =>
    getInitialLanguage(initialLanguage)
  );

  // Multi-tab and custom event synchronization
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === LANGUAGE_STORAGE_KEY && event.newValue) {
        if (
          event.newValue === "en" ||
          event.newValue === "mr" ||
          event.newValue === "hi"
        ) {
          setLanguageState(event.newValue as Language);
          document.documentElement.lang = event.newValue;
        }
      }
    };

    const handleCustomEvent = (event: Event) => {
      const custom = event as CustomEvent<Language>;
      if (
        custom.detail &&
        (custom.detail === "en" || custom.detail === "mr" || custom.detail === "hi")
      ) {
        setLanguageState(custom.detail);
        document.documentElement.lang = custom.detail;
      }
    };

    window.addEventListener("storage", handleStorage);
    window.addEventListener("punesetu:language-change", handleCustomEvent);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener("punesetu:language-change", handleCustomEvent);
    };
  }, []);

  const setLanguage = useCallback((newLang: Language) => {
    setLanguageState(newLang);
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, newLang);
      document.cookie = `${LANGUAGE_COOKIE_NAME}=${newLang}; path=/; max-age=31536000; SameSite=Lax`;
    } catch {
      // Storage unavailable fallback
    }
    document.documentElement.lang = newLang;
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("punesetu:language-change", { detail: newLang }));
    }
  }, []);

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      return translate(language, key, params);
    },
    [language]
  );

  const formatDate = useCallback(
    (dateStr: string | number | Date, options?: Intl.DateTimeFormatOptions): string => {
      return formatLocalizedDate(dateStr, language, options);
    },
    [language]
  );

  const formatNumber = useCallback(
    (num: number, options?: Intl.NumberFormatOptions): string => {
      return formatLocalizedNumber(num, language, options);
    },
    [language]
  );

  const langScript = `
(function() {
  try {
    var stored = localStorage.getItem("${LANGUAGE_STORAGE_KEY}");
    if (stored === "mr" || stored === "hi" || stored === "en") {
      document.documentElement.lang = stored;
    }
  } catch (e) {}
})();
`;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, formatDate, formatNumber }}>
      <script dangerouslySetInnerHTML={{ __html: langScript }} />
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
