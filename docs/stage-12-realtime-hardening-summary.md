# Stage 12 Summary (Realtime Hardening)

## Overview

Stage 12 hardened frontend realtime behavior to avoid unnecessary reloads and expose connection health while keeping non-realtime fallback behavior.

---

## Frontend: Core Realtime Layer

### Updated
- `frontend/src/lib/realtime.ts`
- `frontend/src/lib/useOrgRealtime.ts`

### Added capabilities
- Per-subscription event filtering (`eventTypes`) with wildcard support (e.g. `task.*`)
- Debounced event handling (`debounceMs`) in the realtime hook
- Connection lifecycle status store:
  - `idle`
  - `connecting`
  - `connected`
  - `reconnecting`
  - `offline`
- Auto-stop SignalR connection when no org subscribers remain
- Existing graceful fallback behavior preserved if connection fails

---

## Frontend: Status Indicator

### Updated
- `frontend/src/components/top-nav.tsx`

### Behavior
- Top nav now displays realtime connection status badge across the app.

---

## Frontend: Page-Level Relevance Filtering

Updated org-scoped pages to subscribe only to relevant event families and use debounce:

- `frontend/src/app/orgs/[orgId]/page.tsx`
  - `member.*`, `invite.accepted`
- `frontend/src/app/orgs/[orgId]/dashboard/page.tsx`
  - `invite.*`, `member.*`, `project.*`, `task.*`
- `frontend/src/app/orgs/[orgId]/invite/page.tsx`
  - `invite.*`
- `frontend/src/app/orgs/[orgId]/members/page.tsx`
  - `member.*`
- `frontend/src/app/orgs/[orgId]/projects/page.tsx`
  - `project.*`
- `frontend/src/app/orgs/[orgId]/projects/[projectId]/tasks/page.tsx`
  - `task.*`, `member.*`
- `frontend/src/app/orgs/[orgId]/projects/[projectId]/tasks/[taskId]/page.tsx`
  - `task.*`, `member.*`

---

## Validation

Run in `frontend/`:

```bash
npm run verify
```

Result: pass (lint + typecheck).
