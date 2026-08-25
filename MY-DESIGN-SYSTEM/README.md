# Editorial Operations Design System

Version 1.0.0 · extracted from the Express Housing application · 2026-08-24

This package captures a reusable personal visual language: bold editorial typography, calm operational UI, restrained color, strong photography, hairline structure, and accessible interaction. It is **not** a backup of the application and contains no backend code, customer records, credentials, apartment data, or proprietary business logic.

## Read this first

1. Read [DESIGN_SYSTEM.md](./DESIGN_SYSTEM.md) for the visual rules and rationale.
2. Import [styles/tokens.css](./styles/tokens.css), then [styles/foundations.css](./styles/foundations.css).
3. Use [components/COMPONENT_CATALOG.md](./components/COMPONENT_CATALOG.md) to assemble interfaces.
4. If an AI coding assistant will implement the design, give it [AI_INSTRUCTIONS.md](./AI_INSTRUCTIONS.md).
5. Check [LICENSE_AND_ASSETS.md](./LICENSE_AND_ASSETS.md) before adding fonts, icons, photos, or third-party code.

## What is portable

- The token model, CSS foundations, layout rules, responsive behavior, motion, accessibility requirements, and component recipes.
- The generic React/Tailwind examples in `examples/` (adapt names and dependencies to the destination app).
- The editorial composition system: large compressed headlines, small tracked eyebrows, asymmetric grids, alternating light/dark chapters, photography-led storytelling, and compact operational controls.

## What is deliberately not included

- Express Housing names, logos, customer data, unit/access details, pricing logic, APIs, authentication, or database code.
- Original apartment/building photography. Those files have project-specific permissions and are not presumed reusable elsewhere.
- `node_modules`, build output, caches, Git history, environment files, test credentials, and analytics configuration.

## Quick start without Tailwind

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
<link rel="stylesheet" href="styles/tokens.css">
<link rel="stylesheet" href="styles/foundations.css">
```

Use semantic classes such as `.ed-container`, `.ed-eyebrow`, `.ed-display`, `.ed-button`, `.ed-card`, `.ed-input`, and `.ed-status`.

## Quick start with React + Tailwind

Use the framework-neutral CSS for variables and accessibility, then translate component layout with Tailwind. The examples assume React, `lucide-react`, and optionally `framer-motion`. See [dependencies.md](./dependencies.md).

## Design signature

The system should feel:

- editorial, not decorative;
- calm, not empty;
- operational, not corporate-dashboard generic;
- premium through proportion and typography, not gradients or heavy shadows;
- mobile-first and touch-safe;
- clear about status, privacy, and the next action.

## Package map

| Path | Purpose |
| --- | --- |
| `DESIGN_SYSTEM.md` | Complete visual and responsive specification |
| `AI_INSTRUCTIONS.md` | Paste-ready rules for AI implementation |
| `design-tokens.json` | Machine-readable canonical tokens |
| `styles/` | Portable CSS variables and base components |
| `components/` | Component recipes and composition patterns |
| `examples/` | Generic implementation examples |
| `assets/` | Asset policy and replacement guidance |
| `screenshots/` | Screenshot status and manual capture checklist |
| `audit/` | Extraction evidence, source map, findings, and methodology |
| `dependencies.md` | Required/optional libraries and license notes |
| `SECURITY_AND_PRIVACY.md` | Package safety review and reuse requirements |
| `LICENSE_AND_ASSETS.md` | Rights and attribution boundaries |
| `CHANGELOG.md` | Package version history |

