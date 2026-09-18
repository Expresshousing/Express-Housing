from backend.app.fixtures.portfolio import build_portfolio
from backend.app.services.pricing import calculate_quote


def test_portfolio_contains_four_buildings_and_forty_units():
    buildings, units, listings = build_portfolio()

    assert len(buildings) == 4
    assert len(units) == 40
    assert len(listings) == 8
    assert sum(unit["bedrooms"] == 1 for unit in units) == 20
    assert sum(unit["bedrooms"] == 2 for unit in units) == 20
    assert all(unit["unit_number"].startswith("TBD-") for unit in units)
    assert all(unit["unit_number_verified"] is False for unit in units)
    assert all(not unit["short_stay_authorized"] for unit in units)
    assert all(not listing["accepting_reservations"] for listing in listings)
    assert all(listing["photo_status"] == "building_only" for listing in listings)
    assert all(len(listing["images"]) >= 3 for listing in listings)
    broad_and_noble = next(listing for listing in listings if listing["building_name"] == "Broad + Noble")
    assert len(broad_and_noble["images"]) == 7
    assert all(image.startswith("/images/operator-portfolio/") for image in broad_and_noble["images"])


def test_short_stay_quote_includes_cleaning_and_155_percent_tax():
    quote = calculate_quote(
        nights=2,
        nightly_rate=150,
        monthly_rate=3000,
        cleaning_fee=125,
    ).as_dict()

    assert quote["rate_mode"] == "nightly"
    assert quote["accommodation"] == 300
    assert quote["cleaning_fee"] == 125
    assert quote["tax_rate"] == 0.155
    assert quote["taxes"] == 65.88
    assert quote["total"] == 490.88


def test_thirty_night_quote_uses_monthly_rate_without_hotel_tax():
    quote = calculate_quote(
        nights=30,
        nightly_rate=175,
        monthly_rate=3500,
        cleaning_fee=175,
        parking_monthly=300,
        parking_requested=True,
    ).as_dict()

    assert quote["rate_mode"] == "monthly_prorated"
    assert quote["accommodation"] == 3500
    assert quote["parking_fee"] == 300
    assert quote["tax_rate"] == 0
    assert quote["taxes"] == 0
    assert quote["total"] == 3975


def test_all_portfolio_listings_use_approved_nightly_rates_in_quotes():
    _, _, listings = build_portfolio()
    for listing in listings:
        expected_rate = {1: 250, 2: 350}[listing["bedrooms"]]
        assert listing["nightly_rate"] == expected_rate
        quote = calculate_quote(
            nights=3,
            nightly_rate=listing["nightly_rate"],
            monthly_rate=listing["monthly_rate"],
            cleaning_fee=listing["cleaning_fee"],
        ).as_dict()
        assert quote["accommodation"] == expected_rate * 3


def test_saved_apartment_rate_update_is_idempotent_and_preserves_other_prices():
    import asyncio
    from mongomock_motor import AsyncMongoMockClient
    from backend.app.services.pricing import update_apartment_nightly_rates

    async def check():
        client = AsyncMongoMockClient()
        db = client["nightly_rate_update_test"]
        await db.apartments.insert_many([
            {"id": "one", "bedrooms": 1, "nightly_rate": 150, "monthly_rate": 3000, "cleaning_fee": 125},
            {"id": "two", "bedrooms": 2, "nightly_rate": 175, "monthly_rate": 3500, "cleaning_fee": 175},
            {"id": "studio", "bedrooms": 0, "nightly_rate": 119},
        ])
        await db.bookings.insert_one({"id": "existing", "total": 490.88})
        assert await update_apartment_nightly_rates(db) == 2
        one = await db.apartments.find_one({"id": "one"})
        two = await db.apartments.find_one({"id": "two"})
        assert (one["nightly_rate"], two["nightly_rate"]) == (250, 350)
        assert (one["monthly_rate"], two["monthly_rate"]) == (3000, 3500)
        assert (one["cleaning_fee"], two["cleaning_fee"]) == (125, 175)
        assert (await db.apartments.find_one({"id": "studio"}))["nightly_rate"] == 119
        assert (await db.bookings.find_one({"id": "existing"}))["total"] == 490.88
        assert await update_apartment_nightly_rates(db) == 0
        await db.apartments.update_one({"id": "one"}, {"$set": {"nightly_rate": 275}})
        assert await update_apartment_nightly_rates(db) == 0
        assert (await db.apartments.find_one({"id": "one"}))["nightly_rate"] == 275
        client.close()

    asyncio.run(check())
