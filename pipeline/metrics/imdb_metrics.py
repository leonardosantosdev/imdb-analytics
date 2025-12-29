import argparse
import logging
from datetime import date
from pathlib import Path

import duckdb
import pandas as pd

from pipeline.lib.io import ensure_dir, now_utc_iso, write_dataset
from pipeline.lib.snapshots import latest_snapshot, previous_snapshot, snapshot_dir

ALLOWED_TYPES = ("movie", "tvSeries", "tvMiniSeries")

MIN_VOTES_TOP_ALL = 50000
MIN_VOTES_BY_DECADE = 10000
MAINSTREAM_MIN_RATING = 8.0
MAINSTREAM_MIN_VOTES = 100000
CULT_MIN_RATING = 8.0
CULT_MIN_VOTES = 5000
CULT_MAX_VOTES = 20000
TOP_LIMIT = 200


def resolve_snapshot(silver_dir: Path, snapshot_date: date | None) -> tuple[date, Path]:
    if snapshot_date:
        path = snapshot_dir(silver_dir, snapshot_date)
        if not path.exists():
            raise FileNotFoundError(f"Silver snapshot not found: {path}")
        return snapshot_date, path

    latest = latest_snapshot(silver_dir)
    if not latest:
        raise FileNotFoundError("No silver snapshots found. Run transform first.")
    return latest


def load_tables(con: duckdb.DuckDBPyConnection, silver_path: Path) -> None:
    basics_path = str(silver_path / "title_basics.parquet")
    ratings_path = str(silver_path / "title_ratings.parquet")
    episodes_path = str(silver_path / "title_episodes.parquet")

    con.execute(f"CREATE VIEW title_basics AS SELECT * FROM read_parquet('{basics_path}')")
    con.execute(f"CREATE VIEW title_ratings AS SELECT * FROM read_parquet('{ratings_path}')")
    con.execute(f"CREATE VIEW title_episodes AS SELECT * FROM read_parquet('{episodes_path}')")

    allowed_types_sql = ", ".join(f"'{value}'" for value in ALLOWED_TYPES)
    con.execute(
        "CREATE VIEW titles AS "
        "SELECT b.tconst, b.titleType, b.primaryTitle, b.originalTitle, b.startYear, b.endYear, "
        "       b.runtimeMinutes, b.genres, r.averageRating, r.numVotes "
        "FROM title_basics b "
        "JOIN title_ratings r ON b.tconst = r.tconst "
        f"WHERE b.titleType IN ({allowed_types_sql})"
    )

    con.execute(
        "CREATE VIEW episode_ratings AS "
        "SELECT e.tconst, e.parentTconst, e.seasonNumber, e.episodeNumber, "
        "       b.primaryTitle AS episodeTitle, r.averageRating, r.numVotes "
        "FROM title_episodes e "
        "JOIN title_basics b ON e.tconst = b.tconst "
        "JOIN title_ratings r ON e.tconst = r.tconst"
    )


def run_queries(con: duckdb.DuckDBPyConnection, output_dir: Path, snapshot_date: str, generated_at: str) -> None:
    top_all = con.execute(
        "SELECT tconst, primaryTitle, titleType, startYear, genres, averageRating, numVotes "
        "FROM titles "
        "WHERE numVotes >= ? "
        "ORDER BY averageRating DESC, numVotes DESC "
        "LIMIT ?",
        [MIN_VOTES_TOP_ALL, TOP_LIMIT],
    ).df()
    write_dataset(top_all, output_dir, "top_titles_all_time", snapshot_date, generated_at)

    top_by_decade = con.execute(
        "WITH base AS ("
        "  SELECT *, CAST(FLOOR(startYear / 10) * 10 AS INTEGER) AS decade "
        "  FROM titles "
        "  WHERE numVotes >= ? AND startYear IS NOT NULL"
        "), ranked AS ("
        "  SELECT *, ROW_NUMBER() OVER (PARTITION BY decade ORDER BY averageRating DESC, numVotes DESC) AS rank "
        "  FROM base"
        ")"
        "SELECT decade, rank, tconst, primaryTitle, titleType, startYear, genres, averageRating, numVotes "
        "FROM ranked "
        "WHERE rank <= 10 "
        "ORDER BY decade, rank",
        [MIN_VOTES_BY_DECADE],
    ).df()
    write_dataset(top_by_decade, output_dir, "top_titles_by_decade", snapshot_date, generated_at)

    mainstream = con.execute(
        "SELECT tconst, primaryTitle, titleType, startYear, genres, averageRating, numVotes "
        "FROM titles "
        "WHERE averageRating >= ? AND numVotes >= ? "
        "ORDER BY averageRating DESC, numVotes DESC "
        "LIMIT 50",
        [MAINSTREAM_MIN_RATING, MAINSTREAM_MIN_VOTES],
    ).df()
    mainstream["category"] = "mainstream"

    cult = con.execute(
        "SELECT tconst, primaryTitle, titleType, startYear, genres, averageRating, numVotes "
        "FROM titles "
        "WHERE averageRating >= ? AND numVotes BETWEEN ? AND ? "
        "ORDER BY averageRating DESC, numVotes DESC "
        "LIMIT 50",
        [CULT_MIN_RATING, CULT_MIN_VOTES, CULT_MAX_VOTES],
    ).df()
    cult["category"] = "cult"

    mainstream_vs_cult = pd.concat([mainstream, cult], ignore_index=True)
    write_dataset(mainstream_vs_cult, output_dir, "mainstream_vs_cult", snapshot_date, generated_at)

    con.execute(
        "CREATE OR REPLACE TEMP VIEW genre_exploded AS "
        "SELECT tconst, averageRating, numVotes, runtimeMinutes, startYear, "
        "       unnest(str_split(genres, ',')) AS genre "
        "FROM titles "
        "WHERE genres IS NOT NULL"
    )

    genre_weighted = con.execute(
        "SELECT genre, "
        "       COUNT(DISTINCT tconst) AS titleCount, "
        "       SUM(numVotes) AS totalVotes, "
        "       ROUND(SUM(averageRating * numVotes) / NULLIF(SUM(numVotes), 0), 3) AS weightedRating "
        "FROM genre_exploded "
        "GROUP BY genre "
        "HAVING COUNT(DISTINCT tconst) >= 200 "
        "ORDER BY weightedRating DESC"
    ).df()
    write_dataset(genre_weighted, output_dir, "genre_weighted_ratings", snapshot_date, generated_at)

    con.execute(
        "CREATE OR REPLACE TEMP VIEW genre_totals AS "
        "SELECT genre, SUM(numVotes) AS totalVotes "
        "FROM genre_exploded "
        "GROUP BY genre "
        "ORDER BY totalVotes DESC "
        "LIMIT 12"
    )

    genre_popularity = con.execute(
        "SELECT CAST(FLOOR(startYear / 10) * 10 AS INTEGER) AS decade, "
        "       genre, "
        "       COUNT(DISTINCT tconst) AS titleCount, "
        "       SUM(numVotes) AS totalVotes "
        "FROM genre_exploded "
        "WHERE startYear IS NOT NULL "
        "  AND genre IN (SELECT genre FROM genre_totals) "
        "GROUP BY decade, genre "
        "ORDER BY decade, totalVotes DESC"
    ).df()
    write_dataset(genre_popularity, output_dir, "genre_popularity_by_decade", snapshot_date, generated_at)

    runtime_vs_rating = con.execute(
        "SELECT genre, "
        "       COUNT(DISTINCT tconst) AS titleCount, "
        "       ROUND(AVG(runtimeMinutes), 1) AS avgRuntimeMinutes, "
        "       ROUND(median(runtimeMinutes), 1) AS medianRuntimeMinutes, "
        "       ROUND(AVG(averageRating), 2) AS avgRating, "
        "       ROUND(median(averageRating), 2) AS medianRating "
        "FROM genre_exploded "
        "WHERE runtimeMinutes IS NOT NULL "
        "  AND runtimeMinutes > 0 "
        "  AND genre IN (SELECT genre FROM genre_totals) "
        "GROUP BY genre "
        "ORDER BY avgRating DESC"
    ).df()
    write_dataset(runtime_vs_rating, output_dir, "runtime_vs_rating_by_genre", snapshot_date, generated_at)

    top_episodes = con.execute(
        "SELECT e.tconst, s.primaryTitle AS seriesTitle, e.episodeTitle, "
        "       e.seasonNumber, e.episodeNumber, e.averageRating, e.numVotes "
        "FROM episode_ratings e "
        "JOIN title_basics s ON e.parentTconst = s.tconst "
        "WHERE e.numVotes >= 5000 "
        "ORDER BY e.averageRating DESC, e.numVotes DESC "
        "LIMIT 200"
    ).df()
    write_dataset(top_episodes, output_dir, "top_episodes", snapshot_date, generated_at)

    con.execute(
        "CREATE OR REPLACE TEMP VIEW season_ratings AS "
        "SELECT parentTconst AS seriesTconst, seasonNumber, "
        "       ROUND(AVG(averageRating), 3) AS avgRating, "
        "       SUM(numVotes) AS totalVotes, "
        "       COUNT(*) AS episodeCount "
        "FROM episode_ratings "
        "WHERE seasonNumber IS NOT NULL "
        "GROUP BY parentTconst, seasonNumber"
    )

    season_ratings = con.execute(
        "WITH ranked_series AS ("
        "  SELECT seriesTconst, SUM(totalVotes) AS seriesVotes "
        "  FROM season_ratings "
        "  GROUP BY seriesTconst "
        "  ORDER BY seriesVotes DESC "
        "  LIMIT 50"
        ")"
        "SELECT s.seriesTconst, b.primaryTitle AS seriesTitle, s.seasonNumber, s.avgRating, "
        "       s.totalVotes, s.episodeCount "
        "FROM season_ratings s "
        "JOIN ranked_series r ON s.seriesTconst = r.seriesTconst "
        "JOIN title_basics b ON s.seriesTconst = b.tconst "
        "ORDER BY r.seriesVotes DESC, s.seasonNumber"
    ).df()
    write_dataset(season_ratings, output_dir, "series_season_ratings", snapshot_date, generated_at)

    quality_drop = con.execute(
        "WITH first_last AS ("
        "  SELECT seriesTconst, MAX(seasonNumber) AS lastSeason "
        "  FROM season_ratings "
        "  GROUP BY seriesTconst"
        "), season1 AS ("
        "  SELECT seriesTconst, avgRating AS season1Rating "
        "  FROM season_ratings "
        "  WHERE seasonNumber = 1"
        "), last_season AS ("
        "  SELECT s.seriesTconst, s.avgRating AS lastSeasonRating "
        "  FROM season_ratings s "
        "  JOIN first_last f ON s.seriesTconst = f.seriesTconst AND s.seasonNumber = f.lastSeason"
        "), joined AS ("
        "  SELECT s1.seriesTconst, s1.season1Rating, ls.lastSeasonRating, f.lastSeason "
        "  FROM season1 s1 "
        "  JOIN last_season ls ON s1.seriesTconst = ls.seriesTconst "
        "  JOIN first_last f ON s1.seriesTconst = f.seriesTconst"
        ")"
        "SELECT j.seriesTconst, b.primaryTitle AS seriesTitle, j.season1Rating, "
        "       j.lastSeasonRating, j.lastSeason, "
        "       ROUND(j.season1Rating - j.lastSeasonRating, 3) AS qualityDrop "
        "FROM joined j "
        "JOIN title_basics b ON j.seriesTconst = b.tconst "
        "WHERE j.lastSeason >= 2 "
        "ORDER BY qualityDrop DESC "
        "LIMIT 50"
    ).df()
    write_dataset(quality_drop, output_dir, "series_quality_drop", snapshot_date, generated_at)


def compute_rising_titles(
    con: duckdb.DuckDBPyConnection,
    output_dir: Path,
    current_snapshot: date,
    previous_snapshot_path: Path | None,
    generated_at: str,
) -> None:
    if not previous_snapshot_path:
        empty = pd.DataFrame(
            columns=[
                "tconst",
                "primaryTitle",
                "titleType",
                "startYear",
                "genres",
                "numVotesCurrent",
                "numVotesPrevious",
                "deltaVotes",
                "pctChange",
            ]
        )
        write_dataset(
            empty,
            output_dir,
            "rising_titles_votes_week_over_week",
            current_snapshot.isoformat(),
            generated_at,
            note="Previous snapshot not found. Run at least two weekly snapshots.",
        )
        return

    prev_ratings_path = str(previous_snapshot_path / "title_ratings.parquet")
    con.execute(f"CREATE VIEW prev_ratings AS SELECT * FROM read_parquet('{prev_ratings_path}')")

    rising = con.execute(
        "SELECT t.tconst, t.primaryTitle, t.titleType, t.startYear, t.genres, "
        "       t.numVotes AS numVotesCurrent, p.numVotes AS numVotesPrevious, "
        "       (t.numVotes - p.numVotes) AS deltaVotes, "
        "       ROUND(((t.numVotes - p.numVotes) * 100.0) / NULLIF(p.numVotes, 0), 2) AS pctChange "
        "FROM titles t "
        "JOIN prev_ratings p ON t.tconst = p.tconst "
        "WHERE t.numVotes >= 10000 "
        "ORDER BY deltaVotes DESC "
        "LIMIT 100"
    ).df()

    write_dataset(rising, output_dir, "rising_titles_votes_week_over_week", current_snapshot.isoformat(), generated_at)


def run(snapshot_date: date | None) -> None:
    pipeline_dir = Path(__file__).resolve().parents[1]
    silver_dir = pipeline_dir / "data" / "silver"
    output_dir = pipeline_dir.parents[0] / "dashboard" / "public" / "data"
    ensure_dir(output_dir)

    resolved_date, silver_path = resolve_snapshot(silver_dir, snapshot_date)

    con = duckdb.connect()
    load_tables(con, silver_path)

    generated_at = now_utc_iso()
    run_queries(con, output_dir, resolved_date.isoformat(), generated_at)

    prev = previous_snapshot(silver_dir, resolved_date)
    prev_path = prev[1] if prev else None
    compute_rising_titles(con, output_dir, resolved_date, prev_path, generated_at)

    logging.info("Gold metrics ready at %s", output_dir)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate IMDb metrics from silver parquet")
    parser.add_argument(
        "--snapshot-date",
        type=lambda value: date.fromisoformat(value),
        default=None,
        help="Snapshot date in YYYY-MM-DD (default: latest silver)",
    )
    return parser.parse_args()


def main() -> None:
    logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
    args = parse_args()
    run(args.snapshot_date)


if __name__ == "__main__":
    main()
