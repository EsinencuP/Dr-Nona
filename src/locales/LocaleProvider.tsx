import { createContext, useContext, useEffect } from "react";
import type { ReactNode } from "react";
import { localeSchema, safeLocalStorage } from "../app/storage";
import { useLocation } from "../router";
import { ru } from "./ru";
import type { LocaleMessages } from "./ru";
import { ro } from "./ro";

type LocaleContextValue = {
  locale: "ru" | "ro";
  t: LocaleMessages;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "ru",
  t: ru,
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function LocaleProvider({ children }: { children: ReactNode }) {
  const { locale } = useLocation();
  const messages = locale === "ro" ? ro : ru;
  useEffect(() => {
    safeLocalStorage.set("drnona-locale", locale, localeSchema);
    document.documentElement.lang = locale;
    document.documentElement.dataset.uiLocale = locale;
  }, [locale]);

  return (
    <LocaleContext.Provider value={{ locale, t: messages }}>
      {children}
    </LocaleContext.Provider>
  );
}
