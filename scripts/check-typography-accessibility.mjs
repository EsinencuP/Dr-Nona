import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const minimumTextPx = 14;
const rootFontPx = 16;
const stylesDirectory = "src/styles";
const styleFiles = readdirSync(stylesDirectory)
  .filter((file) => file.endsWith(".css"))
  .map((file) => join(stylesDirectory, file));
const undersized = [];

for (const path of styleFiles) {
  const source = readFileSync(path, "utf8");
  for (const match of source.matchAll(
    /font-size\s*:\s*(\d*\.?\d+)(rem|px)\s*;/g
  )) {
    const value = Number(match[1]);
    const pixels = match[2] === "rem" ? value * rootFontPx : value;
    if (pixels + Number.EPSILON < minimumTextPx) {
      const line = source.slice(0, match.index).split(/\r?\n/).length;
      undersized.push(
        `${path}:${line} uses ${match[1]}${match[2]} (${pixels.toFixed(2)}px)`
      );
    }
  }
}

if (undersized.length) {
  throw new Error(
    `Visible typography must not be smaller than ${minimumTextPx}px:\n${undersized.join(
      "\n"
    )}`
  );
}

const base = readFileSync("src/styles/base.css", "utf8");
const token = (name, visited = new Set()) => {
  if (visited.has(name)) throw new Error(`Circular color alias --${name}.`);
  visited.add(name);
  const value = base.match(new RegExp(`--${name}:\\s*([^;]+);`, "i"))?.[1].trim();
  if (!value) throw new Error(`Missing color token --${name}.`);
  if (/^#[0-9a-f]{6}$/i.test(value)) return value;
  const alias = value.match(/^var\(--([a-z0-9-]+)\)$/i)?.[1];
  if (alias) return token(alias, visited);
  throw new Error(`Unresolvable color token --${name}: ${value}.`);
};
const luminance = (hex) => {
  const channels = hex
    .slice(1)
    .match(/.{2}/g)
    .map((value) => Number.parseInt(value, 16) / 255)
    .map((value) =>
      value <= 0.04045
        ? value / 12.92
        : ((value + 0.055) / 1.055) ** 2.4
    );
  return (
    0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2]
  );
};
const contrast = (foreground, background) => {
  const foregroundLuminance = luminance(foreground);
  const backgroundLuminance = luminance(background);
  return (
    (Math.max(foregroundLuminance, backgroundLuminance) + 0.05) /
    (Math.min(foregroundLuminance, backgroundLuminance) + 0.05)
  );
};

const muted = token("muted");
const lightSurfaces = ["paper", "white", "mist", "sea-050"];
const contrastResults = lightSurfaces.map((surface) => ({
  surface,
  ratio: contrast(muted, token(surface)),
}));
const contrastFailures = contrastResults.filter(({ ratio }) => ratio < 4.5);

if (contrastFailures.length) {
  throw new Error(
    `--muted fails WCAG AA contrast:\n${contrastFailures
      .map(({ surface, ratio }) => `${surface}: ${ratio.toFixed(2)}:1`)
      .join("\n")}`
  );
}

const focusInner = token("focus-inner");
const focusOuter = token("focus-outer");
const focusChecks = [
  ...lightSurfaces.map((surface) => ({
    pair: `focus-inner/${surface}`,
    ratio: contrast(focusInner, token(surface)),
  })),
  ...["ink", "lord-950", "lord-900", "lord-800"].map((surface) => ({
    pair: `focus-outer/${surface}`,
    ratio: contrast(focusOuter, token(surface)),
  })),
];
const focusFailures = focusChecks.filter(({ ratio }) => ratio < 3);
if (focusFailures.length) {
  throw new Error(
    `Focus indicator fails 3:1 adjacent contrast:\n${focusFailures
      .map(({ pair, ratio }) => `${pair}: ${ratio.toFixed(2)}:1`)
      .join("\n")}`
  );
}

// Validate roles used by controls and dark surfaces, not only the light body copy.
const semanticPairs = [
  ["text-primary", "bg", 4.5],
  ["text-secondary", "surface", 4.5],
  ["text-secondary", "surface-raised", 4.5],
  ["action-text", "action", 4.5],
  ["action-text", "action-hover", 4.5],
  ["border-strong", "surface-raised", 3],
  ["border-strong", "surface", 3],
  ["focus", "bg", 3],
  ["premium-accent", "bg", 4.5],
  ["success", "success-surface", 4.5],
  ["error", "error-surface", 4.5],
  ["lord-muted", "lord-950", 4.5],
  ["lord-muted", "lord-900", 4.5],
  ["lord-gold", "lord-950", 4.5],
].map(([foreground, background, minimum]) => ({
  pair: `${foreground}/${background}`,
  ratio: contrast(token(foreground), token(background)),
  minimum,
}));
token("border"); // Decorative dividers are not the boundary of an input/control.
const semanticFailures = semanticPairs.filter(({ ratio, minimum }) => ratio < minimum);
if (semanticFailures.length) {
  throw new Error(`Semantic contrast failures:\n${semanticFailures
    .map(({ pair, ratio, minimum }) => `${pair}: ${ratio.toFixed(2)}:1; needs ${minimum}:1`)
    .join("\n")}`);
}
console.log(`Semantic color roles: PASS (${semanticPairs.length} contrast pairs).`);

const html = readFileSync("index.html", "utf8");
if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(html)) {
  throw new Error("Viewport metadata must not disable browser zoom.");
}

console.log(
  `Typography accessibility: PASS (${styleFiles.length} stylesheets; minimum ${minimumTextPx}px; muted contrast ${contrastResults
    .map(({ surface, ratio }) => `${surface} ${ratio.toFixed(2)}:1`)
    .join(", ")}; focus indicator ${Math.min(...focusChecks.map(({ ratio }) => ratio)).toFixed(2)}:1 minimum).`
);
