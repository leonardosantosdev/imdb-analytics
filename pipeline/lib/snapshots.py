from __future__ import annotations

from datetime import date
from pathlib import Path
import re
import shutil
from typing import List, Optional, Tuple

SNAPSHOT_RE = re.compile(r"snapshot_date=(\d{4}-\d{2}-\d{2})$")


def parse_snapshot_dir(path: Path) -> Optional[date]:
    match = SNAPSHOT_RE.match(path.name)
    if not match:
        return None
    return date.fromisoformat(match.group(1))


def list_snapshots(base_dir: Path) -> List[Tuple[date, Path]]:
    if not base_dir.exists():
        return []
    snapshots: List[Tuple[date, Path]] = []
    for item in base_dir.iterdir():
        if item.is_dir():
            snapshot_date = parse_snapshot_dir(item)
            if snapshot_date:
                snapshots.append((snapshot_date, item))
    snapshots.sort(key=lambda x: x[0])
    return snapshots


def latest_snapshot(base_dir: Path) -> Optional[Tuple[date, Path]]:
    snapshots = list_snapshots(base_dir)
    return snapshots[-1] if snapshots else None


def previous_snapshot(base_dir: Path, current_date: date) -> Optional[Tuple[date, Path]]:
    snapshots = [item for item in list_snapshots(base_dir) if item[0] < current_date]
    return snapshots[-1] if snapshots else None


def snapshot_dir(base_dir: Path, snapshot_date: date) -> Path:
    return base_dir / f"snapshot_date={snapshot_date.isoformat()}"


def prune_snapshots(base_dir: Path, keep: int) -> List[Path]:
    snapshots = list_snapshots(base_dir)
    if len(snapshots) <= keep:
        return []
    to_remove = snapshots[:-keep]
    removed: List[Path] = []
    for _, path in to_remove:
        if path.exists():
            shutil.rmtree(path, ignore_errors=True)
            removed.append(path)
    return removed
