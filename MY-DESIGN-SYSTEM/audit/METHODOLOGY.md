# Extraction Methodology

## Scope

Read-only audit of the current repository followed by creation of a separate package directory. The application source was not edited.

## Sources inspected

- global CSS and token files;
- theme context and reusable style helpers;
- Tailwind and package configuration;
- global header/footer and routing shell;
- landing, informational/editorial, listing detail, gallery, authentication, guest dashboard, admin, and partner components;
- image provenance documentation and public asset inventory;
- dependency manifest and external-reference/motion scans.

## Extraction decisions

- Values implemented in current code take precedence over older notes.
- Frequently repeated values become canonical tokens.
- One-off composition values remain documented patterns rather than global tokens.
- Housing names, domain logic, records, copy, and photos are removed or generalized.
- Ambiguous naming is normalized (`BLUE` becomes `accent`; Inter is canonical).
- Source-specific dependencies are marked optional unless essential to behavior.
- Security/privacy behavior is documented without copying authorization or data code.

## Confidence

- High: palette, font, container, base spacing, radii, shadows, touch sizes, focus, breakpoints, and common motion.
- High: public editorial rhythm, application navigation, form, table/list, drawer, dialog, and status patterns.
- Medium: exact screenshot appearance because an automated browser was unavailable during packaging.
- Rights-dependent: source photography; therefore excluded.

