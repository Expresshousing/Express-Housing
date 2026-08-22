# Express Housing Platform Architecture

## Product definition

Express Housing is not simply an apartment directory. It is the operating layer between:

- apartment-building partners such as Greystar and Bozzuto;
- physical furnished units leased or controlled by Express Housing;
- sales channels such as the Express Housing website, Airbnb, and Booking.com;
- guests who need a fast, low-friction path from search to arrival;
- the internal team that confirms reservations, prepares units, and releases access.

The product promise is: **find a suitable available home, reserve it, pay, and receive verified arrival instructions with as few decisions and handoffs as possible.**

## Primary customer journey

The direct-booking journey should converge on this flow:

1. Search Philadelphia by dates and guest count.
2. Select a suitable available home.
3. Confirm guest details and price.
4. Pay and verify the reservation.
5. Receive arrival instructions automatically when the stay is ready.

Account creation should happen inside checkout or through an email sign-in link, not as a separate journey that makes the guest start again.

## Current system

The repository is a functional prototype with:

- React single-page frontend;
- FastAPI backend;
- MongoDB persistence;
- JWT guest/admin authentication;
- seeded Philadelphia apartment listings;
- request-to-book reservations;
- basic date-conflict checks;
- wishlists;
- guest and admin dashboards;
- a basic admin availability calendar;
- simulated email records.

### What is useful and should remain

- The React/FastAPI split is adequate for the next phase.
- The `/api` boundary is straightforward.
- The public browse, detail, dashboard, and admin flows are useful prototypes.
- ISO date ranges and the existing overlap rule are a reasonable starting convention.
- MongoDB can support the early product if indexes, validation, and atomic reservation rules are added.

### What is prototype-only

- Apartment inventory, building data, physical units, and public listings are one record.
- Search dates were previously displayed but discarded before availability lookup.
- Every reservation is treated as a direct request; there is no channel identity or external reservation ID.
- There is no payment or refund lifecycle.
- Email is logged but never sent.
- Door, building, concierge, Wi-Fi, and parking instructions are not modeled.
- Pending requests block inventory indefinitely.
- The homepage and seed database contain unverified claims, reviews, addresses, pricing, and stock photography.
- The public repository contains demo credentials and unsafe development defaults.
- The backend is one large module and has no migration/versioning strategy.
- The current tests call an obsolete hosted preview and mutate shared data.
- Most files under `frontend/src/components/ui` and all care-themed videos are legacy artifacts from the previous product.

## Target domain model

### Building

The apartment community and partner relationship.

Core fields: `id`, `name`, `operator`, `address`, `city`, `timezone`, building amenities, check-in rules, concierge rules, partner contacts, status.

### Unit

A specific physical apartment Express Housing can sell.

Core fields: `id`, `building_id`, internal unit number, bedrooms, bathrooms, occupancy, floor, operational status, cleaning status, default access method.

The unit number and operational notes are private and must not be returned by public listing endpoints.

### Listing

The guest-facing merchandising record for one unit or an explicitly defined unit type.

Core fields: `id`, `unit_id`, title, description, verified photos, amenities, stay purposes, minimum/maximum stay, publish state, cancellation policy.

For this 40-unit portfolio, one public listing represents a building/bedroom inventory type and maps to five physical units. A reservation starts against the inventory type and receives one conflict-free physical unit before confirmation. The assigned unit must match the listing, be operational, contain its real unit number, pass the short-stay authorization rule when applicable, and have no overlapping assignment.

### Rate plan

Pricing rules independent from listing copy.

Core fields: nightly/monthly base rates, date overrides, fees, taxes, discounts, minimum stay, channel markup, currency, effective dates.

The server must always calculate and sign the final quote. The browser must never be the authority for price.

### Reservation

The single source of truth for stays from every channel.

Core fields: `id`, `unit_id`, `listing_id`, guest, source (`direct`, `airbnb`, `booking_com`, `manual`), external reference, check-in/out, status, hold expiry, quote snapshot, payment status, arrival status, timestamps.

External channel IDs must have unique indexes so webhook retries cannot create duplicates.

### Payment

A separate record of authorization, capture, refund, failure, and provider events.

No reservation should be considered paid because the frontend says it is paid. Payment-provider webhooks must drive final state.

### Guest access

Private, time-released instructions associated with a confirmed reservation and physical unit.

Core sections: building entry, unit entry, concierge/key pickup, parking, Wi-Fi, emergency contact, and checkout instructions.

Access secrets must be encrypted at rest, audited, limited to the correct guest/admin, and released only after the reservation and unit are ready. Email should link to the authenticated arrival page rather than contain a long-lived door code.

### Operations task

Cleaning, inspection, maintenance, restocking, or access-code verification tied to a unit and reservation. A reservation cannot become “arrival ready” until required tasks are complete.

### Message

An auditable outbound notification with template, channel, recipient, provider ID, delivery state, and reservation ID.

## Availability rules

- Search must filter on physical `unit_id`, not marketing title.
- Date ranges use `[check_in, check_out)`: check-in is occupied; check-out is available to the next stay after turnover rules.
- Confirmed reservations block inventory.
- Direct checkout creates a short hold with `expires_at`; expired holds must release automatically.
- Pending manual requests need an expiry and should not block forever.
- Channel events must be idempotent.
- The final availability check and reservation/hold write must be atomic to prevent double booking.
- Cleaning/turnover buffers must be configurable per unit or building.

## Integration boundary

Use adapters so the core reservation service is not coupled to one vendor:

- `PaymentProvider` for Stripe or a future processor;
- `EmailProvider` for Postmark, SendGrid, SES, or another service;
- `ChannelAdapter` for Airbnb, Booking.com, a channel manager, manual import, or iCalendar;
- `AccessProvider` for smart-lock vendors where available;
- `FileStore` for verified apartment photography and documents.

Airbnb and Booking.com integrations depend on the business accounts and partner access available. If direct APIs are unavailable, the preferred early architecture is one channel manager as the upstream source of truth rather than multiple fragile scrapers.

## Application boundaries

The FastAPI backend should be split into:

```text
backend/app/
  api/          HTTP routes and request/response schemas
  core/         configuration, security, logging
  domain/       entities, enums, business rules
  repositories/ MongoDB access and indexes
  services/     availability, quoting, reservations, access, messaging
  integrations/ payments, email, channels, smart locks
```

The frontend should be organized around product journeys rather than a large shared component catalog:

```text
frontend/src/
  app/          router, providers, route guards
  features/     search, listings, checkout, trips, arrival, admin
  components/   genuinely shared UI
  lib/          API client and formatting utilities
```

## Security baseline

- No public role selection during signup.
- No committed or default admin password.
- No default production JWT secret.
- Short-lived access tokens plus a secure session/refresh strategy.
- Rate limiting and audit logs for authentication and admin actions.
- Strict CORS allowlist.
- Encrypted access credentials and least-privilege access.
- Input validation, normalized email addresses, and strong password requirements.
- No medical details unless operationally necessary; sensitive notes need a retention policy.
- Authenticated, signed payment and channel webhooks.
- Database indexes for uniqueness and reservation lookup.

## Delivery sequence

### Phase 1 — trustworthy foundation

1. Make date search real and carry search context into booking.
2. Remove privilege escalation and unsafe configuration defaults.
3. Split building, unit, listing, and reservation identities.
4. Replace destructive demo seeding with controlled development fixtures.
5. Add repeatable local tests and CI.

### Phase 2 — direct booking

1. Server-side quotes including fees, taxes, policies, and expiry.
2. Checkout with embedded account creation or email sign-in.
3. Payment authorization/capture and webhooks.
4. Reservation holds and atomic availability.
5. Real transactional email.

### Phase 3 — arrival without calls

1. Admin arrival-instruction editor.
2. Encrypted, time-released guest arrival page.
3. Unit-readiness checklist and access verification.
4. Automated pre-arrival and day-of-arrival messaging.
5. Access audit log and emergency override.

### Phase 4 — channel operations

1. Confirm the channel manager/API strategy.
2. Import and reconcile Airbnb and Booking.com reservations.
3. Push availability/rates where contracts permit.
4. Detect conflicts and failed syncs in an operations inbox.
5. Reconcile payments, fees, modifications, and cancellations.

### Phase 5 — measured customer experience

Simplify the landing page and checkout using actual funnel data: search completion, listing selection, checkout starts, payment success, arrival-page access, and support contacts per reservation.

## Business inputs still required

- Actual buildings, operators, and physical units.
- Which unit details can be public and when the unit number may be revealed.
- Current Airbnb/Booking.com workflow and whether a channel manager is already used.
- Payment processor and deposit/cancellation/refund policy.
- Taxes, cleaning fees, security deposits, discounts, and long-stay rules.
- Real email domain/provider and support contacts.
- Exact access workflows for each building/unit.
- Timing rules for releasing access.
- Cleaning/inspection workflow and team roles.
- Real listing photos and permission to use building/operator assets.
- Languages, currencies, and identity-verification requirements for international guests.

The researched operating decisions, provisional pricing and specific launch gates are maintained in [`docs/operating-model.md`](./operating-model.md).
