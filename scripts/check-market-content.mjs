import { readFileSync } from "node:fs";

const marketData = JSON.parse(readFileSync("src/data/market.json", "utf8"));
const errors = [];
const contact = marketData.contact;
const certificates = marketData.moldovaCertificates;
const requiredCertificateFields =
  marketData.certificatePolicy?.requiredFields ?? [];

if (marketData.market !== "Moldova" || contact?.country !== "Молдова") {
  errors.push("The primary contact must target Moldova.");
}

if (!contact?.city?.trim() || !contact?.address?.trim()) {
  errors.push("The Moldova contact requires a city and address.");
}

if (!Array.isArray(contact?.phones) || contact.phones.length === 0) {
  errors.push("The Moldova contact requires at least one local phone.");
} else {
  for (const phone of contact.phones) {
    if (!phone.label?.trim() || !phone.href?.startsWith("tel:+373")) {
      errors.push("Every Moldova phone must have a label and a +373 tel link.");
    }
  }
}

if (!contact?.sourceUrl?.startsWith("https://drnona.com/")) {
  errors.push("The Moldova contact requires an official drnona.com source.");
}

const forbiddenPlaceholder = /(pending|ожидает|подключается|coming soon)/i;
if (forbiddenPlaceholder.test(JSON.stringify(marketData))) {
  errors.push("Market data contains a pending placeholder.");
}

if (marketData.certificatePolicy?.foreignDocumentsVisible !== false) {
  errors.push("Foreign certificates must not be exposed as Moldova evidence.");
}

if (!Array.isArray(certificates)) {
  errors.push("moldovaCertificates must be an array.");
} else {
  for (const [index, certificate] of certificates.entries()) {
    const identity = certificate.id || `certificate-${index + 1}`;
    if (certificate.publicationStatus !== "approved") {
      errors.push(`${identity}: only approved certificates may be published.`);
    }
    if (certificate.country !== "Молдова") {
      errors.push(`${identity}: country must be Moldova.`);
    }
    for (const field of requiredCertificateFields) {
      const value = certificate[field];
      const complete = Array.isArray(value)
        ? value.length > 0 && value.every((item) => String(item).trim())
        : typeof value === "string" && value.trim().length > 0;
      if (!complete) errors.push(`${identity}: missing required field ${field}.`);
    }
  }
}

if (errors.length) {
  console.error(`Moldova market gate: FAIL (${errors.length} errors).`);
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Moldova market gate: PASS (${contact.phones.length} local phones; ${certificates.length} approved Moldova certificates; foreign certificates hidden).`
);
