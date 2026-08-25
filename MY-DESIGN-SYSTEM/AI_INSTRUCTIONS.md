# AI Implementation Instructions

Use these instructions when asking an AI coding assistant to apply this design language to another app.

## Mission

Build a responsive interface in the **Editorial Operations** style. Preserve the destination app’s content, domain logic, routes, data contracts, security controls, and accessibility. Adapt the visual language; do not copy Express Housing branding, copy, photography, or business concepts.

## Non-negotiable rules

1. Read `design-tokens.json`, `styles/tokens.css`, `styles/foundations.css`, and `components/COMPONENT_CATALOG.md` before writing UI code.
2. Use Inter or a metric-compatible system fallback. Inputs must be at least 16px.
3. Use white/near-black neutral canvases and one coral primary accent (`#FF385C`). Use status colors only for status.
4. Use 1px hairline borders before adding shadow. Keep shadows quiet and remove them in dark mode when possible.
5. Use oversized, tightly tracked display type only for editorial page statements. Operational tools use smaller, denser headings.
6. Use an 8px spacing rhythm and a centered 1280px container with 16px mobile / 24px desktop gutters.
7. Make every interactive control at least 44×44px on mobile.
8. Ship visible `:focus-visible` states, keyboard behavior, reduced-motion support, semantic HTML, accessible names, and all loading/empty/error/disabled states.
9. Collapse layouts intentionally: sidebars become scrollable tab rails, tables become tappable summaries, and dialogs become independently scrollable full-height mobile sheets.
10. Never expose secrets, private data, credentials, access instructions, or privileged controls to the wrong role or lifecycle state.

## Composition recipe

- Start public pages with a line-plus-eyebrow and a single strong headline.
- Use one structural border after the headline, then split thesis and explanation.
- Alternate white, warm-neutral, photographic, and near-black chapters.
- Use asymmetric image grids and numbered editorial rows instead of uniform card grids everywhere.
- End with one high-confidence CTA and a concise dark footer.
- For apps/dashboards, use a compact editorial heading, bordered navigation, sticky search/filter controls, readable records, and focused drawers.

## Avoid

- gradients as decoration (image-legibility gradients are allowed);
- glassmorphism everywhere;
- neon or multiple competing accents;
- heavy drop shadows;
- excessive rules/lines in heroes;
- giant empty viewport-height sections;
- tiny low-contrast text;
- generic dashboard cards with no hierarchy;
- copying housing-specific photos, names, counts, addresses, or copy;
- renaming an existing product/domain to mimic this source app.

## Required implementation sequence

1. Inventory the destination app’s existing flows and constraints.
2. Map its semantic colors and components to the design tokens.
3. Implement foundations and one representative page.
4. Verify at 320, 375, 768, 1024, and 1440px.
5. Test keyboard navigation, focus order, reduced motion, dark mode if supported, overflow, loading, empty, error, and long-content states.
6. Apply the language to remaining pages without flattening their information hierarchy.
7. Report any deviations and why they were necessary.

## Definition of done

The result feels editorial on public surfaces and calm/operational in tools; mobile content is reachable; no text or controls clip; a keyboard can complete the core flow; status and sensitive data are unambiguous; the destination app retains its own identity and domain logic.

