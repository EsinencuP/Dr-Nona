import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { relative, resolve } from "node:path";

const root = resolve(".");
const failures = [];
const check = (condition, message) => {
  if (!condition) failures.push(message);
};
const read = (path) => readFileSync(resolve(root, path), "utf8");

const appSource = read("src/App.tsx");
const appLines = appSource.split(/\r?\n/).length;
check(appLines <= 30, `src/App.tsx must stay compositional (found ${appLines} lines).`);
check(
  !/\b(HomePage|CatalogPage|ProductPage|ContactPage)\b/.test(appSource),
  "src/App.tsx must not contain page implementations."
);

const rootStyles = read("src/styles.css");
const rootStyleLines = rootStyles.split(/\r?\n/).filter(Boolean);
check(
  rootStyleLines.every((line) => line.startsWith("@import ")),
  "src/styles.css may only aggregate global CSS modules."
);
check(rootStyleLines.length <= 12, "src/styles.css imports too many global modules.");

const requiredPages = [
  "HomePage",
  "CatalogPage",
  "ProductPage",
  "AboutPage",
  "HistoryPage",
  "CompanyPage",
  "SciencePage",
  "FoundersPage",
  "FormulaPage",
  "EditorialPage",
  "BlogPage",
  "NewsPage",
  "SelectionPage",
  "ContactPage",
  "CertificatesPage",
  "BadRequestPage",
  "DynamicOfficialPage",
];
const routesSource = read("src/app/routes.tsx");
for (const page of requiredPages) {
  check(
    existsSync(resolve(root, `src/pages/${page}.tsx`)),
    `Missing page module: src/pages/${page}.tsx.`
  );
  if (page === "HomePage") {
    check(
      routesSource.includes('import HomePage from "../pages/HomePage"'),
      "HomePage must remain the eager LCP-critical route."
    );
  } else {
    check(
      routesSource.includes(`lazy(() => import("../pages/${page}"))`),
      `${page} must use a real dynamic import in src/app/routes.tsx.`
    );
  }
}
check(
  !routesSource.includes("lazy(async"),
  "Synthetic lazy(async) wrappers are not allowed."
);

for (const modulePath of [
  "src/app/ApplicationErrorBoundary.tsx",
  "src/app/monitoring.ts",
  "src/app/storage.ts",
  "src/features/catalog/filterProducts.ts",
  "src/features/contact/consultation.ts",
  "src/features/selection/SelectionContext.tsx",
  "src/locales/LocaleProvider.tsx",
  "src/locales/ru.ts",
  "shared/applications/application-schema.ts",
  "server/applications/application-service.ts",
  "server/applications/format-application.ts",
  "server/applications/providers/telegram-provider.ts",
  "server/config/contact-env.ts",
  "api/applications.ts",
]) {
  check(existsSync(resolve(root, modulePath)), `Missing boundary module: ${modulePath}.`);
}

const sourceFiles = [];
const visit = (directory) => {
  for (const entry of readdirSync(directory)) {
    const path = resolve(directory, entry);
    if (statSync(path).isDirectory()) visit(path);
    else if (/\.(ts|tsx)$/.test(path)) sourceFiles.push(path);
  }
};
visit(resolve(root, "src"));
for (const file of sourceFiles) {
  const relativePath = relative(root, file).replaceAll("\\", "/");
  if (relativePath === "src/main.tsx") continue;
  const source = readFileSync(file, "utf8");
  check(
    !/from\s+["'][^"']*\/App["']/.test(source),
    `${relative(root, file)} imports implementation details from App.tsx.`
  );
  if (relativePath !== "src/app/storage.ts") {
    check(
      !/\blocalStorage\b/.test(source),
      `${relativePath} must access localStorage through src/app/storage.ts.`
    );
  }
}

if (failures.length) {
  console.error("Frontend architecture validation failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  `Frontend architecture PASS: App ${appLines} lines, 1 eager LCP route, ${requiredPages.length - 1} lazy page modules, feature boundaries verified.`
);
