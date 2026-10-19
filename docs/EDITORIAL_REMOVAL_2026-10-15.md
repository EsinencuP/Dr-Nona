# Blog and news removal — owner decision, 2026-10-15

The owner explicitly confirmed removal of the entire Blog / News section, including the blog.

Header, mobile navigation, footer and Home no longer link to or display editorial content. The three listing routes and all article routes are retired: legacy RU/RO entries show the localized not-found page with `noindex` metadata. Editorial routes are excluded from the SEO manifest and sitemap. Home's editorial projection is empty, and the public information-page projection excludes all retired routes.

Unused listing pages, article rendering and the article-card component are removed. Existing editorial UI tests now verify removal and controlled legacy URLs rather than testing a removed product surface.

The imported archive remains as internal content evidence. This decision supersedes earlier scope statements that included public blog/news pages. Other routes and the production release block retain their existing status.
