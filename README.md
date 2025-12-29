# IMDb Analytics

End-to-end data engineering + dashboard project built on the IMDb public datasets. The goal is a reproducible weekly pipeline that generates aggregated metrics and a modern Next.js dashboard.

## Architecture (flow)

```
IMDb TSV (title.basics, title.ratings, title.episode)
  -> Bronze (download + manifest)
  -> Silver (cleaning, filters, Parquet)
  -> Gold (JSON/CSV metrics)
  -> Dashboard (Next.js reads public/data)
```

## Structure

```
imdb-analytics/
  pipeline/          # ETL/ELT
  dashboard/         # Next.js
  .github/workflows/ # weekly pipeline
```

## Run locally

### 1) Pipeline

```bash
python -m venv .venv
.venv\Scripts\activate
pip install -r pipeline/requirements.txt

python pipeline/ingest/imdb_ingest.py
python pipeline/transform/imdb_transform.py
python pipeline/metrics/imdb_metrics.py
```

Final aggregates are written to `dashboard/public/data`.

### One-shot runner

```bash
python -m pipeline.run_pipeline
```

### 2) Dashboard

```bash
cd dashboard
npm install
npm run dev
```

## GitHub Actions

The `imdb_weekly_pipeline.yml` workflow runs weekly:
1. Download (bronze)
2. Transform (silver)
3. Metrics (gold)
4. Auto-commit JSON/CSV outputs

## Notes

- The repo does not store raw IMDb dumps.
- Only final aggregates are versioned.
- The pipeline keeps the last 8 snapshots in `pipeline/data/`.