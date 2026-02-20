# Stage 13 Summary (API Shape + Endpoint Cleanup)

## Overview

Stage 13 standardized API response shape assumptions (camelCase) and added missing detail endpoints so frontend pages can fetch direct resources instead of list+find fallbacks.

---

## Backend Changes

### JSON shape standardization

- `src/Workflow.Api/Program.cs`
  - Explicitly configured:
    - `PropertyNamingPolicy = JsonNamingPolicy.CamelCase`
    - `DictionaryKeyPolicy = JsonNamingPolicy.CamelCase`

### Org members payload consistency

- `src/Workflow.Api/Endpoints/OrgMemberEndpoints.cs`
  - Member list payload changed to explicit camelCase keys
  - Cached JSON now serialized using `JsonSerializerDefaults.Web`
  - Member create response also returns explicit camelCase keys

### Added missing detail endpoints

- `src/Workflow.Api/Endpoints/ProjectEndpoints.cs`
  - Added `GET /orgs/{orgId}/projects/{projectId}` (Member+)
- `src/Workflow.Api/Endpoints/TaskEndpoints.cs`
  - Added `GET /tasks/{taskId}` (Member+ based on task's org)

---

## Frontend Changes

### Removed casing-normalization shims

Updated API clients to consume camelCase directly:

- `frontend/src/lib/orgsApi.ts`
- `frontend/src/lib/membersApi.ts`
- `frontend/src/lib/projectsApi.ts`
- `frontend/src/lib/tasksApi.ts`
- `frontend/src/lib/invitesApi.ts`

### Added detail-client helpers

- `frontend/src/lib/projectsApi.ts`
  - added `getProject(orgId, projectId)`
- `frontend/src/lib/tasksApi.ts`
  - added `getTask(taskId)`

### Updated pages to use new detail endpoints

- `frontend/src/app/orgs/[orgId]/projects/[projectId]/page.tsx`
  - now loads via `getProject`
- `frontend/src/app/orgs/[orgId]/projects/[projectId]/tasks/[taskId]/page.tsx`
  - now loads task via `getTask`

---

## Validation

- Frontend verify: pass (`npm run verify`)
- Backend build: could not be validated in sandbox due environment restore limitations; run locally:

```bash
dotnet build src/Workflow.Api/Workflow.Api.csproj
```
