from __future__ import annotations

import csv
import json
import re
import zipfile
from pathlib import Path
from typing import Any

from PIL import Image

from .utils import SECRET_PATTERNS, sha256_file


def create_output_zip(project_root: Path, zip_path: Path) -> None:
    output = project_root / "output"
    include_files: list[Path] = []
    for folder in (output / "approved", output / "review"):
        if folder.exists():
            include_files.extend(p for p in folder.rglob("*") if p.is_file())
    for path in (
        project_root / "manifest.csv",
        project_root / "report.json",
        output / "review.html",
        project_root / "README.md",
    ):
        if path.exists():
            include_files.append(path)
    for path in (output / "products").glob("*/plans/prompts.json"):
        include_files.append(path)
    include_files = sorted(set(include_files))
    with zipfile.ZipFile(zip_path, "w", compression=zipfile.ZIP_DEFLATED, compresslevel=6) as archive:
        for path in include_files:
            archive.write(path, path.relative_to(project_root).as_posix())


def validate_outputs(project_root: Path, zip_path: Path | None = None) -> dict[str, Any]:
    errors: list[str] = []
    manifest_path = project_root / "manifest.csv"
    report_path = project_root / "report.json"
    review_path = project_root / "output" / "review.html"
    for path in (manifest_path, report_path, review_path):
        if not path.exists():
            errors.append(f"Missing required file: {path.relative_to(project_root)}")
    rows: list[dict[str, str]] = []
    if manifest_path.exists():
        with manifest_path.open("r", encoding="utf-8-sig", newline="") as handle:
            rows = list(csv.DictReader(handle))
        for row in rows:
            filename = row.get("output_filename", "")
            if not filename:
                continue
            path = project_root / filename
            if not path.exists():
                errors.append(f"Manifest output missing: {filename}")
                continue
            try:
                with Image.open(path) as image:
                    image.verify()
                with Image.open(path) as image:
                    if path.suffix.lower() == ".png" and image.mode != "RGBA":
                        errors.append(f"PNG is not RGBA: {filename}")
                    if image.width <= 0 or image.height <= 0:
                        errors.append(f"Invalid image dimensions: {filename}")
            except Exception as exc:
                errors.append(f"Invalid image {filename}: {exc}")
    if zip_path and zip_path.exists():
        if zip_path.stat().st_size == 0:
            errors.append("ZIP is empty.")
        with zipfile.ZipFile(zip_path) as archive:
            bad = archive.testzip()
            if bad:
                errors.append(f"Corrupt ZIP member: {bad}")
            names = archive.namelist()
            if any(name.lower().endswith(".env") for name in names):
                errors.append(".env is present in ZIP.")
            for name in names:
                if name.endswith("/"):
                    continue
                data = archive.read(name)
                if any(pattern.search(data.decode("utf-8", errors="ignore")) for pattern in SECRET_PATTERNS):
                    errors.append(f"Possible secret detected in ZIP member: {name}")
    elif zip_path:
        errors.append("ZIP does not exist.")
    return {
        "valid": not errors,
        "errors": errors,
        "manifest_rows": len(rows),
        "zip_sha256": sha256_file(zip_path) if zip_path and zip_path.exists() else "",
    }
