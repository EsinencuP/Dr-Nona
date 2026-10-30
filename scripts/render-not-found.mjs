import { load } from "cheerio";
import { getNotFoundCopy } from "../src/not-found-copy.mjs";
import { getRouteMetadata, renderSeoHead } from "../src/seo-core.mjs";

export function renderNotFoundHtml(template, pathname, locale, siteOrigin) {
  const $ = load(template);
  const copy = getNotFoundCopy(locale);
  const metadata = getRouteMetadata({ routes: [] }, pathname, locale);
  $("title, meta[name='description'], [data-route-seo]").remove();
  $("head").append(renderSeoHead(metadata, siteOrigin));
  // The shared static fallback cannot know the originally requested URL.
  // Keep it non-indexable without declaring a canonical error-page alias.
  $("link[rel='canonical'], link[rel='alternate'][hreflang], script[type='application/ld+json']").remove();
  $("link[rel='preload'][as='image'][href^='/brand/hero/']").remove();
  $("html").attr("lang", locale);
  $("html").removeAttr("data-prerendered-path data-prerendered-locale");
  const homePath = locale === "ro" ? "/ro" : "/ru";
  $("#root").html(`<main id="main-content" tabindex="-1">
    <section class="not-found not-found--missing container" aria-labelledby="not-found-title">
      <div class="not-found__code" aria-hidden="true">404</div>
      <p class="not-found__label"></p>
      <h1 id="not-found-title"></h1>
      <p class="not-found__description"></p>
      <div class="not-found__actions">
        <a class="button button--primary" data-not-found-catalogue></a>
        <a class="button button--quiet" data-not-found-home></a>
      </div>
    </section>
  </main>`);
  $(".not-found__label").text(copy.label);
  $("#not-found-title").text(copy.title);
  $(".not-found__description").text(copy.description);
  $("[data-not-found-catalogue]").attr("href", `${homePath}/products`).text(copy.catalogue);
  $("[data-not-found-home]").attr("href", homePath).text(copy.home);
  return $.html();
}
