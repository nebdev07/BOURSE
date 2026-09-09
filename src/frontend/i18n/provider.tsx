"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import { dictionaries, type Locale, type Messages } from "./dictionary";

const Ctx = createContext<{ locale: Locale; t: Messages }>({ locale: "fr", t: dictionaries.fr });

export function I18nProvider({ locale, children }: { locale: Locale; children: ReactNode }) {
  const value = useMemo(() => ({ locale, t: dictionaries[locale] ?? dictionaries.fr }), [locale]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useI18n() {
  return useContext(Ctx);
}
