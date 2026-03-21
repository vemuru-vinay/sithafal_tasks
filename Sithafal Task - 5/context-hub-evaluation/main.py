from __future__ import annotations

import sys
from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from evaluator import print_summary, run_experiment


def main() -> None:
    """Run the Context Hub evaluation experiment from the command line."""
    results = run_experiment(project_root=PROJECT_ROOT)
    print_summary(results)


if __name__ == "__main__":
    main()
