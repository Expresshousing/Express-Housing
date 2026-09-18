# Express Housing

Express Housing is a booking and guest-arrival platform for flexible furnished stays. The current repository contains a React frontend, FastAPI API, and MongoDB-backed prototype for Philadelphia inventory.

The product architecture and delivery plan are documented in [docs/architecture.md](docs/architecture.md). Researched operating rules, pricing assumptions, access handling, channel strategy and launch gates are documented in [docs/operating-model.md](docs/operating-model.md).

## Current implementation status

- Four building records: Broad + Noble, The Hannah, Edgewater II and 1500 Locust.
- Forty physical unit records: five one-bedroom and five two-bedroom units per building.
- Eight guest-facing inventory types with capacity-aware availability.
- Server-calculated short- and extended-stay quotes, fees and configurable tax behavior.
- Admin workflows for real unit numbers, operational status, short-stay authorization, unit assignment, payment state and arrival readiness.
- Editable placeholder unit numbers with a separate real-number verification gate.
- Building-scoped partner portal for front desk and property verification.
- Launch Setup records for compliance, Airbnb/Booking.com IDs and provider decisions.
- Encrypted, time-released Door/access and Wi-Fi details in the authenticated guest portal.
- Publishing gates that prevent draft inventory from accepting reservations without active units, approved pricing/compliance and verified photography.

The seeded portfolio is intentionally a preview. Exact apartment numbers, unit specifications, photo rights and short-stay authorization are unresolved and therefore default to unverified/unbookable.

## Local development

Requirements:

- Node.js and Yarn 1.x
- Python 3.11+
- MongoDB

Create local environment files from the examples:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

Install dependencies:

```bash
python3.11 -m venv .venv
.venv/bin/pip install -r backend/requirements.txt
cd frontend && yarn install
```

Run the API from the repository root:

```bash
.venv/bin/uvicorn backend.server:app --reload --port 8000
```

Run the frontend in a second terminal:

```bash
cd frontend
yarn start
```

Local URLs:

- Frontend: `http://localhost:3000`
- API: `http://localhost:8000/api/`
- API documentation: `http://localhost:8000/docs`
- Operations dashboard: `http://localhost:3000/admin`
- Building partner dashboard: `http://localhost:3000/partner`

If the site loads but shows no apartments, check `CORS_ORIGINS` in `backend/.env` before
anything else. It must contain the exact origin serving the frontend, port included, and a
mismatch is silent from the command line — `curl` ignores CORS, so the API looks healthy
while the browser blocks every request the page makes. Restart the backend after changing it.

Changing fixtures or images reaches a running server only on restart, since the portfolio is
seeded at startup. A production build under `frontend/build/` serves its own copy of
`frontend/public/`, so rebuild it too rather than expecting edits to appear.

Portfolio fixtures are safe to rerun: operator-entered unit readiness fields are preserved. Demo data should only be enabled in a local development database. Never reuse example secrets, encryption keys or passwords in a deployed environment.

Normal sign-in sends each user to the correct guest, operations or building portal based on their server-controlled role. See [docs/image-sources.md](docs/image-sources.md) for the official source and scope of every imported building image.

## Tests

Install development dependencies and run the local integration suite:

```bash
.venv/bin/pip install -r backend/requirements-dev.txt
.venv/bin/pytest -q tests
```

Create a production frontend build with:

```bash
cd frontend
yarn build
```
