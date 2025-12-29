from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
import json
from typing import Any, Dict, Optional

import pandas as pd


def ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def now_utc_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def write_json(path: Path, payload: Dict[str, Any]) -> None:
    ensure_dir(path.parent)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2, ensure_ascii=True)


def write_dataset(
    df: pd.DataFrame,
    output_dir: Path,
    name: str,
    snapshot_date: str,
    generated_at: str,
    note: Optional[str] = None,
) -> None:
    output_dir.mkdir(parents=True, exist_ok=True)
    clean_df = df.where(pd.notnull(df), None)
    csv_path = output_dir / f"{name}.csv"
    json_path = output_dir / f"{name}.json"

    clean_df.to_csv(csv_path, index=False)

    payload: Dict[str, Any] = {
        "generatedAt": generated_at,
        "snapshotDate": snapshot_date,
        "rows": int(len(clean_df)),
        "data": clean_df.to_dict(orient="records"),
    }
    if note:
        payload["note"] = note

    write_json(json_path, payload)