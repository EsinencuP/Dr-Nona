export type ContactEnvironment = {
  allowedOrigins: Set<string>;
  telegramBotToken: string;
  telegramChatId: string;
};

export type ContactEnvironmentResult =
  | { success: true; value: ContactEnvironment }
  | { success: false; missing: string[] };

const normalizeOrigin = (value: string) => {
  try {
    return new URL(value).origin;
  } catch {
    return "";
  }
};

export function readContactEnvironment(
  environment: NodeJS.ProcessEnv = process.env
): ContactEnvironmentResult {
  const required = [
    "CONTACT_ALLOWED_ORIGINS",
    "TELEGRAM_BOT_TOKEN",
    "TELEGRAM_CHAT_ID",
  ] as const;
  const missing = required.filter((key) => !environment[key]?.trim());
  if (missing.length) return { success: false, missing: [...missing] };

  const allowedOrigins = new Set(
    environment
      .CONTACT_ALLOWED_ORIGINS!.split(",")
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter(Boolean)
  );
  if (!allowedOrigins.size) {
    return {
      success: false,
      missing: [
        "CONTACT_ALLOWED_ORIGINS",
      ],
    };
  }

  return {
    success: true,
    value: {
      allowedOrigins,
      telegramBotToken: environment.TELEGRAM_BOT_TOKEN!,
      telegramChatId: environment.TELEGRAM_CHAT_ID!,
    },
  };
}
