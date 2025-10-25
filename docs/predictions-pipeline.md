# Seller Propensity Pipeline

## Nightly Flow

1. `npm run nightly:seller` orchestrates the entire flow. It performs:
   - Feature store refresh via `scripts/jobs/refresh-seller-feature-store.ts`
   - Model training (logistic + gradient boosting) with automatic leaderboard selection
   - Seller propensity scoring of cached opportunities and run-log persistence
2. Outputs are written to `predictions-data`:
   - `feature-store/seller/latest.json` and timestamped snapshots
   - `models/seller-propensity/latest.json` with registry entry
   - `seller-propensity-run-log.json` for monitoring

Schedule suggestion: run nightly at 2 AM local time (cron `0 2 * * * npm run nightly:seller`).

## Monitoring & Health Check

- `npm run health:seller` reads the last feature-store quality report and run log to surface key KPIs (coverage, completeness, attribution weights).
- Feature store completeness metrics are stored in `predictions-data/feature-store/seller/quality.json`.

## CRM Webhook

- Configure environment variables to forward pushed opportunities to your CRM:
  - `CRM_SELLER_WEBHOOK_URL` – required to enable forwarding
  - `CRM_SELLER_WEBHOOK_TOKEN` – optional bearer token for the webhook endpoint
- `/api/predictions/seller/push` accepts `{ propertyIds: string[], campaign?: string }` and will POST matched property payloads to the webhook. When unset, the endpoint safely no-ops while still returning the counts.

## API & UI Enhancements

- `/api/predictions/seller` now emits cohort breakdowns, ML attribution weights, and feature coverage metadata.
- `/api/predictions/seller/export` streams CSV exports aligned with the dashboard filters.
- `/api/predictions/seller/push` is a stub endpoint for CRM integration; it accepts `propertyIds` and `campaign` payloads.
- Seller Radar exposes:
  - Model vs heuristic attribution per property and in the summary tiles
  - Feature coverage details, cohort spotlight cards, and CRM push workflow
  - CSV/PDF exports backed by server-side endpoints

## Data Sources

- Mock transaction, listing, and engagement feeds live under `content/mock-data`. The feature store wrapper normalizes them into transaction/listing/engagement summaries that feed the ML feature vectors.

## Testing

- `tests/predictions/feature-store.test.ts` ensures feature store snapshots include completeness metadata.
- `tests/predictions/seller-api.test.ts` covers run logging and API metadata to prevent regressions.
