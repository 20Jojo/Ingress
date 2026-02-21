# Frontend Command Reference

This is the complete command reference for the frontend project in `frontend/`.

## Where to run

Run all commands from:

```bash
cd frontend
```

## Setup Commands

1. Install dependencies

```bash
npm install
```

What it does:
- Installs all dependencies from `package.json`/`package-lock.json`.

2. Install Playwright browsers (required for E2E/a11y)

```bash
npx playwright install
```

What it does:
- Downloads browser binaries used by Playwright tests.

## Daily Dev Commands

1. Start dev server

```bash
npm run dev
```

What it does:
- Runs Next.js dev server with hot reload (default `http://localhost:3000`).

2. Build production bundle

```bash
npm run build
```

What it does:
- Creates optimized production build (`.next` output).

3. Start production server

```bash
npm run start
```

What it does:
- Serves the production build from `next build`.

## Quality / Validation Commands

1. Lint

```bash
npm run lint
```

What it does:
- Runs ESLint checks across frontend source files.

2. Typecheck

```bash
npm run typecheck
```

What it does:
- Runs TypeScript compile checks with `tsc --noEmit`.

3. Verify (fast CI gate)

```bash
npm run verify
```

What it does:
- Runs `lint` + `typecheck`.

4. Verify Full (strict release gate)

```bash
npm run verify:full
```

What it does:
- Runs `verify` + `build`.

## E2E Commands

1. Run all E2E tests (headless)

```bash
npm run e2e
```

What it does:
- Runs all Playwright specs in `frontend/tests/e2e`.

2. Run E2E in UI mode

```bash
npm run e2e:ui
```

What it does:
- Opens Playwright interactive UI runner for debugging tests.

3. Run accessibility audit only

```bash
npm run e2e:a11y
```

What it does:
- Runs route-level `axe-core` WCAG A/AA checks from:
  - `frontend/tests/e2e/a11y-audit.spec.ts`

## Useful Direct Playwright Commands (optional)

1. Run one spec file

```bash
npx playwright test tests/e2e/stage14-smoke.spec.ts
```

2. Run tests matching a title

```bash
npx playwright test -g "invite accept -> member role change happy path"
```

3. Show HTML report

```bash
npx playwright show-report
```

## Recommended command order

For normal local verification:

1. `npm run lint`
2. `npm run typecheck`
3. `npm run e2e:a11y`
4. `npm run e2e`

For pre-merge release confidence:

1. `npm run verify:full`
2. `npm run e2e:a11y`
3. `npm run e2e`
