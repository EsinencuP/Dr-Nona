from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path


def main() -> int:
    parser = argparse.ArgumentParser(description="Run a Catalog Creative Agent project.")
    parser.add_argument("project", type=Path)
    parser.add_argument("args", nargs=argparse.REMAINDER)
    options = parser.parse_args()
    project = options.project.resolve()
    if not (project / "src" / "cli.py").exists():
        parser.error(f"Not a Catalog Creative Agent project: {project}")
    command = [sys.executable, "-m", "src.cli", *options.args]
    return subprocess.call(command, cwd=project)


if __name__ == "__main__":
    raise SystemExit(main())
