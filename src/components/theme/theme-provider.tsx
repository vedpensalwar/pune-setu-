"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useSyncExternalStore,
  useEffect,
} from "react";

export type Theme = "light" | "dark" | "high-contrast";

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "punesetu-theme-preference";
const THEME_MIGRATION_KEY = "punesetu-theme-default-light-v11-final";

let currentTheme: Theme = "light";
const listeners = new Set<() => void>();

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function getThemeSnapshot(): Theme {
  if (typeof window === "undefined") return "light";
  try {
    // Deliberate one-time migration to clear obsolete system-dark preferences
    const migrated = localStorage.getItem(THEME_MIGRATION_KEY);
    if (!migrated) {
      localStorage.setItem(THEME_MIGRATION_KEY, "true");
      localStorage.setItem(THEME_STORAGE_KEY, "light");
      currentTheme = "light";
      document.documentElement.setAttribute("data-theme", "light");
      return "light";
    }

    const stored = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null;
    if (stored === "light" || stored === "dark" || stored === "high-contrast") {
      currentTheme = stored;
      return stored;
    }

    // Default for all visitors when no preference is saved: STRICTLY LIGHT
    currentTheme = "light";
    return "light";
  } catch {
    return currentTheme;
  }
}

function getThemeServerSnapshot(): Theme {
  return "light";
}

function subscribeToTheme(callback: () => void): () => void {
  listeners.add(callback);

  const handleStorage = (event: StorageEvent) => {
    if (event.key === THEME_STORAGE_KEY && event.newValue) {
      if (
        event.newValue === "light" ||
        event.newValue === "dark" ||
        event.newValue === "high-contrast"
      ) {
        currentTheme = event.newValue;
        document.documentElement.setAttribute("data-theme", currentTheme);
        emitChange();
      }
    }
  };

  window.addEventListener("storage", handleStorage);

  return () => {
    listeners.delete(callback);
    window.removeEventListener("storage", handleStorage);
  };
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getThemeServerSnapshot
  );

  // Sync DOM attribute whenever theme changes
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const setTheme = useCallback((newTheme: Theme) => {
    currentTheme = newTheme;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, newTheme);
      localStorage.setItem(THEME_MIGRATION_KEY, "true");
    } catch {
      // Storage unavailable fallback
    }
    document.documentElement.setAttribute("data-theme", newTheme);
    emitChange();
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {/* Inline script to prevent theme flash and enforce light-first default */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              try {
                var migrated = localStorage.getItem('${THEME_MIGRATION_KEY}');
                if (!migrated) {
                  localStorage.setItem('${THEME_MIGRATION_KEY}', 'true');
                  localStorage.setItem('${THEME_STORAGE_KEY}', 'light');
                  document.documentElement.setAttribute('data-theme', 'light');
                  return;
                }
                var stored = localStorage.getItem('${THEME_STORAGE_KEY}');
                if (stored === 'dark' || stored === 'high-contrast' || stored === 'light') {
                  document.documentElement.setAttribute('data-theme', stored);
                } else {
                  document.documentElement.setAttribute('data-theme', 'light');
                }
              } catch (e) {
                document.documentElement.setAttribute('data-theme', 'light');
              }
            })();
          `,
        }}
      />
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
