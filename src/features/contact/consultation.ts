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

export function productPublicUrl(product: Product) {
  return new URL(`/product/${encodeURIComponent(product.slug)}`, window.location.origin).href;
}

export function buildConsultationText(productsToSend: Product[]) {
  const productLines = productsToSend.flatMap((product, index) => [
    `${index + 1}. ${product.officialName}`,
    `Артикул: ${product.sku || "не указан"}`,
    `Ссылка: ${productPublicUrl(product)}`,
    "",
  ]);
  return [
    "Здравствуйте!",
    productsToSend.length
      ? "Хочу получить консультацию по выбранным продуктам Dr. Nona:"
      : "Хочу получить консультацию по продукции Dr. Nona.",
    "",
    ...productLines,
    "Пожалуйста, ответьте на это письмо.",
  ].join("\r\n");
}

export function buildConsultationEmail(productsToSend: Product[]) {
  const subject = productsToSend.length
    ? `Консультация по подборке Dr. Nona — ${productsToSend.length} поз.`
    : "Консультация Dr. Nona Moldova";
  const body = buildConsultationText(productsToSend);

  return `mailto:${officialContactEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

export async function copyConsultationText(productsToSend: Product[]) {
  const text = buildConsultationText(productsToSend);

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
