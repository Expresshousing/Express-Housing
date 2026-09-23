from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from starlette.concurrency import run_in_threadpool
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import OperationFailure
import os
import re
import asyncio
import logging
import requests
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, field_validator, model_validator
from typing import Any, List, Optional, Literal
import uuid
from datetime import datetime, timezone, date, timedelta
from zoneinfo import ZoneInfo
import bcrypt
import jwt
from jwt.exceptions import InvalidTokenError
from cryptography.fernet import Fernet, InvalidToken

from backend.app.fixtures.portfolio import INTEGRATION_SETUP, PORTFOLIO_VERSION, build_portfolio
from backend.app.services.pricing import NIGHTLY_RATES, calculate_quote, update_apartment_nightly_rates

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET')
if not JWT_SECRET:
    raise RuntimeError("JWT_SECRET is required. Copy backend/.env.example to backend/.env and set a strong secret.")
JWT_ALGORITHM = 'HS256'

CORS_ORIGINS = [
    origin.strip()
    for origin in os.environ.get(
        "CORS_ORIGINS",
        "http://localhost:3000,http://127.0.0.1:3000",
    ).split(",")
    if origin.strip()
]
SEED_DEMO_DATA = os.environ.get("SEED_DEMO_DATA", "false").lower() == "true"
SEED_PORTFOLIO_DATA = os.environ.get("SEED_PORTFOLIO_DATA", "false").lower() == "true"
ACCESS_ENCRYPTION_KEY = os.environ.get("ACCESS_ENCRYPTION_KEY", "").strip()
RESEND_API_KEY = os.environ.get("RESEND_API_KEY", "").strip()
RESEND_FROM_EMAIL = os.environ.get("RESEND_FROM_EMAIL", "Express Housing <onboarding@resend.dev>").strip()

app = FastAPI(title="Express Housing API")
api_router = APIRouter(prefix="/api")

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ===== MODELS =====
class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    name: str
    role: Literal["guest", "admin", "building_partner"] = "guest"
    phone: Optional[str] = None

class UserCreate(BaseModel):
    """Public registration input. Roles are intentionally not client-selectable."""
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    name: str = Field(min_length=1, max_length=100)
    password: str = Field(min_length=8, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=30)

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class ApartmentBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    title: str
    building_name: str
    neighborhood: str
    city: str = "Philadelphia, PA"
    address: str = ""
    apt_type: str  # Studio, 1 Bedroom, 2 Bedroom, 3 Bedroom, Penthouse
    bedrooms: int
    bathrooms: Optional[float] = None
    bathrooms_label: Optional[str] = None
    max_guests: int
    sqft: Optional[int] = None
    size_label: Optional[str] = None
    nightly_rate: float
    monthly_rate: float
    cleaning_fee: float = 0
    parking_monthly: float = 0
    tax_rate_short_stay: Optional[float] = None
    description: str = ""
    amenities: List[str] = Field(default_factory=list)
    images: List[str] = Field(default_factory=list)
    stay_paths: List[str] = Field(default_factory=list)  # corporate, medical, family
    rating: float = 4.8
    review_count: int = 0
    is_featured: bool = False
    is_new: bool = False
    min_nights: int = 2
    reviews: List[dict] = Field(default_factory=list)
    photo_tour: List[dict] = Field(default_factory=list)  # [{url, room}]
    building_id: Optional[str] = None
    inventory_count: int = 1
    listing_status: Literal["draft", "published", "archived"] = "published"
    booking_mode: Literal["request", "instant"] = "request"
    pricing_status: Literal["provisional", "approved"] = "provisional"
    photo_status: Literal["required", "building_only", "verified"] = "required"
    compliance_status: Literal["verification_required", "approved"] = "verification_required"
    accepting_reservations: bool = True
    official_website: Optional[str] = None
    amenities_source: Optional[str] = None
    image_scope: Optional[str] = None
    image_sources: List[dict] = Field(default_factory=list)
    channel_mappings: dict = Field(default_factory=dict)
    portfolio_seed: bool = False
    portfolio_version: Optional[str] = None

class Apartment(ApartmentBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BookingCreate(BaseModel):
    apartment_id: str
    check_in: str   # YYYY-MM-DD
    check_out: str  # YYYY-MM-DD
    guests: int = 1
    purpose: str = "leisure"  # business, medical, family, relocation, leisure
    notes: Optional[str] = None
    parking_requested: bool = False

class Booking(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    user_name: str = ""
    user_email: str = ""
    user_phone: Optional[str] = None
    apartment_id: str
    building_id: Optional[str] = None
    unit_id: Optional[str] = None
    apartment_title: str = ""
    apartment_image: str = ""
    neighborhood: str = ""
    check_in: str
    check_out: str
    nights: int = 1
    guests: int = 1
    purpose: str = "leisure"
    notes: Optional[str] = None
    status: str = "pending"  # pending, confirmed, completed, cancelled
    source: Literal["direct", "airbnb", "booking_com", "manual"] = "direct"
    external_reference: Optional[str] = None
    payment_status: Literal["not_started", "authorized", "paid", "partially_refunded", "refunded", "failed"] = "not_started"
    arrival_status: Literal["not_ready", "ready", "released"] = "not_ready"
    total_price: float = 0.0
    quote_snapshot: dict = Field(default_factory=dict)
    parking_requested: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))


class QuoteRequest(BaseModel):
    apartment_id: str
    check_in: date
    check_out: date
    parking_requested: bool = False


class UnitUpdate(BaseModel):
    unit_number: Optional[str] = Field(default=None, max_length=30)
    unit_number_verified: Optional[bool] = None
    bathrooms: Optional[float] = Field(default=None, ge=0.5, le=10)
    max_guests: Optional[int] = Field(default=None, ge=1, le=20)
    operational_status: Optional[Literal["setup_required", "active", "maintenance", "inactive"]] = None
    cleaning_status: Optional[Literal["not_configured", "ready", "dirty", "in_progress"]] = None
    access_status: Optional[Literal["not_configured", "verified", "problem"]] = None
    short_stay_authorized: Optional[bool] = None


class ListingUpdate(BaseModel):
    nightly_rate: Optional[float] = Field(default=None, gt=0)
    monthly_rate: Optional[float] = Field(default=None, gt=0)
    cleaning_fee: Optional[float] = Field(default=None, ge=0)
    parking_monthly: Optional[float] = Field(default=None, ge=0)
    images: Optional[List[str]] = None
    pricing_status: Optional[Literal["provisional", "approved"]] = None
    photo_status: Optional[Literal["required", "building_only", "verified"]] = None
    compliance_status: Optional[Literal["verification_required", "approved"]] = None
    listing_status: Optional[Literal["draft", "published", "archived"]] = None
    accepting_reservations: Optional[bool] = None


class PaymentStatusUpdate(BaseModel):
    payment_status: Literal["not_started", "authorized", "paid", "partially_refunded", "refunded", "failed"]


class BookingAssignmentUpdate(BaseModel):
    unit_id: str


class ArrivalGuideUpsert(BaseModel):
    unit_id: str
    building_entry_instructions: str = Field(min_length=1, max_length=2000)
    unit_entry_instructions: str = Field(min_length=1, max_length=2000)
    concierge_instructions: Optional[str] = Field(default=None, max_length=2000)
    parking_instructions: Optional[str] = Field(default=None, max_length=2000)
    mail_instructions: Optional[str] = Field(default=None, max_length=2000)
    trash_instructions: Optional[str] = Field(default=None, max_length=2000)
    checkout_instructions: Optional[str] = Field(default=None, max_length=2000)
    walkthrough_video_url: Optional[str] = Field(default=None, max_length=500)
    walkthrough_instructions: Optional[str] = Field(default=None, max_length=2000)
    wifi_name: Optional[str] = Field(default=None, max_length=200)
    wifi_password: Optional[str] = Field(default=None, max_length=200)
    access_code: Optional[str] = Field(default=None, min_length=4, max_length=30)
    door_invite_email: Optional[EmailStr] = None
    release_at: datetime
    operations_ready: bool = False
    release_now: bool = False

    @field_validator("walkthrough_video_url")
    @classmethod
    def validate_walkthrough_video_url(cls, value: Optional[str]) -> Optional[str]:
        if value is None or not value.strip():
            return None
        value = value.strip()
        if not re.fullmatch(
            r"https://(?:www\.)?(?:youtube\.com/(?:watch\?v=|shorts/|embed/)|youtu\.be/)[A-Za-z0-9_-]{11}(?:[?&][^\s]*)?",
            value,
        ):
            raise ValueError("Use a valid HTTPS YouTube video link")
        return value

class ContactCreate(BaseModel):
    name: str
    email: EmailStr
    subject: str
    message: str


class PartnerCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    phone: Optional[str] = Field(default=None, max_length=30)
    building_ids: List[str] = Field(min_length=1, max_length=20)


class BuildingComplianceUpdate(BaseModel):
    master_lease_or_owner_permission: Optional[Literal["pending", "verified", "not_applicable"]] = None
    zoning_use_permit: Optional[Literal["pending", "verified", "not_applicable"]] = None
    rental_license: Optional[Literal["pending", "verified", "not_applicable"]] = None
    hotel_tax_account: Optional[Literal["pending", "verified", "not_applicable"]] = None
    insurance_review: Optional[Literal["pending", "verified", "not_applicable"]] = None


class ChannelMappingUpdate(BaseModel):
    channel: Literal["airbnb", "booking_com"]
    status: Literal["not_connected", "pending", "connected"]
    listing_id: Optional[str] = Field(default=None, max_length=200)


class SetupItemUpdate(BaseModel):
    status: Literal["decision_required", "account_required", "in_progress", "connected", "blocked"]
    account_label: Optional[str] = Field(default=None, max_length=200)
    notes: Optional[str] = Field(default=None, max_length=2000)

# ===== AUTH HELPERS =====
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc).timestamp() + 86400 * 7
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(authorization: Optional[str] = Header(None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        token = authorization.removeprefix("Bearer ").strip()
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except (InvalidTokenError, KeyError):
        raise HTTPException(status_code=401, detail="Invalid token")

async def require_admin(user: dict = Depends(get_current_user)):
    if user.get("role") != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


async def require_building_partner(user: dict = Depends(get_current_user)):
    if user.get("role") != "building_partner":
        raise HTTPException(status_code=403, detail="Building partner access required")
    if not user.get("building_ids"):
        raise HTTPException(status_code=403, detail="No buildings are assigned to this account")
    return user


def _access_cipher() -> Fernet:
    if not ACCESS_ENCRYPTION_KEY:
        raise HTTPException(
            status_code=503,
            detail="Access-secret storage is disabled until ACCESS_ENCRYPTION_KEY is configured",
        )
    try:
        return Fernet(ACCESS_ENCRYPTION_KEY.encode("utf-8"))
    except (ValueError, TypeError) as exc:
        raise HTTPException(status_code=503, detail="ACCESS_ENCRYPTION_KEY is invalid") from exc


PROPERTY_TIMEZONE = ZoneInfo("America/New_York")


def checkin_window_utc(check_in: str, check_out: str) -> tuple:
    """Converts a booking's check-in/check-out dates into the standard 3pm
    check-in / 11am check-out window, correctly localized to the property's
    timezone (all buildings are in Philadelphia) and expressed in UTC. Doing
    this server-side with real IANA tz data avoids the bug of trusting the
    admin's browser's local timezone for a guest-facing door-access window."""
    start_local = datetime.combine(date.fromisoformat(check_in), datetime.min.time().replace(hour=15), tzinfo=PROPERTY_TIMEZONE)
    end_local = datetime.combine(date.fromisoformat(check_out), datetime.min.time().replace(hour=11), tzinfo=PROPERTY_TIMEZONE)
    return start_local.astimezone(timezone.utc), end_local.astimezone(timezone.utc)


def as_utc(value: datetime) -> datetime:
    """Normalizes a datetime to UTC. A naive datetime (no tzinfo) is treated as
    already being UTC rather than the server host's local timezone — calling
    .astimezone() directly on a naive datetime silently assumes local time,
    which makes access-window calculations depend on server deployment."""
    if value.tzinfo is None:
        return value.replace(tzinfo=timezone.utc)
    return value.astimezone(timezone.utc)


def encrypt_access_secret(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    return _access_cipher().encrypt(value.encode("utf-8")).decode("utf-8")


def decrypt_access_secret(value: Optional[str]) -> Optional[str]:
    if not value:
        return None
    try:
        return _access_cipher().decrypt(value.encode("utf-8")).decode("utf-8")
    except InvalidToken as exc:
        logger.error("Could not decrypt an arrival secret")
        raise HTTPException(status_code=503, detail="Arrival details are temporarily unavailable") from exc

# ===== EMAIL (MOCKED - logged to db.email_log, visible in admin dashboard) =====
async def send_email(to_email: str, to_name: str, subject: str, body: str, booking_id: str = None):
    """Sends via Resend when RESEND_API_KEY is configured. Otherwise logs a
    mocked record to db.email_log, visible in the admin dashboard. Every send
    attempt is logged either way, real or mocked, so the admin dashboard stays
    an accurate record of what guests were actually told."""
    status = "sent (mocked)"
    if RESEND_API_KEY and to_email:
        try:
            response = await run_in_threadpool(
                requests.post,
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {RESEND_API_KEY}"},
                json={"from": RESEND_FROM_EMAIL, "to": [to_email], "subject": subject, "text": body},
                timeout=10,
            )
            if response.status_code < 300:
                status = "sent"
            else:
                status = f"failed ({response.status_code})"
                logger.error(f"Resend send failed: {response.status_code} {response.text}")
        except requests.RequestException as exc:
            status = "failed (network error)"
            logger.error(f"Resend send raised: {exc}")
    record = {
        "id": str(uuid.uuid4()),
        "to_email": to_email,
        "to_name": to_name,
        "subject": subject,
        "body": body,
        "booking_id": booking_id,
        "status": status,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.email_log.insert_one(dict(record))
    logger.info(f"[EMAIL:{status}] to={to_email} subject={subject}")
    return record

# ===== AVAILABILITY =====
# In-process locks serialize booking creation per apartment so the
# availability check and the insert are effectively atomic. This is correct
# for the single-process deployment this app currently runs as; a
# multi-process/multi-instance deployment would need a DB-level lock or a
# replica-set transaction instead, since asyncio.Lock only coordinates
# within one process.
_booking_locks: dict[str, asyncio.Lock] = {}
_BOOKING_LOCKS_MAX = 1000


def _booking_lock(apartment_id: str) -> asyncio.Lock:
    lock = _booking_locks.get(apartment_id)
    if lock is None:
        if len(_booking_locks) >= _BOOKING_LOCKS_MAX:
            # Simple cap so this process-lifetime cache can't grow unbounded
            # if the apartment set stops being small and curated. Only evicts
            # locks nobody currently holds, so an in-flight booking is never
            # disrupted.
            for existing_id, existing_lock in list(_booking_locks.items()):
                if not existing_lock.locked():
                    del _booking_locks[existing_id]
                    break
        lock = asyncio.Lock()
        _booking_locks[apartment_id] = lock
    return lock


def _day_by_day_occupancy(
    bookings: List[dict], window_start: Optional[date] = None, window_end: Optional[date] = None
) -> dict:
    """Given booking documents (each with apartment_id, check_in, check_out as
    ISO date strings), returns {apartment_id: {day: occupied_unit_count}}. If
    window_start/window_end are given, each booking's range is clipped to the
    window before counting — the single source of truth for "how many units
    are occupied on a given day," shared by every availability check so the
    definition of "full" can't drift between them."""
    occupied: dict = {}
    for booking in bookings:
        cursor = date.fromisoformat(booking["check_in"])
        end = date.fromisoformat(booking["check_out"])
        if window_start is not None:
            cursor = max(cursor, window_start)
        if window_end is not None:
            end = min(end, window_end)
        day_counts = occupied.setdefault(booking["apartment_id"], {})
        while cursor < end:
            day_counts[cursor] = day_counts.get(cursor, 0) + 1
            cursor += timedelta(days=1)
    return occupied


async def _apartments_at_full_capacity(
    check_in: str, check_out: str, apartment_ids: Optional[List[str]] = None
) -> set:
    """Returns the ids of apartments whose peak same-day occupancy within
    [check_in, check_out) would reach or exceed their inventory_count, using
    day-by-day occupancy rather than a coarser 'total overlapping bookings'
    count, which can falsely mark a multi-unit listing as sold out when
    bookings occupy non-overlapping sub-ranges."""
    match = {
        "status": {"$in": ["pending", "confirmed"]},
        "check_in": {"$lt": check_out},
        "check_out": {"$gt": check_in},
    }
    if apartment_ids is not None:
        match["apartment_id"] = {"$in": apartment_ids}
    bookings = await db.bookings.find(
        match, {"_id": 0, "apartment_id": 1, "check_in": 1, "check_out": 1}
    ).to_list(10000)
    if not bookings:
        return set()
    occupied_by_apartment_day = _day_by_day_occupancy(
        bookings, date.fromisoformat(check_in), date.fromisoformat(check_out)
    )
    inventory_rows = await db.apartments.find(
        {"id": {"$in": list(occupied_by_apartment_day)}}, {"_id": 0, "id": 1, "inventory_count": 1}
    ).to_list(10000)
    capacity = {row["id"]: row.get("inventory_count", 1) for row in inventory_rows}
    return {
        apartment_id
        for apartment_id, day_counts in occupied_by_apartment_day.items()
        if any(count >= capacity.get(apartment_id, 1) for count in day_counts.values())
    }

# ===== ROUTES =====
@api_router.get("/")
async def root():
    return {"message": "Express Housing - Flexible Furnished Stays API"}


@api_router.get("/buildings")
async def get_buildings():
    """Public building facts. Compliance status, partner authorization, and
    unit data never leave this endpoint."""
    projection = {
        "_id": 0,
        "id": 1,
        "slug": 1,
        "name": 1,
        "address": 1,
        "neighborhood": 1,
        "city": 1,
        "state": 1,
        "website": 1,
        "images": 1,
        "amenities": 1,
    }
    return await db.buildings.find({}, projection).sort([("name", 1)]).to_list(100)


@api_router.post("/quotes")
async def create_quote(data: QuoteRequest):
    apartment = await db.apartments.find_one(
        {"id": data.apartment_id, "is_archived": {"$ne": True}}, {"_id": 0}
    )
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    nights = (data.check_out - data.check_in).days
    if nights < 1:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    quote = calculate_quote(
        nights=nights,
        nightly_rate=apartment["nightly_rate"],
        monthly_rate=apartment["monthly_rate"],
        cleaning_fee=apartment.get("cleaning_fee", 0),
        parking_monthly=apartment.get("parking_monthly", 0),
        parking_requested=data.parking_requested,
        short_stay_tax_rate=apartment.get("tax_rate_short_stay"),
    ).as_dict()
    quote["pricing_status"] = apartment.get("pricing_status", "provisional")
    quote.update(
        {
            "apartment_id": apartment["id"],
            "check_in": data.check_in.isoformat(),
            "check_out": data.check_out.isoformat(),
            "parking_requested": data.parking_requested,
            "parking_note": (
                f"${apartment.get('parking_monthly', 0):,.0f}/month, prorated for stays of 30 nights or more; shorter-stay parking is confirmed separately."
                if data.parking_requested
                else None
            ),
        }
    )
    return quote

# --- Auth ---
@api_router.post("/auth/signup")
async def signup(user_data: UserCreate):
    email = str(user_data.email).strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    user = {
        "email": email,
        "name": user_data.name.strip(),
        "phone": user_data.phone,
        "role": "guest",
        "id": str(uuid.uuid4()),
        "password_hash": hash_password(user_data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(user)
    token = create_token(user["id"], user["email"])
    safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return {"access_token": token, "token_type": "bearer", "user": safe_user}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    email = str(credentials.email).strip().lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_token(user["id"], user["email"])
    safe_user = {k: v for k, v in user.items() if k not in ("password_hash", "_id")}
    return {"access_token": token, "token_type": "bearer", "user": safe_user}

@api_router.get("/auth/me")
async def get_me(user: dict = Depends(get_current_user)):
    return {k: v for k, v in user.items() if k != "password_hash"}

# --- Apartments ---
@api_router.get("/apartments")
async def get_apartments(
    neighborhood: Optional[str] = None,
    apt_type: Optional[str] = None,
    guests: Optional[int] = None,
    min_price: Optional[float] = None,
    max_price: Optional[float] = None,
    stay_path: Optional[str] = None,
    search: Optional[str] = None,
    featured: Optional[bool] = None,
    sort: Optional[str] = None,
    check_in: Optional[str] = None,
    check_out: Optional[str] = None,
):
    query = {"is_archived": {"$ne": True}}
    if neighborhood:
        query["neighborhood"] = neighborhood
    if apt_type:
        query["apt_type"] = apt_type
    if guests is not None:
        if guests < 1:
            raise HTTPException(status_code=400, detail="Guests must be at least 1")
        query["max_guests"] = {"$gte": guests}
    if stay_path:
        query["stay_paths"] = stay_path
    if featured is not None:
        query["is_featured"] = featured
    price_q = {}
    if min_price is not None:
        price_q["$gte"] = min_price
    if max_price is not None:
        price_q["$lte"] = max_price
    if price_q:
        query["nightly_rate"] = price_q
    if search:
        safe_search = re.escape(search)
        query["$or"] = [
            {"title": {"$regex": safe_search, "$options": "i"}},
            {"neighborhood": {"$regex": safe_search, "$options": "i"}},
            {"building_name": {"$regex": safe_search, "$options": "i"}},
            {"description": {"$regex": safe_search, "$options": "i"}},
        ]
    if bool(check_in) != bool(check_out):
        raise HTTPException(status_code=400, detail="Check-in and check-out must be provided together")
    if check_in and check_out:
        try:
            ci = date.fromisoformat(check_in)
            co = date.fromisoformat(check_out)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid dates. Use YYYY-MM-DD")
        if co <= ci:
            raise HTTPException(status_code=400, detail="Check-out must be after check-in")
        unavailable_ids = await _apartments_at_full_capacity(check_in, check_out)
        if unavailable_ids:
            query["id"] = {"$nin": list(unavailable_ids)}
    sort_map = {
        "price_asc": ("nightly_rate", 1),
        "price_desc": ("nightly_rate", -1),
        "rating": ("rating", -1),
        "newest": ("created_at", -1),
    }
    cursor = db.apartments.find(query, {"_id": 0})
    if sort in sort_map:
        cursor = cursor.sort([sort_map[sort]])
    apartments = await cursor.to_list(200)
    return apartments

@api_router.get("/apartments/{apartment_id}")
async def get_apartment(apartment_id: str):
    apt = await db.apartments.find_one({"id": apartment_id}, {"_id": 0})
    if not apt:
        raise HTTPException(status_code=404, detail="Apartment not found")
    return apt

@api_router.get("/neighborhoods")
async def get_neighborhoods():
    pipeline = [
        {"$match": {"is_archived": {"$ne": True}}},
        {"$group": {"_id": "$neighborhood", "count": {"$sum": 1}, "image": {"$first": {"$arrayElemAt": ["$images", 0]}}, "min_rate": {"$min": "$nightly_rate"}}},
        {"$sort": {"count": -1}},
    ]
    rows = await db.apartments.aggregate(pipeline).to_list(50)
    return [{"name": r["_id"], "count": r["count"], "image": r["image"], "min_rate": r["min_rate"]} for r in rows]

# --- Bookings (Request to Book) ---
@api_router.post("/bookings")
async def create_booking(booking_data: BookingCreate, user: dict = Depends(get_current_user)):
    apt = await db.apartments.find_one(
        {"id": booking_data.apartment_id, "is_archived": {"$ne": True}}, {"_id": 0}
    )
    if not apt:
        raise HTTPException(status_code=404, detail="Apartment not found")
    if not apt.get("accepting_reservations", True):
        raise HTTPException(
            status_code=409,
            detail="This listing is still being verified and is not accepting reservations yet",
        )
    try:
        ci = date.fromisoformat(booking_data.check_in)
        co = date.fromisoformat(booking_data.check_out)
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid dates. Use YYYY-MM-DD")
    nights = (co - ci).days
    if nights < 1:
        raise HTTPException(status_code=400, detail="Check-out must be after check-in")
    if ci < datetime.now(PROPERTY_TIMEZONE).date():
        raise HTTPException(status_code=400, detail="Check-in cannot be in the past")
    if nights < apt.get("min_nights", 1):
        raise HTTPException(status_code=400, detail=f"Minimum stay is {apt.get('min_nights', 1)} nights")
    if booking_data.guests > apt.get("max_guests", 1):
        raise HTTPException(status_code=400, detail=f"Maximum {apt.get('max_guests', 1)} guests for this apartment")
    quote = calculate_quote(
        nights=nights,
        nightly_rate=apt["nightly_rate"],
        monthly_rate=apt["monthly_rate"],
        cleaning_fee=apt.get("cleaning_fee", 0),
        parking_monthly=apt.get("parking_monthly", 0),
        parking_requested=booking_data.parking_requested,
        short_stay_tax_rate=apt.get("tax_rate_short_stay"),
    ).as_dict()
    quote["pricing_status"] = apt.get("pricing_status", "provisional")
    total = quote["total"]
    booking = Booking(
        user_id=user["id"],
        user_name=user.get("name", ""),
        user_email=user.get("email", ""),
        user_phone=user.get("phone"),
        apartment_id=apt["id"],
        building_id=apt.get("building_id"),
        apartment_title=apt["title"],
        apartment_image=apt["images"][0] if apt.get("images") else "",
        neighborhood=apt.get("neighborhood", ""),
        check_in=booking_data.check_in,
        check_out=booking_data.check_out,
        nights=nights,
        guests=booking_data.guests,
        purpose=booking_data.purpose,
        notes=booking_data.notes,
        parking_requested=booking_data.parking_requested,
        status="pending",
        total_price=total,
        quote_snapshot=quote,
    )
    doc = booking.model_dump()
    doc["created_at"] = doc["created_at"].isoformat()
    # A public listing represents a pool of equivalent bedroom inventory. It
    # remains available until every physical unit in the pool is committed.
    # The check and the insert are serialized per apartment so two concurrent
    # requests for the last unit can't both pass the availability check.
    async with _booking_lock(apt["id"]):
        unavailable_ids = await _apartments_at_full_capacity(
            booking_data.check_in, booking_data.check_out, apartment_ids=[apt["id"]]
        )
        if apt["id"] in unavailable_ids:
            raise HTTPException(status_code=409, detail="Those dates are no longer available for this apartment type")
        await db.bookings.insert_one(dict(doc))
    await send_email(
        user.get("email", ""), user.get("name", ""),
        f"Stay request received \u2014 {apt['title']}",
        f"Hi {user.get('name', '').split(' ')[0]},\n\nWe received your stay request for {apt['title']} in {apt.get('neighborhood', '')} from {booking_data.check_in} to {booking_data.check_out} ({nights} nights, {booking_data.guests} guests). Estimated total: ${total:,.2f}.\n\nOur team will confirm availability, the assigned unit, and the final rate.\n\n\u2014 Express Housing",
        booking.id,
    )
    return doc

@api_router.get("/apartments/{apartment_id}/unavailable")
async def get_unavailable_dates(apartment_id: str):
    apartment = await db.apartments.find_one({"id": apartment_id}, {"_id": 0, "inventory_count": 1})
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    bookings = await db.bookings.find(
        {"apartment_id": apartment_id, "status": {"$in": ["pending", "confirmed"]}},
        {"_id": 0, "apartment_id": 1, "check_in": 1, "check_out": 1},
    ).to_list(200)
    capacity = apartment.get("inventory_count", 1)
    occupied_by_day = _day_by_day_occupancy(bookings).get(apartment_id, {})
    full_days = sorted(day for day, count in occupied_by_day.items() if count >= capacity)
    if not full_days:
        return []
    ranges = []
    start = previous = full_days[0]
    for current in full_days[1:]:
        if current != previous + timedelta(days=1):
            ranges.append({"check_in": start.isoformat(), "check_out": (previous + timedelta(days=1)).isoformat()})
            start = current
        previous = current
    ranges.append({"check_in": start.isoformat(), "check_out": (previous + timedelta(days=1)).isoformat()})
    return ranges

@api_router.get("/bookings")
async def get_bookings(user: dict = Depends(get_current_user)):
    bookings = await db.bookings.find({"user_id": user["id"]}, {"_id": 0}).sort([("created_at", -1)]).to_list(100)
    return bookings

@api_router.get("/bookings/{booking_id}")
async def get_booking(booking_id: str, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id, "user_id": user["id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking


@api_router.get("/bookings/{booking_id}/arrival")
async def get_arrival_guide(booking_id: str, user: dict = Depends(get_current_user)):
    booking = await db.bookings.find_one({"id": booking_id, "user_id": user["id"]}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    guide = await db.arrival_guides.find_one({"booking_id": booking_id}, {"_id": 0})
    if not guide:
        return {"available": False, "status": "not_prepared"}

    release_at = datetime.fromisoformat(guide["release_at"])
    now = datetime.now(timezone.utc)
    release_conditions_met = (
        booking.get("status") in ("confirmed", "completed")
        and booking.get("payment_status") == "paid"
        and booking.get("arrival_status") in ("ready", "released")
        and guide.get("operations_ready") is True
        and release_at <= now
    )
    if not release_conditions_met:
        return {
            "available": False,
            "status": "scheduled" if booking.get("status") in ("confirmed", "completed") else "reservation_not_confirmed",
            "release_at": guide["release_at"],
        }

    return {
        "available": True,
        "status": "released",
        "building_name": guide["building_name"],
        "building_address": guide["building_address"],
        "unit_number": guide["unit_number"],
        "building_entry_instructions": guide["building_entry_instructions"],
        "unit_entry_instructions": guide["unit_entry_instructions"],
        "concierge_instructions": guide.get("concierge_instructions"),
        "parking_instructions": guide.get("parking_instructions"),
        "mail_instructions": guide.get("mail_instructions"),
        "trash_instructions": guide.get("trash_instructions"),
        "checkout_instructions": guide.get("checkout_instructions"),
        "walkthrough_video_url": guide.get("walkthrough_video_url"),
        "walkthrough_instructions": guide.get("walkthrough_instructions"),
        "wifi_name": guide.get("wifi_name"),
        "wifi_password": decrypt_access_secret(guide.get("wifi_password_encrypted")),
        "access_code": decrypt_access_secret(guide.get("access_code_encrypted")),
        "door_invite_email": guide.get("door_invite_email"),
        "door_app_url": "https://door.com/latch",
        "access_start": guide["access_start"],
        "access_end": guide["access_end"],
    }

# --- Wishlist ---
@api_router.get("/wishlist")
async def get_wishlist(user: dict = Depends(get_current_user)):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0}).to_list(200)
    apt_ids = [i["apartment_id"] for i in items]
    apartments = await db.apartments.find({"id": {"$in": apt_ids}}, {"_id": 0}).to_list(200)
    return apartments

@api_router.post("/wishlist/{apartment_id}")
async def toggle_wishlist(apartment_id: str, user: dict = Depends(get_current_user)):
    apartment = await db.apartments.find_one({"id": apartment_id}, {"_id": 1})
    if not apartment:
        raise HTTPException(status_code=404, detail="Apartment not found")
    existing = await db.wishlist.find_one({"user_id": user["id"], "apartment_id": apartment_id})
    if existing:
        await db.wishlist.delete_one({"user_id": user["id"], "apartment_id": apartment_id})
        return {"saved": False}
    await db.wishlist.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "apartment_id": apartment_id,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    return {"saved": True}

@api_router.get("/wishlist/ids")
async def get_wishlist_ids(user: dict = Depends(get_current_user)):
    items = await db.wishlist.find({"user_id": user["id"]}, {"_id": 0, "apartment_id": 1}).to_list(200)
    return [i["apartment_id"] for i in items]

# --- Admin ---
class StatusUpdate(BaseModel):
    status: Literal["confirmed", "cancelled", "completed"]

class AdminCreate(BaseModel):
    name: str
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


@api_router.get("/partner/summary")
async def partner_summary(partner: dict = Depends(require_building_partner)):
    """Building-scoped operational view with deliberately minimized guest data."""
    building_ids = list(dict.fromkeys(partner.get("building_ids", [])))
    buildings = await db.buildings.find(
        {"id": {"$in": building_ids}},
        {"_id": 0, "id": 1, "name": 1, "address": 1, "city": 1, "state": 1},
    ).sort([("name", 1)]).to_list(100)
    bookings = await db.bookings.find(
        {"building_id": {"$in": building_ids}},
        {
            "_id": 0,
            "id": 1,
            "building_id": 1,
            "unit_id": 1,
            "apartment_title": 1,
            "user_name": 1,
            "user_email": 1,
            "user_phone": 1,
            "check_in": 1,
            "check_out": 1,
            "nights": 1,
            "guests": 1,
            "status": 1,
            "source": 1,
            "arrival_status": 1,
            "created_at": 1,
        },
    ).sort([("check_in", 1)]).to_list(1000)
    units = await db.units.find(
        {"building_id": {"$in": building_ids}},
        {"_id": 0, "id": 1, "building_id": 1, "internal_label": 1, "unit_number": 1, "unit_number_verified": 1},
    ).sort([("internal_label", 1)]).to_list(1000)
    unit_map = {unit["id"]: unit for unit in units}
    safe_bookings = []
    for booking in bookings:
        unit = unit_map.get(booking.get("unit_id"))
        booking["unit_assignment"] = None
        if unit:
            booking["unit_assignment"] = {
                "internal_label": unit["internal_label"],
                "unit_number": unit.get("unit_number") if unit.get("unit_number_verified") else None,
                "candidate_unit_number": None if unit.get("unit_number_verified") else unit.get("unit_number"),
                "verified": bool(unit.get("unit_number_verified")),
            }
        safe_bookings.append(booking)
    return {"buildings": buildings, "units": units, "bookings": safe_bookings}

@api_router.get("/admin/users")
async def admin_list_admins(admin: dict = Depends(require_admin)):
    admins = await db.users.find({"role": "admin"}, {"_id": 0, "password_hash": 0}).to_list(100)
    return admins

@api_router.post("/admin/users")
async def admin_create_admin(data: AdminCreate, admin: dict = Depends(require_admin)):
    email = str(data.email).strip().lower()
    existing = await db.users.find_one({"email": email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    new_admin = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": data.name.strip(),
        "role": "admin",
        "phone": None,
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.users.insert_one(dict(new_admin))
    return {k: v for k, v in new_admin.items() if k not in ("password_hash", "_id")}


@api_router.get("/admin/partners")
async def admin_list_partners(admin: dict = Depends(require_admin)):
    return await db.users.find(
        {"role": "building_partner"}, {"_id": 0, "password_hash": 0}
    ).sort([("name", 1)]).to_list(200)


@api_router.post("/admin/partners")
async def admin_create_partner(data: PartnerCreate, admin: dict = Depends(require_admin)):
    email = str(data.email).strip().lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    building_ids = list(dict.fromkeys(data.building_ids))
    valid_count = await db.buildings.count_documents({"id": {"$in": building_ids}})
    if valid_count != len(building_ids):
        raise HTTPException(status_code=400, detail="One or more selected buildings do not exist")
    partner = {
        "id": str(uuid.uuid4()),
        "email": email,
        "name": data.name.strip(),
        "role": "building_partner",
        "phone": data.phone,
        "building_ids": building_ids,
        "password_hash": hash_password(data.password),
        "created_at": datetime.now(timezone.utc).isoformat(),
        "created_by": admin["id"],
    }
    await db.users.insert_one(dict(partner))
    return {k: v for k, v in partner.items() if k not in ("password_hash", "_id")}


@api_router.patch("/admin/buildings/{building_id}/compliance")
async def admin_update_building_compliance(
    building_id: str,
    update: BuildingComplianceUpdate,
    admin: dict = Depends(require_admin),
):
    if not await db.buildings.find_one({"id": building_id}):
        raise HTTPException(status_code=404, detail="Building not found")
    changes = update.model_dump(exclude_unset=True)
    if not changes:
        raise HTTPException(status_code=400, detail="No compliance fields supplied")
    set_fields = {f"compliance.{key}": value for key, value in changes.items()}
    set_fields.update({"updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": admin["id"]})
    await db.buildings.update_one({"id": building_id}, {"$set": set_fields})
    return await db.buildings.find_one({"id": building_id}, {"_id": 0})


@api_router.patch("/admin/listings/{listing_id}/channel")
async def admin_update_channel_mapping(
    listing_id: str,
    update: ChannelMappingUpdate,
    admin: dict = Depends(require_admin),
):
    if not await db.apartments.find_one({"id": listing_id}):
        raise HTTPException(status_code=404, detail="Listing not found")
    listing_id_value = update.listing_id.strip() if update.listing_id else None
    if update.status == "connected" and not listing_id_value:
        raise HTTPException(status_code=400, detail="A real channel listing ID is required before marking connected")
    await db.apartments.update_one(
        {"id": listing_id},
        {"$set": {
            f"channel_mappings.{update.channel}": {"status": update.status, "listing_id": listing_id_value},
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "updated_by": admin["id"],
        }},
    )
    return await db.apartments.find_one({"id": listing_id}, {"_id": 0})


@api_router.get("/admin/setup")
async def admin_get_setup(admin: dict = Depends(require_admin)):
    return await db.setup_items.find({}, {"_id": 0}).sort([("category", 1), ("key", 1)]).to_list(100)


@api_router.patch("/admin/setup/{item_key}")
async def admin_update_setup_item(
    item_key: str,
    update: SetupItemUpdate,
    admin: dict = Depends(require_admin),
):
    if not await db.setup_items.find_one({"key": item_key}):
        raise HTTPException(status_code=404, detail="Setup item not found")
    changes = update.model_dump(exclude_unset=True)
    changes.update({"updated_at": datetime.now(timezone.utc).isoformat(), "updated_by": admin["id"]})
    await db.setup_items.update_one({"key": item_key}, {"$set": changes})
    return await db.setup_items.find_one({"key": item_key}, {"_id": 0})


@api_router.get("/admin/portfolio")
async def admin_portfolio(admin: dict = Depends(require_admin)):
    buildings = await db.buildings.find({}, {"_id": 0}).sort([("name", 1)]).to_list(100)
    units = await db.units.find({}, {"_id": 0}).sort([("internal_label", 1)]).to_list(500)
    listings = await db.apartments.find(
        {"portfolio_seed": True, "is_archived": {"$ne": True}}, {"_id": 0}
    ).sort([("building_name", 1), ("bedrooms", 1)]).to_list(100)
    return {
        "portfolio_version": PORTFOLIO_VERSION,
        "buildings": buildings,
        "units": units,
        "listings": listings,
        "summary": {
            "buildings": len(buildings),
            "units": len(units),
            "one_bedroom_units": sum(1 for unit in units if unit["bedrooms"] == 1),
            "two_bedroom_units": sum(1 for unit in units if unit["bedrooms"] == 2),
            "ready_units": sum(1 for unit in units if unit["operational_status"] == "active"),
            "verified_unit_numbers": sum(1 for unit in units if unit.get("unit_number_verified")),
            "short_stay_authorized_units": sum(1 for unit in units if unit.get("short_stay_authorized")),
        },
    }


@api_router.patch("/admin/units/{unit_id}")
async def admin_update_unit(unit_id: str, update: UnitUpdate, admin: dict = Depends(require_admin)):
    unit = await db.units.find_one({"id": unit_id}, {"_id": 0})
    if not unit:
        raise HTTPException(status_code=404, detail="Unit not found")
    changes = update.model_dump(exclude_unset=True)
    if "unit_number" in changes and changes["unit_number"] is not None:
        changes["unit_number"] = changes["unit_number"].strip() or None
    if "unit_number" in changes and changes["unit_number"] != unit.get("unit_number") and "unit_number_verified" not in changes:
        changes["unit_number_verified"] = False
    prospective_number = changes.get("unit_number", unit.get("unit_number"))
    prospective_verified = changes.get("unit_number_verified", unit.get("unit_number_verified", False))
    if prospective_verified and (not prospective_number or prospective_number.upper().startswith("TBD-")):
        raise HTTPException(status_code=400, detail="Replace the placeholder with a real unit number before verifying it")
    if not prospective_number:
        changes["unit_number_verified"] = False
    changes["updated_at"] = datetime.now(timezone.utc).isoformat()
    changes["updated_by"] = admin["id"]
    await db.units.update_one({"id": unit_id}, {"$set": changes})
    return await db.units.find_one({"id": unit_id}, {"_id": 0})


@api_router.patch("/admin/listings/{listing_id}")
async def admin_update_listing(
    listing_id: str,
    update: ListingUpdate,
    admin: dict = Depends(require_admin),
):
    listing = await db.apartments.find_one({"id": listing_id}, {"_id": 0})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    changes = update.model_dump(exclude_unset=True)
    prospective = {**listing, **changes}
    if prospective.get("accepting_reservations"):
        active_unit_query = {
            "listing_id": listing_id,
            "operational_status": "active",
            "unit_number": {"$nin": [None, ""]},
            "unit_number_verified": True,
        }
        if prospective.get("min_nights", 1) < 30:
            active_unit_query["short_stay_authorized"] = True
        active_units = await db.units.count_documents(active_unit_query)
        missing = []
        if active_units < 1:
            missing.append("at least one verified, active and stay-authorized unit")
        if prospective.get("pricing_status") != "approved":
            missing.append("approved pricing")
        if prospective.get("photo_status") != "verified" or not prospective.get("images"):
            missing.append("verified listing photography")
        if prospective.get("compliance_status") != "approved":
            missing.append("approved compliance")
        if prospective.get("listing_status") != "published":
            missing.append("published listing status")
        if missing:
            raise HTTPException(status_code=400, detail=f"Cannot open reservations; missing {', '.join(missing)}")
    changes["updated_at"] = datetime.now(timezone.utc).isoformat()
    changes["updated_by"] = admin["id"]
    await db.apartments.update_one({"id": listing_id}, {"$set": changes})
    return await db.apartments.find_one({"id": listing_id}, {"_id": 0})


@api_router.patch("/admin/bookings/{booking_id}/assignment")
async def admin_assign_unit(
    booking_id: str,
    update: BookingAssignmentUpdate,
    admin: dict = Depends(require_admin),
):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    unit = await db.units.find_one({"id": update.unit_id}, {"_id": 0})
    if not unit or unit.get("listing_id") != booking["apartment_id"]:
        raise HTTPException(status_code=400, detail="Unit is not part of the booked listing")
    if not unit.get("unit_number"):
        raise HTTPException(status_code=400, detail="Add a candidate unit number before assigning this unit")
    if unit.get("operational_status") != "active":
        raise HTTPException(status_code=400, detail="Only an active unit can be assigned")
    nights = booking.get("nights", 0)
    if nights < 30 and not unit.get("short_stay_authorized"):
        raise HTTPException(status_code=400, detail="This unit is not verified for stays under 30 nights")
    conflict = await db.bookings.find_one(
        {
            "id": {"$ne": booking_id},
            "unit_id": unit["id"],
            "status": {"$in": ["pending", "confirmed"]},
            "check_in": {"$lt": booking["check_out"]},
            "check_out": {"$gt": booking["check_in"]},
        }
    )
    if conflict:
        raise HTTPException(status_code=409, detail="That physical unit is already assigned for these dates")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"unit_id": unit["id"]}})
    return await db.bookings.find_one({"id": booking_id}, {"_id": 0})


@api_router.patch("/admin/bookings/{booking_id}/payment")
async def admin_update_payment(
    booking_id: str,
    update: PaymentStatusUpdate,
    admin: dict = Depends(require_admin),
):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    await db.bookings.update_one(
        {"id": booking_id},
        {"$set": {"payment_status": update.payment_status, "payment_status_source": "admin_manual"}},
    )
    return await db.bookings.find_one({"id": booking_id}, {"_id": 0})


@api_router.put("/admin/bookings/{booking_id}/arrival")
async def admin_upsert_arrival_guide(
    booking_id: str,
    data: ArrivalGuideUpsert,
    admin: dict = Depends(require_admin),
):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    unit = await db.units.find_one({"id": data.unit_id}, {"_id": 0})
    if not unit or unit.get("id") != booking.get("unit_id"):
        raise HTTPException(status_code=400, detail="Assign this unit to the booking before preparing arrival")
    if not unit.get("unit_number") or not unit.get("unit_number_verified"):
        raise HTTPException(status_code=400, detail="Verify the assigned unit's real number before preparing arrival details")
    building = await db.buildings.find_one({"id": unit["building_id"]}, {"_id": 0})
    if not building:
        raise HTTPException(status_code=400, detail="Assigned unit has no building")
    access_start, access_end = checkin_window_utc(booking["check_in"], booking["check_out"])
    if data.release_now:
        if booking.get("status") not in ("confirmed", "completed"):
            raise HTTPException(status_code=400, detail="Confirm the reservation before releasing arrival details")
        if booking.get("payment_status") != "paid":
            raise HTTPException(status_code=400, detail="Payment must be paid before releasing arrival details")
        if not data.operations_ready:
            raise HTTPException(status_code=400, detail="Complete the readiness check before releasing arrival details")

    guide = {
        "id": str(uuid.uuid5(uuid.NAMESPACE_URL, f"expresshousing:arrival:{booking_id}")),
        "booking_id": booking_id,
        "unit_id": unit["id"],
        "building_id": building["id"],
        "building_name": building["name"],
        "building_address": f"{building['address']}, {building['city']}, {building['state']}",
        "unit_number": unit["unit_number"],
        "building_entry_instructions": data.building_entry_instructions,
        "unit_entry_instructions": data.unit_entry_instructions,
        "concierge_instructions": data.concierge_instructions,
        "parking_instructions": data.parking_instructions,
        "mail_instructions": data.mail_instructions,
        "trash_instructions": data.trash_instructions,
        "checkout_instructions": data.checkout_instructions,
        "walkthrough_video_url": data.walkthrough_video_url,
        "walkthrough_instructions": data.walkthrough_instructions,
        "wifi_name": data.wifi_name,
        "wifi_password_encrypted": encrypt_access_secret(data.wifi_password),
        "access_code_encrypted": encrypt_access_secret(data.access_code),
        "door_invite_email": str(data.door_invite_email) if data.door_invite_email else None,
        "access_start": access_start.isoformat(),
        "access_end": access_end.isoformat(),
        "release_at": (
            datetime.now(timezone.utc) if data.release_now else as_utc(data.release_at)
        ).isoformat(),
        "operations_ready": data.operations_ready,
        "updated_at": datetime.now(timezone.utc).isoformat(),
        "updated_by": admin["id"],
    }
    await db.arrival_guides.update_one({"booking_id": booking_id}, {"$set": guide}, upsert=True)
    arrival_status = "released" if data.release_now else ("ready" if data.operations_ready else "not_ready")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"arrival_status": arrival_status}})
    if arrival_status == "released" and booking.get("arrival_status") != "released":
        first = (booking.get("user_name") or "Guest").split(" ")[0]
        await send_email(
            booking.get("user_email", ""), booking.get("user_name", ""),
            f"Your arrival details are ready — {booking.get('apartment_title', '')}",
            f"Hi {first},\n\nYour unit number, Door access code, and Wi-Fi details for {booking.get('apartment_title', '')} are ready in your Express Housing account.\n\nSign in and open “My stays” to view them: check-in is {booking.get('check_in', '')} at {guide['building_name']}.\n\nFor your security we don't include access codes in email — they're only visible after you sign in.\n\n— Express Housing",
            booking_id,
        )
    return {"success": True, "arrival_status": arrival_status, "release_at": guide["release_at"]}

@api_router.get("/admin/stats")
async def admin_stats(admin: dict = Depends(require_admin)):
    pipeline = [{"$group": {"_id": "$status", "count": {"$sum": 1}, "revenue": {"$sum": "$total_price"}}}]
    rows = await db.bookings.aggregate(pipeline).to_list(20)
    stats = {"pending": 0, "confirmed": 0, "completed": 0, "cancelled": 0, "revenue": 0}
    for r in rows:
        stats[r["_id"]] = r["count"]
        if r["_id"] in ("confirmed", "completed"):
            stats["revenue"] += r["revenue"]
    stats["total"] = sum(stats[k] for k in ("pending", "confirmed", "completed", "cancelled"))
    stats["apartments"] = await db.apartments.count_documents({"is_archived": {"$ne": True}})
    return stats

@api_router.get("/admin/bookings")
async def admin_bookings(status: Optional[str] = None, admin: dict = Depends(require_admin)):
    query = {"status": status} if status else {}
    bookings = await db.bookings.find(query, {"_id": 0}).sort([("created_at", -1)]).to_list(500)
    return bookings

@api_router.patch("/admin/bookings/{booking_id}")
async def admin_update_booking(booking_id: str, update: StatusUpdate, admin: dict = Depends(require_admin)):
    booking = await db.bookings.find_one({"id": booking_id}, {"_id": 0})
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    listing = await db.apartments.find_one({"id": booking["apartment_id"]}, {"_id": 0})
    if update.status == "confirmed" and listing and listing.get("portfolio_seed") and not booking.get("unit_id"):
        raise HTTPException(status_code=400, detail="Assign a verified physical unit before confirming this reservation")
    await db.bookings.update_one({"id": booking_id}, {"$set": {"status": update.status}})
    booking["status"] = update.status
    first = (booking.get("user_name") or "Guest").split(" ")[0]
    if update.status == "confirmed":
        subject = f"Your stay is confirmed \u2014 {booking['apartment_title']}"
        body = f"Hi {first},\n\nGreat news \u2014 your stay at {booking['apartment_title']} ({booking['neighborhood']}) from {booking['check_in']} to {booking['check_out']} is CONFIRMED.\n\nTotal: ${booking['total_price']:,.2f}. Your authenticated arrival page will show Door access and unit details after payment and the readiness check.\n\nWelcome to Express Housing!"
    elif update.status == "cancelled":
        subject = f"Update on your stay request \u2014 {booking['apartment_title']}"
        body = f"Hi {first},\n\nUnfortunately we couldn't accommodate your stay at {booking['apartment_title']} from {booking['check_in']} to {booking['check_out']}. Those dates are unavailable.\n\nReply to this email and our team will find you a comparable home.\n\n\u2014 Express Housing"
    else:
        subject = f"Thanks for staying with us \u2014 {booking['apartment_title']}"
        body = f"Hi {first},\n\nYour stay at {booking['apartment_title']} is complete. We'd love to host you again \u2014 returning guests get priority on new listings.\n\n\u2014 Express Housing"
    await send_email(booking.get("user_email", ""), booking.get("user_name", ""), subject, body, booking_id)
    return booking

@api_router.get("/admin/emails")
async def admin_emails(admin: dict = Depends(require_admin)):
    emails = await db.email_log.find({}, {"_id": 0}).sort([("created_at", -1)]).to_list(200)
    return emails

# --- Contact ---
@api_router.post("/contact")
async def submit_contact(contact_data: ContactCreate):
    doc = contact_data.model_dump()
    doc["id"] = str(uuid.uuid4())
    doc["created_at"] = datetime.now(timezone.utc).isoformat()
    await db.contact_messages.insert_one(dict(doc))
    return {"success": True, "message": "Thanks for reaching out. Our team will reply within 24 hours."}

# ===== SEED DATA =====
# Image pools (curated via vision expert)
LR = [
    "https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1658218635253-64728f6234be?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1564078516393-cf04bd966897?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.pexels.com/photos/6492391/pexels-photo-6492391.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
    "https://images.pexels.com/photos/6636314/pexels-photo-6636314.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
]
BR = [
    "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1562438668-bcf0ca6578f0?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.pexels.com/photos/34574606/pexels-photo-34574606.jpeg?auto=compress&cs=tinysrgb&dpr=2&h=650&w=940",
]
KT = [
    "https://images.unsplash.com/photo-1600489000022-c2086d79f9d4?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1484154218962-a197022b5858?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1617228069096-4638a7ffc906?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
    "https://images.unsplash.com/photo-1556911220-bff31c812dba?crop=entropy&cs=srgb&fm=jpg&q=85&w=1200",
]
HERO = [
    "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "https://images.unsplash.com/photo-1518733057094-95b53143d2a7?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
    "https://images.unsplash.com/photo-1686056040370-b5e5c06c4273?crop=entropy&cs=srgb&fm=jpg&q=85&w=1600",
]

AMEN_CORE = ["Fully furnished", "Gigabit Wi-Fi", "Fully-equipped kitchen", "Keypad self check-in", "4K Smart TV", "In-unit washer & dryer"]

def _rev(name, rating, comment, purpose, date_str):
    return {"id": str(uuid.uuid4()), "user_name": name, "rating": rating, "comment": comment, "purpose": purpose, "date": date_str}

SEED_APARTMENTS = [
    {
        "title": "The Franklin Residences 1BR", "building_name": "The Franklin", "neighborhood": "Old City",
        "address": "834 Chestnut St", "apt_type": "1 Bedroom", "bedrooms": 1, "bathrooms": 1, "max_guests": 2, "sqft": 720,
        "nightly_rate": NIGHTLY_RATES[1], "monthly_rate": 3400,
        "description": "A polished one-bedroom in the heart of Old City, steps from Independence Hall. Dedicated workspace, gigabit Wi-Fi, and a building gym make this a favorite for business travelers who want history outside their door.",
        "amenities": AMEN_CORE + ["Dedicated workspace", "24-hour fitness center", "Elevator"],
        "images": [LR[0], BR[0], KT[0], LR[3]], "stay_paths": ["corporate"], "rating": 4.9, "review_count": 42,
        "is_featured": True, "min_nights": 2,
        "reviews": [
            _rev("Marcus T.", 5, "Check-in was seamless and the workspace setup saved my week. Better than any hotel.", "Business", "May 2025"),
            _rev("Elena R.", 5, "Beautiful apartment, walkable to everything in Old City.", "Leisure", "April 2025"),
        ],
    },
    {
        "title": "Rittenhouse Square Luxe 2BR", "building_name": "The Rittenhouse Collection", "neighborhood": "Rittenhouse Square",
        "address": "1900 Walnut St", "apt_type": "2 Bedroom", "bedrooms": 2, "bathrooms": 2, "max_guests": 4, "sqft": 1100,
        "nightly_rate": NIGHTLY_RATES[2], "monthly_rate": 5200,
        "description": "Designer two-bedroom overlooking Rittenhouse Square with a chef's kitchen, marble baths, and a resident lounge. Ideal for relocations and executive stays that need room to breathe.",
        "amenities": AMEN_CORE + ["Doorman", "24-hour fitness center", "Rooftop terrace", "Dedicated workspace"],
        "images": [LR[3], BR[1], KT[1], LR[1]], "stay_paths": ["corporate", "family"], "rating": 4.9, "review_count": 57,
        "is_featured": True, "min_nights": 3,
        "reviews": [
            _rev("Priya S.", 5, "Our family of four stayed 6 weeks during a relocation. Felt like home from day one.", "Relocation", "June 2025"),
            _rev("David K.", 5, "The square outside your window every morning. Unbeatable.", "Business", "May 2025"),
        ],
    },
    {
        "title": "Center City Skyline Studio", "building_name": "One Liberty Place Residences", "neighborhood": "Center City",
        "address": "1650 Market St", "apt_type": "Studio", "bedrooms": 0, "bathrooms": 1, "max_guests": 2, "sqft": 520,
        "nightly_rate": 119, "monthly_rate": 2600,
        "description": "A bright studio with floor-to-ceiling skyline views in the middle of Center City. Smart layout with a real workspace and a queen bed — everything a solo traveler needs.",
        "amenities": AMEN_CORE + ["Dedicated workspace", "Elevator", "24-hour fitness center"],
        "images": [LR[1], BR[2], KT[2]], "stay_paths": ["corporate", "medical"], "rating": 4.7, "review_count": 31,
        "min_nights": 2,
        "reviews": [_rev("Jordan M.", 5, "Perfect for my 3-week hospital rotation. Quiet, clean, great Wi-Fi.", "Medical", "March 2025")],
    },
    {
        "title": "Fishtown Artist Loft 1BR", "building_name": "The Frankford Lofts", "neighborhood": "Fishtown",
        "address": "1401 Frankford Ave", "apt_type": "1 Bedroom", "bedrooms": 1, "bathrooms": 1, "max_guests": 3, "sqft": 850,
        "nightly_rate": NIGHTLY_RATES[1], "monthly_rate": 2900,
        "description": "Exposed brick, 14-foot ceilings, and Fishtown's best coffee downstairs. A creative loft minutes from the El, made for longer stays that should not feel corporate.",
        "amenities": AMEN_CORE + ["Pet friendly", "Rooftop terrace"],
        "images": [LR[2], BR[3], KT[3], LR[6]], "stay_paths": ["family"], "rating": 4.8, "review_count": 26,
        "is_new": True, "min_nights": 2,
        "reviews": [_rev("Sofia L.", 5, "The loft is stunning and the neighborhood is so alive. Extended twice!", "Leisure", "June 2025")],
    },
    {
        "title": "University City Med Stay 1BR", "building_name": "The Radian", "neighborhood": "University City",
        "address": "3925 Walnut St", "apt_type": "1 Bedroom", "bedrooms": 1, "bathrooms": 1, "max_guests": 2, "sqft": 680,
        "nightly_rate": NIGHTLY_RATES[1], "monthly_rate": 2750,
        "description": "Five minutes from Penn Medicine and CHOP. Comfortable, quiet one-bedroom built for medical travelers, visiting clinicians, and families who need to be close to care.",
        "amenities": AMEN_CORE + ["Free parking", "Elevator", "24/7 guest support"],
        "images": [LR[4], BR[0], KT[0]], "stay_paths": ["medical"], "rating": 4.9, "review_count": 48,
        "is_featured": True, "min_nights": 2,
        "reviews": [
            _rev("Anne W.", 5, "We stayed 2 months during my husband's treatment. The team checked in on us constantly. Grateful.", "Medical", "April 2025"),
            _rev("Dr. Chen", 5, "Booked for a visiting fellowship. Walkable to the hospital, spotless unit.", "Medical", "February 2025"),
        ],
    },
    {
        "title": "Northern Liberties Penthouse", "building_name": "The Piazza Alta", "neighborhood": "Northern Liberties",
        "address": "1001 N 2nd St", "apt_type": "Penthouse", "bedrooms": 3, "bathrooms": 2, "max_guests": 6, "sqft": 1600,
        "nightly_rate": 389, "monthly_rate": 7900,
        "description": "A three-bedroom penthouse with a private terrace over the Piazza. Pool, gym, and dining downstairs. The flagship Express Housing stay for teams and families.",
        "amenities": AMEN_CORE + ["Pool", "Rooftop terrace", "24-hour fitness center", "Free parking", "Doorman"],
        "images": [HERO[1], LR[5], BR[1], KT[1]], "stay_paths": ["corporate", "family"], "rating": 5.0, "review_count": 19,
        "is_featured": True, "min_nights": 3,
        "reviews": [_rev("The Grants", 5, "Hosted our whole family for a month. Terrace dinners every night.", "Family", "May 2025")],
    },
    {
        "title": "Society Hill Classic 2BR", "building_name": "Society Hill Towers", "neighborhood": "Society Hill",
        "address": "200 Locust St", "apt_type": "2 Bedroom", "bedrooms": 2, "bathrooms": 1, "max_guests": 4, "sqft": 980,
        "nightly_rate": NIGHTLY_RATES[2], "monthly_rate": 4300,
        "description": "Cobblestone streets and river views. A classic two-bedroom in one of Philadelphia's most storied neighborhoods, refreshed with modern furnishings throughout.",
        "amenities": AMEN_CORE + ["Elevator", "24-hour fitness center", "Doorman"],
        "images": [LR[5], BR[2], KT[2], LR[0]], "stay_paths": ["family", "corporate"], "rating": 4.8, "review_count": 34,
        "min_nights": 2,
        "reviews": [_rev("Hannah B.", 5, "Waking up near the waterfront was the highlight of our relocation.", "Relocation", "March 2025")],
    },
    {
        "title": "Logan Square Executive 1BR", "building_name": "The Alexander", "neighborhood": "Logan Square",
        "address": "1601 Vine St", "apt_type": "1 Bedroom", "bedrooms": 1, "bathrooms": 1, "max_guests": 2, "sqft": 750,
        "nightly_rate": NIGHTLY_RATES[1], "monthly_rate": 3600,
        "description": "Steps from the Comcast towers and the Parkway museums. An executive one-bedroom with in-building workspace and a serious gym — built for the business week and the weekend after.",
        "amenities": AMEN_CORE + ["Dedicated workspace", "In-building workspace", "24-hour fitness center", "Doorman"],
        "images": [LR[6], BR[3], KT[3]], "stay_paths": ["corporate"], "rating": 4.8, "review_count": 29,
        "min_nights": 2,
        "reviews": [_rev("Tom H.", 5, "My company books this unit every quarter now. Consistent, professional, easy.", "Business", "June 2025")],
    },
    {
        "title": "Manayunk Riverside 2BR", "building_name": "The Isle", "neighborhood": "Manayunk",
        "address": "4601 Flat Rock Rd", "apt_type": "2 Bedroom", "bedrooms": 2, "bathrooms": 2, "max_guests": 5, "sqft": 1050,
        "nightly_rate": NIGHTLY_RATES[2], "monthly_rate": 3800,
        "description": "Riverside two-bedroom along the towpath with Main Street's restaurants a short stroll away. Free parking and space to spread out make this a family favorite.",
        "amenities": AMEN_CORE + ["Free parking", "Pool", "Pet friendly"],
        "images": [LR[7], BR[0], KT[1], LR[2]], "stay_paths": ["family"], "rating": 4.7, "review_count": 22,
        "is_new": True, "min_nights": 2,
        "reviews": [_rev("The Nguyens", 5, "Kids loved the pool, we loved the towpath runs. Perfect month.", "Family", "May 2025")],
    },
    {
        "title": "Graduate Hospital Family 3BR", "building_name": "The Southwark", "neighborhood": "Graduate Hospital",
        "address": "2001 South St", "apt_type": "3 Bedroom", "bedrooms": 3, "bathrooms": 2, "max_guests": 6, "sqft": 1400,
        "nightly_rate": 289, "monthly_rate": 6100,
        "description": "A rare three-bedroom with a real dining table for eight, a washer-dryer, and three quiet bedrooms. Built for family recovery stays, renovations, and long visits.",
        "amenities": AMEN_CORE + ["Free parking", "Elevator", "24/7 guest support"],
        "images": [LR[3], BR[1], KT[0], LR[4]], "stay_paths": ["family", "medical"], "rating": 4.9, "review_count": 27,
        "min_nights": 3,
        "reviews": [_rev("Renee C.", 5, "Three real bedrooms saved us during our home renovation. Flexible checkout too.", "Family", "April 2025")],
    },
    {
        "title": "Old City Boutique Studio", "building_name": "The Bank Building", "neighborhood": "Old City",
        "address": "421 Chestnut St", "apt_type": "Studio", "bedrooms": 0, "bathrooms": 1, "max_guests": 2, "sqft": 480,
        "nightly_rate": 109, "monthly_rate": 2400,
        "description": "A thoughtfully designed studio inside a converted 19th-century bank. Original details, brand-new everything else. The best value stay in Old City.",
        "amenities": AMEN_CORE + ["Elevator"],
        "images": [LR[4], BR[2], KT[3]], "stay_paths": ["corporate", "medical"], "rating": 4.8, "review_count": 38,
        "is_new": True, "min_nights": 2,
        "reviews": [_rev("Isabelle F.", 5, "Gorgeous building, unbeatable location, fair price. Will return.", "Leisure", "June 2025")],
    },
    {
        "title": "Center City Corporate 2BR", "building_name": "The Metropolitan", "neighborhood": "Center City",
        "address": "117 N 15th St", "apt_type": "2 Bedroom", "bedrooms": 2, "bathrooms": 2, "max_guests": 4, "sqft": 1150,
        "nightly_rate": NIGHTLY_RATES[2], "monthly_rate": 5600,
        "description": "Two bedrooms, two workspaces, one block from City Hall. Our most-booked corporate unit, with a conference-ready dining table and blackout shades for jet-lagged mornings.",
        "amenities": AMEN_CORE + ["Dedicated workspace", "In-building workspace", "Doorman", "24-hour fitness center"],
        "images": [HERO[0], BR[3], KT[2], LR[7]], "stay_paths": ["corporate"], "rating": 4.9, "review_count": 51,
        "is_featured": True, "min_nights": 3,
        "reviews": [
            _rev("Sarah J.", 5, "Our consultants rotate through this unit monthly. Zero complaints ever.", "Business", "June 2025"),
            _rev("Ahmed Z.", 5, "International relocation made painless. The team even stocked the fridge.", "Relocation", "May 2025"),
        ],
    },
]

async def seed_apartments():
    # Room label mapping for photo tours
    room_map = {}
    for u in LR:
        room_map[u] = "Living Room"
    for u in BR:
        room_map[u] = "Bedroom"
    for u in KT:
        room_map[u] = "Kitchen"
    for u in HERO:
        room_map[u] = "Living Space"
    # Scoped to the demo apartments this function owns. An unscoped delete_many({})
    # here would also wipe live, admin-verified portfolio listings (a different
    # dataset entirely, managed by seed_portfolio) every time /api/seed is called.
    await db.apartments.delete_many({"portfolio_seed": {"$ne": True}})
    docs = []
    for a in SEED_APARTMENTS:
        apt = Apartment(**a)
        d = apt.model_dump()
        # Deterministic id so re-seeding preserves bookings/wishlist references
        d["id"] = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"expresshousing:{a['title']}"))
        d["photo_tour"] = [{"url": img, "room": room_map.get(img, "Interior")} for img in d["images"]]
        d["created_at"] = d["created_at"].isoformat()
        docs.append(d)
    await db.apartments.insert_many(docs)
    return len(docs)


async def seed_portfolio():
    buildings, units, listings = build_portfolio()
    now = datetime.now(timezone.utc).isoformat()
    for building in buildings:
        existing_building = await db.buildings.find_one({"id": building["id"]}, {"_id": 0})
        if existing_building:
            controlled_building = {key: value for key, value in building.items() if key != "compliance"}
            if not existing_building.get("compliance"):
                controlled_building["compliance"] = building["compliance"]
            await db.buildings.update_one(
                {"id": building["id"]},
                {"$set": {**controlled_building, "updated_at": now}},
            )
        else:
            await db.buildings.insert_one({**building, "created_at": now, "updated_at": now})
    for unit in units:
        # Preserve operator-entered unit numbers and readiness data on reseed.
        existing = await db.units.find_one({"id": unit["id"]}, {"_id": 0})
        if existing:
            controlled_fields = {
                "building_id": unit["building_id"],
                "listing_id": unit["listing_id"],
                "internal_label": unit["internal_label"],
                "bedrooms": unit["bedrooms"],
                "monthly_rate": unit["monthly_rate"],
                "parking_monthly": unit["parking_monthly"],
                "portfolio_version": unit["portfolio_version"],
                "updated_at": now,
            }
            if not existing.get("unit_number"):
                controlled_fields["unit_number"] = unit["unit_number"]
            if "unit_number_verified" not in existing:
                controlled_fields["unit_number_verified"] = False
            await db.units.update_one({"id": unit["id"]}, {"$set": controlled_fields})
        else:
            await db.units.insert_one({**unit, "created_at": now, "updated_at": now})
    for listing in listings:
        apartment = Apartment(**listing).model_dump()
        apartment["created_at"] = apartment["created_at"].isoformat()
        apartment["updated_at"] = now
        existing_listing = await db.apartments.find_one({"id": apartment["id"]}, {"_id": 0})
        if existing_listing:
            for key in (
                "nightly_rate", "monthly_rate", "cleaning_fee", "parking_monthly",
                "pricing_status", "compliance_status", "listing_status",
                "accepting_reservations", "channel_mappings",
            ):
                if key in existing_listing:
                    apartment[key] = existing_listing[key]
            if existing_listing.get("photo_status") == "verified" and existing_listing.get("images"):
                apartment["photo_status"] = "verified"
                apartment["images"] = existing_listing["images"]
                apartment["photo_tour"] = existing_listing.get("photo_tour", [])
                apartment["image_sources"] = existing_listing.get("image_sources", [])
                apartment["image_scope"] = existing_listing.get("image_scope", "verified_unit")
        await db.apartments.update_one(
            {"id": apartment["id"]},
            {"$set": apartment},
            upsert=True,
        )
    for item in INTEGRATION_SETUP:
        await db.setup_items.update_one(
            {"key": item["key"]},
            {"$setOnInsert": {**item, "created_at": now}, "$set": {"catalog_updated_at": now}},
            upsert=True,
        )
    # Keep previous prototype records for referential integrity, but remove them
    # from browse/search whenever the real portfolio fixture is enabled.
    await db.apartments.update_many(
        {"portfolio_seed": {"$ne": True}},
        {"$set": {"is_archived": True, "archived_reason": "replaced_by_verified_portfolio"}},
    )
    return {"buildings": len(buildings), "units": len(units), "listings": len(listings)}

async def seed_admin():
    admin_email = os.environ.get("BOOTSTRAP_ADMIN_EMAIL", "").strip().lower()
    admin_password = os.environ.get("BOOTSTRAP_ADMIN_PASSWORD", "")
    if not admin_email or not admin_password:
        logger.info("Bootstrap admin is disabled; set BOOTSTRAP_ADMIN_EMAIL and BOOTSTRAP_ADMIN_PASSWORD to create one")
        return
    if len(admin_password) < 8:
        raise RuntimeError("BOOTSTRAP_ADMIN_PASSWORD must be at least 8 characters")
    existing = await db.users.find_one({"email": admin_email})
    if not existing:
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "name": "Express Admin",
            "role": "admin",
            "phone": None,
            "password_hash": hash_password(admin_password),
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        logger.info("Created bootstrap admin user")

# --------------------------------------------------------------- Support chat
# One thread per guest: every message carries the guest's user_id, and "sender"
# says which side wrote it. Read flags are per side, so an unread count means
# "written by the other party and not yet opened by this one".

SUPPORT_MESSAGE_MAX = 4000
SUPPORT_ATTACHMENTS_MAX = 4
# Photos ride along inside the message document as data URIs. The browser shrinks
# each one before upload, so a maintenance photo lands well inside this ceiling,
# and it keeps attachments working on a host whose own disk is wiped on deploy.
SUPPORT_ATTACHMENT_MAX_BYTES = 2_000_000
# Raster formats only, and base64 only. "data:image/" alone would also admit
# image/svg+xml, which is a document that can carry script: a guest could attach
# one and the person who opens it is the operator, inside the admin session.
# The browser only ever sends JPEG from its canvas, so nothing legitimate is lost.
SUPPORT_ATTACHMENT_PREFIXES = (
    "data:image/jpeg;base64,",
    "data:image/png;base64,",
    "data:image/webp;base64,",
    "data:image/gif;base64,",
)


class SupportMessageCreate(BaseModel):
    body: str = Field(default="", max_length=SUPPORT_MESSAGE_MAX)
    attachments: List[str] = Field(default_factory=list, max_length=SUPPORT_ATTACHMENTS_MAX)

    @field_validator("attachments")
    @classmethod
    def only_images_within_size(cls, values: List[str]) -> List[str]:
        for value in values:
            if not value.startswith(SUPPORT_ATTACHMENT_PREFIXES):
                raise ValueError("Attachments must be JPEG, PNG, WebP or GIF photos")
            if len(value) > SUPPORT_ATTACHMENT_MAX_BYTES:
                raise ValueError("That photo is too large. Please send a smaller one.")
        return values

    @model_validator(mode="after")
    def needs_text_or_photo(self):
        if not self.body.strip() and not self.attachments:
            raise ValueError("Write a message or attach a photo")
        return self


def _support_public(message: dict) -> dict:
    return {
        "id": message["id"],
        "sender": message["sender"],
        "body": message["body"],
        "attachments": message.get("attachments", []),
        "created_at": message["created_at"],
    }


async def _store_support_message(*, guest: dict, sender: str, body: str, attachments: Optional[List[str]] = None) -> dict:
    text = body.strip()
    attachments = attachments or []
    if not text and not attachments:
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    message = {
        "id": str(uuid.uuid4()),
        "user_id": guest["id"],
        "user_name": guest.get("name") or guest.get("email", ""),
        "user_email": guest.get("email", ""),
        "sender": sender,
        "body": text[:SUPPORT_MESSAGE_MAX],
        "attachments": attachments,
        "created_at": datetime.now(timezone.utc).isoformat(),
        # Whoever wrote it has read it; the other side has not.
        "read_by_admin": sender == "admin",
        "read_by_guest": sender == "guest",
    }
    await db.support_messages.insert_one({**message})
    return _support_public(message)


@api_router.get("/support/messages")
async def get_support_messages(user: dict = Depends(get_current_user)):
    """The signed-in guest's own thread. Opening it clears their unread badge."""
    await db.support_messages.update_many(
        {"user_id": user["id"], "sender": "admin", "read_by_guest": False},
        {"$set": {"read_by_guest": True}},
    )
    messages = await db.support_messages.find(
        {"user_id": user["id"]}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    return {"messages": [_support_public(m) for m in messages]}


@api_router.get("/support/unread")
async def get_support_unread(user: dict = Depends(get_current_user)):
    unread = await db.support_messages.count_documents(
        {"user_id": user["id"], "sender": "admin", "read_by_guest": False}
    )
    return {"unread": unread}


@api_router.post("/support/messages")
async def send_support_message(payload: SupportMessageCreate, user: dict = Depends(get_current_user)):
    if user.get("role") == "admin":
        raise HTTPException(status_code=400, detail="Admins reply from the operations dashboard")
    return await _store_support_message(guest=user, sender="guest", body=payload.body, attachments=payload.attachments)


@api_router.get("/admin/support/threads")
async def admin_support_threads(admin: dict = Depends(require_admin)):
    """One row per guest, newest conversation first, with the unread count."""
    messages = await db.support_messages.find({}, {"_id": 0}).sort("created_at", 1).to_list(5000)
    threads: dict = {}
    for message in messages:
        thread = threads.setdefault(message["user_id"], {
            "user_id": message["user_id"],
            "user_name": message.get("user_name", ""),
            "user_email": message.get("user_email", ""),
            "unread": 0,
            "message_count": 0,
            "last_message": "",
            "last_sender": "",
            "last_at": "",
        })
        thread["message_count"] += 1
        photo_count = len(message.get("attachments", []))
        thread["last_message"] = message["body"] or (
            f"{photo_count} photo{'' if photo_count == 1 else 's'}" if photo_count else ""
        )
        thread["last_sender"] = message["sender"]
        thread["last_at"] = message["created_at"]
        if message["sender"] == "guest" and not message.get("read_by_admin"):
            thread["unread"] += 1

    rows = sorted(threads.values(), key=lambda row: row["last_at"], reverse=True)
    for row in rows:
        # Booking context so the inbox reads as a list of renters, not user ids.
        booking = await db.bookings.find_one(
            {"user_id": row["user_id"]},
            {"_id": 0, "apartment_title": 1, "check_in": 1, "check_out": 1, "status": 1},
            sort=[("check_in", -1)],
        )
        row["booking"] = booking
    return {"threads": rows, "unread_total": sum(row["unread"] for row in rows)}


@api_router.get("/admin/support/threads/{user_id}")
async def admin_support_thread(user_id: str, admin: dict = Depends(require_admin)):
    """Opening a thread marks that guest's messages read, which clears the badge."""
    await db.support_messages.update_many(
        {"user_id": user_id, "sender": "guest", "read_by_admin": False},
        {"$set": {"read_by_admin": True}},
    )
    messages = await db.support_messages.find(
        {"user_id": user_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(500)
    if not messages:
        raise HTTPException(status_code=404, detail="No messages from this guest")
    return {
        "user_id": user_id,
        "user_name": messages[-1].get("user_name", ""),
        "user_email": messages[-1].get("user_email", ""),
        "messages": [_support_public(m) for m in messages],
    }


@api_router.post("/admin/support/threads/{user_id}")
async def admin_reply_support(user_id: str, payload: SupportMessageCreate, admin: dict = Depends(require_admin)):
    guest = await db.users.find_one({"id": user_id}, {"_id": 0})
    if not guest:
        raise HTTPException(status_code=404, detail="Guest not found")
    return await _store_support_message(guest=guest, sender="admin", body=payload.body, attachments=payload.attachments)


@api_router.post("/seed")
async def seed_data(admin: dict = Depends(require_admin)):
    count = await seed_apartments()
    portfolio = await seed_portfolio()
    await seed_admin()
    await update_apartment_nightly_rates(db)
    return {"success": True, "demo_apartments_seeded": count, "portfolio": portfolio}

async def ensure_indexes():
    await db.users.create_index("email", unique=True)
    await db.support_messages.create_index([("user_id", 1), ("created_at", 1)])
    await db.apartments.create_index("id", unique=True)
    await db.buildings.create_index("id", unique=True)
    await db.buildings.create_index("slug", unique=True)
    await db.units.create_index("id", unique=True)
    await db.units.create_index([("building_id", 1), ("internal_label", 1)], unique=True)
    await db.bookings.create_index([("apartment_id", 1), ("check_in", 1), ("check_out", 1), ("status", 1)])
    # A sparse compound index still contains direct bookings because `source`
    # exists, which makes repeated `external_reference=None` values collide.
    # Create the partial index once and leave a correct existing index intact;
    # this also avoids unnecessary startup index churn.
    index_name = "unique_external_channel_reservation"
    index_info = await db.bookings.index_information()
    existing_external_index = index_info.get(index_name)
    if not existing_external_index or not existing_external_index.get("partialFilterExpression"):
        for legacy_name in ("source_1_external_reference_1", index_name):
            if legacy_name in index_info:
                try:
                    await db.bookings.drop_index(legacy_name)
                except OperationFailure:
                    pass
        await db.bookings.create_index(
            [("source", 1), ("external_reference", 1)],
            name=index_name,
            unique=True,
            partialFilterExpression={"external_reference": {"$type": "string"}},
        )
    await db.wishlist.create_index([("user_id", 1), ("apartment_id", 1)], unique=True)
    await db.arrival_guides.create_index("booking_id", unique=True)
    await db.setup_items.create_index("key", unique=True)

@app.on_event("startup")
async def startup_seed():
    await ensure_indexes()
    await seed_admin()
    if SEED_DEMO_DATA:
        sample = await db.apartments.find_one({})
        if not sample or "photo_tour" not in sample:
            count = await seed_apartments()
            logger.info(f"Seeded {count} demo apartments on startup")
    if SEED_PORTFOLIO_DATA:
        counts = await seed_portfolio()
        logger.info(f"Seeded controlled portfolio: {counts}")
    await update_apartment_nightly_rates(db)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
