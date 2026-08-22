# Spec: Guest Stay Portal

## Objective
Replace the compact account booking card with a calm, mobile-first stay experience organized around pre-arrival, mid-stay, and checkout, while preserving saved homes and status alerts.

## Tech Stack and Commands
- React 19, React Router, Tailwind utilities: `cd frontend && yarn build`
- Integration suite: `.venv/bin/pytest -q tests`

## Project Structure and Style
- `frontend/src/components/housing/DashboardPage.jsx`: authenticated guest portal and secure guide presentation.
- Use Express Housing editorial typography, neutral surfaces, coral action/focus color, hairline borders, and progressive disclosure.

## Testing Strategy
Build verification plus backend integration coverage for ownership and release conditions. Preserve existing dashboard and booking test ids.

## Boundaries
- Always: authenticated access, mobile-first layout, accessible native controls, useful unavailable states.
- Ask first: smart-lock actions, maps, PDF generation, or third-party integrations.
- Never: render unreleased unit, code, or Wi-Fi secrets; imply a lock state without provider evidence.

## Success Criteria
- Guests can understand status and next steps immediately.
- Released arrival details are organized into access, Wi-Fi, parking, mail/trash, support, and checkout sections.
- Information remains comprehensive without a dense grid of equal-priority cards.

