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
