# Express Housing editorial redesign handoff

Created: 2026-08-22. Preserve this document as a reusable record of the design direction, completed work, implementation locations, and verification state.

## Product and visual direction

- Continue the new editorial Express Housing style: confident oversized typography, restrained black/white surfaces, blue accents, occasional coral CTAs, large property photography, clear information hierarchy, and generous but controlled spacing.
- The site should feel polished and hospitality-focused, not like a generic card-heavy SaaS template.
- Preserve responsiveness and accessibility. Reuse the shared `eh-container`, design-system helpers, theme colors, and established typography/spacing rhythm.
- The user generally gives design autonomy and prefers implementation over repeated clarification.

## Major work completed

- Redesigned the homepage/landing experience and apartment-detail template; the apartment template is shared across the inventory.
- Redesigned sign-in/sign-up as a scrollable auth experience and fixed the create-account scrolling problem.
- Redesigned the guest portal with pre-arrival/stay information, access instructions, codes, Wi-Fi, mail, trash, parking, and apartment-access video support.
- Added admin-side apartment access-guide fields, including written instructions and a YouTube link surfaced to guests.
- Redesigned the main admin dashboard and partner/apartment unit dashboard in the same editorial language. Partner data must default safely before calls such as `.filter()`.
- Redesigned About us, Careers, FAQ, Testimonials, Contact us, and Locations pages.
- Header navigation now uses: Testimonials, About us, Contact us, Careers, FAQ. Labels intentionally say “About us” and “Contact us.”
- Footer was redesigned as a dark editorial CTA/footer. It includes “A furnished home. A clearer arrival.” followed by compact Explore, Company, and contact information. The oversized bottom “EXPRESS HOUSING” wordmark and its divider were removed.
- Homepage footer transition was fixed: the final large image no longer overlaps the footer. `HomePage.jsx` now uses `mb-16 md:mb-20` instead of `-mb-20`, providing a 64–80px gap above the footer.

## Important files

- `frontend/src/components/housing/HomePage.jsx`
- `frontend/src/components/housing/Footer.jsx`
- `frontend/src/components/housing/Header.jsx`
- `frontend/src/components/housing/ApartmentDetailPage.jsx`
- `frontend/src/components/housing/DashboardPage.jsx`
- `frontend/src/components/housing/AdminPage.jsx`
- `frontend/src/components/housing/PartnerDashboard.jsx`
- `frontend/src/components/housing/AuthDialog.jsx`
- `frontend/src/components/housing/{AboutPage,CareersPage,FaqPage,TestimonialsPage,ContactPage,LocationsPage}.jsx`
- `frontend/src/design-system.css`
- `frontend/src/lib/designSystem.js`
- `backend/server.py` and the newer `backend/app/` modules

## Verification and repository state

- Latest frontend production build passes with `yarn build` from `frontend/`.
- Existing non-blocking warning: `ApartmentDetailPage.jsx` has a `react-hooks/exhaustive-deps` warning around `submitBookingRequest` (reported near line 208).
- Tailwind also reports pre-existing ambiguous variable utility warnings for delay/duration/easing.
- The worktree contains many related modified and untracked redesign/backend files. Treat them as user work; do not reset or discard them.
- No commit was created during this handoff.

## Suggested next-session starting point

1. Read this note and inspect `git status` before editing.
2. Run the local app and visually check the exact page the user names at desktop and mobile sizes.
3. Keep new work aligned with the established editorial components rather than introducing a new visual system.
