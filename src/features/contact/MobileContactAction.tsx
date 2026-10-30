import { ChatCircleDots } from "@phosphor-icons/react/ChatCircleDots";
import publishedSlugs from "../../data/published-product-slugs.json";
import { isLocaleRouteSupported } from "../../locale-routing.mjs";
import { useLocale } from "../../locales/LocaleProvider";
import { Link, safeDecodeRouteSegment, useLocation } from "../../router";

export function MobileContactAction() {
  const { pathname } = useLocation();
  const { locale } = useLocale();
  const productMatch = pathname.match(/^\/product\/([^/]+)$/);
  const slug = productMatch ? safeDecodeRouteSegment(productMatch[1]) : null;
  if (
    !isLocaleRouteSupported(pathname) ||
    pathname === "/contactus" || pathname === "/selection" || pathname === "/privacypolicy" || pathname === "/reviews" ||
    (productMatch && (!slug || !publishedSlugs.includes(slug)))
  ) return null;

  const destination = slug
    ? `/contactus?${new URLSearchParams({ products: slug })}`
    : "/contactus";
  const label = locale === "ro"
    ? "Plasează comanda"
    : "Оформить заказ";

  return (
    <div className="mobile-contact-action">
      <div className="mobile-contact-action__bar">
        <Link className="button button--primary" to={destination}>
          <ChatCircleDots aria-hidden="true" />
          {label}
        </Link>
      </div>
    </div>
  );
}
