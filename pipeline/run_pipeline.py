import argparse
import logging
from datetime import date

from pipeline.ingest.imdb_ingest import run as run_ingest
from pipeline.metrics.imdb_metrics import run as run_metrics
from pipeline.transform.imdb_transform import run as run_transform


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run IMDb pipeline end-to-end")
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

    run_ingest(args.snapshot_date, args.keep)
    run_transform(args.snapshot_date, args.keep)
    run_metrics(args.snapshot_date)


if __name__ == "__main__":
    main()
