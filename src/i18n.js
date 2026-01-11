export const RTL_LANGS = new Set(["ar"]);
export const DEFAULT_LANG = "en";
export const LANG_STORAGE_KEY = "mx_lang";

const loaders = {
  en: () => import("./locales/en.json", { assert: { type: "json" } }),
  es: () => import("./locales/es.json", { assert: { type: "json" } }),
  ca: () => import("./locales/ca.json", { assert: { type: "json" } }),
  eu: () => import("./locales/eu.json", { assert: { type: "json" } }),
  fr: () => import("./locales/fr.json", { assert: { type: "json" } }),
  ar: () => import("./locales/ar.json", { assert: { type: "json" } }),
  ru: () => import("./locales/ru.json", { assert: { type: "json" } }),
  zh: () => import("./locales/zh.json", { assert: { type: "json" } }),
  hi: () => import("./locales/hi.json", { assert: { type: "json" } })
};

const cache = new Map();

export async function loadDict(lang){
  const safe = loaders[lang] ? lang : DEFAULT_LANG;
  if (cache.has(safe)) return cache.get(safe);

  const mod = await loaders[safe]();
  const dict = mod?.default || {};
  cache.set(safe, dict);
  return dict;
}
