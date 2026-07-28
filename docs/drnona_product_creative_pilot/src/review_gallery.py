from __future__ import annotations

import html
import json
from pathlib import Path
from typing import Any


def _image_tag(relative: str | None, label: str) -> str:
    if not relative:
        return f'<div class="empty">{html.escape(label)}: not generated</div>'
    escaped = html.escape(relative.replace("\\", "/"))
    return (
        f'<figure><img src="{escaped}" alt="{html.escape(label)}" loading="lazy">'
        f"<figcaption>{html.escape(label)}</figcaption></figure>"
    )


def create_review_html(output_path: Path, items: list[dict[str, Any]], summary: dict[str, Any]) -> None:
    cards = []
    for item in items:
        assets = item.get("assets", {})
        prompt_text = "\n\n".join(
            f"{key.upper()}\n{value.get('prompt', '')}\n\nNEGATIVE\n{value.get('negative_prompt', '')}"
            for key, value in item.get("prompts", {}).get("items", {}).items()
        )
        images = [_image_tag(item.get("source_preview"), "Source")]
        for key in ("clean-catalog", "hero", "ingredients", "lifestyle"):
            images.append(_image_tag(assets.get(key), key))
        warnings = ", ".join(item.get("warnings", [])) or "None"
        cards.append(
            f"""<article class="card" data-product="{html.escape(item['product_slug'])}"
 data-category="{html.escape(item['category'])}" data-preset="{html.escape(item['preset'])}"
 data-status="{html.escape(item['status'])}" data-provider="{html.escape(item['provider'])}">
<header><div><h2>{html.escape(item['product_name'])}</h2>
<p>{html.escape(item['category'])} · {html.escape(item['preset'])} · {html.escape(item['provider'])}</p></div>
<span class="status {item['status'].lower()}">{html.escape(item['status'])}</span></header>
<div class="gallery">{''.join(images)}</div>
<dl>
<dt>QA score</dt><dd>{item.get('qa_score', '')}</dd>
<dt>Fidelity</dt><dd>{item.get('fidelity_score', '')}</dd>
<dt>Warnings</dt><dd>{html.escape(warnings)}</dd>
<dt>Estimated cost</dt><dd>{item.get('estimated_cost', 0)}</dd>
</dl>
<details><summary>Prompts</summary><pre>{html.escape(prompt_text)}</pre></details>
</article>"""
        )
    summary_json = html.escape(json.dumps(summary, ensure_ascii=False))
    document = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>Catalog Creative Review</title>
<style>
:root{{--bg:#f4f1eb;--card:#fff;--ink:#1c1a17;--muted:#746f67;--line:#ddd5ca;}}
*{{box-sizing:border-box}} body{{margin:0;background:var(--bg);color:var(--ink);font:14px/1.45 system-ui,sans-serif}}
main{{max-width:1500px;margin:auto;padding:32px}} h1{{font-size:32px;margin:0 0 6px}} .summary{{color:var(--muted);margin-bottom:24px}}
.filters{{display:flex;gap:10px;flex-wrap:wrap;position:sticky;top:0;background:rgba(244,241,235,.95);padding:12px 0;z-index:2}}
select,input{{padding:10px;border:1px solid var(--line);border-radius:8px;background:#fff}}
.card{{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:18px;margin:18px 0;box-shadow:0 8px 28px #3a2f2112}}
.card header{{display:flex;justify-content:space-between;gap:16px;align-items:start}} h2{{margin:0}} header p{{margin:4px 0 0;color:var(--muted)}}
.status{{font-weight:700;padding:7px 11px;border-radius:999px}} .pass{{background:#dff4e8;color:#17653a}} .review{{background:#fff0c7;color:#815c00}} .reject{{background:#ffdede;color:#8b1e1e}} .planned{{background:#e3e9f8;color:#334d8f}}
.gallery{{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px;margin:16px 0}} figure{{margin:0}} img{{width:100%;aspect-ratio:1;object-fit:contain;background:repeating-conic-gradient(#eee 0 25%,#ccc 0 50%) 50%/24px 24px;border-radius:10px}} figcaption{{margin-top:5px;color:var(--muted)}}
.empty{{aspect-ratio:1;display:grid;place-items:center;border:1px dashed var(--line);border-radius:10px;color:var(--muted);text-align:center;padding:12px}}
dl{{display:grid;grid-template-columns:max-content 1fr;gap:5px 12px}} dt{{font-weight:700}} dd{{margin:0}} pre{{white-space:pre-wrap;background:#171717;color:#eee;padding:14px;border-radius:10px;max-height:360px;overflow:auto}}
</style></head><body><main>
<h1>Catalog Creative Review</h1><div class="summary" data-summary="{summary_json}">
Products: {summary.get('products_found', 0)} · API requests: {summary.get('api_requests', 0)} · Estimated cost: {summary.get('estimated_cost', 0)}
</div>
<div class="filters">
<input id="search" placeholder="Filter product">
<select id="status"><option value="">All statuses</option><option>PASS</option><option>REVIEW</option><option>REJECT</option><option>PLANNED</option></select>
<select id="category"><option value="">All categories</option></select>
<select id="preset"><option value="">All presets</option></select>
<select id="provider"><option value="">All providers</option></select>
</div>
{''.join(cards) if cards else '<p>No products were found. Add PNG files to input/products.</p>'}
</main><script>
const cards=[...document.querySelectorAll('.card')];
for(const key of ['category','preset','provider']){{const s=document.getElementById(key);[...new Set(cards.map(c=>c.dataset[key]))].sort().forEach(v=>{{const o=document.createElement('option');o.value=o.textContent=v;s.appendChild(o)}})}}
function apply(){{const q=document.getElementById('search').value.toLowerCase();for(const c of cards){{c.hidden=!(c.dataset.product.includes(q)&&['status','category','preset','provider'].every(k=>!document.getElementById(k).value||c.dataset[k]===document.getElementById(k).value))}}}}
document.querySelectorAll('input,select').forEach(el=>el.addEventListener('input',apply));
</script></body></html>"""
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(document, encoding="utf-8")
