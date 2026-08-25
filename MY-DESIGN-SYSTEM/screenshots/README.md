# Screenshot Status and Capture Checklist

## Status

Automated screenshots are not included in this package. No controllable browser session was available during packaging, and previously supplied screenshots contained browser/desktop chrome and user-specific account context. They were deliberately not copied to keep this reusable package clean and private.

The design is instead documented from the current source of truth: tokens, CSS, and live component implementations. Add screenshots later only from a sanitized local/test environment.

## Recommended sanitized captures

Capture each at 375×812, 768×1024, and 1440×1000 where applicable:

1. Landing page: image/video hero, collection, warm process section, dark standards section, final conversion, footer.
2. Text-led editorial page: oversized opening, image grid, numbered rows, dark chapter.
3. Image-led careers-style page with white pill CTA.
4. Detail page: media hero + “View all,” mobile booking CTA, desktop sticky booking panel, content sections.
5. Gallery/lightbox at mobile and desktop widths.
6. Authentication dialog: login, long sign-up form scrolled to bottom, validation error.
7. Guest portal: pre-arrival summary, access instructions, Wi-Fi, video, mid-stay, checkout. Use fake data only.
8. Admin: overview, portfolio filters, unit drawer, empty/loading/error states. Use fake data only.
9. Partner/limited-role portal demonstrating intentionally omitted sensitive information.
10. Light and dark theme component sheet with buttons, fields, cards, statuses, focus rings, and disabled states.

Before saving, hide real names, emails, phones, addresses, dates, unit numbers, codes, Wi-Fi, tokens, browser bookmarks, desktop notifications, and operating-system account details.

