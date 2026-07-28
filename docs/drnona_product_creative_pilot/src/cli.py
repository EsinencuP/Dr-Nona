from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .exporter import validate_outputs
from .pipeline import CatalogCreativePipeline, PipelineOptions
from .utils import configure_logging


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Fidelity-safe ecommerce product creative automation."
    )
    modes = parser.add_mutually_exclusive_group()
    modes.add_argument("--plan-only", action="store_true")
    modes.add_argument("--pilot", action="store_true")
    modes.add_argument("--batch", action="store_true")
    parser.add_argument("--confirm-batch", action="store_true")
    parser.add_argument("--max-products", type=int)
    parser.add_argument("--max-api-requests", type=int)
    parser.add_argument("--skip-existing", action="store_true")
    parser.add_argument("--regenerate", action="store_true")
    parser.add_argument("--product")
    parser.add_argument(
        "--asset-type",
        choices=["clean-catalog", "hero", "ingredients", "lifestyle"],
    )
    parser.add_argument(
        "--provider", default="gemini", choices=["gemini", "openai", "mock"]
    )
    parser.add_argument(
        "--allow-billable",
        action="store_true",
        help=(
            "Allow a provider request that may be billed. A key alone is not "
            "treated as billing approval."
        ),
    )
    parser.add_argument("--quality", default="high", choices=["low", "medium", "high", "auto"])
    parser.add_argument(
        "--generation-mode",
        choices=["SAFE_COMPOSITE", "GENERATIVE_EDIT"],
        help="Experimental GENERATIVE_EDIT requires explicit selection and QA.",
    )
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--validate", action="store_true")
    parser.add_argument("--verbose", action="store_true")
    return parser


def main(argv: list[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    root = Path(__file__).resolve().parent.parent
    logger = configure_logging(args.verbose)
    if args.validate:
        result = validate_outputs(root, root / "catalog-creative-output.zip")
        print(json.dumps(result, ensure_ascii=False, indent=2))
        return 0 if result["valid"] else 1
    default_plan_only = not args.pilot and not args.batch
    options = PipelineOptions(
        plan_only=args.plan_only or default_plan_only,
        pilot=args.pilot,
        batch=args.batch,
        confirm_batch=args.confirm_batch,
        max_products=args.max_products,
        max_api_requests=args.max_api_requests,
        skip_existing=args.skip_existing,
        regenerate=args.regenerate,
        product=args.product,
        asset_type=args.asset_type,
        provider=args.provider,
        quality=args.quality,
        dry_run=args.dry_run,
        generation_mode=args.generation_mode,
        allow_billable=True if args.allow_billable else None,
    )
    try:
        report = CatalogCreativePipeline(root, options, logger).run()
    except Exception as exc:
        logger.error(str(exc))
        return 2
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    sys.exit(main())
