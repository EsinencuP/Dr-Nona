import type { Product } from "../../data";
import { marketData } from "../../market";

const officialContactEmail = marketData.internationalSupport.email;

export function resolveSelectionProducts(
  slugs: string[],
  productBySlug: Map<string, Product>
) {
  const seen = new Set<string>();
  return slugs
    .map((slug) => slug.trim())
    .filter((slug) => {
      if (!slug || seen.has(slug)) return false;
      seen.add(slug);
      return true;
    })
    .map((slug) => productBySlug.get(slug))
    .filter((product): product is Product => Boolean(product));
}

type ConsultationLocale = "ru" | "ro";

export function productPublicUrl(
  product: Product,
  locale: ConsultationLocale = "ru"
) {
  const prefix = locale === "ro" ? "/ro" : "";
  return new URL(
    `${prefix}/product/${encodeURIComponent(product.slug)}`,
    window.location.origin
  ).href;
}

export function buildConsultationText(
  productsToSend: Product[],
  locale: ConsultationLocale = "ru"
) {
  const copy = locale === "ro"
    ? {
        greeting: "Bună ziua!",
        withProducts:
          "Doresc o consultație despre produsele Dr. Nona selectate:",
        withoutProducts: "Doresc o consultație despre produsele Dr. Nona.",
        sku: "Cod produs",
        missingSku: "nu este indicat",
        link: "Link",
        reply: "Vă rog să mă contactați pentru detalii.",
      }
    : {
        greeting: "Здравствуйте!",
        withProducts:
          "Хочу получить консультацию по выбранным продуктам Dr. Nona:",
        withoutProducts: "Хочу получить консультацию по продукции Dr. Nona.",
        sku: "Артикул",
        missingSku: "не указан",
        link: "Ссылка",
        reply: "Пожалуйста, свяжитесь со мной для уточнения деталей.",
      };
  const productLines = productsToSend.flatMap((product, index) => [
    `${index + 1}. ${product.officialName}`,
    `${copy.sku}: ${product.sku || copy.missingSku}`,
    `${copy.link}: ${productPublicUrl(product, locale)}`,
    "",
  ]);
  return [
    copy.greeting,
    productsToSend.length ? copy.withProducts : copy.withoutProducts,
    "",
    ...productLines,
    copy.reply,
  ].join("\r\n");
}

export function buildConsultationEmail(
  productsToSend: Product[],
  locale: ConsultationLocale = "ru"
) {
  const subject = locale === "ro"
    ? productsToSend.length
      ? `Consultație pentru selecția Dr. Nona — ${productsToSend.length} produse`
      : "Consultație Dr. Nona Moldova"
    : productsToSend.length
      ? `Консультация по подборке Dr. Nona — ${productsToSend.length} поз.`
      : "Консультация Dr. Nona Moldova";
  const body = buildConsultationText(productsToSend, locale);

  return `mailto:${officialContactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function copyConsultationText(
  productsToSend: Product[],
  locale: ConsultationLocale = "ru"
) {
  const text = buildConsultationText(productsToSend, locale);

  if (navigator.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Continue with the local fallback for browsers that deny Clipboard API access.
    }
  }

  const field = document.createElement("textarea");
  field.value = text;
  field.setAttribute("readonly", "");
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  const copied = document.execCommand("copy");
  field.remove();
  return copied;
}

export function buildConsultationPath(productsToSend: Product[]) {
  const params = new URLSearchParams({
    products: productsToSend.map((product) => product.slug).join(","),
  });
  return `/contactus?${params.toString()}`;
}
