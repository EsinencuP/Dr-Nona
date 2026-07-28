# Scenario Validation Contract

Run:

```powershell
python scripts\validate_scenarios.py
```

The validator uses synthetic PNG fixtures and no paid provider.

| Scenario | Expected result |
|---|---|
| Cosmetic jar | Classify skincare/repairing skincare, select the matching preset, and preserve the product layer. |
| Perfume with box | Keep bottle and real box as one protected composition; use `perfume_luxury`. |
| Tea in box | Classify tea and use `herbal_tea`; do not invent herbs. |
| Powdered food supplement | Classify food supplement and use `clean_scientific` unless metadata says otherwise. |
| No metadata | Infer conservatively, use `neutral_premium`, and set review below 0.70 confidence. |
| Low resolution | Emit `LOW_RESOLUTION_SOURCE`; do not silently upscale. |
| No transparent background | Block creative generation, mark review, and route to `prepare-catalog-product-images`. |
| Catalog of 55 files | Discover all 55 and require explicit batch confirmation. |
| Missing Gemini API key | Return provider-not-ready and fall back to `PLAN_ONLY`. |
| One generation failure | Sanitize/log the failure, continue the remaining catalog, and report partial failure. |
