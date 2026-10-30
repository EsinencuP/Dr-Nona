/** Remove outbound referrals after the publication gate has selected public copy. */
export function withoutExternalReferences(text: string) {
  // Imported statements about another website must not be reassigned to this site.
  if (/\b(?:www\.)?drnona\.(?:com|md)\b/iu.test(text)) return "";

  return text
    .replace(/\([^()]*https?:\/\/[^()]*\)/giu, "")
    .replace(/(?:(?:[СC]сылка|Вход по ссылке|Ждем вас на Зуме)\s*:?\s*)?(?:https?:\/\/|www\.)[^\s<>()]+/giu, "")
    .replace("Sursa disponibilă nu oferă o listă completă și clară a ingredientelor.", "Lista completă a ingredientelor nu este disponibilă.")
    .replace("Sursa indică până la", "Modul de utilizare indicat: până la")
    .replace("Pentru adulți, sursa indică maximum", "Pentru adulți: maximum")
    .replace(/\s+([,.;:])/gu, "$1")
    .replace(/\s{2,}/gu, " ")
    .trim();
}
