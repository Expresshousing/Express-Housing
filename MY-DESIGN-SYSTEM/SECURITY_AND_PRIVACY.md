# Security and Privacy Review

## Package review result

This package is documentation and generic presentation code only. It intentionally excludes:

- environment files, API keys, tokens, passwords, session values, test credentials, and analytics IDs;
- customer/guest names, emails, phone numbers, addresses, dates, access codes, Wi-Fi credentials, reservation details, and private notes;
- backend endpoints, payment flows, authorization logic, database models, and business pricing logic;
- source application images and image metadata;
- Git history, dependency folders, caches, builds, and logs.

## Safe reuse requirements

- Treat CSS hiding as presentation only; enforce authorization on the server and data layer.
- Return minimum-necessary fields for each role. Do not fetch sensitive values and merely hide them in the UI.
- Release access instructions, credentials, or private locations only at the approved lifecycle point.
- Do not place sensitive values in URLs, analytics, logs, screenshots, static fixtures, HTML source, client bundles, or toast messages.
- Sanitize user-generated content and validate every external URL server-side. Allowlist embed providers if video/media embeds are supported.
- Apply `rel="noopener noreferrer"` to new-tab links and a restrictive `referrer-policy` where appropriate.
- Use `youtube-nocookie.com` or a consent-aware alternative for YouTube embeds; review tracking implications.
- Dialog focus management and body-scroll locking are usability controls, not security controls.
- Review Content Security Policy before loading Google Fonts, images, analytics, or embeds.
- Never copy real production data into design-system examples.

## Findings from the source audit

- Positive: role-scoped partner UI explicitly omits payment, private notes, access codes, Wi-Fi credentials, and stay purpose.
- Positive: private arrival data is conceptually lifecycle-gated and the YouTube embed uses the privacy-enhanced domain.
- Caution: the source app includes runtime third-party/bootstrap and analytics references outside this package. Audit those separately before production.
- Caution: source image files may retain EXIF metadata. This package avoids copying them; future asset pipelines should strip unnecessary metadata.
- Caution: Google Fonts creates a third-party request. Self-host when privacy policy or CSP requires it.
- Caution: CSS/theme storage uses local storage and authentication uses browser storage in the source. Those implementation choices are outside this visual package and require a separate application-security review.

