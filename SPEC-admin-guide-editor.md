# Spec: Admin Guide Editor

## Objective
Extend the existing secure arrival-guide workflow so operations can author concierge, parking, mail/package, trash/recycling, and checkout guidance, see completeness before release, and keep secret access fields encrypted.

## Tech Stack and Commands
- FastAPI/Pydantic/MongoDB: `.venv/bin/pytest -q tests`
- React/CRACO: `cd frontend && yarn build`

## Project Structure and Style
- `backend/server.py`: validated API contract, encrypted access secrets, ownership/role checks.
- `frontend/src/components/housing/admin/BookingsView.jsx`: admin authoring UI using existing design tokens and controls.
- `tests/test_architecture_foundation.py`: authenticated release and disclosure tests.

## Testing Strategy
Extend the existing arrival-guide integration test to prove new guide fields reach only the owning authenticated guest after release.

## Boundaries
- Always: retain admin authorization, guest ownership checks, release gates, and encryption for codes/passwords.
- Ask first: external smart-lock integration or new PII collection.
- Never: expose access details publicly, email secrets, or store secret values unencrypted.

## Success Criteria
- Admin can author every supported guide section.
- Missing optional sections are visible in a completeness summary.
- Released guide returns the new non-secret guidance only to the booking owner.

