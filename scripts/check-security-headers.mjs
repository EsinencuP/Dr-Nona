import { readFile } from "node:fs/promises";
import {
  EXPECTED_EXTERNAL_ORIGINS,
  validateSecurityConfiguration,
} from "./security-headers-lib.mjs";

const configuration = JSON.parse(await readFile("vercel.json", "utf8"));
const errors = validateSecurityConfiguration(configuration);
const indexHtml = await readFile("index.html", "utf8");
const officialPages = JSON.parse(
  await readFile("src/data/official-pages.json", "utf8")
);

const runtimeOrigins = new Set();
for (const match of indexHtml.matchAll(
  /<(?:link|img|script)[^>]+(?:href|src)="(https:\/\/[^"]+)"/g
)) {
  runtimeOrigins.add(new URL(match[1]).origin);
}
for (const record of officialPages) {
  for (const image of record.images ?? []) {
    if (image.src?.startsWith("https://")) {
      runtimeOrigins.add(new URL(image.src).origin);
    }
  }
}

for (const origin of runtimeOrigins) {
  if (!EXPECTED_EXTERNAL_ORIGINS.has(origin)) {
    errors.push(`Runtime content uses an unapproved external origin: ${origin}.`);
  }
}
for (const origin of EXPECTED_EXTERNAL_ORIGINS) {
  if (!runtimeOrigins.has(origin)) {
    errors.push(`Approved CSP origin is not used by runtime content: ${origin}.`);
  }
}

if (errors.length) {
  throw new Error(`Security header gate failed:\n- ${errors.join("\n- ")}`);
}

console.log(
  `Security header gate: PASS (${runtimeOrigins.size} external runtime origins; report-only CSP ready for enforced verification).`
);
