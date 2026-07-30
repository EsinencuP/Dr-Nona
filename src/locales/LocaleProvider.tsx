import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { ruLocaleSchema, safeLocalStorage } from "../app/storage";
import { ru } from "./ru";

type LocaleContextValue = {
  locale: "ru";
  t: typeof ru;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "ru",
  t: ru,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  useEffect(() => {
    const locale = safeLocalStorage.get(
      "drnona-locale",
      ruLocaleSchema,
      "ru"
    );
    safeLocalStorage.set("drnona-locale", locale, ruLocaleSchema);
    document.documentElement.lang = locale;
    document.documentElement.dataset.uiLocale = locale;
  }, []);

  return (
    <LocaleContext.Provider value={{ locale: "ru", t: ru }}>
      {children}
    </LocaleContext.Provider>
  );
}
