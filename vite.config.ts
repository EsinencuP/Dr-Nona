import { defineConfig } from "vite";
import type { ViteDevServer } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync, statSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve, sep } from "node:path";
import { getGlobalHeaders } from "./scripts/security-headers-lib.mjs";
import { handleDevApplicationRequest } from "./server/dev/applications-middleware";
import manifest from "./src/data/seo-manifest.json";
import { renderNotFoundHtml } from "./scripts/render-not-found.mjs";
import { resolveSiteOriginFromEnvironment } from "./src/seo-core.mjs";

const knownRoutePaths = new Set(manifest.routes.map((route) => route.path));

const deploymentConfiguration = JSON.parse(
  readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")
);
const securityHeaders = getGlobalHeaders(deploymentConfiguration);
if (process.env.npm_lifecycle_event === "dev") {
  securityHeaders["Content-Security-Policy"] = securityHeaders[
    "Content-Security-Policy"
  ].replace("script-src 'self'", "script-src 'self' 'unsafe-inline'");
}

type MiddlewareServer = {
  middlewares: {
    use: (
      handler: (
        request: IncomingMessage,
        response: ServerResponse,
        next: (error?: unknown) => void
      ) => void
    ) => void;
  };
};

function installSecurityHeaders(server: MiddlewareServer) {
  server.middlewares.use((_request, response, next) => {
    for (const [key, value] of Object.entries(securityHeaders)) {
      response.setHeader(key, value);
    }
    next();
  });
}

function installMalformedPathGuard(server: MiddlewareServer) {
  server.middlewares.use((request, response, next) => {
    if (!["GET", "HEAD"].includes(request.method ?? "") || !request.url) {
      next();
      return;
    }

    const rawPathname = request.url.split("?", 1)[0];
    try {
      decodeURI(rawPathname);
      next();
    } catch {
      console.warn(
        `[drnona-monitoring] malformed URL redirected; pathLength=${rawPathname.length}`
      );
      response.statusCode = 302;
      response.setHeader("Location", "/bad-request");
      response.setHeader("Cache-Control", "no-store");
      response.end();
    }
  });
}

function installLegacyHomeRedirect(server: MiddlewareServer) {
  server.middlewares.use((request, response, next) => {
    if (request.method !== "GET" || !request.url) {
      next();
      return;
    }

    let pathname;
    try {
      pathname = new URL(request.url, "http://127.0.0.1").pathname;
    } catch {
      next();
      return;
    }

    if (pathname !== "/main" && pathname !== "/main/") {
      next();
      return;
    }

    response.statusCode = 308;
    response.setHeader("Location", "/");
    response.setHeader("Cache-Control", "public, max-age=3600");
    response.end();
  });
}

function installNotFoundHandler(
  server: MiddlewareServer,
  render: (pathname: string, locale: "ru" | "ro") => string | Promise<string>,
  assetRoot = resolve(process.cwd(), "public")
) {
  server.middlewares.use((request, response, next) => {
    if (!request.url || !["GET", "HEAD"].includes(request.method ?? "")) {
      next();
      return;
    }
    const pathname = decodeURI(new URL(request.url, "http://127.0.0.1").pathname).replace(/\/+$/, "") || "/";
    // Source modules, APIs and Vite's internal endpoints retain their handlers.
    if (/^\/(?:api|src|shared|node_modules)(?:\/|$)|^\/(?:@|__)/.test(pathname)) {
      next();
      return;
    }
    const basePath = pathname.replace(/^\/(?:ru|ro)(?=\/|$)/, "") || "/";
    const assetPath = resolve(assetRoot, pathname.replace(/^\/+/, ""));
    if (
      knownRoutePaths.has(pathname) || knownRoutePaths.has(basePath) ||
      (assetPath.startsWith(`${assetRoot}${sep}`) && existsSync(assetPath) && statSync(assetPath).isFile())
    ) {
      next();
      return;
    }
    const locale = /^\/ro(?:\/|$)/.test(pathname) ? "ro" : "ru";
    void Promise.resolve().then(() => render(pathname, locale)).then((html) => {
      response.statusCode = 404;
      response.setHeader("Content-Type", "text/html; charset=utf-8");
      response.setHeader("X-Robots-Tag", "noindex, follow");
      response.setHeader("Cache-Control", "no-store");
      response.end(request.method === "HEAD" ? undefined : html);
    }).catch(next);
  });
}

function prerenderedRoutePreview() {
  return {
    name: "dr-nona-prerendered-route-preview",
    configureServer(server: ViteDevServer) {
      if (existsSync(resolve(process.cwd(), ".env.local"))) {
        process.loadEnvFile(resolve(process.cwd(), ".env.local"));
      }
      installSecurityHeaders(server);
      server.middlewares.use((request, response, next) => {
        void handleDevApplicationRequest(request, response).then((handled) => {
          if (!handled) next();
        });
      });
      installMalformedPathGuard(server);
      installLegacyHomeRedirect(server);
      installNotFoundHandler(server, (pathname, locale) => server.transformIndexHtml(
        pathname,
        renderNotFoundHtml(
          readFileSync(resolve(process.cwd(), "index.html"), "utf8"),
          pathname,
          locale,
          resolveSiteOriginFromEnvironment(process.env)
        )
      ));
    },
    configurePreviewServer(server: MiddlewareServer) {
      installSecurityHeaders(server);
      installMalformedPathGuard(server);
      installLegacyHomeRedirect(server);
      const distRoot = resolve(process.cwd(), "dist");
      installNotFoundHandler(server, (pathname, locale) => renderNotFoundHtml(
        readFileSync(resolve(distRoot, "404.html"), "utf8"),
        pathname,
        locale,
        resolveSiteOriginFromEnvironment(process.env)
      ), distRoot);
      server.middlewares.use((request, response, next) => {
        if (request.method !== "GET" || !request.url) {
          next();
          return;
        }

        let pathname;
        try {
          pathname = new URL(request.url, "http://127.0.0.1").pathname;
        } catch {
          next();
          return;
        }
        if (pathname === "/" || pathname.endsWith("/")) {
          next();
          return;
        }

        const routeIndex = resolve(
          distRoot,
          pathname.replace(/^\/+/, ""),
          "index.html"
        );
        if (
          !routeIndex.startsWith(`${distRoot}${sep}`) ||
          !existsSync(routeIndex)
        ) {
          next();
          return;
        }

        response.statusCode = 200;
        response.setHeader("Content-Type", "text/html; charset=utf-8");
        response.setHeader("Cache-Control", "no-cache");
        response.end(readFileSync(routeIndex, "utf8"));
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), prerenderedRoutePreview()],
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("official-pages-public.json")) return "official-content";
          if (/products(?:-ro)?-public\.json$/u.test(id)) return "catalog-data";
          if (id.includes("node_modules/react")) return "react-core";
          if (id.includes("@phosphor-icons")) return "icons";
        }
      }
    }
  },
  server: {
    host: "127.0.0.1",
    port: 4173,
    headers: securityHeaders,
    watch: {
      ignored: ["**/artifacts/**", "**/graphify-out/**", "**/test-results/**", "**/playwright-report/**"],
    },
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    headers: securityHeaders,
  }
});
