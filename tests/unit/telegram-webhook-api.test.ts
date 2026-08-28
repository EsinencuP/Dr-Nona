import { describe, expect, test, vi } from "vitest";
import {
  createTelegramWebhookHandler,
  isDoneCommand,
  type TelegramUpdate,
} from "../../api/telegram-webhook.js";
import { STATUS_PENDING, STATUS_DONE } from "../../server/applications/format-application.js";

const env = {
  botToken: "test-bot-token",
  webhookSecret: "test-secret-123",
};

const makeRequest = (
  body: TelegramUpdate | Record<string, unknown> = {},
  overrides: { method?: string; secret?: string } = {}
) =>
  new Request("https://example.test/api/telegram-webhook", {
    method: overrides.method ?? "POST",
    headers: {
      "Content-Type": "application/json",
      ...(overrides.secret !== undefined
        ? { "x-telegram-bot-api-secret-token": overrides.secret }
        : { "x-telegram-bot-api-secret-token": "test-secret-123" }),
    },
    ...(overrides.method === "GET" ? {} : { body: JSON.stringify(body) }),
  });

describe("isDoneCommand", () => {
  test.each([
    "ok",
    "OK",
    "ок",
    "ОК",
    "готово",
    "ГОТОВО",
    "сделано",
    "done",
    "ready",
    "выполнено",
    "отправлено",
  ])("recognizes '%s' as done command", (word) => {
    expect(isDoneCommand(word)).toBe(true);
    expect(isDoneCommand(`  ${word}  `)).toBe(true);
  });

  test.each(["hello", "нет", "отмена", "pending", "123", ""])(
    "rejects '%s'",
    (word) => {
      expect(isDoneCommand(word)).toBe(false);
    }
  );
});

describe("POST /api/telegram-webhook", () => {
  test("returns 405 for non-POST method", async () => {
    const handler = createTelegramWebhookHandler({
      getEnvironment: () => env,
    });
    const response = await handler(makeRequest({}, { method: "GET" }));
    expect(response.status).toBe(405);
    expect(response.headers.get("Allow")).toBe("POST");
  });

  test("returns 503 when environment is missing", async () => {
    const handler = createTelegramWebhookHandler({
      getEnvironment: () => null,
    });
    const response = await handler(makeRequest({}));
    expect(response.status).toBe(503);
  });

  test("returns 403 when secret token is wrong", async () => {
    const handler = createTelegramWebhookHandler({
      getEnvironment: () => env,
    });
    const response = await handler(
      makeRequest({}, { secret: "wrong-secret" })
    );
    expect(response.status).toBe(403);
  });

  test("returns 200 when update is not a reply", async () => {
    const editMessage = vi.fn();
    const handler = createTelegramWebhookHandler({
      getEnvironment: () => env,
      editMessage,
    });
    const response = await handler(
      makeRequest({
        update_id: 1,
        message: {
          message_id: 10,
          chat: { id: 123 },
          text: "hello without reply",
        },
      })
    );
    expect(response.status).toBe(200);
    expect(editMessage).not.toHaveBeenCalled();
  });

  test("returns 200 when reply is to a user message, not bot", async () => {
    const editMessage = vi.fn();
    const handler = createTelegramWebhookHandler({
      getEnvironment: () => env,
      editMessage,
    });
    const response = await handler(
      makeRequest({
        update_id: 2,
        message: {
          message_id: 20,
          chat: { id: 123 },
          text: "ok",
          reply_to_message: {
            message_id: 19,
            from: { id: 456, is_bot: false },
            text: `Заявка\n\n${STATUS_PENDING}`,
          },
        },
      })
    );
    expect(response.status).toBe(200);
    expect(editMessage).not.toHaveBeenCalled();
  });

  test("returns 200 when reply text is not a done keyword", async () => {
    const editMessage = vi.fn();
    const handler = createTelegramWebhookHandler({
      getEnvironment: () => env,
      editMessage,
    });
    const response = await handler(
      makeRequest({
        update_id: 3,
        message: {
          message_id: 30,
          chat: { id: 123 },
          text: "вопрос по заявке",
          reply_to_message: {
            message_id: 29,
            from: { id: 999, is_bot: true },
            text: `Заявка\n\n${STATUS_PENDING}`,
          },
        },
      })
    );
    expect(response.status).toBe(200);
    expect(editMessage).not.toHaveBeenCalled();
  });

  test("updates status from pending to done and deletes reply message", async () => {
    const editMessage = vi.fn(async () => ({ ok: true as const }));
    const deleteMessage = vi.fn(async () => ({ ok: true as const }));
    const logger = vi.fn();

    const handler = createTelegramWebhookHandler({
      getEnvironment: () => env,
      editMessage,
      deleteMessage,
      logger,
    });

    const originalText = `🛒 НОВЫЙ ЗАКАЗ\nИмя: Test\n\n${STATUS_PENDING}`;

    const response = await handler(
      makeRequest({
        update_id: 4,
        message: {
          message_id: 40,
          chat: { id: -100123 },
          from: { id: 777, first_name: "Manager" },
          text: "Готово",
          reply_to_message: {
            message_id: 39,
            from: { id: 999, is_bot: true },
            text: originalText,
          },
        },
      })
    );

    expect(response.status).toBe(200);
    expect(editMessage).toHaveBeenCalledTimes(1);
    expect(editMessage).toHaveBeenCalledWith(
      -100123,
      39,
      `🛒 НОВЫЙ ЗАКАЗ\nИмя: Test\n\n${STATUS_DONE}`,
      { botToken: "test-bot-token" }
    );
    expect(deleteMessage).toHaveBeenCalledTimes(1);
    expect(deleteMessage).toHaveBeenCalledWith(-100123, 40, {
      botToken: "test-bot-token",
    });
    expect(logger).toHaveBeenCalledWith(
      expect.objectContaining({
        event: "webhook.status_update",
        chatId: -100123,
        originalMessageId: 39,
        replyFrom: "Manager",
        editSuccess: true,
      })
    );
  });

  test("ignores message if status was already completed", async () => {
    const editMessage = vi.fn();
    const handler = createTelegramWebhookHandler({
      getEnvironment: () => env,
      editMessage,
    });

    const alreadyDoneText = `🛒 НОВЫЙ ЗАКАЗ\nИмя: Test\n\n${STATUS_DONE}`;

    const response = await handler(
      makeRequest({
        update_id: 5,
        message: {
          message_id: 50,
          chat: { id: -100123 },
          text: "ok",
          reply_to_message: {
            message_id: 49,
            from: { id: 999, is_bot: true },
            text: alreadyDoneText,
          },
        },
      })
    );

    expect(response.status).toBe(200);
    expect(editMessage).not.toHaveBeenCalled();
  });
});
