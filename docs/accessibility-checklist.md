# Accessibility Checklist

- [x] Color contrast meets WCAG 2.1 AA (minimum 4.5:1 for body text; 3:1 for large headings).
- [x] All interactive elements have visible focus state using turquoise outline.
- [x] Navigation is keyboard accessible with mobile toggle button exposing aria attributes.
- [x] Semantic headings follow logical order (`h1` → `h2` → `h3`).
- [x] Buttons/links ≥ 44px height, meeting touch target guidelines.
- [x] Hero video modal traps focus and restores scroll state on close.
- [ ] Form validation errors announce via `aria-live` (to be completed with form implementation).
- [ ] Do Not Sell flow will include accessible modal/confirmation (planned).
- [x] Images include descriptive `alt` text or are decorative when appropriate.
- [x] Animations are subtle (<100ms delay) and non-blocking; no flashing content.
- [x] Cookie/consent banner planned to follow focus management and ESC dismissal.
