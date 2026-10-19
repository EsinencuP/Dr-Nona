import { mkdtempSync, readFileSync, rmdirSync, statSync, unlinkSync, utimesSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "vitest";
import { writeGeneratedFile } from "../../scripts/write-generated-file.mjs";

test("repeated generation preserves unchanged file timestamps used by live watchers", () => {
  const directory = mkdtempSync(join(tmpdir(), "drnona-generated-"));
  const path = join(directory, "projection.json");
  try {
    writeGeneratedFile(path, '{"products":50}\n');
    utimesSync(path, new Date(0), new Date(0));
    const previousTimestamp = statSync(path).mtimeMs;
    writeGeneratedFile(path, '{"products":50}\n');
    expect(statSync(path).mtimeMs).toBe(previousTimestamp);
    writeGeneratedFile(path, '{"products":49}\n');
    expect(readFileSync(path, "utf8")).toBe('{"products":49}\n');
    expect(statSync(path).mtimeMs).toBeGreaterThan(previousTimestamp);
  } finally {
    unlinkSync(path);
    rmdirSync(directory);
  }
});
