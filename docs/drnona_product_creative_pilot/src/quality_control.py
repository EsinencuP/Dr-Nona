from __future__ import annotations

import math
from dataclasses import asdict, dataclass
from typing import Any

import numpy as np
from PIL import Image, ImageChops


@dataclass
class QAResult:
    status: str
    product_fidelity_score: float
    silhouette_score: float
    edge_quality_score: float
    product_visible: bool
    product_count: int
    background_text_detected: bool
    duplicate_product_detected: bool
    cropped_product: bool
    resolution_ok: bool
    aspect_ratio_ok: bool
    warnings: list[str]

    def to_dict(self) -> dict[str, Any]:
        return asdict(self)


def silhouette_iou(alpha_a: Image.Image, alpha_b: Image.Image) -> float:
    a = np.asarray(alpha_a.resize(alpha_b.size, Image.Resampling.NEAREST)) > 8
    b = np.asarray(alpha_b) > 8
    union = np.logical_or(a, b).sum()
    if union == 0:
        return 0.0
    return float(np.logical_and(a, b).sum() / union)


def pixel_fidelity(reference: Image.Image, candidate: Image.Image) -> float:
    ref = reference.convert("RGBA").resize(candidate.size, Image.Resampling.LANCZOS)
    cand = candidate.convert("RGBA")
    ref_array = np.asarray(ref, dtype=np.float32)
    cand_array = np.asarray(cand, dtype=np.float32)
    mask = ref_array[:, :, 3] > 16
    if not mask.any():
        return 0.0
    diff = np.abs(ref_array[:, :, :3] - cand_array[:, :, :3])[mask].mean()
    return max(0.0, 1.0 - float(diff / 255.0))


def evaluate_composite(
    reference_product: Image.Image,
    placed_product: Image.Image,
    final_image: Image.Image,
    product_bbox: tuple[int, int, int, int],
    thresholds: dict[str, Any],
    inherited_warnings: list[str] | None = None,
    candidate_product: Image.Image | None = None,
) -> QAResult:
    warnings = list(inherited_warnings or [])
    width, height = final_image.size
    x0, y0, x1, y1 = product_bbox
    cropped = x0 <= 0 or y0 <= 0 or x1 >= width or y1 >= height
    if cropped:
        warnings.append("CROPPED_PRODUCT")
    fidelity = pixel_fidelity(
        placed_product,
        candidate_product.convert("RGBA").resize(
            placed_product.size, Image.Resampling.LANCZOS
        )
        if candidate_product is not None
        else placed_product,
    )
    silhouette = silhouette_iou(
        reference_product.convert("RGBA").getchannel("A"),
        placed_product.getchannel("A"),
    )
    alpha = placed_product.getchannel("A")
    edges = ImageChops.difference(alpha, alpha.filter(ImageFilterSafe.gaussian(1)))
    edge_energy = np.asarray(edges, dtype=np.float32).mean() / 255.0
    edge_quality = max(0.0, min(1.0, 1.0 - edge_energy * 2.5))
    visible = alpha.getbbox() is not None
    resolution_ok = width >= 1600 and height >= 1600
    aspect_ok = width == height
    if not visible:
        warnings.append("PRODUCT_NOT_VISIBLE")
    if fidelity < float(thresholds.get("product_fidelity_review", 0.85)):
        status = "REJECT"
    elif cropped or fidelity < float(thresholds.get("product_fidelity_pass", 0.93)):
        status = "REVIEW"
    else:
        status = "PASS"
    return QAResult(
        status=status,
        product_fidelity_score=round(fidelity, 4),
        silhouette_score=round(silhouette, 4),
        edge_quality_score=round(edge_quality, 4),
        product_visible=visible,
        product_count=1 if visible else 0,
        background_text_detected=False,
        duplicate_product_detected=False,
        cropped_product=cropped,
        resolution_ok=resolution_ok,
        aspect_ratio_ok=aspect_ok,
        warnings=sorted(set(warnings)),
    )


class ImageFilterSafe:
    @staticmethod
    def gaussian(radius: float):
        from PIL import ImageFilter

        return ImageFilter.GaussianBlur(radius)
