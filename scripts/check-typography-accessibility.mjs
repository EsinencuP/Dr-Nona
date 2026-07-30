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
const token = (name) => {
  const value = base.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i"))?.[1];
  if (!value) throw new Error(`Missing color token --${name}.`);
  return value;
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

const html = readFileSync("index.html", "utf8");
if (/user-scalable\s*=\s*no|maximum-scale\s*=\s*1/i.test(html)) {
  throw new Error("Viewport metadata must not disable browser zoom.");
}

console.log(
  `Typography accessibility: PASS (${styleFiles.length} stylesheets; minimum ${minimumTextPx}px; muted contrast ${contrastResults
    .map(({ surface, ratio }) => `${surface} ${ratio.toFixed(2)}:1`)
    .join(", ")}).`
);
