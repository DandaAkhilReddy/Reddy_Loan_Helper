from __future__ import annotations

import json
from functools import lru_cache
from pathlib import Path
from typing import Any


_DATA_PATH = Path(__file__).parent.parent.parent / "data" / "credit_report.json"


@lru_cache(maxsize=1)
def load_report() -> dict[str, Any]:
    """Load and cache the credit report JSON from disk."""
    if not _DATA_PATH.exists():
        raise FileNotFoundError(f"Credit report not found at {_DATA_PATH}")
    with _DATA_PATH.open("r", encoding="utf-8") as fh:
        return json.load(fh)
