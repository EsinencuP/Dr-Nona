# Product card naming decision — 2026-10-15

The owner requested and confirmed this presentation for all product cards:

- Keep the existing English product name as the main heading in both locales.
- Replace the supporting description with a Russian translation of the name in RU and the existing Romanian product name in RO. Product and collection brand names retain their original spelling.
- Example: `Solaris Body Lotion` → RU `Лосьон для тела Solaris`; RO `Loțiune de corp Solaris`.

`src/data/product-card-names-ru.json` owns the Russian card subtitles. The runtime generator verifies coverage for published products and preserves the original English name in `cardTitle` before Romanian localization. Full product descriptions and localized product detail titles retain their existing sources. Long card subtitles wrap without truncation.

This is a local presentation change. Production release approval and claim approvals are unchanged.
