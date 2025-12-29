# IMDb Analytics Pipeline

This pipeline downloads the IMDb public datasets, normalizes the data, and generates aggregated JSON/CSV metrics for the dashboard.

## Structure

- **Bronze**: raw TSV download with a `manifest.json` per snapshot.
- **Silver**: normalized and cleaned data with mandatory filters, stored in Parquet.
- **Gold**: final metrics published to `dashboard/public/data`.

```
pipeline/
  ingest/    # download and manifest
  transform/ # cleaning and normalization
  metrics/   # metrics and aggregates
  data/      # bronze/silver/gold (not versioned)
```

## Run locally

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r pipeline/requirements.txt

python pipeline/ingest/imdb_ingest.py
python pipeline/transform/imdb_transform.py
python pipeline/metrics/imdb_metrics.py
```

Or use the one-shot runner:

```bash
python -m pipeline.run_pipeline
```

### Useful parameters

- `--snapshot-date YYYY-MM-DD`: run for a specific date.
- `--keep 8`: number of snapshots kept in `bronze/` and `silver/`.

## Notes

- Raw and intermediate data live in `pipeline/data/` and should not be versioned.
- The process removes adult titles (`isAdult = 1`) and restricts types to `movie`, `tvSeries`, `tvMiniSeries`, and `tvEpisode`.
- The weekly growth metric needs at least two snapshots on disk.