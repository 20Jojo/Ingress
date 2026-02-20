# Workflow Platform Frontend

Next.js frontend for auth, organizations, invitations, member management, projects, tasks, dashboard, and realtime updates.

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
