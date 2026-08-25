# Design System Specification

## 1. Creative direction

The design language combines an editorial publication with a dependable operations product. Marketing pages use scale, photography, and rhythm; authenticated tools use compact structure, predictable controls, and minimum-necessary information. Both sides share the same typography, neutral palette, coral accent, geometry, and interaction behavior.

The central rule is **clarity through hierarchy**. Large type creates a point of view. Hairline borders organize detail. Color signals action or status. Photography supplies warmth. Empty space is intentional but must never obscure the next action.

## 2. Foundations

### Typography

Primary family: `Inter`, followed by the native system stack. Inter is available through Google Fonts and the upstream font project; see licensing notes before bundling it.

UI scale:

| Token | Size | Typical use |
| --- | ---: | --- |
| `text-xs` | 11px | metadata, captions, timestamps |
| `text-sm` | 13px | supporting copy and compact tables |
| `text-base` | 15px | interface text and buttons |
| `text-lg` | 17px | lead copy and compact headings |
| `text-xl` | 20px | section introduction |
| `text-2xl` | 24px | panel title |

Editorial display sizes are fluid and intentionally separate from the UI scale:

- Display XL: `clamp(3.25rem, 8vw, 7.375rem)`, line-height `0.88`, tracking `-0.055em`.
- Display LG: `clamp(2.75rem, 6.3vw, 6.75rem)`, line-height `0.92`, tracking `-0.05em`.
- Display MD: `clamp(2.375rem, 4.7vw, 4rem)`, line-height `0.97`, tracking `-0.04em`.
- Section title: 34–48px, line-height `1.02`.

Weights: 500 body, 600 labels, 700 controls, 800 editorial emphasis. Avoid 900 unless a destination font renders 800 too softly.

Rules:

- Inputs remain at least 16px to prevent iOS zoom.
- Headings use tight tracking; paragraphs use normal tracking and relaxed line-height.
- Eyebrows are 10–11px, uppercase, weight 700–800, tracking `0.20–0.28em`.
- Keep body lines near 55–75 characters.

### Color

Light mode uses white surfaces, near-black text, a warm pale section field, and quiet gray borders. Dark mode uses distinct near-black layers rather than pure black everywhere. Coral is the only primary action accent.

Canonical colors are in `design-tokens.json` and `styles/tokens.css`. Key values:

- Coral action: `#FF385C`
- Light text: `#222222`; muted: `#717171`; border: `#EBEBEB`
- Dark canvas: `#0A0A0A`; surface: `#141414`; raised: `#1C1C1C`
- Editorial dark: `#0B0B0B` or `#171717`
- Editorial warm field: `#F2F1EE`
- Status: green `#34C759`, red `#FF3B30`, orange `#FF9500`
- A cool blue `#6597FF` appears only as a secondary annotation on very dark editorial surfaces. It is not a second primary action color.

Use coral for primary actions, focus, active accents, and small editorial rules. Do not flood large backgrounds with it. Status colors communicate state, never branding.

### Spacing and layout

The base spacing rhythm is 8px: 8, 16, 24, 32, 48. Editorial compositions extend it with 56, 64, 80, 96, 112, and 144px.

- Main container: max-width 1280px, centered.
- Horizontal gutter: 16px mobile, 24px from 768px.
- Standard page section: 80px vertical mobile, 112px tablet, 144px wide desktop.
- Dense application section: 24–40px vertical.
- Card padding: 16px compact, 20–24px standard, 32–48px editorial callout.
- Use asymmetric grids such as `1.25fr / 0.75fr`, `1.45fr / 0.55fr`, and `0.65fr / 1.35fr` to create editorial tension.

White space must be attached to meaning. Avoid fixed viewport-height blank bands. On short screens, content should determine height.

### Shape and elevation

Radii scale with object size:

- 6px badges/focus normalization
- 8px compact chips
- 10–12px controls and icon tiles
- 14–16px cards
- 18–22px editorial media and large panels
- 999px pills and circular controls

Structure comes from 1px borders. Shadows are restrained:

- card: `0 2px 8px rgba(0,0,0,.04)`
- raised: `0 2px 12px rgba(0,0,0,.08)`
- floating: `0 8px 30px rgba(0,0,0,.12)`
- primary glow: `0 8px 24px rgba(255,56,92,.25)`

Remove shadows in dark mode when borders provide enough separation.

## 3. Editorial composition

### Page opening

Use one of two hero forms:

1. **Text-led:** eyebrow, oversized statement, then a border-top split with bold thesis and muted explanation.
2. **Image-led:** full-bleed image with black gradient, compact context at top, oversized headline near the bottom, and one white or coral pill action.

Do not stack multiple horizontal rules inside the same hero. A single structural line is usually enough.

### Chapter rhythm

Alternate canvas types to pace long pages:

1. white editorial introduction;
2. full-bleed or asymmetric photography;
3. warm neutral process section;
4. near-black standards/story section;
5. white conversion section;
6. dark footer.

Use a small line-plus-eyebrow to start a chapter. Use numbered rows (`01`, `02`, `03`) for process and principles. Use large media with concise captions instead of decorative cards.

### Imagery

- Favor real, high-resolution environmental photography.
- Common crops: 4:3, 5:4, 16:10, 16:8, and square supporting tiles.
- Use `object-fit: cover` and record deliberate focal points.
- A hover scale of 1.02–1.03 over 500–700ms is enough.
- Add a dark gradient only where text overlaps media.
- Captions are 10–11px uppercase or sentence case muted copy.
- Never imply an image depicts an exact product/unit/person unless verified.

## 4. Application composition

The operational UI uses the same voice at smaller scale:

- A compact eyebrow and 42–58px page title establish context.
- Navigation uses a bordered surface and a near-black active item.
- Search and filters sit in a sticky, lightly raised control bar when lists are long.
- Tables become stacked, tappable records on mobile; nonessential columns hide rather than squeeze.
- Detail work opens in a right-side drawer or focused panel.
- Sensitive fields are revealed only in the correct role and lifecycle state.
- Empty, loading, error, and success states are part of every component definition.

## 5. Responsive system

The source application uses Tailwind defaults: `sm 640px`, `md 768px`, `lg 1024px`, `xl 1280px`, `2xl 1536px`.

Mobile first:

- Global header is 80px. Desktop nav hides below 1024px; account/menu remains a pill.
- Every core control is at least 44×44px on screens up to 768px.
- Two-column editorial introductions collapse to one column with 32–48px gaps.
- Asymmetric media grids become single-column; paired small media may remain two columns.
- Display text uses `clamp()` or explicit stepped sizes; it must not overflow at 320px.
- Desktop sidebars become horizontally scrollable tab rows.
- Desktop tables hide secondary columns and turn each row into a single clear tap target.
- Full-screen mobile dialogs use `100dvh`, independent content scrolling, and safe-area padding.
- Sticky bottom actions use `max(16px, env(safe-area-inset-bottom))`.

## 6. Interaction and motion

Primary easing: `cubic-bezier(0.22, 1, 0.36, 1)`. Editorial reveal easing: `[0.16, 1, 0.3, 1]`.

- Micro hover/press: 150ms; press scale 0.97.
- Standard state change: 220–240ms.
- Panel entrance: fade + 8px rise, 220ms.
- Editorial reveal: fade + 20–28px rise, 650–850ms, once per viewport.
- Image hover: scale 1.02–1.03, 500–700ms.
- Stagger: 40–80ms per child; avoid long queues.
- Route fade: 180ms.
- Skeleton shimmer: 1.6s.

All animations must collapse under `prefers-reduced-motion: reduce`. Motion must clarify state or reading sequence, never delay access to content.

## 7. Accessibility

- WCAG AA contrast is the minimum target.
- Use semantic headings in order and one primary `h1` per page.
- All icon-only buttons need explicit accessible names.
- Visible focus: 2px coral, 2px offset; cards may use 3px offset.
- Dialogs require focus trapping, Escape close, focus restoration, body-scroll locking, an accessible label/title, and a dedicated scrolling content region.
- Do not communicate status through color alone; include text and/or icon.
- Decorative images use empty alt text; meaningful images describe content, not styling.
- Respect safe areas and 44px touch targets.
- Provide loading, empty, validation, error, success, disabled, hover, active, and focus states.

## 8. Content voice

Headlines are short, declarative, and human. Supporting copy explains what changes for the user. Operational labels are literal. Avoid luxury clichés, vague superlatives, and jargon.

Useful pattern:

- Eyebrow: context (`THE PROCESS`)
- Headline: outcome (`Every detail, already organized.`)
- Lead: confident plain-language thesis
- Body: evidence and boundaries
- CTA: verb + object (`View opportunities`, `Review request`)

## 9. Known inconsistencies to correct in future implementations

- The source theme calls the coral primary token `BLUE`. New work must use `accent` or `brand`, never preserve that misleading name.
- The historical guidelines mention Plus Jakarta Sans, but the current implemented UI uses Inter only. Inter is canonical here.
- The small cool-blue annotation is hard-coded in a few dark sections. Treat it as optional `accent-cool`, not a primary token.
- Some source components mix inline style objects and Tailwind classes. New systems should centralize tokens in CSS variables and use one composition approach per component.
- Some prototype UI components contain remote stock-image URLs and are not part of this extracted system.
- Google Fonts is a runtime dependency in the source. Privacy-sensitive deployments should self-host Inter.

