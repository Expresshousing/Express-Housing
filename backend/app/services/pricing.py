"""Server-authoritative quote calculation for Express Housing stays."""

from __future__ import annotations

from dataclasses import asdict, dataclass
from decimal import Decimal, ROUND_HALF_UP


NIGHTLY_RATES = {1: 250, 2: 350}
NIGHTLY_RATE_VERSION = "2026-09-18"


async def update_apartment_nightly_rates(db):
    """Apply the approved rates once per apartment, preserving later admin edits."""
    updated = 0
    for bedrooms, rate in NIGHTLY_RATES.items():
        result = await db.apartments.update_many(
            {"bedrooms": bedrooms, "nightly_rate_version": {"$ne": NIGHTLY_RATE_VERSION}},
            {"$set": {"nightly_rate": rate, "nightly_rate_version": NIGHTLY_RATE_VERSION}},
        )
        updated += result.modified_count
    return updated


SHORT_STAY_TAX_RATE = Decimal("0.155")


def money(value: Decimal) -> Decimal:
    return value.quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


@dataclass(frozen=True)
class Quote:
    nights: int
    rate_mode: str
    accommodation: Decimal
    cleaning_fee: Decimal
    parking_fee: Decimal
    taxable_subtotal: Decimal
    tax_rate: Decimal
    taxes: Decimal
    total: Decimal
    currency: str = "USD"
    pricing_status: str = "provisional"

    def as_dict(self):
        return {
            key: float(value) if isinstance(value, Decimal) else value
            for key, value in asdict(self).items()
        }


def calculate_quote(
    *,
    nights: int,
    nightly_rate: float,
    monthly_rate: float,
    cleaning_fee: float,
    parking_monthly: float = 0,
    parking_requested: bool = False,
    short_stay_tax_rate: float | None = None,
) -> Quote:
    if nights < 1:
        raise ValueError("A quote requires at least one night")

    nightly = Decimal(str(nightly_rate))
    monthly = Decimal(str(monthly_rate))
    cleaning = Decimal(str(cleaning_fee))

    if nights >= 30:
        rate_mode = "monthly_prorated"
        accommodation = money(monthly * Decimal(nights) / Decimal(30))
    else:
        rate_mode = "nightly"
        accommodation = money(nightly * Decimal(nights))

    # The supplied parking price is monthly. A requested parking space is not
    # charged on a short-stay quote until the business defines a daily policy.
    parking = Decimal("0")
    if parking_requested and nights >= 30:
        parking = money(Decimal(str(parking_monthly)) * Decimal(nights) / Decimal(30))

    taxable_subtotal = money(accommodation + cleaning + parking)
    effective_short_stay_rate = (
        Decimal(str(short_stay_tax_rate)) if short_stay_tax_rate is not None else SHORT_STAY_TAX_RATE
    )
    tax_rate = effective_short_stay_rate if nights < 30 else Decimal("0")
    taxes = money(taxable_subtotal * tax_rate)
    total = money(taxable_subtotal + taxes)

    return Quote(
        nights=nights,
        rate_mode=rate_mode,
        accommodation=accommodation,
        cleaning_fee=cleaning,
        parking_fee=parking,
        taxable_subtotal=taxable_subtotal,
        tax_rate=tax_rate,
        taxes=taxes,
        total=total,
    )
