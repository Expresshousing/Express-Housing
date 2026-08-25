# Component Catalog

Every component must define default, hover, active, focus-visible, disabled, loading, error, and relevant empty states. Components handling private information must also define authorization and lifecycle visibility.

## 1. Buttons

**Primary:** coral fill, white label, 12px radius for UI or full pill for editorial CTAs, 44–48px minimum height. Hover rises 1px; press scales to .97.

**Secondary:** raised neutral fill, hairline border, no glow. On dark editorial surfaces, a white pill with black text is preferred when it is the main local action.

**Icon-only:** 44×44px minimum, circular or 12px radius, explicit `aria-label`. Overlay controls use translucent dark/white surfaces with enough contrast.

## 2. Eyebrow and chapter header

A 36–40px, 2px rule followed by a 10–11px tracked uppercase label. Use once at the beginning of a content chapter. Do not repeat decorative lines around every heading.

## 3. Editorial hero

An `h1`, one short lead, and at most two actions. Text heroes use a border-top split beneath the statement. Image heroes use a dark gradient for legibility. Avoid fixed-height blank areas; use content-based padding with sensible minimums only for image-led heroes.

## 4. Editorial row list

Rows use top/bottom hairlines and three columns on desktop: number, title, explanation. On mobile, stack with 16px gaps. Good for principles, process, FAQs, and service standards.

## 5. Media story card

Use a 4:3 or 5:4 image with 18px radius, a small number badge, then a border-top title/explanation split. The image may scale 1.02 on hover. Do not add a shadow to large editorial media.

## 6. Cards and panels

Compact card: 14px radius, 16px padding, hairline border, almost imperceptible shadow. Large panel: 20px radius, 20–24px padding. Favor borders over nested cards. Use an icon tile only when it adds meaning.

## 7. Forms

Labels are 13px/600 with a 6px gap. Inputs are 48px minimum height, 16px type, 12px radius, neutral raised fill, and coral focus border. Validation appears adjacent to its field and in plain language. Long dialogs require an independently scrolling form region.

## 8. Navigation

Public header: 80px, centered 1280px content, text nav on large screens, account/menu capsule always present. It may overlay an image hero, then become a blurred solid surface after the hero.

Application navigation: bordered 16px panel, active row near-black in light mode and light-on-dark in dark mode. Below 768px, convert vertical navigation to a horizontally scrollable control rail.

## 9. Search and filters

Combine one full-width search input with compact filter pills. For long records, make the surface sticky below the global header (`top: 96px` approximately). Active filters invert foreground/background; inactive filters remain quiet.

## 10. Table / record list

Desktop headers use 9–10px uppercase labels and generous column ratios. Rows are at least 76–78px high and fully clickable. On mobile, show primary identity plus a chevron; move secondary details into the drawer rather than compressing five columns.

## 11. Status and micro-badges

10px uppercase, 800 weight, 6px badge radius or pill radius for state. Use pale tinted fill and a subtle border. Always include status text. Reserve success, warning, and danger colors for their semantic meaning.

## 12. Drawer

Fixed viewport overlay with a dimming scrim and a right panel up to 540px. On small screens the panel may be full width. It needs a title, 44px close control, independent vertical scroll, semantic dialog attributes, Escape behavior, focus trap, and focus restoration.

## 13. Modal / authentication shell

Desktop: up to 980px, two columns (`0.9fr / 1.1fr`), visual narrative on the left and form on the right. Mobile: full `100dvh`, image column hidden, form scrolls internally. Lock body scroll; do not let the page behind move.

## 14. Toast and tone notice

Toast provides brief global feedback. Inline tone notice is a 12px-radius tinted box with 13px copy and 1px semantic border. Errors must not disappear automatically before they can be read.

## 15. Loading and empty state

Loading uses a restrained spinner or theme-aware shimmer. Empty states use one 56px icon tile, a 22px title, one sentence, and one clear action. Do not use whimsical illustrations that conflict with the editorial tone.

## 16. Footer

Near-black background, one large conversion statement, one coral pill action, then compact grouped navigation and contact. Keep lower navigation concise. Typography and spacing create hierarchy; avoid oversized branding below the actual footer.

