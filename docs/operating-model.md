# Express Housing Operating Model

## Decision status

This document separates facts from proposals so the application never presents a researched assumption as a business-approved policy.

- **Supplied** — stated by Express Housing.
- **Verified** — confirmed from a primary public source.
- **Provisional** — a reasonable starting rule that still needs business approval.
- **Launch gate** — must be resolved before accepting real reservations.

## Portfolio

| Building | Address | Inventory | Source status |
| --- | --- | ---: | --- |
| Broad + Noble | 435 N Broad St, Philadelphia | 5 one-bedroom + 5 two-bedroom | Inventory supplied; address and amenities verified on the [official site](https://www.livebroadandnoble.com/amenities/) |
| The Hannah | 1306 Callowhill St, Philadelphia | 5 one-bedroom + 5 two-bedroom | Inventory supplied; address and amenities verified on the [official site](https://thehannahcallowhill.com/amenities/) |
| Edgewater II | 2323 Race St, Philadelphia | 5 one-bedroom + 5 two-bedroom | Inventory supplied; address and amenities verified on the [official site](https://edgewaterapthomes.com/amenities/) |
| 1500 Locust | 1500 Locust St, Philadelphia | 5 one-bedroom + 5 two-bedroom | Inventory supplied; address and amenities verified on the [official site](https://www.1500locustapartments.com/amenities) |

The application creates 40 physical unit records with clearly marked `TBD-` candidate numbers. These placeholders support testing and allocation but are never treated as real guest-facing unit numbers. Exact bathrooms, square footage, view, floor and furnishings remain unverified. Eight public inventory types—one- and two-bedroom at each building—sit above those units. A reservation receives a conflict-free physical unit before confirmation.

## Operating roles

- **Guest**: browses inventory, requests a stay and receives private arrival access only after payment and readiness.
- **Express Housing operations**: controls inventory, pricing, approvals, payment exceptions, cleaning and access release.
- **Building partner**: sees only contact, dates, party size, booking source, unit-assignment status and arrival-readiness data for stays in its assigned building. Payment data, private notes, trip or medical purpose, Door codes, Wi-Fi credentials and internal financial data are excluded by the API.

## Guest information by stage

### Hyatus comparison

The primary comparison is the live [Hyatus website](https://www.hyatus.com/). Its public journey asks for destination, dates and residents; separates business, medical and family stay paths; and routes guests through review rather than pretending every stay is immediately confirmed. A current [Philadelphia listing](https://www.hyatus.com/listing/thoughtfully-designed-apartment-in-old-city) publicly shows capacity, bedrooms, beds, bathrooms, amenities, house rules, check-in/out timing and review provenance, while keeping the exact address and access details private until confirmation. It also tells guests to select dates before showing the amount due and scheduled payments.

Express Housing adopts the useful operating principles—date-first search, complete pre-payment disclosure, private access data, channel-aware review provenance and a clear arrival handoff—but does not copy Hyatus wording, photography, reviews, layout or legal terms. Express Housing can show the building address when the building itself is the advertised product, while the physical unit number and credentials remain private.

### Before dates are selected

Show:

- building name and public street address;
- verified building amenities and official source;
- bedroom type, maximum guest policy, monthly rate, parking price;
- only verified photos of the actual unit, plus clearly labeled building-amenity photos when usage rights exist;
- house rules, cancellation summary, minimum stay, accessibility facts, and whether parking is available by request.

Do not show:

- unit number, door code, Wi-Fi password, private partner contact, or operational notes;
- an exact unit layout, bath count, view, or amenity that has not been verified;
- fabricated reviews or ratings.

### Before payment

Show the server-calculated quote, including accommodation, cleaning, parking if applicable, tax, total, cancellation terms, and the fact that a unit will be assigned. Collect guest identity/contact information and agreement to house rules. Do not expose access details.

### After payment, before readiness

Show reservation status, payment status, assigned building, dates, guest count, and when arrival details are scheduled for release. The exact unit number can remain hidden until the arrival window.

### After payment and readiness

Release through the authenticated guest portal:

- exact address and unit number;
- Door invitation email and official app instructions;
- time-limited building and apartment access window;
- building entry, concierge or key-pickup instructions;
- parking, Wi-Fi, support and checkout instructions;
- a fallback code only if the building workflow requires it.

Email should announce that access is ready and link to the portal. It should not contain a long-lived door code or any guest password.

## Door access

Latch is now Door. Existing Latch credentials can be used in the Door app, and the vendor documents phone, watch, keycard and Doorcode access on its [Latch-to-Door page](https://door.com/latch). Door's [migration instructions](https://support.door.com/hc/en-us/articles/39994004118295-I-used-to-use-the-Latch-App-how-do-I-switch-to-DOOR) state that existing access remains in place.

The production workflow is:

1. Assign a verified physical unit.
2. Confirm payment and identity checks.
3. Clean and inspect the unit.
4. Create scheduled Door access using the guest's own email and credentials.
5. Test the building and unit entry path.
6. Mark operations ready.
7. Release the authenticated arrival page at the configured time.
8. Revoke access at checkout and retain an audit event.

A daily or one-time code is not suitable as the only credential for a multi-night stay. The historical [Latch guest-access documentation](https://support.latch.com/hc/en-us/articles/15618823988247-Inviting-Guests-and-Revoking-Guest-Access) describes daily-code expiry and limited revocation, so scheduled app access should be primary and codes should be controlled fallbacks.

The codebase encrypts stored access codes and Wi-Fi passwords with a separate `ACCESS_ENCRYPTION_KEY`. It never asks for or stores a guest's Door password.

## Pricing, fees and taxes

### Supplied prices

- One-bedroom: $3,000 per 30-night month.
- Two-bedroom: $3,500 per 30-night month.
- Parking: $300 per month, subject to availability.

### Provisional short-stay prices

Until Express Housing approves a revenue plan or connects a dynamic-pricing provider:

- one-bedroom: $150/night;
- two-bedroom: $175/night;
- one-bedroom cleaning: $125/stay;
- two-bedroom cleaning: $175/stay.

The nightly amounts are transparent provisional multipliers of the supplied monthly economics, not copied competitor prices. Cleaning should ultimately be actual turnover cost plus any approved margin. The admin and guest interfaces label these values provisional.

For 30 nights or longer, the supplied monthly rate is prorated by `monthly_rate / 30 × nights`. Parking is prorated only for stays of 30 nights or longer. Short-stay parking is requested but excluded from the quote until Express Housing defines a daily rule.

Philadelphia's current Hotel Tax page states an 8.5% City tax and a 7% Commonwealth total, for 15.5% on stays under 30 days: [City of Philadelphia Hotel Tax](https://www.phila.gov/services/business-self-employment/business-taxes/hotel-tax/). Pennsylvania separately describes hotel occupancy tax for stays under 30 days and platform collection: [Pennsylvania home-sharing tax guidance](https://www.pa.gov/agencies/revenue/resources/tax-types-and-information/sales-use-and-hotel-occupancy-tax/home-sharing).

The quote engine therefore applies 15.5% to accommodation, cleaning and included parking for stays under 30 nights, and zero hotel occupancy tax for 30 nights or longer. This is configuration, not tax advice; the taxable base, platform remittance, exemptions and any rate change must be confirmed with a Philadelphia lodging-tax professional before payment launch.

## Cancellation proposal

This has not been implemented or approved. A balanced starting policy is:

- under 30 nights: full refund until seven days before check-in; 50% of accommodation from three to six days; non-refundable within 72 hours;
- 30 nights or longer: full refund until 30 days before check-in; after that, the first 30 nights are non-refundable;
- cleaning is refunded when the guest never checks in;
- channel reservations follow the cancellation policy displayed and accepted on that channel;
- approved refunds are returned only to the original payment method.

Hyatus provides a useful structural precedent: rates, taxes and fees are disclosed at booking; cancellation terms are shown at booking; identity verification may be required; and check-in information is supplied before arrival. Its [rental agreement](https://www.hyatus.com/rental-agreement) also makes clear that third-party platform terms can govern channel reservations. Express Housing should adopt the structure, not copy the text.

## Channel strategy

Do not build direct Airbnb and Booking.com integrations first.

- Airbnb's basic iCalendar import can update only every three hours, so it is not a safe real-time inventory authority for 40 units: [Airbnb calendar sync](https://www.airbnb.com/help/article/99).
- Airbnb supports full or pricing-and-availability synchronization through property-management/channel-management software: [Airbnb software sync options](https://www.airbnb.com/help/article/2348).
- Booking.com says it is not accepting direct connections from individual properties; properties should connect through a channel manager: [Booking.com Connectivity Portal](https://connect.booking.com/).

Recommended next integration phase: evaluate Hostaway and Guesty with Express Housing's actual Airbnb/Booking.com accounts, contract price, migration support, Door integration, webhook/API access and accounting requirements. Hostaway publicly identifies 15–49 listings as a supported portfolio tier and advertises direct Airbnb/Booking.com API synchronization: [Hostaway channel manager](https://www.hostaway.com/features/channel-manager/). This makes it a strong candidate, not an automatic selection.

The selected channel manager should become the external distribution source of truth. Express Housing remains the source of truth for guest portal access, internal unit readiness and private operational data. Every imported reservation needs a channel, external reservation ID, listing mapping, unit assignment, payment responsibility and idempotent event history.

## Compliance launch gates

Philadelphia classifies a non-primary residence rented for fewer than 30 days as Visitor Accommodation. The City says it needs permitted zoning and a hotel-designated rental license; permitted districts are limited and overlays may prohibit the use: [Philadelphia short-term rental guidance](https://www.phila.gov/2022-07-21-updated-guidance-on-required-zoning-permits-and-licenses-for-philadelphia-short-term-rentals-and-hosts/) and [short-term rental licensing page](https://www.phila.gov/services/permits-violations-licenses/rent-or-sell-property/rent-your-property-short-term/).

Before any one-night listing is published, obtain and record for every building/unit:

1. lease/partner authorization for transient or subleased stays;
2. zoning/use approval for Visitor Accommodation;
3. Commercial Activity License, BIRT account and hotel-designated rental license;
4. insurance that covers the operating model;
5. building-specific guest, concierge, parking and Door rules;
6. who remits each tax for direct, Airbnb and Booking.com reservations.

The application defaults `short_stay_authorized` to false and blocks assignment of an under-30-night reservation until an admin explicitly verifies it.

## Photography and content

The Express Housing operator explicitly authorized use of images from the four official building websites for this project. Building and model-home photos remain labeled as such and do not imply that a guest will receive the exact depicted unit. The exact furnished unit must still have its own verified image set before the listing publication gate is satisfied. Generated or unrelated stock interiors must never imply that they depict a bookable unit.

The current official-site preview assets and their exact URLs are recorded in [image-sources.md](image-sources.md). They are tagged `building_only` and do not satisfy the verified-unit photography launch gate.

## Integration decision record

The admin **Launch Setup** view is the operational source of truth for these decisions and must never contain passwords or API keys.

- **PMS/channel manager:** pilot Hostaway for Airbnb and Booking.com distribution. Do not purchase until a one-building demo proves multi-unit mapping, reservation/rate webhooks and the exact Booking.com connection.
- **Door access:** keep Door (formerly Latch) as the access source of truth. Door's published ePMS connections do not establish a Hostaway integration, so use the verified manual workflow until Door confirms an API or supported partner path.
- **Payments:** use Stripe PaymentIntents and signed server webhooks; card data must go directly to Stripe-hosted components.
- **Transactional email:** use Postmark after the Express Housing sending domain and sender are verified. Track delivery and bounces through idempotent webhooks.
- **Identity:** start with Stripe Identity only when the written booking policy requires it. Retain the minimum result and never collect medical details for building verification.
- **Channel listing IDs:** Airbnb and Booking.com IDs stay `not_connected` until an admin enters a real ID. No placeholder external IDs are generated.

## Placeholder unit-number rule

Changing a candidate number resets `unit_number_verified`. A `TBD-` number cannot be marked verified, and an arrival guide cannot be prepared or released until the assigned real number is verified. Building partners see an unverified candidate clearly labeled as such; guests never do.

## Remaining inputs from Express Housing

- The 40 real unit numbers (the one-/two-bedroom split is already supplied and modeled).
- Exact bathrooms, occupancy limits, floor plans and furnishings per unit.
- Signed short-stay authorization and license status per building/unit.
- Actual-unit photography; official building/model images are authorized for preview and source-recorded.
- Cleaning vendor cost, turnover time and inspection checklist.
- Approved cancellation, damage/deposit, pet, smoking, party, ID and age policies.
- Parking availability and the price/rule for stays under 30 nights.
- Current Airbnb and Booking.com listing IDs and account/channel-manager setup.
- Door property setup and whether scheduled guest access can be provisioned by API/PMS.
- Payment processor, support number, emergency escalation, transactional email domain and provider.
