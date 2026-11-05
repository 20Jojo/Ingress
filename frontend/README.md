# Ingress — Frontend

The Ingress web application (Next.js): authentication, organizations, invitations, member management, projects, tasks, dashboard and realtime updates. See the [root README](../README.md) for the full project overview.

## Prerequisites

- Node.js 20+
- Backend API running (default expected at `http://localhost:5050`)

## Environment

Create `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:5050
```

## Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Quality Gates

```bash
npm run lint
npm run typecheck
npm run verify
npm run verify:full
```

- `lint`: ESLint checks
- `typecheck`: TypeScript strict compile checks
- `verify`: lint + typecheck (portable CI/sandbox gate)
- `verify:full`: verify + production build

## E2E Smoke (Stage 14.1)

```bash
npx playwright install
npm run e2e
```

Notes:
- Starts/reuses the frontend dev server automatically.
- Requires backend API and dependent services to be running.

## Accessibility Audit (Stage 15)

```bash
npx playwright install
npm run e2e:a11y
```

What it does:
- Runs `axe-core` WCAG A/AA checks via Playwright on:
  - `/`
  - `/auth`
  - `/ping`
  - `/orgs`
- Fails the test run if any violations are detected.

## Core Routes

- `/ping`
- `/auth`
- `/users`
- `/orgs`
- `/orgs/[orgId]`
- `/orgs/[orgId]/invite`
- `/orgs/[orgId]/members`
- `/orgs/[orgId]/projects`
- `/orgs/[orgId]/projects/[projectId]`
- `/orgs/[orgId]/projects/[projectId]/tasks`
- `/orgs/[orgId]/projects/[projectId]/tasks/[taskId]`
- `/orgs/[orgId]/dashboard`
- `/invite/accept`

## Smoke Validation

Use `frontend/docs/stage11.5-smoke-checklist.md` after starting backend + frontend.

## Command Reference

For the full list of frontend commands and what each does, see:

- `frontend/docs/command-reference.md`

## UI Design Spec

- Enterprise design system and rationale: `frontend/docs/enterprise-ui-design-spec.md`
