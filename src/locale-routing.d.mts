export type SupportedLocale = "ru" | "ro";

export function isLocaleRouteSupported(pathname: string): boolean;
export function localePathFor(
  pathname: string,
  search: string,
  locale: SupportedLocale
): string;
