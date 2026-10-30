export function isRetiredEditorialPath(value) {
  const path = String(value || "/").split(/[?#]/u, 1)[0]
    .replace(/^\/(?:ru|ro)(?=\/|$)/u, "");
  return /^\/(?:editorial|blog|news)(?:\/|$)/u.test(path);
}
