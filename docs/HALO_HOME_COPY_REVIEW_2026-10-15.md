# Halo Complex copy — homepage and formula page review candidates

Status: **PENDING APPROVAL**. Evidence: **NOT VERIFIED**.

Requested on 2026-10-15 through the homepage browser annotation. The user's instruction approves the proposed editorial change; it does not supply evidence or a qualified review decision for the scientific assertions.

## Exact proposed Russian text

> Halo Complex — это уникальный запатентованный научный комплекс, лежащий в основе всей продукции Dr. Nona. Он был разработан израильскими учёными на стыке биотехнологий и природных ресурсов Мёртвого моря и не имеет аналогов в мире.

## Evidence needed

- Patent number and document identifying the protected invention and its relationship to Halo Complex.
- Documentation supporting use across the entire Dr. Nona assortment and the stated development history.
- Evidence supporting the exact worldwide exclusivity statement «не имеет аналогов в мире».
- A named qualified reviewer, review date and evidence reference for the final wording, as required by [CLAIMS_REVIEW.md](CLAIMS_REVIEW.md).

Existing mentions of patents in the claims registry are pending; they are not approval for this paragraph. No approval status was changed.

## Hero annotation: patent-focused visual draft

The owner subsequently requested replacing the hero's nature tagline with a patent statement and a stronger technology introduction. This editorial request is recorded; patent scope and scientific-claim approval remain pending.

Draft RU tagline: **Запатентованная формула**

Draft RU lead: **Уникальная разработка Dr. Nona на основе минералов Мёртвого моря. Наука и природа в формулах нового поколения для ежедневного ухода.**

Draft RO tagline: **Formulă brevetată**

Draft RO lead: **O tehnologie unică Dr. Nona, bazată pe mineralele Mării Moarte. Știință și natură în formule de nouă generație pentru îngrijirea zilnică.**

These strings are visual review candidates only. They are not imported by `HomePage.tsx`, runtime generation, SEO, or any public route. Private draft screenshots use an isolated browser DOM override, which is discarded on reload. They do not change the local site or bypass the publication gate. No claim is marked approved.

### Evidence check on 2026-10-15

- The Moldova [Phase 9 page](https://www.drnona.md/phase_9) describes Halo Complex as a company patent, but supplies no patent identifier or scope document in the retrieved text.
- A real granted patent document was located: [US 11,058,731 B2, dated 2021-07-13](https://patentimages.storage.googleapis.com/13/a1/80/844f0441f2a24c/US11058731.pdf). The applicant is Dr. Nona International Ltd.; the document concerns a topical Halobacteria/Dunaliella composition. It does not identify the branded Halo Complex by that name in the retrieved document. A company patent alone does not establish that the specific branded formula in the hero is protected by that patent.
- No evidence was found establishing the proposed worldwide uniqueness or an industry-wide “beauty revolution.” Those stronger assertions are not used in the visual candidate.
- Requested from the owner: the patent number or a document link tying the protected invention to Halo Complex. A qualified review record is still required under [CLAIMS_REVIEW.md](CLAIMS_REVIEW.md) before publishing a patent/scientific statement.

The original neutral hero copy remains in the application until the evidence and review requirements are satisfied.

## Expanded formula-page candidate

Requested through the subsequent `/ourformula` annotation on 2026-10-15. Status: **PENDING APPROVAL**, evidence **NOT VERIFIED**. The intended replacement is the three numbered story chapters beneath the hero, not the hero itself.

> Halo Complex — это уникальный запатентованный научный комплекс, лежащий в основе всей продукции Dr. Nona. Он был разработан израильскими учёными на стыке биотехнологий и природных ресурсов Мёртвого моря и не имеет аналогов в мире.
>
> Ключевым компонентом Halo Complex является архибактерия, способная выживать в экстремальных условиях, а также водоросль Dunaliella, богатая природным β-каротином — мощным антиоксидантом. В сочетании с минералами Мёртвого моря комплекс активирует естественные процессы защиты и восстановления клеток.
>
> Halo Complex работает на клеточном уровне, усиливая действие всех активных ингредиентов, поддерживая регенерацию, защитный барьер кожи и общее состояние организма. Именно благодаря этому комплексу продукция Dr. Nona обладает выраженным терапевтическим и профилактическим эффектом.
>
> Halo Complex — это не просто ингредиент, а научная основа философии Dr. Nona, объединяющая природу, науку и здоровье в каждой формуле.

In addition to the patent and exclusivity evidence above, review must cover the exact ingredient, antioxidant, cellular-action, regeneration, therapeutic and preventive statements, their applicability to the assortment and their admissibility for the Moldova market. Do not infer an approval from this editorial request or from the catalogue navigation change.

## Implemented formula-page navigation change

The separate product module containing only the first four catalogue products was replaced with a link to the entire catalogue. RU: «Перейти в каталог». RO: «Vezi catalogul complet». The link uses the existing localized `/products` route. No assertion about every product's formulation was added, and no assortment, storage, API or CRM behavior changed.

## Implementation boundary

The homepage candidate location is `/`, `src/pages/HomePage.tsx`, Russian `scienceFallback`, inside `section#halo-science`. The expanded candidate belongs to `src/pages/FormulaPage.tsx`, `.formula-story__content`. This document stores both candidates only; current visible scientific copy remains in place. Romanian wording has not been supplied or approved for these candidates.

Once evidence and the review decision are available, add the exact approved wording through the claims publication workflow before displaying it. Relevant verification then includes claims validation, homepage claims-publication tests and responsive UI checks.

## Rule applied

[AGENTS.md](../AGENTS.md): “Do not publish draft products or pending/rejected claims.” [CLAIMS_REVIEW.md](CLAIMS_REVIEW.md) requires sentence-level review of scientific statements and a named qualified reviewer, date and document reference for approved records.
