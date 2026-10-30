# Withdrawn phone, branch module and physical locations

Owner decision on 2026-10-15: withdraw the invalid second Moldova phone and remove all public branch/location references and addresses. The remaining contact phone is unchanged.

- `src/data/market.json` now contains one phone and no physical city/address fields; `src/market.ts` reflects that interface. The market validator enforces the withdrawal and absence of physical-location fields.
- The shared footer no longer links to branches, repeats the withdrawn phone or displays the city. Phones render from the contact list rather than two hard-coded array positions.
- `ContactPage` no longer contains the branch/address card or a second phone action. Direct-contact copy and application failure messages no longer refer to a branch, in both RU and RO. The contact layout uses one centered column.
- `/warehouses` is excluded from the runtime official-page projection and SEO manifest and resolves to the localized not-found page. The page inventory now contains 191 routes, 187 indexable. Raw imported source records remain internal provenance and are not bundled into public content.
- Company-history paragraphs no longer mention the first foreign branch in either locale. References to the consultation time zone remain: they describe appointment scheduling, not an address or a physical office.
- Contact metadata describes phone consultation and the form, without an address or branch.

Owning modules: `src/app/AppShell.tsx`, `src/pages/ContactPage.tsx`, `src/features/contact/ApplicationForm.tsx`, market configuration, runtime projection and SEO generator. Persistence, API/CRM transport and appointment scheduling behavior are unchanged. Existing contact integration/e2e expectations and retired-route regression coverage were updated for the owner's decision.
