import { createRequire } from "node:module";
import { validateApplicationInput } from "../shared/applications/application-schema.js";
import { processApplication } from "../server/applications/application-service.js";
import type { ApplicationProduct } from "../server/applications/application-types.js";
import { sendTelegramApplication } from "../server/applications/providers/telegram-provider.js";
import {
  readContactEnvironment,
  type ContactEnvironment,
} from "../server/config/contact-env.js";
import { jsonResponse } from "../server/http/json-response.js";
import {
  readJsonBody,
  requestOriginIsAllowed,
} from "../server/http/request-validation.js";

const require = createRequire(import.meta.url);
type ProductRecord = ApplicationProduct & {
  publicationStatus: string;
  editorialStatus: string;
};
const productsJson = require("../src/data/products.json") as ProductRecord[];

const availableProducts = productsJson.filter(
  (product) =>
    product.publicationStatus === "published" &&
    product.editorialStatus === "ready"
);
const productsBySlug = new Map<string, ApplicationProduct>(
  availableProducts.map((product) => [
    product.slug,
    {
      slug: product.slug,
      officialName: product.officialName,
      sku: product.sku,
    },
  ])
);

export type ApplicationsHandlerDependencies = {
  environment?: () =>
    | { success: true; value: ContactEnvironment }
    | { success: false; missing: string[] };
  process?: typeof processApplication;
  rateLimitGuard?: (request: Request) => Promise<boolean>;
  logger?: (metadata: Record<string, unknown>) => void;
};

export function createApplicationsHandler(
  dependencies: ApplicationsHandlerDependencies = {}
) {
  return async function applicationsHandler(request: Request) {
    if (request.method !== "POST") {
      return jsonResponse(
        { ok: false, code: "METHOD_NOT_ALLOWED" },
        405,
        { Allow: "POST" }
      );
    }
    const environmentResult = (
      dependencies.environment ?? readContactEnvironment
    )();
    if (!environmentResult.success) {
      return jsonResponse(
        { ok: false, code: "SERVICE_UNAVAILABLE" },
        503
      );
    }
    const environment = environmentResult.value;
    if (!requestOriginIsAllowed(request, environment.allowedOrigins)) {
      return jsonResponse({ ok: false, code: "FORBIDDEN" }, 403);
    }
    if (
      dependencies.rateLimitGuard &&
      !(await dependencies.rateLimitGuard(request))
    ) {
      return jsonResponse({ ok: false, code: "RATE_LIMITED" }, 429);
    }
    const body = await readJsonBody(request);
    if (!body.success) {
      return jsonResponse({ ok: false, code: body.code }, body.status);
    }
    const validation = validateApplicationInput(body.value, {
      allowedProductSlugs: new Set(productsBySlug.keys()),
    });
    if (!validation.success) {
      return jsonResponse(
        {
          ok: false,
          code: "VALIDATION_ERROR",
          fieldErrors: validation.fieldErrors,
        },
        400
      );
    }
    const idempotencyKey = request.headers.get("idempotency-key")?.trim();
    if (
      !idempotencyKey ||
      idempotencyKey.length > 128 ||
      !/^[a-zA-Z0-9:_-]+$/u.test(idempotencyKey)
    ) {
      return jsonResponse(
        {
          ok: false,
          code: "VALIDATION_ERROR",
          fieldErrors: {
            idempotencyKey: "Некорректный ключ повторной отправки",
          },
        },
        400
      );
    }
    const serviceResult = await (dependencies.process ?? processApplication)(
      validation.data,
      {
        productsBySlug,
        sendTelegram: (_record, message) =>
          sendTelegramApplication(message, {
            botToken: environment.telegramBotToken,
            chatId: environment.telegramChatId,
          }),
        logger: dependencies.logger ?? ((metadata) => console.info(metadata)),
      }
    );
    const responseBody = {
      ok: serviceResult.outcome !== "failure",
      requestId: serviceResult.requestId,
      ...(serviceResult.outcome === "failure"
          ? { code: "DELIVERY_FAILED" }
          : {}),
      delivery: serviceResult.delivery,
    };
    if (serviceResult.outcome === "success") return jsonResponse(responseBody, 201);
    return jsonResponse(
      { ok: false, code: "DELIVERY_FAILED", requestId: serviceResult.requestId },
      502
    );
  };
}

const handler = createApplicationsHandler();

export default {
  fetch: handler,
};
