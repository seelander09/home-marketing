# Component Library Spec

| Component | Props | Data Source | Notes |
|-----------|-------|-------------|-------|
| `Hero` | `content`, `metrics` | CMS `homePage.hero`, `metrics` | Supports optional video CTA; metrics animated with CountUp. |
| `FeatureGrid` | `features` | CMS `homePage.features` | Icons mapped via token strings (`target`, `spark`, etc.). |
| `TestimonialCarousel` | `testimonials`, `headline` | CMS `homePage.testimonials` | Uses Embla carousel; autoplay optional in future. |
| `GuideOfferSection` | `guide` | CMS `homePage.guide` | CTA gates PDF asset via form. |
| `JourneyTimeline` | `steps` | CMS `homePage.journey` | Numbered steps auto-generated. |
| `ResourceHighlights` | `headline`, `items` | CMS `homePage.resources` | Cards link to CMS-driven posts. |
| `ProductPackages` | `packages` | CMS `productPage.packages` | Pricing, features, CTA computed per package. |
| `PlaybookSteps` | `steps` | CMS `productPage.playbooks` | Used for onboarding timeline. |
| `IntegrationMarquee` | `integrations` | CMS `productPage.integrations` | Tokenized badges for partner logos. |
| `ResourceHero` | `featured` | CMS `resourcesPage.featured` | Highlights gated resource. |
| `ResourceGrid` | `posts` | CMS `resourcesPage.posts` | Filter tokens derived from categories. |
| `StorySection` | `story` | CMS `aboutPage.story` | Stats displayed via `formatNumber` util. |
| `LeadershipGrid` | `leaders` | CMS `aboutPage.leadership` | Images stored in CMS asset pipeline. |
| `ValuesGrid` | `values` | CMS `aboutPage.values` | Reuses feature icon tokens. |
| `FAQAccordion` | `faqs` | Multiple pages | Accessible accordion with keyboard support. |
| `DemoRequestForm` | TBD props | API route + CMS | Multi-step form with territory lookup (Milestone 3). |

## Content Governance
- All copy stored in Sanity; fallback JSON ensures local dev without credentials.
- Navigation, footer, CTAs sourced from `siteSettings` document.
- Posts stored under `post` schema; reuse for blog and downloads.

## Storybook Coverage
- UI primitives (Button, Card, Badge) have stories to document states.
- Complex layouts will get stories with mock CMS payloads once forms and analytics are finalized.
