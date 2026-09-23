import asyncio
import os
from datetime import date, datetime, timedelta, timezone

os.environ.setdefault("MONGO_URL", "mongodb://127.0.0.1:27017")
os.environ.setdefault("DB_NAME", "express_housing_test")
os.environ.setdefault("JWT_SECRET", "test-only-secret-that-is-never-used-in-production")
os.environ.setdefault("SEED_DEMO_DATA", "true")
os.environ.setdefault("SEED_PORTFOLIO_DATA", "false")
os.environ.setdefault("BOOTSTRAP_ADMIN_EMAIL", "architecture-admin@example.com")
os.environ.setdefault("BOOTSTRAP_ADMIN_PASSWORD", "architecture-admin-password")
os.environ.setdefault("ACCESS_ENCRYPTION_KEY", "MDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDAwMDA=")

from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient
from pydantic import ValidationError
import pytest

from backend import server


server.client.close()
server.client = AsyncMongoMockClient()
server.db = server.client["express_housing_test"]


def future_range(offset=30, nights=4):
    check_in = date.today() + timedelta(days=offset)
    check_out = check_in + timedelta(days=nights)
    return check_in.isoformat(), check_out.isoformat()


def register_guest(client, email):
    response = client.post(
        "/api/auth/signup",
        json={
            "name": "Architecture Test Guest",
            "email": email,
            "password": "strong-test-password",
            "role": "admin",
        },
    )
    assert response.status_code == 200
    return response.json()


def test_arrival_guide_accepts_only_https_youtube_walkthroughs():
    with pytest.raises(ValidationError, match="valid HTTPS YouTube"):
        server.ArrivalGuideUpsert(
            unit_id="unit-test",
            building_entry_instructions="Enter through the lobby.",
            unit_entry_instructions="Use the apartment door.",
            walkthrough_video_url="https://example.com/not-a-youtube-video",
            release_at=datetime.now(timezone.utc),
        )


def test_public_signup_cannot_choose_admin_role():
    with TestClient(server.app) as client:
        registration = register_guest(client, "role-check@example.com")

    assert registration["user"]["role"] == "guest"


def test_date_search_excludes_conflicting_unit_and_allows_adjacent_stay():
    with TestClient(server.app) as client:
        apartments = client.get("/api/apartments").json()
        apartment = apartments[0]
        registration = register_guest(client, "availability-check@example.com")
        token = registration["access_token"]
        check_in, check_out = future_range()

        booking = client.post(
            "/api/bookings",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "apartment_id": apartment["id"],
                "check_in": check_in,
                "check_out": check_out,
                "guests": 1,
                "purpose": "medical",
            },
        )
        assert booking.status_code == 200

        same_dates = client.get(
            "/api/apartments",
            params={"check_in": check_in, "check_out": check_out},
        )
        assert same_dates.status_code == 200
        assert apartment["id"] not in {item["id"] for item in same_dates.json()}

        adjacent_out = (date.fromisoformat(check_out) + timedelta(days=3)).isoformat()
        adjacent = client.get(
            "/api/apartments",
            params={"check_in": check_out, "check_out": adjacent_out},
        )
        assert adjacent.status_code == 200
        assert apartment["id"] in {item["id"] for item in adjacent.json()}


def test_date_search_requires_a_complete_valid_range():
    with TestClient(server.app) as client:
        check_in, _ = future_range(offset=45)
        response = client.get("/api/apartments", params={"check_in": check_in})

    assert response.status_code == 400
    assert response.json()["detail"] == "Check-in and check-out must be provided together"


def test_verified_reservation_can_release_encrypted_arrival_details():
    with TestClient(server.app) as client:
        admin_login = client.post(
            "/api/auth/login",
            json={"email": "architecture-admin@example.com", "password": "architecture-admin-password"},
        )
        assert admin_login.status_code == 200
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
        seeded = client.post("/api/seed", headers=admin_headers)
        assert seeded.status_code == 200

        portfolio = client.get("/api/admin/portfolio", headers=admin_headers).json()
        listing = portfolio["listings"][0]
        unit = next(row for row in portfolio["units"] if row["listing_id"] == listing["id"])
        unit_update = client.patch(
            f"/api/admin/units/{unit['id']}",
            headers=admin_headers,
            json={
                "unit_number": "TEST-101",
                "unit_number_verified": True,
                "operational_status": "active",
                "cleaning_status": "ready",
                "access_status": "verified",
                "short_stay_authorized": True,
            },
        )
        assert unit_update.status_code == 200
        listing_update = client.patch(
            f"/api/admin/listings/{listing['id']}",
            headers=admin_headers,
            json={
                "images": ["https://example.com/test-only-verified-unit.jpg"],
                "pricing_status": "approved",
                "photo_status": "verified",
                "compliance_status": "approved",
                "listing_status": "published",
                "accepting_reservations": True,
            },
        )
        assert listing_update.status_code == 200

        guest = register_guest(client, "arrival-check@example.com")
        guest_headers = {"Authorization": f"Bearer {guest['access_token']}"}
        check_in, check_out = future_range(offset=90, nights=3)
        booking_response = client.post(
            "/api/bookings",
            headers=guest_headers,
            json={
                "apartment_id": listing["id"],
                "check_in": check_in,
                "check_out": check_out,
                "guests": 1,
                "purpose": "medical",
            },
        )
        assert booking_response.status_code == 200
        booking = booking_response.json()

        assigned = client.patch(
            f"/api/admin/bookings/{booking['id']}/assignment",
            headers=admin_headers,
            json={"unit_id": unit["id"]},
        )
        assert assigned.status_code == 200
        assert client.patch(
            f"/api/admin/bookings/{booking['id']}",
            headers=admin_headers,
            json={"status": "confirmed"},
        ).status_code == 200
        assert client.patch(
            f"/api/admin/bookings/{booking['id']}/payment",
            headers=admin_headers,
            json={"payment_status": "paid"},
        ).status_code == 200

        access_start = f"{check_in}T19:00:00Z"
        access_end = f"{check_out}T15:00:00Z"
        arrival = client.put(
            f"/api/admin/bookings/{booking['id']}/arrival",
            headers=admin_headers,
            json={
                "unit_id": unit["id"],
                "building_entry_instructions": "Use the scheduled Door invitation.",
                "unit_entry_instructions": "Open the assigned apartment in Door.",
                "concierge_instructions": "Check in with the lobby team after 3 PM.",
                "parking_instructions": "Use the reserved garage space shown in your confirmation.",
                "mail_instructions": "Packages are held by the package concierge.",
                "trash_instructions": "The trash room is across from the elevators.",
                "checkout_instructions": "Leave by 11 AM and close the apartment door behind you.",
                "walkthrough_video_url": "https://youtu.be/dQw4w9WgXcQ",
                "walkthrough_instructions": "Watch this before arrival, then follow the written entry steps below.",
                "wifi_name": "TEST-WIFI",
                "wifi_password": "test-wifi-password",
                "access_code": "8642",
                "door_invite_email": "arrival-check@example.com",
                "access_start": access_start,
                "access_end": access_end,
                "release_at": datetime.now(timezone.utc).isoformat(),
                "operations_ready": True,
                "release_now": True,
            },
        )
        assert arrival.status_code == 200

        guest_arrival = client.get(f"/api/bookings/{booking['id']}/arrival", headers=guest_headers)
        assert guest_arrival.status_code == 200
        assert guest_arrival.json()["available"] is True
        assert guest_arrival.json()["unit_number"] == "TEST-101"
        assert guest_arrival.json()["access_code"] == "8642"
        assert guest_arrival.json()["wifi_password"] == "test-wifi-password"
        assert guest_arrival.json()["concierge_instructions"] == "Check in with the lobby team after 3 PM."
        assert guest_arrival.json()["parking_instructions"] == "Use the reserved garage space shown in your confirmation."
        assert guest_arrival.json()["mail_instructions"] == "Packages are held by the package concierge."
        assert guest_arrival.json()["trash_instructions"] == "The trash room is across from the elevators."
        assert guest_arrival.json()["checkout_instructions"] == "Leave by 11 AM and close the apartment door behind you."
        assert guest_arrival.json()["walkthrough_video_url"] == "https://youtu.be/dQw4w9WgXcQ"
        assert guest_arrival.json()["walkthrough_instructions"] == "Watch this before arrival, then follow the written entry steps below."


def test_building_partner_is_scoped_and_receives_only_minimum_guest_data():
    with TestClient(server.app) as client:
        admin_login = client.post(
            "/api/auth/login",
            json={"email": "architecture-admin@example.com", "password": "architecture-admin-password"},
        )
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
        assert client.post("/api/seed", headers=admin_headers).status_code == 200
        portfolio = client.get("/api/admin/portfolio", headers=admin_headers).json()
        allowed_building, other_building = portfolio["buildings"][:2]

        created = client.post(
            "/api/admin/partners",
            headers=admin_headers,
            json={
                "name": "Front Desk Partner",
                "email": "front-desk@example.com",
                "password": "partner-test-password",
                "phone": "+1 215 555 0100",
                "building_ids": [allowed_building["id"]],
            },
        )
        assert created.status_code == 200
        booking_base = {
            "apartment_title": "Test One Bedroom",
            "user_name": "Scoped Guest",
            "user_email": "scoped-guest@example.com",
            "user_phone": "+1 215 555 0199",
            "check_in": "2030-01-10",
            "check_out": "2030-01-15",
            "nights": 5,
            "guests": 2,
            "status": "confirmed",
            "source": "direct",
            "arrival_status": "ready",
            "payment_status": "paid",
            "total_price": 9999,
            "quote_snapshot": {"secret": "not-for-building"},
            "purpose": "medical",
            "notes": "private guest note",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        asyncio.run(server.db.bookings.insert_many([
            {**booking_base, "id": "partner-visible-booking", "building_id": allowed_building["id"], "unit_id": None},
            {**booking_base, "id": "partner-hidden-booking", "building_id": other_building["id"], "unit_id": None},
        ]))

        login = client.post(
            "/api/auth/login",
            json={"email": "front-desk@example.com", "password": "partner-test-password"},
        )
        partner_headers = {"Authorization": f"Bearer {login.json()['access_token']}"}
        response = client.get("/api/partner/summary", headers=partner_headers)
        assert response.status_code == 200
        payload = response.json()
        assert [building["id"] for building in payload["buildings"]] == [allowed_building["id"]]
        assert payload["units"]
        assert all(unit["building_id"] == allowed_building["id"] for unit in payload["units"])
        assert all(set(unit).issubset({"id", "building_id", "internal_label", "unit_number", "unit_number_verified"}) for unit in payload["units"])
        visible_ids = {booking["id"] for booking in payload["bookings"]}
        assert "partner-visible-booking" in visible_ids
        assert "partner-hidden-booking" not in visible_ids
        assert all(booking["building_id"] == allowed_building["id"] for booking in payload["bookings"])
        for visible in payload["bookings"]:
            for forbidden in ("payment_status", "total_price", "quote_snapshot", "purpose", "notes"):
                assert forbidden not in visible


def test_legacy_apartment_without_tax_rate_field_still_quotes_full_tax():
    with TestClient(server.app) as client:
        admin_login = client.post(
            "/api/auth/login",
            json={"email": "architecture-admin@example.com", "password": "architecture-admin-password"},
        )
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
        assert client.post("/api/seed", headers=admin_headers).status_code == 200
        portfolio = client.get("/api/admin/portfolio", headers=admin_headers).json()
        listing_id = portfolio["listings"][0]["id"]

        # Simulate a pre-existing record that predates the tax_rate_short_stay
        # field entirely, rather than one that explicitly opted into 0%.
        asyncio.run(server.db.apartments.update_one(
            {"id": listing_id}, {"$unset": {"tax_rate_short_stay": ""}}
        ))

        check_in, check_out = future_range(offset=60, nights=3)
        quote = client.post(
            "/api/quotes",
            json={"apartment_id": listing_id, "check_in": check_in, "check_out": check_out},
        )
        assert quote.status_code == 200
        payload = quote.json()
        assert payload["tax_rate"] == 0.155
        assert payload["taxes"] > 0


def test_archived_listing_cannot_be_booked():
    with TestClient(server.app) as client:
        admin_login = client.post(
            "/api/auth/login",
            json={"email": "architecture-admin@example.com", "password": "architecture-admin-password"},
        )
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
        assert client.post("/api/seed", headers=admin_headers).status_code == 200
        portfolio = client.get("/api/admin/portfolio", headers=admin_headers).json()
        listing_id = portfolio["listings"][0]["id"]

        asyncio.run(server.db.apartments.update_one(
            {"id": listing_id}, {"$set": {"is_archived": True, "accepting_reservations": True}}
        ))

        guest = register_guest(client, "archived-listing-check@example.com")
        guest_headers = {"Authorization": f"Bearer {guest['access_token']}"}
        check_in, check_out = future_range(offset=70, nights=3)
        booking = client.post(
            "/api/bookings",
            headers=guest_headers,
            json={"apartment_id": listing_id, "check_in": check_in, "check_out": check_out, "guests": 1, "purpose": "leisure"},
        )
        assert booking.status_code == 404


def test_scheduled_release_unlocks_automatically_once_release_time_passes():
    with TestClient(server.app) as client:
        admin_login = client.post(
            "/api/auth/login",
            json={"email": "architecture-admin@example.com", "password": "architecture-admin-password"},
        )
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
        assert client.post("/api/seed", headers=admin_headers).status_code == 200

        portfolio = client.get("/api/admin/portfolio", headers=admin_headers).json()
        listing = portfolio["listings"][0]
        unit = next(row for row in portfolio["units"] if row["listing_id"] == listing["id"])
        assert client.patch(
            f"/api/admin/units/{unit['id']}",
            headers=admin_headers,
            json={
                "unit_number": "TEST-202",
                "unit_number_verified": True,
                "operational_status": "active",
                "cleaning_status": "ready",
                "access_status": "verified",
                "short_stay_authorized": True,
            },
        ).status_code == 200
        assert client.patch(
            f"/api/admin/listings/{listing['id']}",
            headers=admin_headers,
            json={
                "images": ["https://example.com/test-only-verified-unit.jpg"],
                "pricing_status": "approved",
                "photo_status": "verified",
                "compliance_status": "approved",
                "listing_status": "published",
                "accepting_reservations": True,
            },
        ).status_code == 200

        guest = register_guest(client, "scheduled-release-check@example.com")
        guest_headers = {"Authorization": f"Bearer {guest['access_token']}"}
        check_in, check_out = future_range(offset=95, nights=3)
        booking = client.post(
            "/api/bookings",
            headers=guest_headers,
            json={"apartment_id": listing["id"], "check_in": check_in, "check_out": check_out, "guests": 1, "purpose": "medical"},
        ).json()

        assert client.patch(
            f"/api/admin/bookings/{booking['id']}/assignment",
            headers=admin_headers,
            json={"unit_id": unit["id"]},
        ).status_code == 200
        assert client.patch(
            f"/api/admin/bookings/{booking['id']}",
            headers=admin_headers,
            json={"status": "confirmed"},
        ).status_code == 200
        assert client.patch(
            f"/api/admin/bookings/{booking['id']}/payment",
            headers=admin_headers,
            json={"payment_status": "paid"},
        ).status_code == 200

        # A scheduled (not release_now) release whose release_at has already
        # elapsed should unlock on its own, without a follow-up manual release.
        past_release_at = (datetime.now(timezone.utc) - timedelta(hours=1)).isoformat()
        arrival = client.put(
            f"/api/admin/bookings/{booking['id']}/arrival",
            headers=admin_headers,
            json={
                "unit_id": unit["id"],
                "building_entry_instructions": "Enter through the lobby.",
                "unit_entry_instructions": "Use the apartment door.",
                "access_start": f"{check_in}T19:00:00Z",
                "access_end": f"{check_out}T15:00:00Z",
                "release_at": past_release_at,
                "operations_ready": True,
                "release_now": False,
            },
        )
        assert arrival.status_code == 200
        assert arrival.json()["arrival_status"] == "ready"

        guest_arrival = client.get(f"/api/bookings/{booking['id']}/arrival", headers=guest_headers)
        assert guest_arrival.status_code == 200
        assert guest_arrival.json()["available"] is True


def test_placeholder_unit_can_be_assigned_but_cannot_release_arrival_details():
    with TestClient(server.app) as client:
        admin_login = client.post(
            "/api/auth/login",
            json={"email": "architecture-admin@example.com", "password": "architecture-admin-password"},
        )
        admin_headers = {"Authorization": f"Bearer {admin_login.json()['access_token']}"}
        assert client.post("/api/seed", headers=admin_headers).status_code == 200
        portfolio = client.get("/api/admin/portfolio", headers=admin_headers).json()
        listing = portfolio["listings"][0]
        unit = next(row for row in portfolio["units"] if row["listing_id"] == listing["id"] and not row["unit_number_verified"])
        assert client.patch(
            f"/api/admin/units/{unit['id']}",
            headers=admin_headers,
            json={"operational_status": "active", "short_stay_authorized": True},
        ).status_code == 200
        booking = {
            "id": "placeholder-assignment-booking",
            "user_id": "placeholder-guest",
            "user_name": "Placeholder Guest",
            "user_email": "placeholder@example.com",
            "apartment_id": listing["id"],
            "building_id": listing["building_id"],
            "unit_id": None,
            "apartment_title": listing["title"],
            "check_in": "2030-03-10",
            "check_out": "2030-03-12",
            "nights": 2,
            "guests": 1,
            "status": "confirmed",
            "source": "manual",
            "payment_status": "paid",
            "arrival_status": "not_ready",
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        asyncio.run(server.db.bookings.insert_one(booking))
        assigned = client.patch(
            f"/api/admin/bookings/{booking['id']}/assignment",
            headers=admin_headers,
            json={"unit_id": unit["id"]},
        )
        assert assigned.status_code == 200
        arrival = client.put(
            f"/api/admin/bookings/{booking['id']}/arrival",
            headers=admin_headers,
            json={
                "unit_id": unit["id"],
                "building_entry_instructions": "Door invitation",
                "unit_entry_instructions": "Door invitation",
                "access_start": "2030-03-10T19:00:00Z",
                "access_end": "2030-03-12T15:00:00Z",
                "release_at": datetime.now(timezone.utc).isoformat(),
                "operations_ready": True,
                "release_now": True,
            },
        )
        assert arrival.status_code == 400
        assert "Verify the assigned unit's real number" in arrival.json()["detail"]


def admin_headers(client):
    login = client.post(
        "/api/auth/login",
        json={"email": "architecture-admin@example.com", "password": "architecture-admin-password"},
    )
    assert login.status_code == 200
    return {"Authorization": f"Bearer {login.json()['access_token']}"}


def test_support_thread_is_private_to_its_guest_and_reaches_the_admin_inbox():
    with TestClient(server.app) as client:
        alice = register_guest(client, "support-alice@example.com")
        bob = register_guest(client, "support-bob@example.com")
        alice_headers = {"Authorization": f"Bearer {alice['access_token']}"}
        bob_headers = {"Authorization": f"Bearer {bob['access_token']}"}

        sent = client.post("/api/support/messages", headers=alice_headers, json={"body": "  The key fob stopped working.  "})
        assert sent.status_code == 200
        assert sent.json()["body"] == "The key fob stopped working."
        assert sent.json()["sender"] == "guest"

        client.post("/api/support/messages", headers=bob_headers, json={"body": "Can I check in early?"})

        # Each guest sees only their own thread.
        alice_thread = client.get("/api/support/messages", headers=alice_headers).json()["messages"]
        assert [m["body"] for m in alice_thread] == ["The key fob stopped working."]

        # The admin sees both, each carrying one unread.
        headers = admin_headers(client)
        inbox = client.get("/api/admin/support/threads", headers=headers).json()
        assert inbox["unread_total"] == 2
        by_email = {row["user_email"]: row for row in inbox["threads"]}
        assert by_email["support-alice@example.com"]["unread"] == 1
        assert by_email["support-alice@example.com"]["last_message"] == "The key fob stopped working."

        # Opening one thread clears only that guest's unread count.
        alice_id = by_email["support-alice@example.com"]["user_id"]
        opened = client.get(f"/api/admin/support/threads/{alice_id}", headers=headers)
        assert opened.status_code == 200
        assert [m["sender"] for m in opened.json()["messages"]] == ["guest"]
        assert client.get("/api/admin/support/threads", headers=headers).json()["unread_total"] == 1

        # The reply lands in that guest's thread, and nobody else's.
        reply = client.post(f"/api/admin/support/threads/{alice_id}", headers=headers, json={"body": "A new fob is waiting at the desk."})
        assert reply.status_code == 200
        assert reply.json()["sender"] == "admin"

        assert client.get("/api/support/unread", headers=alice_headers).json()["unread"] == 1
        assert client.get("/api/support/unread", headers=bob_headers).json()["unread"] == 0

        alice_thread = client.get("/api/support/messages", headers=alice_headers).json()["messages"]
        assert [(m["sender"], m["body"]) for m in alice_thread] == [
            ("guest", "The key fob stopped working."),
            ("admin", "A new fob is waiting at the desk."),
        ]
        # Reading the thread clears the guest's own badge.
        assert client.get("/api/support/unread", headers=alice_headers).json()["unread"] == 0

        bob_thread = client.get("/api/support/messages", headers=bob_headers).json()["messages"]
        assert [m["body"] for m in bob_thread] == ["Can I check in early?"]


def test_support_endpoints_reject_anonymous_blank_and_non_admin_callers():
    with TestClient(server.app) as client:
        guest = register_guest(client, "support-guard@example.com")
        guest_headers = {"Authorization": f"Bearer {guest['access_token']}"}

        assert client.get("/api/support/messages").status_code == 401
        assert client.post("/api/support/messages", json={"body": "hello"}).status_code == 401

        # A guest cannot read the inbox or answer on behalf of support.
        assert client.get("/api/admin/support/threads", headers=guest_headers).status_code == 403
        assert client.post(
            f"/api/admin/support/threads/{guest['user']['id']}",
            headers=guest_headers,
            json={"body": "approved"},
        ).status_code == 403

        # Whitespace-only passes the length check, so the strip guard rejects it.
        blank = client.post("/api/support/messages", headers=guest_headers, json={"body": "   "})
        assert blank.status_code == 400
        assert blank.json()["detail"] == "Message cannot be empty"
        # An entirely empty body is caught earlier, by validation.
        assert client.post("/api/support/messages", headers=guest_headers, json={"body": ""}).status_code == 422

        headers = admin_headers(client)
        assert client.get("/api/admin/support/threads/does-not-exist", headers=headers).status_code == 404
        assert client.post(
            "/api/admin/support/threads/does-not-exist",
            headers=headers,
            json={"body": "hello"},
        ).status_code == 404
