# Design System Overview

## Foundations
- **Typography:** Nunito (primary), Plus Jakarta Sans (display). Base size 16px with modular scale 1.25.
- **Color Palette:**
  - Turquoise: #0BADD5 (primary)
  - Orange: #FF564F (accent)
  - Navy: #051B35 (depth)
  - Midnight: #021124 (background emphasis)
  - Sand: #F0F5F8 (neutral surface)
- **Spacing Scale:** 4px baseline with tokens (4, 8, 12, 16, 24, 32, 48, 64).
- **Shadows:** Card = `0 30px 60px -40px rgba(5, 27, 53, 0.35)`; Focus = `0 0 0 4px rgba(11, 173, 213, 0.2)`.

## Components
- **Buttons:** `primary`, `secondary`, `ghost`, `outline`; pill-shaped with 24px radius.
- **Cards:** Frosted background, 24px radius, used for testimonials, resource tiles, pricing packages.
- **Navigation:** Sticky header with gradient hero overlay, mobile drawer replicates SmartZip pattern.
- **Typography Styles:**
  - Display 1 (Hero): 48/56 Nunito, bold.
  - Heading 2: 32/40 Plus Jakarta, semi-bold.
  - Body 1: 18/28 Nunito regular.
- **Forms:** Large rounded inputs, inline validation, Support icons to reinforce trust.

## Interaction Tokens
- **Motion:** Framer Motion fade/slide in 400–600ms; CountUp for metrics; Embla carousel for testimonials.
- **States:** Hover lifts cards by 4px with subtle shadow increase; active states reset translation.
- **Accessibility:** 4.5:1 minimum contrast; focus ring uses turquoise; interactive targets ≥ 44px height.

## Content Blocks
- **Hero:** Gradient background, metric capsule, video CTA replicating SmartZip hero.
- **Metric Strip:** Animated stats with descriptive subtext.
- **Testimonials:** Carousel with avatars/logos, replicates SmartZip style.
- **Three-Step Journey:** Cards with numbered steps matching SmartZip's "How it works".
- **Resource Grid:** Filter tokens and card layout for blog/downloads.

## Assets & Icons
- Icons referenced by tokens (`target`, `spark`, `workflow`, etc.) and mapped in `FeatureGrid`.
- SVG logo placeholders live under `public/images` and should be swapped with brand assets once delivered.
- Video hero uses Wistia/Vimeo embed helper via `buildVideoEmbedUrl` utility.

## Theming Strategy
- Colors exposed as CSS variables in `globals.css`; Tailwind consumes via `rgb(var(--token) / <alpha-value>)` pattern.
- Dark mode ready by toggling `.dark` class—tokens shift surfaces and strokes without touching component code.
- Component variations controlled via props aligning to CMS data (e.g., CTA variant stored alongside label/href).

## Change Management
- Tokens defined centrally; update values in `globals.css` and `tailwind.config.js` only.
- Storybook acts as visual regression safety net; run `npm run storybook` for designers to review.
- Document content governance in CMS to ensure marketing team can update copy without code changes.
