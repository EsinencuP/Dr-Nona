from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Validate Catalog Creative Agent outputs.")
    parser.add_argument("project", type=Path)
    options = parser.parse_args()
    project = options.project.resolve()
    return subprocess.call([sys.executable, "-m", "src.cli", "--validate"], cwd=project)


if __name__ == "__main__":
    raise SystemExit(main())
