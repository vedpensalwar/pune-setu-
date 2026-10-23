import { enDictionary } from "./dictionaries/en";
import { mrDictionary } from "./dictionaries/mr";
import { hiDictionary } from "./dictionaries/hi";
import type { Language, TranslationDictionary } from "./types";

export * from "./types";

export const DICTIONARIES: Record<Language, TranslationDictionary> = {
  en: enDictionary,
  mr: mrDictionary,
  hi: hiDictionary,
};

/**
 * Checks if a key is genuinely translated in the target language (does not fall back to en).
 */
export function isKeyTranslated(lang: Language, key: string): boolean {
  const dict = DICTIONARIES[lang];
  return Boolean(dict && dict[key] && dict[key].trim().length > 0);
}

/**
 * Translate a key into the target language with optional parameter interpolation.
 * If translation is missing in the target language, falls back to English.
 */
export function translate(
  lang: Language,
  key: string,
  params?: Record<string, string | number>
): string {
  const dict = DICTIONARIES[lang] || DICTIONARIES.en;
  let text = dict[key] || DICTIONARIES.en[key] || key;

  if (params) {
    for (const [paramKey, paramVal] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${paramKey}\\}`, "g"), String(paramVal));
    }
  }

  return text;
}

/**
 * Audit translation completeness across all supported languages.
 * Identifies total canonical keys, missing keys, and empty translations without hiding fallbacks.
 */
export function auditTranslationCompleteness(): {
  totalCanonicalKeys: number;
  languages: Record<
    Language,
    {
      translatedCount: number;
      missingKeys: string[];
      emptyKeys: string[];
      completenessPercent: number;
    }
  >;
  isComplete: boolean;
} {
  const canonicalKeys = Object.keys(DICTIONARIES.en);
  const total = canonicalKeys.length;

  const result: Record<
    Language,
    {
      translatedCount: number;
      missingKeys: string[];
      emptyKeys: string[];
      completenessPercent: number;
    }
  > = {
    en: { translatedCount: 0, missingKeys: [], emptyKeys: [], completenessPercent: 0 },
    mr: { translatedCount: 0, missingKeys: [], emptyKeys: [], completenessPercent: 0 },
    hi: { translatedCount: 0, missingKeys: [], emptyKeys: [], completenessPercent: 0 },
  };

  const langs: Language[] = ["en", "mr", "hi"];

  for (const lang of langs) {
    const dict = DICTIONARIES[lang] || {};
    const missing: string[] = [];
    const empty: string[] = [];
    let count = 0;

    for (const key of canonicalKeys) {
      if (!(key in dict)) {
        missing.push(key);
      } else if (!dict[key] || dict[key].trim() === "") {
        empty.push(key);
      } else {
        count++;
      }
    }

    result[lang] = {
      translatedCount: count,
      missingKeys: missing,
      emptyKeys: empty,
      completenessPercent: Math.round((count / total) * 100),
    };
  }

  const isComplete =
    result.mr.missingKeys.length === 0 &&
    result.mr.emptyKeys.length === 0 &&
    result.hi.missingKeys.length === 0 &&
    result.hi.emptyKeys.length === 0;

  return {
    totalCanonicalKeys: total,
    languages: result,
    isComplete,
  };
}

/**
 * Format a date string or timestamp according to the locale.
 */
export function formatLocalizedDate(
  dateStr: string | number | Date,
  lang: Language,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);

  const locale = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
  const defaultOptions: Intl.DateTimeFormatOptions = {
    day: "numeric",
    month: "short",
    year: "numeric",
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch {
    return date.toLocaleDateString("en-IN", defaultOptions);
  }
}

/**
 * Format a number with localized numeral conventions.
 */
export function formatLocalizedNumber(
  num: number,
  lang: Language,
  options?: Intl.NumberFormatOptions
): string {
  const locale = lang === "mr" ? "mr-IN" : lang === "hi" ? "hi-IN" : "en-IN";
  try {
    return new Intl.NumberFormat(locale, options).format(num);
  } catch {
    return String(num);
  }
}
