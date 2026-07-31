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

const vercelOriginKeys = [
  "VERCEL_URL",
  "VERCEL_BRANCH_URL",
  "VERCEL_PROJECT_PRODUCTION_URL",
] as const;

const normalizeVercelOrigin = (value: string | undefined) => {
  const hostname = value?.trim();
  if (!hostname) return "";
  return normalizeOrigin(
    hostname.includes("://") ? hostname : `https://${hostname}`
  );
};

export function readContactEnvironment(
  environment: NodeJS.ProcessEnv = process.env
): ContactEnvironmentResult {
  const required = ["TELEGRAM_BOT_TOKEN", "TELEGRAM_CHAT_ID"] as const;
  const missing = required.filter((key) => !environment[key]?.trim());
  if (missing.length) return { success: false, missing: [...missing] };

  const allowedOrigins = new Set(
    [
      ...(environment.CONTACT_ALLOWED_ORIGINS ?? "").split(","),
      ...vercelOriginKeys.map((key) =>
        normalizeVercelOrigin(environment[key])
      ),
    ]
      .map((origin) => normalizeOrigin(origin.trim()))
      .filter(Boolean)
  );

  return {
    success: true,
    value: {
      allowedOrigins,
      telegramBotToken: environment.TELEGRAM_BOT_TOKEN!,
      telegramChatId: environment.TELEGRAM_CHAT_ID!,
    },
  };
}
