# Image Generator

Generate background plates only. Respect provider availability, request budgets,
confirmation gates, retry caps, and dry-run/PLAN_ONLY behavior. Never expose
credentials or treat a catalogue-only provider entry as callable. Prefer the
official Gemini adapter, and never treat a Gemini key as proof that image
generation is free; require the configured billable-use gate.
