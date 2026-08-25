# Source Map

This map helps a future maintainer trace the extraction without turning the package into a source-code backup.

| Design concern | Primary source evidence |
| --- | --- |
| Core tokens/base accessibility | `frontend/src/design-system.css` |
| Buttons, inputs, container, hero controls | `frontend/src/App.css` |
| Light/dark palettes | `frontend/src/context/ThemeContext.jsx` |
| Style-object recipes | `frontend/src/lib/designSystem.js` |
| Breakpoints/theme bridge | `frontend/tailwind.config.js` |
| Editorial landing composition | `frontend/src/components/housing/HomePage.jsx` |
| Text-led editorial pages | `AboutPage.jsx`, `TestimonialsPage.jsx`, `ContactPage.jsx`, `FaqPage.jsx` |
| Image-led editorial hero | `CareersPage.jsx` |
| Header/account navigation | `Header.jsx` |
| Conversion/footer pattern | `Footer.jsx` |
| Detail/media/sticky booking | `ApartmentDetailPage.jsx`, `apartmentGallery.jsx` |
| Full-height scroll-safe modal | `AuthDialog.jsx` |
| Guest task portal | `DashboardPage.jsx` |
| Admin navigation and portfolio tools | `AdminPage.jsx`, `admin/PortfolioView.jsx` |
| Limited-role records/drawer | `PartnerDashboard.jsx` |
| Asset provenance | `docs/image-sources.md` |
| Dependency versions | `frontend/package.json` |

Paths are relative to the source repository as audited on 2026-08-24.

