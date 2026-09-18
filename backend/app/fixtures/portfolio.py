"""Verified portfolio facts and intentionally explicit unknowns.

This fixture contains only facts supplied by the business or published on each
building's official website. Candidate unit numbers are visibly marked as
placeholders until Express Housing verifies them. Official building/model
photography is never represented as photography of the assigned apartment.
"""

from __future__ import annotations

import uuid

from backend.app.services.pricing import NIGHTLY_RATES


PORTFOLIO_VERSION = "2026-08-18"


INTEGRATION_SETUP = [
    {
        "key": "pms_channel_manager",
        "category": "Reservations",
        "provider": "Hostaway (recommended pilot)",
        "status": "decision_required",
        "summary": "Connect Airbnb and Booking.com inventory, rates and reservations through one channel manager.",
        "next_step": "Run a vendor demo using one building and prove multi-unit mapping, webhooks and Booking.com connectivity before purchase.",
    },
    {
        "key": "door_access",
        "category": "Guest access",
        "provider": "Door (formerly Latch)",
        "status": "account_required",
        "summary": "Keep Door as the source of truth for time-bounded building and apartment access.",
        "next_step": "Confirm the property permissions and supported API or partner integration directly with Door; use the verified manual workflow until then.",
    },
    {
        "key": "payments",
        "category": "Payments",
        "provider": "Stripe Payments",
        "status": "account_required",
        "summary": "Use server-created PaymentIntents and signed webhooks; never accept card details in the Express Housing backend.",
        "next_step": "Open or select the business Stripe account, complete verification and add webhook credentials through environment secrets.",
    },
    {
        "key": "transactional_email",
        "category": "Guest communication",
        "provider": "Postmark",
        "status": "account_required",
        "summary": "Send booking, payment and arrival messages as transactional email with delivery/bounce tracking.",
        "next_step": "Verify the Express Housing sending domain, create a transactional stream and configure the API token as a secret.",
    },
    {
        "key": "identity_verification",
        "category": "Guest verification",
        "provider": "Stripe Identity (recommended first phase)",
        "status": "decision_required",
        "summary": "Request identity verification only where the booking policy requires it and retain the minimum result data.",
        "next_step": "Approve the verification policy and privacy notice before enabling it; do not collect medical details.",
    },
]


def stable_id(kind: str, slug: str) -> str:
    return str(uuid.uuid5(uuid.NAMESPACE_URL, f"expresshousing:{kind}:{slug}"))


BUILDINGS = [
    {
        "slug": "broad-and-noble",
        "name": "Broad + Noble",
        "address": "435 N Broad St",
        "neighborhood": "Callowhill",
        "website": "https://www.livebroadandnoble.com/",
        "amenities_source": "https://www.livebroadandnoble.com/amenities/",
        "amenities": [
            "24-hour concierge",
            "Fitness center",
            "Coworking spaces",
            "Resident lounges",
            "Rooftop deck and grills",
            "Package concierge",
            "Secured parking with EV charging",
            "Pet spa",
            "Bike storage",
        ],
    },
    {
        "slug": "the-hannah",
        "name": "The Hannah",
        "address": "1306 Callowhill St",
        "neighborhood": "Callowhill",
        "website": "https://thehannahcallowhill.com/",
        "amenities_source": "https://thehannahcallowhill.com/amenities/",
        "amenities": [
            "Garage parking",
            "Coworking space",
            "Resident lounge and community kitchen",
            "Conference and media room",
            "Fitness center and yoga studio",
            "Outdoor lounge and dining",
            "Package lockers",
            "Bike storage",
            "Smartphone access",
        ],
    },
    {
        "slug": "edgewater-2",
        "name": "Edgewater II",
        "address": "2323 Race St",
        "neighborhood": "Logan Square",
        "website": "https://edgewaterapthomes.com/",
        "amenities_source": "https://edgewaterapthomes.com/amenities/",
        "amenities": [
            "In-unit washer and dryer",
            "Fitness center and yoga studio",
            "Courtyard pool",
            "Roof deck",
            "Coworking lounge and business center",
            "Resident lounge with Wi-Fi",
            "Package lockers",
            "Outdoor grill and lounge",
            "Concierge and 24-hour maintenance",
            "Schuylkill River Trail access",
        ],
    },
    {
        "slug": "1500-locust",
        "name": "1500 Locust",
        "address": "1500 Locust St",
        "neighborhood": "Rittenhouse Square",
        "website": "https://www.1500locustapartments.com/",
        "amenities_source": "https://www.1500locustapartments.com/amenities",
        "amenities": [
            "Rooftop terrace and clubroom",
            "Indoor rooftop pool and jacuzzi",
            "Outdoor sundeck, cabanas and grills",
            "Media room with theater",
            "24-hour fitness center",
            "24-hour concierge and controlled access",
            "Garage parking",
            "Pet play area",
        ],
    },
]


BUILDING_IMAGES = {
    "broad-and-noble": [
        {
            "url": "/images/operator-portfolio/broad-noble-kitchen.jpg",
            "label": "Operator-supplied official model kitchen and dining imagery",
            "source_url": "https://www.livebroadandnoble.com/",
        },
        {
            "url": "/images/operator-portfolio/broad-noble-private-terrace.jpg",
            "label": "Operator-supplied official private-terrace imagery",
            "source_url": "https://www.livebroadandnoble.com/",
        },
        {
            "url": "/images/operator-portfolio/broad-noble-lobby.jpg",
            "label": "Operator-supplied official lobby imagery",
            "source_url": "https://www.livebroadandnoble.com/",
        },
        {
            "url": "/images/operator-portfolio/broad-noble-sky-deck.webp",
            "label": "Operator-supplied official sky-deck imagery",
            "source_url": "https://www.livebroadandnoble.com/",
        },
        {
            "url": "/images/operator-portfolio/broad-noble-gym.jpg",
            "label": "Operator-supplied official fitness-center imagery",
            "source_url": "https://www.livebroadandnoble.com/",
        },
        {
            "url": "/images/operator-portfolio/broad-noble-bar-lounge.webp",
            "label": "Operator-supplied official bar-lounge imagery",
            "source_url": "https://www.livebroadandnoble.com/",
        },
        {
            "url": "/images/operator-portfolio/broad-noble-study-lounge.webp",
            "label": "Operator-supplied official study-lounge imagery",
            "source_url": "https://www.livebroadandnoble.com/",
        },
    ],
    "the-hannah": [
        {
            "url": "/images/operator-portfolio/the-hannah-entrance.jpg",
            "label": "Operator-supplied official building-entrance imagery",
            "source_url": "https://thehannahcallowhill.com/",
        },
        {
            "url": "/images/operator-portfolio/clubhouse.jpg",
            "label": "Operator-supplied official clubhouse imagery",
            "source_url": "https://thehannahcallowhill.com/",
        },
        {
            "url": "/images/buildings/the-hannah/model-one-bedroom.jpg",
            "label": "Official one-bedroom model imagery",
            "source_url": "https://thehannahcallowhill.com/assets/images/cache/1bedroom-1W1-0228abb712c121d26f4c318d37356a52.jpg",
        },
    ],
    "edgewater-2": [
        {
            "url": "/images/buildings/edgewater-2/model-interior.jpg",
            "label": "Official model-home imagery",
            "source_url": "https://edgewaterapthomes.com/assets/images/cache/shoootin-photo-7-726c41e8d01e5629bc04d1b6d28dca76.jpg",
        },
        {
            "url": "/images/buildings/edgewater-2/building-amenity-1.jpg",
            "label": "Official building amenity imagery",
            "source_url": "https://edgewaterapthomes.com/assets/images/cache/10-8439fcc03e48c780bf969e2cd08e5bef.jpg",
        },
        {
            "url": "/images/buildings/edgewater-2/building-amenity-2.jpg",
            "label": "Official building amenity imagery",
            "source_url": "https://edgewaterapthomes.com/assets/images/cache/17-401212ba211cbbd1eb0e65e86bf02a91.jpg",
        },
    ],
    "1500-locust": [
        {
            "url": "/images/operator-portfolio/center-city-rooftop.webp",
            "label": "Operator-supplied official rooftop and Center City view imagery",
            "source_url": "https://www.1500locustapartments.com/",
        },
        {
            "url": "/images/operator-portfolio/bedroom-view.webp",
            "label": "Operator-supplied official model-bedroom imagery",
            "source_url": "https://www.1500locustapartments.com/",
        },
        {
            "url": "/images/buildings/1500-locust/rooftop-pool.jpg",
            "label": "Official rooftop indoor-pool imagery",
            "source_url": "https://irp.cdn-website.com/47bff720/dms3rep/multi/opt/1500+Locust+-+Rooftop+Indoor+Pool+2-2880w.jpg",
        },
    ],
}


def build_portfolio():
    buildings = []
    units = []
    listings = []

    for raw in BUILDINGS:
        building_id = stable_id("building", raw["slug"])
        building = {
            **raw,
            "id": building_id,
            "city": "Philadelphia",
            "state": "PA",
            "country": "US",
            "timezone": "America/New_York",
            "access_provider": "door",
            "short_stay_compliance": "verification_required",
            "partner_authorization": "verification_required",
            "photo_rights": "operator_authorized_official_site_use",
            "image_scope": "official_building_and_model_imagery",
            "images": BUILDING_IMAGES[raw["slug"]],
            "compliance": {
                "master_lease_or_owner_permission": "pending",
                "zoning_use_permit": "pending",
                "rental_license": "pending",
                "hotel_tax_account": "pending",
                "insurance_review": "pending",
            },
            "portfolio_version": PORTFOLIO_VERSION,
        }
        buildings.append(building)

        for bedrooms, code in ((1, "1br"), (2, "2br")):
            monthly_rate = 3000 if bedrooms == 1 else 3500
            nightly_rate = NIGHTLY_RATES[bedrooms]
            cleaning_fee = 125 if bedrooms == 1 else 175
            listing_slug = f"{raw['slug']}-{code}"
            listing_id = stable_id("listing", listing_slug)

            for index in range(1, 6):
                internal_label = f"{raw['slug'].upper()}-{code.upper()}-{index:02d}"
                placeholder_unit_number = f"TBD-{bedrooms}{index:02d}"
                units.append(
                    {
                        "id": stable_id("unit", internal_label),
                        "building_id": building_id,
                        "listing_id": listing_id,
                        "internal_label": internal_label,
                        "unit_number": placeholder_unit_number,
                        "unit_number_verified": False,
                        "bedrooms": bedrooms,
                        "bathrooms": None,
                        "max_guests": 2 if bedrooms == 1 else 4,
                        "monthly_rate": monthly_rate,
                        "parking_monthly": 300,
                        "operational_status": "setup_required",
                        "cleaning_status": "not_configured",
                        "access_status": "not_configured",
                        "short_stay_authorized": False,
                        "portfolio_version": PORTFOLIO_VERSION,
                    }
                )

            bedroom_word = "One-Bedroom" if bedrooms == 1 else "Two-Bedroom"
            listings.append(
                {
                    "id": listing_id,
                    "building_id": building_id,
                    "title": f"{raw['name']} {bedroom_word}",
                    "building_name": raw["name"],
                    "neighborhood": raw["neighborhood"],
                    "city": "Philadelphia, PA",
                    "address": raw["address"],
                    "apt_type": "1 Bedroom" if bedrooms == 1 else "2 Bedroom",
                    "bedrooms": bedrooms,
                    "bathrooms": None,
                    "bathrooms_label": "Varies by assigned unit",
                    "max_guests": 2 if bedrooms == 1 else 4,
                    "sqft": None,
                    "size_label": "Varies by assigned unit",
                    "nightly_rate": nightly_rate,
                    "monthly_rate": monthly_rate,
                    "cleaning_fee": cleaning_fee,
                    "parking_monthly": 300,
                    "tax_rate_short_stay": 0.155,
                    "description": (
                        f"A furnished {bedroom_word.lower()} stay at {raw['name']}. "
                        "Exact layout, view, finishes and unit number are confirmed for the assigned home."
                    ),
                    "amenities": raw["amenities"],
                    "images": [image["url"] for image in BUILDING_IMAGES[raw["slug"]]],
                    "photo_tour": [
                        {"url": image["url"], "room": image["label"]}
                        for image in BUILDING_IMAGES[raw["slug"]]
                    ],
                    "image_sources": BUILDING_IMAGES[raw["slug"]],
                    "image_scope": "building_and_model_not_assigned_unit",
                    "stay_paths": ["corporate", "medical", "family", "relocation", "leisure"],
                    "rating": 0,
                    "review_count": 0,
                    "reviews": [],
                    "is_featured": bedrooms == 1,
                    "is_new": True,
                    "min_nights": 1,
                    "inventory_count": 5,
                    "listing_status": "draft",
                    "booking_mode": "request",
                    "pricing_status": "provisional",
                    "photo_status": "building_only",
                    "compliance_status": "verification_required",
                    "accepting_reservations": False,
                    "official_website": raw["website"],
                    "amenities_source": raw["amenities_source"],
                    "channel_mappings": {
                        "airbnb": {"status": "not_connected", "listing_id": None},
                        "booking_com": {"status": "not_connected", "listing_id": None},
                    },
                    "portfolio_seed": True,
                    "portfolio_version": PORTFOLIO_VERSION,
                }
            )

    return buildings, units, listings
