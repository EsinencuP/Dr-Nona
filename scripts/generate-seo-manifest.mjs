import { readFileSync, writeFileSync } from "node:fs";

const products = JSON.parse(readFileSync("src/data/products.json", "utf8"));
const romanianProducts = JSON.parse(
  readFileSync("src/data/products-ro.json", "utf8")
);
const companyPages = JSON.parse(
  readFileSync("src/data/company-pages.json", "utf8")
);
const pages = JSON.parse(readFileSync("src/data/official-pages.json", "utf8"));
const claims = JSON.parse(
  readFileSync("src/data/claims-registry.json", "utf8")
);

const SITE_NAME = "Dr. Nona Moldova";
const DEFAULT_IMAGE = "/brand/dr-nona-logo.png";
const importedPageFallbackTitles = {
  "/blog/Mastopathy": "Мастопатия: что нужно знать",
  "/news/happypassover": "С праздником Песах",
  "/news/july-promo": "Июльская акция",
  "/news/ukraine-results-2022": "Итоги 2022 года в Украине",
};

const claimsByField = new Map();
for (const claim of claims) {
  const key = `${claim.scope}\u001f${claim.contentId}\u001f${claim.field}`;
  const records = claimsByField.get(key) ?? [];
  records.push(claim);
  claimsByField.set(key, records);
}

function fieldIsPublishable(scope, contentId, field) {
  const records =
    claimsByField.get(`${scope}\u001f${contentId}\u001f${field}`) ?? [];
  return records.length === 0 || records.every((item) => item.status === "approved");
}

function clean(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

function truncate(value, max = 158) {
  const text = clean(value);
  if (text.length <= max) return text;
  return `${text.slice(0, max - 1).replace(/\s+\S*$/, "")}…`;
}

function pageTitle(page) {
  return (
    clean(page.title) ||
    clean(page.headings.find((heading) => clean(heading))) ||
    importedPageFallbackTitles[page.path] ||
    humanizePath(page.path)
  );
}

function humanizePath(pathname) {
  const segment = pathname.split("/").filter(Boolean).at(-1) || "Главная";
  let decoded;
  try {
    decoded = decodeURIComponent(segment);
  } catch {
    decoded = segment;
  }
  return clean(decoded.replace(/[-_]+/g, " ")) || "Страница";
}

function breadcrumbRoot() {
  return { name: "Главная", path: "/" };
}

function articleBreadcrumbs(page, title) {
  const isNews = page.path.startsWith("/news/");
  return [
    breadcrumbRoot(),
    { name: isNews ? "Новости" : "Блог", path: isNews ? "/news" : "/blog" },
    { name: title, path: page.path },
  ];
}

function genericBreadcrumbs(path, title) {
  const segments = path.split("/").filter(Boolean);
  if (segments.length <= 1) {
    return [breadcrumbRoot(), { name: title, path }];
  }
  const parentPath = `/${segments[0]}`;
  const parentLabels = {
    about: "О компании",
    blog: "Блог",
    news: "Новости",
  };
  return [
    breadcrumbRoot(),
    {
      name: parentLabels[segments[0]] ?? humanizePath(parentPath),
      path: parentPath,
    },
    { name: title, path },
  ];
}

function fixedRoute(
  path,
  pageTitleValue,
  description,
  {
    canonicalPath = path,
    indexable = true,
    kind = "page",
    breadcrumbs = genericBreadcrumbs(path, pageTitleValue),
    image = DEFAULT_IMAGE,
  } = {}
) {
  return {
    path,
    canonicalPath,
    pageTitle: pageTitleValue,
    title:
      path === "/"
        ? `${SITE_NAME} — каталог и история Halo Complex™`
        : `${pageTitleValue} — ${SITE_NAME}`,
    description: truncate(description),
    robots: indexable ? "index,follow" : "noindex,follow",
    indexable,
    ogType: "website",
    image,
    kind,
    breadcrumbs,
    schema: null,
  };
}

const routes = new Map();
const add = (route) => routes.set(route.path, route);

add(
  fixedRoute(
    "/",
    SITE_NAME,
    "Каталог продукции Dr. Nona для Молдовы, история бренда и научная основа Halo Complex™.",
    { kind: "home", breadcrumbs: [{ name: "Главная", path: "/" }] }
  )
);
add(
  fixedRoute(
    "/products",
    "Каталог продукции Dr. Nona",
    "Каталог опубликованных продуктов Dr. Nona для ежедневного ухода и консультационного выбора в Молдове."
  )
);
add(
  fixedRoute(
    "/about",
    "О компании Dr. Nona",
    "История Dr. Nona, основатели компании, научный подход и развитие бренда."
  )
);
add(
  fixedRoute(
    "/about/our-history",
    "История Dr. Nona",
    "Основные этапы развития Dr. Nona и формирования международного бренда."
  )
);
add(
  fixedRoute(
    "/about/company",
    "Компания Dr. Nona",
    "Информация о компании Dr. Nona, её принципах и международном развитии."
  )
);
add(
  fixedRoute(
    "/about/science",
    "Наука и технологии Dr. Nona",
    "Научное направление Dr. Nona и подход к разработке продуктов на основе компонентов Мёртвого моря."
  )
);
add(
  fixedRoute(
    "/about/founders",
    "Основатели Dr. Nona",
    "История основателей Dr. Nona и людей, стоящих за развитием бренда."
  )
);
add(
  fixedRoute(
    "/ourformula",
    "Halo Complex™",
    "Информация о происхождении и научной концепции комплекса Halo Complex™."
  )
);
add(
  fixedRoute(
    "/editorial",
    "Блог и новости Dr. Nona",
    "Материалы, знания, события и новости Dr. Nona в едином редакционном разделе."
  )
);
add(
  fixedRoute(
    "/blog",
    "Блог Dr. Nona",
    "Статьи Dr. Nona о повседневном уходе, образе жизни и новостях бренда."
  )
);
add(
  fixedRoute(
    "/news",
    "Новости Dr. Nona",
    "События, объявления и международные новости Dr. Nona."
  )
);
add(
  fixedRoute(
    "/selection",
    "Моя подборка",
    "Сохранённые пользователем продукты Dr. Nona для последующей консультации.",
    { indexable: false }
  )
);
add(
  fixedRoute(
    "/bad-request",
    "Некорректная ссылка",
    "Контролируемая страница для повреждённых или некорректно закодированных URL.",
    { indexable: false }
  )
);
add(
  fixedRoute(
    "/contactus",
    "Контакты Dr. Nona в Молдове",
    "Адрес и официальные телефонные контакты филиала Dr. Nona в Кишинёве."
  )
);
add(
  fixedRoute(
    "/certificates",
    "Сертификаты для рынка Молдовы",
    "Статус документов и сертификатов Dr. Nona, применимых к рынку Молдовы."
  )
);

for (const product of products.filter(
  (item) =>
    item.publicationStatus === "published" && item.editorialStatus === "ready"
)) {
  const path = `/product/${product.slug}`;
  const approvedDescription =
    product.shortDescription &&
    fieldIsPublishable("product", product.slug, "shortDescription")
      ? product.shortDescription
      : "";
  const description = approvedDescription
    ? `${product.officialName}. ${approvedDescription}`
    : `Информация о продукте ${product.officialName} в каталоге Dr. Nona Moldova.`;
  add({
    path,
    canonicalPath: path,
    pageTitle: product.officialName,
    title: `${product.officialName} — ${SITE_NAME}`,
    description: truncate(description),
    robots: "index,follow",
    indexable: true,
    ogType: "product",
    image: product.image,
    kind: "product",
    breadcrumbs: [
      breadcrumbRoot(),
      { name: "Каталог", path: "/products" },
      { name: product.officialName, path },
    ],
    schema: {
      type: "Product",
      name: product.officialName,
      sku: product.sku,
      image: product.image,
    },
  });
}

for (const page of pages.filter((item) => !item.error)) {
  if (routes.has(page.path)) continue;
  const title = pageTitle(page);
  const isArticle =
    page.path.startsWith("/blog/") || page.path.startsWith("/news/");
  const approvedDescription = fieldIsPublishable(
    "official-page",
    page.path,
    "description"
  )
    ? clean(page.description)
    : "";
  const description = truncate(
    approvedDescription
      ? `${title}. ${approvedDescription}`
      : isArticle
        ? `Материал Dr. Nona: ${title}. Контент для Молдовы проходит редакционную и юридическую проверку.`
        : `Информация Dr. Nona: ${title}.`
  );
  add({
    path: page.path,
    canonicalPath: page.path,
    pageTitle: title,
    title: `${title} — ${SITE_NAME}`,
    description,
    robots: "index,follow",
    indexable: true,
    ogType: isArticle ? "article" : "website",
    image: page.images[0]?.src || DEFAULT_IMAGE,
    kind: isArticle
      ? page.path.startsWith("/news/")
        ? "news"
        : "blog"
      : "page",
    breadcrumbs: isArticle
      ? articleBreadcrumbs(page, title)
      : genericBreadcrumbs(page.path, title),
    schema: isArticle
      ? {
          type: "Article",
          articleType: page.path.startsWith("/news/")
            ? "NewsArticle"
            : "BlogPosting",
          headline: title,
          image: page.images[0]?.src || "",
          sourceUrl: page.sourceUrl,
          dateModified: page.sourceLastmod || "",
        }
      : null,
  });
}

const localizableCompanyPaths = new Set([
  "/about",
  "/about/company",
  "/about/our-history",
  "/about/founders",
  "/about/science",
  "/ourformula",
]);
const localizedStaticCopy = {
  ro: {
    "/": {
      title: "Dr. Nona Moldova",
      description:
        "Catalogul produselor Dr. Nona pentru Moldova, istoria brandului și baza științifică Halo Complex™.",
    },
    "/selection": {
      title: "Selecția mea",
      description:
        "Produsele Dr. Nona selectate pentru a fi transmise unui consultant.",
    },
    "/contactus": {
      title: "Contacte Dr. Nona în Moldova",
      description:
        "Adresa, telefoanele și formularul de contact al filialei Dr. Nona din Chișinău.",
    },
  },
};
const localizableRoutes = [...routes.values()].filter(
  (route) =>
    route.path === "/" ||
    route.path === "/products" ||
    route.path === "/selection" ||
    route.path === "/contactus" ||
    route.kind === "product" ||
    localizableCompanyPaths.has(route.path)
);

for (const baseRoute of localizableRoutes) {
  const isProduct = baseRoute.kind === "product";
  const slug = isProduct ? baseRoute.path.split("/").at(-1) : null;
  const product = slug
    ? products.find((item) => item.slug === slug)
    : null;
  const romanian = slug ? romanianProducts[slug] : null;
  if (slug && (!product || !romanian)) {
    throw new Error(`Missing localized SEO content for product ${slug}.`);
  }
  const unprefixedPath = baseRoute.path;
  const localizedPaths = {
    ru: unprefixedPath === "/" ? "/ru" : `/ru${unprefixedPath}`,
    ro: unprefixedPath === "/" ? "/ro" : `/ro${unprefixedPath}`,
  };
  const alternates = {
    "ru-MD": localizedPaths.ru,
    "ro-MD": localizedPaths.ro,
    "x-default": unprefixedPath,
  };

  baseRoute.alternates = alternates;
  baseRoute.locale = "ru";

  for (const locale of ["ru", "ro"]) {
    const path = localizedPaths[locale];
    const isRomanian = locale === "ro";
    const localizedCompanyPage = companyPages[locale][baseRoute.path];
    const localizedStatic = isRomanian
      ? localizedStaticCopy.ro[baseRoute.path]
      : null;
    const pageTitleValue = isProduct
      ? product.officialName
      : baseRoute.path === "/products" && isRomanian
        ? "Catalogul produselor Dr. Nona"
        : localizedCompanyPage?.title ?? localizedStatic?.title ?? baseRoute.pageTitle;
    const description = localizedCompanyPage?.description ?? localizedStatic?.description ?? (
      isRomanian
        ? isProduct
        ? truncate(`${product.officialName}. ${romanian.shortDescription}`)
        : "Catalogul complet Dr. Nona Moldova, cu descrieri, compoziție și mod de utilizare."
        : baseRoute.description
    );
    const parentAboutPath = `/${locale}/about`;
    const localizedBreadcrumbs = baseRoute.path === "/"
      ? [{ name: pageTitleValue, path }]
      : isProduct
      ? [
          { name: isRomanian ? "Pagina principală" : "Главная", path: `/${locale}` },
          {
            name: isRomanian ? "Catalog" : "Каталог",
            path: localizedPaths[locale].replace(`/product/${slug}`, "/products"),
          },
          { name: product.officialName, path },
        ]
      : baseRoute.path.startsWith("/about/")
        ? [
            { name: isRomanian ? "Pagina principală" : "Главная", path: `/${locale}` },
            {
              name: isRomanian ? "Despre companie" : "О компании",
              path: parentAboutPath,
            },
            { name: pageTitleValue, path },
          ]
        : [
            { name: isRomanian ? "Pagina principală" : "Главная", path: `/${locale}` },
            { name: pageTitleValue, path },
          ];
    add({
      ...baseRoute,
      path,
      canonicalPath: path,
      pageTitle: pageTitleValue,
      title: `${pageTitleValue} (${locale.toUpperCase()}) — ${SITE_NAME}`,
      description: truncate(
        locale === "ru" ? `Русская версия. ${description}` : description
      ),
      locale,
      alternates,
      breadcrumbs: localizedBreadcrumbs,
    });
  }
}

const routeList = [...routes.values()];

function disambiguate(field, valueFactory) {
  const groups = new Map();
  for (const route of routeList.filter((item) => item.indexable)) {
    const value = route[field];
    const group = groups.get(value) ?? [];
    group.push(route);
    groups.set(value, group);
  }
  for (const group of groups.values()) {
    if (group.length < 2) continue;
    for (const route of group) {
      route[field] = valueFactory(route);
    }
  }
}

disambiguate(
  "title",
  (route) =>
    `${route.pageTitle} · ${humanizePath(route.path)} — ${SITE_NAME}`
);
disambiguate(
  "description",
  (route) => truncate(`${humanizePath(route.path)}. ${route.description}`)
);

const unsafePath = routeList.find(
  (route) =>
    !route.path.startsWith("/") ||
    route.path.includes("..") ||
    route.path.includes("\\") ||
    route.path.includes("?") ||
    route.path.includes("#")
);
if (unsafePath) throw new Error(`Unsafe SEO route path: ${unsafePath.path}`);

const indexed = routeList.filter((route) => route.indexable);
for (const [field, label] of [
  ["title", "title"],
  ["description", "description"],
]) {
  const values = new Set();
  for (const route of indexed) {
    if (!clean(route[field])) {
      throw new Error(`SEO ${label} is empty for ${route.path}`);
    }
    if (values.has(route[field])) {
      throw new Error(`SEO ${label} is not unique: ${route[field]}`);
    }
    values.add(route[field]);
  }
}

const manifest = {
  version: 1,
  siteName: SITE_NAME,
  routes: routeList.sort((left, right) => left.path.localeCompare(right.path)),
};

writeFileSync(
  "src/data/seo-manifest.json",
  `${JSON.stringify(manifest, null, 2)}\n`,
  "utf8"
);

console.log(
  `SEO manifest: ${manifest.routes.length} routes (${indexed.length} indexable, ${manifest.routes.length - indexed.length} noindex).`
);
