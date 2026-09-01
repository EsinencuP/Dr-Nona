const localizedExactPaths = new Set([
  "/",
  "/products",
  "/selection",
  "/contactus",
  "/certificates",
  "/editorial",
  "/blog",
  "/news",
  "/about",
  "/about/company",
  "/about/our-history",
  "/about/founders",
  "/about/science",
  "/ourformula",
]);

function pathnameOnly(value) {
  return String(value || "/").split(/[?#]/u, 1)[0] || "/";
}

export function isLocaleRouteSupported(value) {
  const pathname = pathnameOnly(value).replace(/\/$/u, "") || "/";
  return localizedExactPaths.has(pathname) || /^\/product\/[^/]+$/u.test(pathname);
}

export function localePathFor(pathname, search, locale) {
  const base = pathnameOnly(pathname).replace(/^\/(?:ru|ro)(?=\/|$)/u, "") || "/";
  const query = search && String(search).startsWith("?") ? String(search) : "";
  if (!isLocaleRouteSupported(base)) return `${base}${query}`;
  return `${base === "/" ? `/${locale}` : `/${locale}${base}`}${query}`;
}
