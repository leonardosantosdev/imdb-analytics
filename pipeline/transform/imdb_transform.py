import argparse
import logging
from datetime import date
from pathlib import Path

import duckdb

from pipeline.lib.io import ensure_dir, now_utc_iso, write_json
from pipeline.lib.snapshots import latest_snapshot, snapshot_dir, prune_snapshots

ALLOWED_TYPES = ("movie", "tvSeries", "tvMiniSeries", "tvEpisode")


def resolve_snapshot(bronze_dir: Path, snapshot_date: date | None) -> tuple[date, Path]:
    if snapshot_date:
        path = snapshot_dir(bronze_dir, snapshot_date)
        if not path.exists():
            raise FileNotFoundError(f"Bronze snapshot not found: {path}")
        return snapshot_date, path

    latest = latest_snapshot(bronze_dir)
    if not latest:
        raise FileNotFoundError("No bronze snapshots found. Run ingest first.")
    return latest


def validate_non_empty(con: duckdb.DuckDBPyConnection, table: str) -> None:
    count = con.execute(f"SELECT COUNT(*) FROM {table}").fetchone()[0]
    if count == 0:
        raise ValueError(f"Validation failed: {table} is empty")
    logging.info("%s rows: %s", table, count)


def validate_unique(con: duckdb.DuckDBPyConnection, table: str, key: str = "tconst") -> None:
    dupes = con.execute(
        f"SELECT COUNT(*) - COUNT(DISTINCT {key}) FROM {table}"
    ).fetchone()[0]
    if dupes:
        raise ValueError(f"Validation failed: {table} has {dupes} duplicate {key}")


def run(snapshot_date: date | None, keep: int) -> None:
    pipeline_dir = Path(__file__).resolve().parents[1]
    bronze_dir = pipeline_dir / "data" / "bronze"
    silver_dir = pipeline_dir / "data" / "silver"
    ensure_dir(silver_dir)

    resolved_date, bronze_path = resolve_snapshot(bronze_dir, snapshot_date)
    silver_path = snapshot_dir(silver_dir, resolved_date)
    ensure_dir(silver_path)

    basics_path = bronze_path / "title.basics.tsv.gz"
    ratings_path = bronze_path / "title.ratings.tsv.gz"
    episodes_path = bronze_path / "title.episode.tsv.gz"

    for path in (basics_path, ratings_path, episodes_path):
        if not path.exists():
            raise FileNotFoundError(f"Missing bronze file: {path}")

    con = duckdb.connect()

    con.execute(
        "CREATE OR REPLACE TABLE raw_basics AS "
        "SELECT * FROM read_csv(?, delim='\t', header=true, nullstr='\\N', all_varchar=true)",
        [str(basics_path)],
    )
    con.execute(
        "CREATE OR REPLACE TABLE raw_ratings AS "
        "SELECT * FROM read_csv(?, delim='\t', header=true, nullstr='\\N', all_varchar=true)",
        [str(ratings_path)],
    )
    con.execute(
        "CREATE OR REPLACE TABLE raw_episodes AS "
        "SELECT * FROM read_csv(?, delim='\t', header=true, nullstr='\\N', all_varchar=true)",
        [str(episodes_path)],
    )

    con.execute(
        "CREATE OR REPLACE TABLE title_basics AS "
        "SELECT "
        "  tconst, "
        "  titleType, "
        "  primaryTitle, "
        "  originalTitle, "
        "  CAST(isAdult AS INTEGER) AS isAdult, "
        "  try_cast(startYear AS INTEGER) AS startYear, "
        "  try_cast(endYear AS INTEGER) AS endYear, "
        "  try_cast(runtimeMinutes AS INTEGER) AS runtimeMinutes, "
        "  genres "
        "FROM raw_basics "
        "WHERE titleType IN (?, ?, ?, ?) "
        "  AND try_cast(isAdult AS INTEGER) = 0",
        list(ALLOWED_TYPES),
    )

    con.execute(
        "CREATE OR REPLACE TABLE title_ratings AS "
        "SELECT "
        "  tconst, "
        "  try_cast(averageRating AS DOUBLE) AS averageRating, "
        "  try_cast(numVotes AS BIGINT) AS numVotes "
        "FROM raw_ratings "
        "WHERE try_cast(numVotes AS BIGINT) >= 0 "
        "  AND try_cast(averageRating AS DOUBLE) BETWEEN 0 AND 10",
    )

    con.execute(
        "CREATE OR REPLACE TABLE title_episodes AS "
        "SELECT "
        "  e.tconst, "
        "  e.parentTconst, "
        "  try_cast(e.seasonNumber AS INTEGER) AS seasonNumber, "
        "  try_cast(e.episodeNumber AS INTEGER) AS episodeNumber "
        "FROM raw_episodes e "
        "JOIN title_basics b ON e.tconst = b.tconst "
        "WHERE e.parentTconst IS NOT NULL",
    )

    validate_non_empty(con, "title_basics")
    validate_non_empty(con, "title_ratings")
    validate_non_empty(con, "title_episodes")

    validate_unique(con, "title_basics")
    validate_unique(con, "title_ratings")
    validate_unique(con, "title_episodes")

    rating_out_of_range = con.execute(
        "SELECT COUNT(*) FROM title_ratings WHERE averageRating < 0 OR averageRating > 10"
    ).fetchone()[0]
    if rating_out_of_range:
        raise ValueError("Validation failed: ratings out of range")

    votes_negative = con.execute(
        "SELECT COUNT(*) FROM title_ratings WHERE numVotes < 0"
    ).fetchone()[0]
    if votes_negative:
        raise ValueError("Validation failed: negative numVotes found")

    con.execute(
        "COPY title_basics TO ? (FORMAT 'PARQUET')",
        [str(silver_path / "title_basics.parquet")],
    )
    con.execute(
        "COPY title_ratings TO ? (FORMAT 'PARQUET')",
        [str(silver_path / "title_ratings.parquet")],
    )
    con.execute(
        "COPY title_episodes TO ? (FORMAT 'PARQUET')",
        [str(silver_path / "title_episodes.parquet")],
    )

    manifest = {
        "snapshotDate": resolved_date.isoformat(),
        "generatedAt": now_utc_iso(),
        "inputs": {
            "basics": str(basics_path.name),
            "ratings": str(ratings_path.name),
            "episodes": str(episodes_path.name),
        },
        "outputs": {
            "title_basics": "title_basics.parquet",
            "title_ratings": "title_ratings.parquet",
            "title_episodes": "title_episodes.parquet",
        },
    }
    write_json(silver_path / "manifest.json", manifest)

    removed = prune_snapshots(silver_dir, keep=keep)
    if removed:
        logging.info("Pruned %s old snapshot(s)", len(removed))

    logging.info("Silver snapshot ready at %s", silver_path)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Transform IMDb TSV to parquet")
    parser.add_argument(
        "--snapshot-date",
        type=lambda value: date.fromisoformat(value),
        default=None,
        help="Snapshot date in YYYY-MM-DD (default: latest bronze)",
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
