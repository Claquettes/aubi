import { useCallback } from 'react';
import { create } from 'zustand';
import { en } from './en';
import { fr } from './fr';

export type Lang = 'fr' | 'en';
export type TKey = keyof typeof fr;
export type TVars = Record<string, string | number>;
export type TFn = (key: TKey, vars?: TVars) => string;

export const LANGS: { key: Lang; labelKey: TKey }[] = [
  { key: 'fr', labelKey: 'settings.language.fr' },
  { key: 'en', labelKey: 'settings.language.en' },
];

const DICTS: Record<Lang, Record<TKey, string>> = { fr, en };
const STORAGE_KEY = 'aubi.lang';

export const DEFAULT_LANG: Lang = 'en';

function initialLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === 'fr' || saved === 'en') return saved;
  } catch {
    /* stockage indisponible (mode privé) : on prend la langue par défaut */
  }
  return DEFAULT_LANG;
}

/**
 * Miroir hors React de la langue courante : les formateurs (durées, dates,
 * nombres) sont de simples fonctions, ils ne peuvent pas lire un hook.
 */
let currentLang: Lang = initialLang();
document.documentElement.lang = currentLang;

interface LangState {
  lang: Lang;
  setLang: (lang: Lang) => void;
}

export const useLangStore = create<LangState>((set) => ({
  lang: currentLang,
  setLang: (lang) => {
    currentLang = lang;
    document.documentElement.lang = lang;
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {
      /* rien à faire : la langue reste valable pour la session */
    }
    set({ lang });
  },
}));

export const getLang = () => currentLang;

export const localeTag = () => (currentLang === 'fr' ? 'fr-FR' : 'en-GB');

/** Le français garde le singulier à 0 (« 0 titre »), l'anglais non. */
export const isPlural = (n: number, lang: Lang = currentLang) =>
  lang === 'fr' ? n > 1 : n !== 1;

export function translate(lang: Lang, key: TKey, vars?: TVars): string {
  let out: string = DICTS[lang][key] ?? fr[key] ?? key;
  if (vars?.count !== undefined && out.includes('|')) {
    const [one, many] = out.split('|');
    out = isPlural(Number(vars.count), lang) ? many : one;
  }
  if (vars) {
    out = out.replace(/\{(\w+)\}/g, (m, name: string) =>
      name in vars ? String(vars[name]) : m,
    );
  }
  return out;
}

/** Traduction hors composant (formateurs, stores, callbacks). */
export const t: TFn = (key, vars) => translate(currentLang, key, vars);

/** Traduction dans un composant : re-rend au changement de langue. */
export function useT(): TFn {
  const lang = useLangStore((s) => s.lang);
  return useCallback((key: TKey, vars?: TVars) => translate(lang, key, vars), [
    lang,
  ]);
}

export const useLang = () => useLangStore((s) => s.lang);
export const useSetLang = () => useLangStore((s) => s.setLang);
