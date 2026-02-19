# Current Architecture (Stages 0-10)

## Scope
Monorepo architecture with:
- .NET API (`src/Workflow.Api`)
- Next.js frontend (`frontend`)
- PostgreSQL/Redis/RabbitMQ via Docker
- JWT auth + org RBAC
- MassTransit eventing
- SignalR realtime (RabbitMQ -> SignalR bridge)

---

## Stage Map

### Stage 0: Frontend Foundation
- Next.js app scaffolded under `frontend`
- API base URL configured via `NEXT_PUBLIC_API_BASE_URL`
- Connectivity check page (`/ping`)

### Stage 1: Auth Tokens + Auth API
- Local token storage helpers
- Auth API methods:
  - register
  - login
  - refresh
  - logout

### Stage 2: Auth UI
- `/auth` page:
  - register/login/logout
  - token presence status

### Stage 3: Protected Calls + Auto Refresh
- Auth-aware fetch layer:
  - inject bearer token
  - one-time refresh retry on 401
- `/users` page for protected endpoint verification

### Stage 4: Organizations UI
- `/orgs`: create + list organizations
- `/orgs/[orgId]`: org detail + members summary

### Stage 5: Invitations UI
- `/orgs/[orgId]/invite`: create/list/revoke invites
- `/invite/accept`: accept invitation (manual or query token)
- Invite status badges + copy helpers

### Stage 6: Member Management UI
- `/orgs/[orgId]/members`:
  - list members
  - change role
  - remove member

### Stage 7: Projects UI
- `/orgs/[orgId]/projects`: create/list projects
- `/orgs/[orgId]/projects/[projectId]`: project detail

### Stage 8: Tasks UI
- `/orgs/[orgId]/projects/[projectId]/tasks`: create/list/update status/assign
- `/orgs/[orgId]/projects/[projectId]/tasks/[taskId]`:
  - edit details
  - edit status
  - assign/unassign
  - set/clear due date

### Stage 9: Dashboard UI
- `/orgs/[orgId]/dashboard`:
  - aggregate members/projects/tasks/invites
  - status and role breakdown
  - recent activity

### Stage 10: Realtime (Option 2)
- RabbitMQ event contracts for org/project/task/member/invite actions
- SignalR hub (`/hubs/org-events`) with org group join
- MassTransit consumer broadcasts bus events to SignalR groups
- Frontend org-scoped subscriptions auto-refresh key pages

---

## Backend Architecture

## API Layer
- Minimal API endpoints grouped by domain:
  - auth
  - organizations
  - org members
  - invitations
  - projects
  - tasks
  - users

## Security
- JWT bearer authentication
- Policy-based authorization:
  - `OrgMember`
  - `OrgAdmin`
  - `OrgOwner`
- Role checks in endpoint and authorization handlers

## Data + Infra
- EF Core + PostgreSQL
- Redis for selected cache paths (e.g., org members list)
- Hangfire for background jobs

## Eventing + Realtime
- MassTransit + RabbitMQ event bus
- Realtime contracts published from mutation endpoints
- `RealtimeBroadcastConsumer` forwards events to SignalR org groups

---

## Frontend Architecture

## API Utility Layer (`frontend/src/lib`)
- `api.ts` generic POST helper
- `authFetch.ts` bearer + refresh retry
- domain clients:
  - `authApi.ts`
  - `usersApi.ts`
  - `orgsApi.ts`
  - `membersApi.ts`
  - `invitesApi.ts`
  - `projectsApi.ts`
  - `tasksApi.ts`
  - `dashboardApi.ts`

## Realtime Utility Layer
- `realtime.ts`:
  - SignalR connection manager
  - org subscription registry
  - event normalization
  - fallback behavior if connection fails
- `useOrgRealtime.ts`:
  - hook wrapper for page-level subscriptions

## Route Structure (current)
- `/auth`
- `/users`
- `/orgs`
- `/orgs/[orgId]`
- `/orgs/[orgId]/members`
- `/orgs/[orgId]/invite`
- `/orgs/[orgId]/projects`
- `/orgs/[orgId]/projects/[projectId]`
- `/orgs/[orgId]/projects/[projectId]/tasks`
- `/orgs/[orgId]/projects/[projectId]/tasks/[taskId]`
- `/orgs/[orgId]/dashboard`
- `/invite/accept`
- `/ping`

---

## Key Data Flow

1. User action in UI calls domain API client.
2. Client uses `authFetch` (bearer + refresh-on-401).
3. API persists data and publishes domain event to RabbitMQ.
4. MassTransit consumer receives event and broadcasts org-scoped SignalR message.
5. Frontend `useOrgRealtime` listeners trigger page reload logic.
6. UI updates live; manual reload remains fallback path.

---

## Operational Notes
- Ensure backend and frontend use aligned base URL and JWT configuration.
- Realtime requires:
  - API running
  - RabbitMQ reachable
  - valid bearer token
  - org membership for hub group join
- If realtime negotiation fails, pages continue functioning with standard fetch/reload.

