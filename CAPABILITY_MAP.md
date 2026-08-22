# Capability Map: Guest Stay Experience

| Module id | Responsibility | Depends on |
|---|---|---|
| `admin-guide-editor` | Capture, validate, preview, and release complete stay guidance | Existing booking, unit, and arrival-guide services |
| `guest-stay-portal` | Present reservation, arrival, mid-stay, and checkout guidance to the authenticated guest | `admin-guide-editor` |

Build order: `admin-guide-editor` → `guest-stay-portal`.

