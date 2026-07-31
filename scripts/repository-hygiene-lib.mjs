const generatedDirectoryPattern = /^(dist|coverage|playwright-report|test-results|artifacts)\//;
const archivePattern = /\.(?:7z|gz|tar|tgz|zip)$/i;
const rootMediaPattern = /^[^/]+\.(?:avif|gif|jpe?g|png|webp)$/i;
const obsoleteEvidencePattern = /^docs\/(?:[^/]*qa[^/]*\/\d{4}-\d{2}-\d{2}|audit\/\d{4}-\d{2}-\d{2}|archive\/[^/]*qa)(?:\/|$)/i;
const nestedProjectPattern = /^docs\/[^/]+\/(?:AGENTS\.md|package\.json|pyproject\.toml|requirements\.txt|\.env\.example)$/i;
const generatedReportPattern = /^docs\/(?:BUILD_REPORT|PRODUCT_CONTENT_REPORT|SEO_REPORT|PERFORMANCE_REPORT|RUNTIME_PERFORMANCE_REPORT)\.md$/;
const unsafeNamePattern = /(^|\/)(?:copy|backup|old|final-final|tmp)(?:[._ -]|$)/i;

export function findForbiddenTrackedPaths(paths) {
  return paths.filter((rawPath) => {
    const path = rawPath.replaceAll("\\", "/");
    return (
      generatedDirectoryPattern.test(path) ||
      (/((^|\/)\.env(?:\.|$))/.test(path) && !path.endsWith("/.env.example") && path !== ".env.example") ||
      /(^|\/)[^/]+\.log$/i.test(path) ||
      rootMediaPattern.test(path) ||
      /^public\/generated\/qa-/i.test(path) ||
      archivePattern.test(path) ||
      /(^|\/)node_modules\//.test(path) ||
      /(^|\/)\.git\//.test(path) ||
      obsoleteEvidencePattern.test(path) ||
      nestedProjectPattern.test(path) ||
      generatedReportPattern.test(path) ||
      unsafeNamePattern.test(path)
    );
  });
}
