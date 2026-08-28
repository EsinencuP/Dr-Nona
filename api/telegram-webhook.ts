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
const DONE_KEYWORDS = [
  "ok",
  "ок",
  "готово",
  "сделано",
  "done",
  "ready",
  "выполнено",
  "отправлено",
];

type TelegramUpdate = {
  update_id: number;
  message?: {
    message_id: number;
    chat: { id: number };
    from?: { id: number; first_name?: string };
    text?: string;
    reply_to_message?: {
      message_id: number;
      from?: { id: number; is_bot?: boolean };
      text?: string;
    };
  };
};

function isDoneCommand(text: string): boolean {
  const normalized = text.trim().toLowerCase();
  return DONE_KEYWORDS.includes(normalized);
}

function readWebhookEnvironment() {
  const botToken = process.env.TELEGRAM_BOT_TOKEN?.trim();
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET?.trim();
  if (!botToken || !webhookSecret) return null;
  return { botToken, webhookSecret };
}

async function telegramWebhookHandler(request: Request): Promise<Response> {
  // Only accept POST
  if (request.method !== "POST") {
    return jsonResponse({ ok: false, code: "METHOD_NOT_ALLOWED" }, 405, {
      Allow: "POST",
    });
  }

  const env = readWebhookEnvironment();
  if (!env) {
    return jsonResponse({ ok: false, code: "SERVICE_UNAVAILABLE" }, 503);
  }

  // Verify the secret token sent by Telegram
  const secretHeader = request.headers.get("x-telegram-bot-api-secret-token");
  if (secretHeader !== env.webhookSecret) {
    return jsonResponse({ ok: false, code: "FORBIDDEN" }, 403);
  }

  // Parse the Telegram update
  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    // Telegram expects 200 even on parse errors to avoid retries
    return jsonResponse({ ok: true }, 200);
  }

  const message = update.message;
  if (!message?.text || !message.reply_to_message) {
    // Not a reply or no text — nothing to do
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
    // Status line not found (maybe already marked done) — ignore
    return jsonResponse({ ok: true }, 200);
  }

  // Edit the original message
  const editResult = await editTelegramMessage(
    message.chat.id,
    message.reply_to_message.message_id,
    updatedText,
    { botToken: env.botToken }
  );

  if (editResult.ok) {
    // Delete the user's reply message to keep the chat clean
    await deleteTelegramMessage(message.chat.id, message.message_id, {
      botToken: env.botToken,
    });
  }

  console.info({
    event: "webhook.status_update",
    chatId: message.chat.id,
    originalMessageId: message.reply_to_message.message_id,
    replyFrom: message.from?.first_name,
    editSuccess: editResult.ok,
  });

  // Always return 200 to Telegram to prevent retries
  return jsonResponse({ ok: true }, 200);
}

export default async function handler(request: Request): Promise<Response> {
  return telegramWebhookHandler(request);
}

export { telegramWebhookHandler };
