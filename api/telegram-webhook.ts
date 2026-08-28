import {
  STATUS_PENDING,
  STATUS_DONE,
  replaceStatus,
} from "../server/applications/format-application.js";
import {
  editTelegramMessage,
  deleteTelegramMessage,
} from "../server/applications/providers/telegram-edit.js";
import { jsonResponse } from "../server/http/json-response.js";

/**
 * Keywords that mark an application as completed.
 * Matched case-insensitively against the full reply text.
 */
const DONE_KEYWORDS = new Set([
  "ok",
  "ок",
  "готово",
  "сделано",
  "done",
  "ready",
  "выполнено",
  "отправлено",
]);

export type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number | string };
    from?: { id: number; first_name?: string };
    text?: string;
    reply_to_message?: {
      message_id: number;
      from?: { id: number; is_bot?: boolean };
      text?: string;
    };
  };
};

export function isDoneCommand(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return DONE_KEYWORDS.has(normalized);
}

function getHeader(request: Request, name: string): string | null {
  try {
    if (typeof request.headers?.get === "function") {
      return request.headers.get(name);
    }
    const headersObj = (request as unknown as { headers?: Record<string, string | string[]> }).headers;
    if (headersObj && typeof headersObj === "object") {
      const val = headersObj[name.toLowerCase()];
      return Array.isArray(val) ? val[0] : val ?? null;
    }
  } catch {
    return null;
  }
  return null;
}

async function getUpdatePayload(request: Request): Promise<TelegramUpdate | null> {
  try {
    if (typeof request.json === "function") {
      return (await request.json()) as TelegramUpdate;
    }
    const reqObj = request as unknown as { body?: unknown };
    if (reqObj.body && typeof reqObj.body === "object") {
      return reqObj.body as TelegramUpdate;
    }
    if (typeof reqObj.body === "string") {
      return JSON.parse(reqObj.body) as TelegramUpdate;
    }
  } catch {
    return null;
  }
  return null;
}

export type WebhookHandlerDependencies = {
  getEnvironment?: () => { botToken: string; webhookSecret: string } | null;
  editMessage?: typeof editTelegramMessage;
  deleteMessage?: typeof deleteTelegramMessage;
  logger?: (metadata: Record<string, unknown>) => void;
};

export function createTelegramWebhookHandler(
  dependencies: WebhookHandlerDependencies = {}
) {
  return async function telegramWebhookHandler(request: Request): Promise<Response> {
    try {
      if (request.method !== "POST") {
        return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, {
          Allow: "POST",
        });
      }

      const env = dependencies.getEnvironment
        ? dependencies.getEnvironment()
        : {
            botToken: process.env.TELEGRAM_BOT_TOKEN?.trim() ?? "",
            webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET?.trim() ?? "",
          };

      if (!env?.botToken || !env?.webhookSecret) {
        return jsonResponse({ ok: false, code: "SERVICE_UNAVAILABLE" }, 503);
      }

      // Verify the secret token sent by Telegram
      const secretHeader = getHeader(request, "x-telegram-bot-api-secret-token");
      if (secretHeader !== env.webhookSecret) {
        return jsonResponse({ ok: false, code: "FORBIDDEN" }, 403);
      }

      const update = await getUpdatePayload(request);
      if (!update || !update.message) {
        return jsonResponse({ ok: true }, 200);
      }

      const message = update.message;
      if (!message.text || !message.reply_to_message) {
        return jsonResponse({ ok: true }, 200);
      }

      // Only react when the reply is to a bot message
      if (!message.reply_to_message.from?.is_bot) {
        return jsonResponse({ ok: true }, 200);
      }

      const originalText = message.reply_to_message.text;
      if (!originalText) {
        return jsonResponse({ ok: true }, 200);
      }

      // Check if the reply text is a "done" command
      if (!isDoneCommand(message.text)) {
        return jsonResponse({ ok: true }, 200);
      }

      // Build the updated message text
      const updatedText = replaceStatus(originalText, STATUS_PENDING, STATUS_DONE);
      if (!updatedText) {
        return jsonResponse({ ok: true }, 200);
      }

      const editFn = dependencies.editMessage ?? editTelegramMessage;
      const deleteFn = dependencies.deleteMessage ?? deleteTelegramMessage;
      const logFn = dependencies.logger ?? console.info;

      const editResult = await editFn(
        message.chat.id,
        message.reply_to_message.message_id,
        updatedText,
        { botToken: env.botToken }
      );

      if (editResult.ok) {
        await deleteFn(message.chat.id, message.message_id, {
          botToken: env.botToken,
        }).catch(() => undefined);
      }

      logFn({
        event: "webhook.status_update",
        chatId: message.chat.id,
        originalMessageId: message.reply_to_message.message_id,
        replyFrom: message.from?.first_name,
        editSuccess: editResult.ok,
      });

      return jsonResponse({ ok: true }, 200);
    } catch (error) {
      console.error("Telegram webhook uncaught error:", error);
      return jsonResponse({ ok: true }, 200);
    }
  };
}

const defaultHandler = createTelegramWebhookHandler();

export default {
  fetch: defaultHandler,
};
