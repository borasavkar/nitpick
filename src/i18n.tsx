import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type Lang = "en" | "tr";

/** A piece of text in every supported language. */
export type L = Record<Lang, string>;

export const LANGS: { id: Lang; label: string }[] = [
  { id: "en", label: "EN" },
  { id: "tr", label: "TR" },
];

const KEY = "nitpick.lang";

/** The user's saved choice wins; otherwise Turkish in Türkiye or with a Turkish system language, else English. */
function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "en" || saved === "tr") return saved;
  } catch {
    // ignore
  }
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz === "Europe/Istanbul" || tz === "Asia/Istanbul") return "tr";
  } catch {
    // ignore
  }
  const first = (navigator.languages?.[0] ?? navigator.language ?? "").toLowerCase();
  return first.startsWith("tr") ? "tr" : "en";
}

interface I18nValue {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (text: L) => string;
  /** BCP 47 locale for dates and numbers. */
  locale: string;
}

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const value = useMemo<I18nValue>(
    () => ({ lang, setLang, t: (text) => text[lang], locale: lang === "tr" ? "tr-TR" : "en-US" }),
    [lang, setLang],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside I18nProvider");
  return ctx;
}
