import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { existsSync, readFileSync } from "node:fs";
import type { IncomingMessage, ServerResponse } from "node:http";
import { resolve, sep } from "node:path";
import { getGlobalHeaders } from "./scripts/security-headers-lib.mjs";
import { handleDevApplicationRequest } from "./server/dev/applications-middleware";

const deploymentConfiguration = JSON.parse(
  readFileSync(resolve(process.cwd(), "vercel.json"), "utf8")
);
const securityHeaders = getGlobalHeaders(deploymentConfiguration, {
  enforceCsp: process.env.SECURITY_CSP_ENFORCE === "1",
});

type MiddlewareServer = {
  middlewares: {
    use: (
      handler: (
        request: IncomingMessage,
        response: ServerResponse,
        next: () => void
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
    if (request.method !== "GET" || !request.url) {
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

function prerenderedRoutePreview() {
  return {
    name: "dr-nona-prerendered-route-preview",
    configureServer(server: MiddlewareServer) {
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
    },
    configurePreviewServer(server: MiddlewareServer) {
      installSecurityHeaders(server);
      installMalformedPathGuard(server);
      installLegacyHomeRedirect(server);
      const distRoot = resolve(process.cwd(), "dist");
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
          if (id.includes("official-pages.json")) return "official-content";
          if (id.includes("products.json")) return "catalog-data";
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
  },
  preview: {
    host: "127.0.0.1",
    port: 4173,
    headers: securityHeaders,
  }
});
