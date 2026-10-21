# Owner approval of current Russian and Romanian product copy

Date: 2026-10-05. Decision ID: `USER-DIRECT-DECISION-2-2026-10-05`.

The owner directly approved the current Russian and Romanian texts for all 50 catalogue products in the existing project and stated that later customer edits would be supplied as they arrive:

> Я подтверждаю все переводы, если что, дальнейшие правки я буду приносить уже в имеющийся проект. Сейчас я подтверждаю все тексты на русском и на румынском языках, дальнейшие правки введу по мере получения их от заказчика. На момент я утверждаю всё.

This decision covers the current `src/data/products.json` and `src/data/products-ro.json` product texts in the `content/product-descriptions` branch. The Romanian review manifest records approval of the four descriptive fields for every slug, bound to exact source and translation fingerprints. The existing Romanian names, categories and alt text are included in each fingerprint.

The decision accepts explicit Romanian absence notices where no verified source supplied an ingredient list or usage instruction. The corresponding Russian source fields remain `null`; this approval does not provide the missing facts.

Editorial approval is separate from Moldova medical/legal claims review. The claims registry remains pending, and its field-level publication gate still suppresses affected public copy. This decision does not approve a production release, deployment, new assortment, contact/legal wording or media rights.
