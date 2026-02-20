# Stage 14 Summary (Testing & Verification)

## Status
- Stage 14.1: complete
- Stage 14.2: complete
- Stage 14.3: complete
- Stage 14.4: complete
- Stage 14.5: complete
- Stage 14.6: complete
- Stage 14.7: complete

## Implemented

### Frontend E2E (Playwright)
- Config:
  - `frontend/playwright.config.ts`
- Specs:
  - `frontend/tests/e2e/stage14-smoke.spec.ts`
  - `frontend/tests/e2e/stage14-org-project-task.spec.ts`
  - `frontend/tests/e2e/stage14-invite-members.spec.ts`

### Backend Integration (Auth/Org RBAC Critical Paths)
- File:
  - `Workflow.Api.IntegrationTests/AuthAndOrgFlowTests.cs`
- Coverage:
  - Bearer token required on protected endpoint
  - Register -> login -> create org -> list orgs
  - Org list scoped to current caller only
  - Non-member forbidden on `/orgs/{orgId}/members`

### Backend Integration (Invite/Member/Task Critical Paths)
- File:
  - `Workflow.Api.IntegrationTests/ApiCriticalPathTests.cs`
- Coverage:
  - Invited user can accept invite and create task
  - Outsider is forbidden from listing project tasks
  - Assigning a task to a non-member is rejected
  - Member cannot create project without admin role

### Backend Integration (Realtime Propagation)
- File:
  - `Workflow.Api.IntegrationTests/RealtimePropagationTests.cs`
- Coverage:
  - authenticated client joins org SignalR group
  - realtime broadcaster sends `project.created` to org group
  - joined client receives `org_event` for that org

## Run Commands

### Frontend
1. `cd frontend`
2. `npm run verify`
3. `npm run e2e`

### Backend Integration Tests
1. `dotnet test Workflow.Api.IntegrationTests/Workflow.Api.IntegrationTests.csproj --filter AuthAndOrgFlowTests`
2. `dotnet test Workflow.Api.IntegrationTests/Workflow.Api.IntegrationTests.csproj --filter ApiCriticalPathTests`
3. `dotnet test Workflow.Api.IntegrationTests/Workflow.Api.IntegrationTests.csproj --filter RealtimePropagationTests`

## Stage 14.7 Closeout
- Verified green locally (user-confirmed):
  - `AuthAndOrgFlowTests`
  - `ApiCriticalPathTests`
  - `RealtimePropagationTests`
  - Playwright E2E suite (`npm run e2e`)
- Artifacts in repo:
  - Frontend E2E config + specs
  - Backend integration suites for auth/org, invite/member/task, realtime propagation
  - Stage docs + architecture map updated

## Notes
- E2E is configured with `workers: 1` for determinism.
- Backend integration execution may depend on local Docker/service availability.
