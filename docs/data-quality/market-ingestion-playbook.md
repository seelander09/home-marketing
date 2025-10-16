# Market Data Ingestion Playbook

This playbook documents the workflow for building and validating structured market datasets that feed the seller propensity model.

## Commands

- `npm run market:refresh` – runs all cache builders (Redfin, Census, HUD, FRED) sequentially and ensures cache directories exist before execution.
- `npm run market:validate` – generates `predictions-data/market-cache-quality.json` summarising dataset counts, sample keys, and missing caches.

## Checklist

1. **Environment variables** – confirm `REDFIN_DATA_DIR`/`REDFIN_CACHE_DIR` plus API keys for Census, HUD, and FRED are present.
2. **Source exports** – drop the latest TSV exports into the Redfin raw directory, and verify API credentials allow nightly pulls for the others.
3. **Refresh run** – execute `npm run market:refresh` and review any warnings surfaced by the orchestration script.
4. **Validation** – run `npm run market:validate` and inspect the generated JSON or wire the output into the BI dashboard for coverage visualisation.
5. **Alerts** – configure scheduled jobs to run both commands and raise alerts when the validator reports missing datasets or stale `lastUpdated` values.

## Next Enhancements

- Snapshot the validator output over time to surface freshness trends.
- Add schema assertions for required Redfin/Census/HUD/FRED fields (e.g., non-null `medianSalePrice`, `affordabilityIndex`).
- Publish the validation JSON to the team analytics workspace for cross-team monitoring.
