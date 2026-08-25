# Audit Findings

## Strengths worth preserving

- One distinctive accent with strong neutral discipline.
- Editorial hierarchy based on type, rhythm, photography, and asymmetric grids rather than ornamental effects.
- The same geometry and voice extend from marketing into guest/admin tools.
- Mobile touch targets, 16px inputs, focus-visible rules, reduced motion, and safe-area utilities are explicitly present.
- Large data views progressively disclose details through drawers instead of overloading tables.
- Sensitive guest information is described with role and lifecycle boundaries.

## Inconsistencies normalized in this package

- Coral was named `BLUE` in JavaScript theme helpers.
- An older root guideline included Plus Jakarta Sans even though current CSS imports only Inter.
- Cool blue appears in a few dark editorial annotations without a central token.
- Reusable values are split between CSS variables, Tailwind arbitrary values, and inline style objects.
- Prototype components outside the main housing surface contain unrelated remote stock images.

## Improvements recommended for the source app (not applied)

- Rename the primary theme token in a planned migration.
- Consolidate visual tokens into one source and generate CSS/Tailwind/JS aliases.
- Add automated visual regression captures at representative widths.
- Add a formal asset registry and metadata-stripping pipeline.
- Audit external bootstrap/analytics scripts and define a production CSP.
- Confirm color contrast for every muted text-on-dark combination; several values around `white/35–45` should be treated as decorative metadata, not essential content.

