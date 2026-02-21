# Command And Docs Index

Single entry point for operations, quality checks, and project documentation.

## Command References

- Backend command reference: `docs/backend-command-reference.md`
- Frontend command reference: `frontend/docs/command-reference.md`
- Runbook: `RUNBOOK.md`

## Core Technical Docs

- Current architecture: `docs/current-architecture.md`
- Accessibility audit (Stage 15): `docs/stage-15-accessibility-audit.md`

## Stage Summaries

- Stage 10: `docs/stage-10-summary.md`
- Stage 12 (hardening): `docs/stage-12-realtime-hardening-summary.md`
- Stage 12: `docs/stage-12-summary.md`
- Stage 13: `docs/stage-13-summary.md`
- Stage 14: `docs/stage-14-summary.md`
- Stage 15: `docs/stage-15-summary.md`

## Quick Start Commands

Backend stack:

```powershell
docker compose up -d --build
dotnet test Workflow.Api.IntegrationTests\Workflow.Api.IntegrationTests.csproj
```

Frontend:

```powershell
cd frontend
npm run verify
npm run e2e:a11y
npm run e2e
```
