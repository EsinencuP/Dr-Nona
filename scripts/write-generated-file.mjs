import { existsSync, readFileSync, writeFileSync } from "node:fs";

// Preserve file timestamps so repeated generation does not invalidate live
// Vite modules (including React context providers) when content is unchanged.
export function writeGeneratedFile(path, content, encoding = "utf8") {
  if (existsSync(path) && readFileSync(path, encoding) === content) return false;
  writeFileSync(path, content, encoding);
  return true;
}
