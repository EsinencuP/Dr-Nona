from __future__ import annotations

import csv
import json
from dataclasses import asdict, dataclass, field
from pathlib import Path
from typing import Any

from .utils import IMAGE_SUFFIXES, parse_bool, slugify


@dataclass
class ProductRecord:
    source_path: Path
    sku: str = ""
    product_name: str = ""
    product_slug: str = ""
    category: str = ""
    subcategory: str = ""
    product_line: str = ""
    short_description: str = ""
    ingredients: list[str] = field(default_factory=list)
    benefits: list[str] = field(default_factory=list)
    primary_color: str = ""
    secondary_color: str = ""
    mood: str = ""
    scene_preset: str = ""
    generate_clean: bool = True
    generate_hero: bool = True
    generate_ingredients: bool = False
    generate_lifestyle: bool = False
    reference_image: str = ""
    notes: str = ""

    def to_dict(self) -> dict[str, Any]:
        payload = asdict(self)
        payload["source_path"] = str(self.source_path)
        return payload


def _split_semicolon(value: Any) -> list[str]:
    return [item.strip() for item in str(value or "").split(";") if item.strip()]


def _from_mapping(row: dict[str, Any], products_dir: Path) -> ProductRecord | None:
    filename = str(row.get("source_filename") or "").strip()
    if not filename:
        return None
    source_path = products_dir / filename
    name = str(row.get("product_name") or Path(filename).stem.replace("-", " ")).strip()
    slug = slugify(str(row.get("product_slug") or name))
    return ProductRecord(
        source_path=source_path,
        sku=str(row.get("sku") or "").strip(),
        product_name=name,
        product_slug=slug,
        category=str(row.get("category") or "").strip().lower(),
        subcategory=str(row.get("subcategory") or "").strip(),
        product_line=str(row.get("product_line") or "").strip(),
        short_description=str(row.get("short_description") or "").strip(),
        ingredients=_split_semicolon(row.get("ingredients")),
        benefits=_split_semicolon(row.get("benefits")),
        primary_color=str(row.get("primary_color") or "").strip(),
        secondary_color=str(row.get("secondary_color") or "").strip(),
        mood=str(row.get("mood") or "").strip(),
        scene_preset=str(row.get("scene_preset") or "").strip(),
        generate_clean=parse_bool(row.get("generate_clean"), True),
        generate_hero=parse_bool(row.get("generate_hero"), True),
        generate_ingredients=parse_bool(row.get("generate_ingredients"), False),
        generate_lifestyle=parse_bool(row.get("generate_lifestyle"), False),
        reference_image=str(row.get("reference_image") or "").strip(),
        notes=str(row.get("notes") or "").strip(),
    )


def read_catalog(project_root: Path) -> list[ProductRecord]:
    products_dir = project_root / "input" / "products"
    csv_path = project_root / "input" / "catalog.csv"
    json_path = project_root / "input" / "catalog.json"
    records: list[ProductRecord] = []

    if csv_path.exists() and csv_path.stat().st_size:
        with csv_path.open("r", encoding="utf-8-sig", newline="") as handle:
            for row in csv.DictReader(handle):
                record = _from_mapping(row, products_dir)
                if record and record.source_path.exists():
                    records.append(record)

    if not records and json_path.exists():
        payload = json.loads(json_path.read_text(encoding="utf-8"))
        rows = payload.get("products", payload) if isinstance(payload, dict) else payload
        for row in rows:
            record = _from_mapping(row, products_dir)
            if record and record.source_path.exists():
                records.append(record)

    if not records:
        for index, path in enumerate(
            sorted(p for p in products_dir.iterdir() if p.suffix.lower() in IMAGE_SUFFIXES),
            start=1,
        ):
            slug = slugify(path.stem, f"product-{index:03d}")
            records.append(
                ProductRecord(
                    source_path=path,
                    product_name=path.stem.replace("-", " ").replace("_", " ").title(),
                    product_slug=slug,
                )
            )

    unique: dict[str, ProductRecord] = {}
    for record in records:
        slug = record.product_slug
        counter = 2
        while slug in unique:
            slug = f"{record.product_slug}-{counter}"
            counter += 1
        record.product_slug = slug
        unique[slug] = record
    return list(unique.values())
