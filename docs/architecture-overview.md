# Architecture Overview

## Technical Stack
- **Framework:** Next.js 14 (App Router, TypeScript)
- **Styling:** Tailwind CSS with CSS custom properties for design tokens.
- **Fonts:** Google Nunito via `next/font`.
- **Animations & Interactions:** Framer Motion, React CountUp.
- **Carousel:** Embla Carousel React (planned dependency) for testimonials and resource sliders.
- **CMS:** Sanity (headless) for content, structured via reusable document and object schemas.
- **Forms:** Next.js Route Handlers with validation via Zod, reCAPTCHA v3 verification, CRM webhooks.
- **Analytics:** Google Tag Manager injecting GA4, Google Ads, Meta Pixel, Bing UET; custom consent management.
- **Testing & QA:** Jest/React Testing Library for unit tests, Playwright for E2E smoke, Lighthouse CI.
- **Deployment:** Vercel (default) with preview environments; GitHub Actions for CI (lint, type-check, tests, Lighthouse CI).

## Application Structure
```
app/
  (marketing)/
    layout.tsx
    page.tsx (Home)
    products/page.tsx
    resources/page.tsx
    resources/[slug]/page.tsx
    about/page.tsx
    contact/page.tsx
  api/
    forms/
      demo/route.ts
      download/route.ts
    consent/route.ts
    territory/route.ts
cms/
  schemas/
  queries/
components/
  layout/
  sections/
  ui/
content/
  mock-data/
lib/
  cms/
  config/
  forms/
  analytics/
public/
  images/
  downloads/
```

## Content Flow
1. Page components request structured data via hooks/services in `lib/cms`.
2. CMS queries use GROQ documents in `cms/queries` and Sanity client with ISR caching.
3. For local development without CMS credentials, data layers fall back to JSON mocks under `content/mock-data`.
4. Components receive typed props (shared `types/cms.ts`) ensuring content-driven layout.

## Lead Capture Flow
1. Multi-step forms capture user info, optional territory lookup, gating assets.
2. Client obtains reCAPTCHA token; API route verifies with Google.
3. Validated payload forwarded to CRM webhook (HubSpot/Salesforce) defined via env vars; responses logged to Vercel Edge LogDrain (or console locally).
4. On success, gated asset URL returned; analytics events fired via GTM data layer.

## Equity Insights
- `lib/insights/realie.ts` calls the Realie Seller Equity API (or falls back to `/content/mock-data/realie-equity.json`) and normalizes market-level loan payoff, valuation, and equity distribution data.
- `/api/insights/equity` exposes that dataset to the UI with optional `marketId` and `limit` filters.
- `EquityReadiness` home page section blends Realie data with CMS copy to surface break-even equity thresholds, percentile benchmarks, and readiness scoring.
- `scripts/build-redfin-cache.mjs` digests Redfin market tracker TSVs into cache files under `REDFIN_CACHE_DIR` (state/city/zip); `lib/insights/redfin.ts` reads those JSON caches to surface current inventory, DOM, sale-to-list, and price metrics, served via `/api/market/redfin`.

## Analytics & Consent
- Consent banner persists user choices in encrypted cookies.
- Tag Manager script only loads once marketing consent provided.
- "Do Not Sell My Info" flow triggers `consent/route.ts` to store suppression list entries (with CRM webhook).

## Accessibility & Performance
- All interactive components keyboard navigable and screen reader labelled.
- Images served through `next/image` with CMS-driven alt text.
- Pages configured for ISR, using dynamic metadata (`generateMetadata`).
- Automated Lighthouse CI ensures ≥90 scores; Playwright asserts key flows.

## Outstanding Decisions & TODOs
- Confirm CRM endpoint + payload mappings.
- Finalize territory dataset or API.
- Upload brand assets (logos, imagery) to CMS / asset bucket.
- Align legal copy with compliance team.
- Validate Realie API contract (authentication, schema, rate limits) before production launch.
- Expand Redfin ingestion scheduling (cron, queue) and persist caches in durable storage for multi-instance environments.

