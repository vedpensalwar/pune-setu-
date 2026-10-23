export type Language = "en" | "mr" | "hi";

export interface LanguageInfo {
  id: Language;
  label: string;
  native: string;
  locale: string;
}

export const SUPPORTED_LANGUAGES: LanguageInfo[] = [
  { id: "en", label: "English", native: "English", locale: "en-IN" },
  { id: "mr", label: "Marathi", native: "मराठी", locale: "mr-IN" },
  { id: "hi", label: "Hindi", native: "हिन्दी", locale: "hi-IN" },
];

export type TranslationDictionary = Record<string, string>;
