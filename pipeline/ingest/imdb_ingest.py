import argparse
import hashlib
import logging
from datetime import date
from pathlib import Path
from typing import Dict, List

import requests

from pipeline.lib.io import ensure_dir, now_utc_iso, write_json
from pipeline.lib.snapshots import prune_snapshots, snapshot_dir

DATASETS = {
    "title.basics.tsv.gz": "https://datasets.imdbws.com/title.basics.tsv.gz",
    "title.ratings.tsv.gz": "https://datasets.imdbws.com/title.ratings.tsv.gz",
    "title.episode.tsv.gz": "https://datasets.imdbws.com/title.episode.tsv.gz",
}


def download_file(url: str, dest: Path) -> Dict[str, str | int]:
    logging.info("Downloading %s", url)
    sha256 = hashlib.sha256()
    with requests.get(url, stream=True, timeout=120) as response:
        response.raise_for_status()
        with dest.open("wb") as handle:
            for chunk in response.iter_content(chunk_size=1024 * 1024):
                if chunk:
                    handle.write(chunk)
                    sha256.update(chunk)
    return {
        "url": url,
        "path": str(dest.name),
        "sizeBytes": dest.stat().st_size,
        "sha256": sha256.hexdigest(),
    }


def run(snapshot_date: date, keep: int) -> None:
    pipeline_dir = Path(__file__).resolve().parents[1]
    bronze_dir = pipeline_dir / "data" / "bronze"
    ensure_dir(bronze_dir)

    snapshot_path = snapshot_dir(bronze_dir, snapshot_date)
    ensure_dir(snapshot_path)

    datasets_meta: List[Dict[str, str | int]] = []
    for filename, url in DATASETS.items():
        dest = snapshot_path / filename
        meta = download_file(url, dest)
        datasets_meta.append(meta)

    manifest = {
        "snapshotDate": snapshot_date.isoformat(),
        "generatedAt": now_utc_iso(),
        "datasets": datasets_meta,
    }
    write_json(snapshot_path / "manifest.json", manifest)

    removed = prune_snapshots(bronze_dir, keep=keep)
    if removed:
        logging.info("Pruned %s old snapshot(s)", len(removed))

    logging.info("Bronze snapshot ready at %s", snapshot_path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Download IMDb TSV snapshots")
    parser.add_argument(
        "--snapshot-date",
        type=lambda value: date.fromisoformat(value),
        default=date.today(),
        help="Snapshot date in YYYY-MM-DD (default: today)",
    )
    parser.add_argument(
        "--keep",
        type=int,
        default=8,
        help="Number of snapshots to retain (default: 8)",
    )
    return parser.parse_args()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    args = parse_args()
    run(args.snapshot_date, args.keep)


if __name__ == "__main__":
    main()