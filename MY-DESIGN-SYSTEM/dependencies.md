# Dependencies and Portability

The core package (`design-tokens.json` and `styles/`) has no JavaScript dependency. Everything below is optional unless a destination implementation uses the React examples.

## Source stack observed

| Dependency | Observed version/range | Purpose | Required for the visual language? |
| --- | --- | --- | --- |
| React / React DOM | `^19.0.0` | UI framework | No |
| Tailwind CSS | `^3.4.17` | utility styling | No |
| Framer Motion | `^12.23.26` | reveal/presence motion | No; CSS or native transitions work |
| Lucide React | `^0.507.0` | iconography | No; use another consistent outline set |
| Radix UI primitives | various | accessible dialogs, tabs, menus, etc. | No, but recommended if equivalent behavior is not already available |
| Sonner | `^2.0.3` | toast feedback | No |
| clsx | `^2.1.1` | conditional classes | No |
| tailwind-merge | `^3.2.0` | Tailwind class resolution | No |
| class-variance-authority | `^0.7.1` | component variants | No |
| tailwindcss-animate | `^1.0.7` | utility animations | No |

## License notes

The listed open-source packages use permissive licenses, but versions and terms can change. Before distributing a new product, inspect the exact installed package manifests and include required notices. Do not treat this summary as legal advice.

The local dependency tree inspected on 2026-08-24 reported MIT for React, React DOM, React Router DOM, Tailwind CSS, Framer Motion, Radix Dialog, Sonner, clsx, and tailwind-merge; ISC for Lucide React; and Apache-2.0 for class-variance-authority. The installed patch versions were sometimes newer than the manifest’s minimum ranges, so the lockfile/installed manifest—not this table—must remain the release source of truth.
- Inter is distributed under the SIL Open Font License 1.1. Keep its license when self-hosting font files and do not sell the font by itself.
- Google Fonts hosting is optional; self-host Inter where privacy, availability, or content-security policy requires it.

## Migration guidance

- **Plain HTML/CSS:** import the two CSS files and use the semantic `.ed-*` classes.
- **Next.js/Vite/Remix:** load Inter with the framework’s font pipeline, import tokens globally, and adapt the examples to the router.
- **Vue/Svelte:** keep tokens and component anatomy; translate React state/slots into native component patterns.
- **Native mobile:** translate tokens, but re-evaluate density, safe-area behavior, platform navigation, and motion primitives.
- **Existing design system:** alias its semantic tokens to this package rather than maintaining duplicate color and spacing sources.

## External/runtime connections to avoid copying blindly

The source application includes runtime font loading, analytics/bootstrap scripts, remote prototype images, API calls, authentication, payments, and video embedding. None is required by this visual package. Add integrations only after a security, privacy, CSP, consent, and licensing review.
