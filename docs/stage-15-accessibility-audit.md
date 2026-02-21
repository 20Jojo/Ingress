# Stage 15 Accessibility Audit (Frontend)

Date: February 21, 2026  
Scope: Frontend accessibility verification + remediation + repeatable audit workflow

## Summary

This stage added a repeatable automated accessibility audit and finalized key a11y remediations across shared UI and core routes.

Automated result:
- `npm run e2e:a11y`: **PASS** (4/4 routes, 0 WCAG A/AA violations)

Routes audited:
- `/`
- `/auth`
- `/ping`
- `/orgs`

## Audit Tooling

Primary tool:
- Playwright + in-browser `axe-core` injection

New command:
- `frontend/package.json`: `e2e:a11y = playwright test tests/e2e/a11y-audit.spec.ts`

New automated audit spec:
- `frontend/tests/e2e/a11y-audit.spec.ts`

Audit behavior:
- Loads each route
- Injects `axe-core` script from local `node_modules`
- Runs WCAG A/AA rules
- Fails test if any violations exist
- Prints violation details (rule id, impact, help URL, target selector, failure summary)

## Remediations Implemented

### Live regions and status semantics

- `frontend/src/components/toast.tsx`
  - Toast stack has `aria-live`
  - Error toasts use `role="alert"` + assertive live region
  - Success/info toasts use `role="status"` + polite live region

- `frontend/src/components/ui.tsx`
  - `ErrorBox`: `role="alert"`, `aria-live="assertive"`
  - `SuccessBox`: `role="status"`, `aria-live="polite"`
  - `LoadingCard`: `role="status"`, `aria-live="polite"`, `aria-busy="true"`

- `frontend/src/components/top-nav.tsx`
  - Realtime status badge uses `role="status"` + `aria-live="polite"`

### Navigation and keyboard accessibility

- `frontend/src/components/top-nav.tsx`
  - Added `aria-current="page"` on active navigation item

- `frontend/src/app/globals.css`
  - Added explicit `a:focus-visible` outline/offset for keyboard users

### Reduced motion support

- `frontend/src/app/globals.css`
  - Added `@media (prefers-reduced-motion: reduce)` fallback
  - Minimizes animation/transition timing for motion-sensitive users

### Form control labeling (no placeholder-only semantics)

- `frontend/src/app/orgs/page.tsx`
  - Organization input now has explicit `aria-label`

- `frontend/src/app/orgs/[orgId]/projects/page.tsx`
  - Project input now has explicit `aria-label`

- `frontend/src/app/orgs/[orgId]/projects/[projectId]/tasks/page.tsx`
  - Task title/description fields now have explicit `aria-label`
  - Task status/assignee selects now have contextual labels

- `frontend/src/app/orgs/[orgId]/projects/[projectId]/tasks/[taskId]/page.tsx`
  - Status, assignee, title, description, and due date controls now explicitly labeled

## Verification Commands and Results

Executed in `frontend/`:

1. `npm run lint`
- Result: PASS

2. `npm run typecheck`
- Result: PASS

3. `npm run e2e:a11y`
- Result: PASS (4 tests passed, 0 violations)

Observed output (summary):
- `@a11y /` passed
- `@a11y /auth` passed
- `@a11y /ping` passed
- `@a11y /orgs` passed

## Operational Notes

- Browser-based audit may require unsandboxed execution in restricted environments where process spawning is blocked.
- In normal local dev/CI, the command runs directly as long as Playwright browser binaries are installed.

## Ongoing Accessibility Runbook

Before merge:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run e2e:a11y`

If violations appear:

1. Fix semantics/labels/focus/contrast at component level first (`src/components/ui.tsx`, shared layout/styles).
2. Re-run `npm run e2e:a11y`.
3. Update this document with date, findings, and remediation details.

