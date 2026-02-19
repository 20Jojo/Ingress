# Stage 10 Summary (RabbitMQ + SignalR Realtime)

## Overview
Stage 10 implemented realtime updates using:
- RabbitMQ (MassTransit) as the event backbone
- SignalR as the frontend delivery channel
- Org-scoped subscriptions so clients receive only relevant events

---

## Backend: New Files

### SignalR + Realtime
- `src/Workflow.Api/Hubs/OrgEventsHub.cs`
- `src/Workflow.Api/Realtime/OrgRealtimeEvent.cs`
- `src/Workflow.Api/Realtime/OrgRealtimeBroadcaster.cs`

### Messaging Contracts
- `src/Workflow.Api/Messaging/Contracts/ProjectCreated.cs`
- `src/Workflow.Api/Messaging/Contracts/TaskChanged.cs`
- `src/Workflow.Api/Messaging/Contracts/OrgMemberAdded.cs`
- `src/Workflow.Api/Messaging/Contracts/OrgMemberRoleChanged.cs`
- `src/Workflow.Api/Messaging/Contracts/OrgMemberRemoved.cs`
- `src/Workflow.Api/Messaging/Contracts/OrgInvitationAccepted.cs`

### Messaging Consumer
- `src/Workflow.Api/Messaging/Consumers/RealtimeBroadcastConsumer.cs`

---

## Backend: Updated Files

- `src/Workflow.Api/Program.cs`
  - Added SignalR service registration
  - Registered realtime MassTransit consumer
  - Enabled JWT query-token handling for hub connections (`access_token`)
  - Mapped hub endpoint: `/hubs/org-events`

- `src/Workflow.Api/Endpoints/ProjectEndpoints.cs`
  - Publishes `ProjectCreated` on create

- `src/Workflow.Api/Endpoints/TaskEndpoints.cs`
  - Publishes `TaskChanged` on:
    - create
    - status change
    - details update
    - due date update
    - assign/unassign

- `src/Workflow.Api/Endpoints/OrgInvitationEndpoints.cs`
  - Publishes `OrgInvitationAccepted` on acceptance
  - Publishes `OrgMemberAdded` when invite acceptance results in membership

- `src/Workflow.Api/Endpoints/OrgMemberEndpoints.cs`
  - Publishes:
    - `OrgMemberAdded`
    - `OrgMemberRoleChanged`
    - `OrgMemberRemoved`

---

## Frontend: New Files

- `frontend/src/lib/realtime.ts`
  - SignalR connection manager
  - Org group subscription helper
  - Event normalization
  - Graceful fallback if realtime connection fails

- `frontend/src/lib/useOrgRealtime.ts`
  - React hook to subscribe/unsubscribe org realtime events

---

## Frontend: Updated Files

### Realtime subscriptions added
- `frontend/src/app/orgs/[orgId]/page.tsx`
- `frontend/src/app/orgs/[orgId]/dashboard/page.tsx`
- `frontend/src/app/orgs/[orgId]/members/page.tsx`
- `frontend/src/app/orgs/[orgId]/invite/page.tsx`
- `frontend/src/app/orgs/[orgId]/projects/page.tsx`
- `frontend/src/app/orgs/[orgId]/projects/[projectId]/tasks/page.tsx`
- `frontend/src/app/orgs/[orgId]/projects/[projectId]/tasks/[taskId]/page.tsx`

### Additional robustness update
- `frontend/src/lib/orgsApi.ts`
  - Normalized `listOrgMembers` response casing (PascalCase/camelCase)
  - Prevented duplicate React keys from `undefined` fields

---

## Dependency Changes

- `frontend/package.json`
  - Added `@microsoft/signalr`

---

## Runtime Notes

- Realtime is org-scoped: clients join `org:{orgId}` groups
- JWT bearer auth is used for hub connections
- If SignalR negotiate/connection fails, UI continues to function with normal reload behavior

---

## Verification Completed

- Frontend lint: `npm run lint` passes
- Backend build: `dotnet build src/Workflow.Api/Workflow.Api.csproj` passes

