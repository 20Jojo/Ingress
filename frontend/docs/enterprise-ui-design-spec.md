# Ingress Design System

Ingress is an enterprise workflow management platform. Its visual language translates the atmosphere of clear tropical water — turquoise, cyan, aqua and white — into a calm, precise software interface. It is professional first: no illustrations, mascots or decorative clutter. The interface itself carries the visual appeal.

## Principles

1. **Clarity over decoration.** Every element earns its place. Imagery is limited to the brand mark and one subtle contour-line texture on brand surfaces.
2. **One system, everywhere.** Pages compose shared components from `src/components/ui.tsx`. Pages never invent their own colours, radii or shadows.
3. **Predictable structure.** Every in-app page follows the same skeleton (see Layout).
4. **Calm colour.** White and cool off-white surfaces dominate; turquoise is used for action and emphasis, deep ocean blue for depth.

## Colour tokens (`src/app/globals.css`)

| Token | Value | Use |
| --- | --- | --- |
| `brand-500` | `#20C5C7` | Signature turquoise: focus rings, active indicators |
| `brand-400` | `#48DDE0` | Caribbean cyan: gradients, highlights |
| `brand-100` | `#DDF8F5` | Soft aqua: tinted backgrounds |
| `brand-700` | `#0C7F88` | Primary buttons and links (AA contrast with white) |
| `ocean-700` | `#075985` | Deep ocean blue: depth, Owner role, "To do" status |
| `canvas` | `#F5FAFA` | App background |
| `surface` | `#FFFFFF` | Cards, tables, sidebar |
| `line` / `line-strong` | `#E2EBED` / `#CAD9DC` | Borders and dividers |
| `fg` / `fg-muted` | `#0F2A37` / `#64748B` | Text and secondary text |
| `success` / `warning` / `danger` | green / amber / rose scales | Status only, always muted |

Avoid: purple, neon, heavy black or navy backgrounds, saturated fills, large gradients. Gradients appear only in the logo mark, the auth brand panel (`.ing-depth`) and the light aqua wash (`.ing-water`).

## Typography

- **Plus Jakarta Sans** — headings and display numbers (`font-display`), weight 600.
- **Inter** — all UI and body text (`font-sans`), base 14px.
- **JetBrains Mono** — identifiers and tokens (`font-mono`), 12px.

Hierarchy: page title 28px / section title 16px / card title 15px / body 14px / labels 13px / metadata 12–12.5px. Uppercase eyebrow labels use 11–12px with 0.08em tracking.

## Shape and elevation

- Radius: controls 8px (`rounded-lg`), cards and tables 12px (`rounded-xl`), dialogs 16px.
- Borders: 1px `line`. No thick outlines.
- Shadows: `shadow-xs` for resting surfaces, `shadow-md` on hover, `shadow-lg` for dialogs and toasts only.

## Layout

- **App shell** (`app-shell.tsx`): fixed 264px white sidebar + sticky top bar with breadcrumbs and realtime status. Authentication routes (`/auth`, `/register`, `/invite/accept`) render without the shell using `AuthLayout`.
- **Sidebar groups**: *General* (Home, Organizations, People), *Workspace* (shown inside an org: Overview, Dashboard, Projects, Members, Invitations, with an organization switcher), *System* (API status, Accept invitation). Session status and sign-out sit at the bottom.
- **Page skeleton**: `PageShell` (max 1200px, consistent gutters) → `PageHeader` (title, one-line description, actions on the right, bottom divider) → one or more `Section`s (16px title, optional description and actions) with 40px spacing between them.

## Components (`src/components`)

| Component | Notes |
| --- | --- |
| `Button`, `ButtonLink` | `primary`, `secondary`, `ghost`, `danger`, `danger-ghost`, `danger-solid`; sizes `sm` / `md` / `lg` |
| `Input`, `Select`, `TextArea`, `Field`, `Label` | 40px controls, turquoise focus ring |
| `Card`, `CardHeader` | White surface, optional tinted icon tile |
| `Table`, `THead`, `Th`, `Tr`, `Td` | Primary way to present collections |
| `StatCard` | Dashboard metrics |
| `Badge`, `StatusBadge`, `RoleBadge` | Status: To do = ocean, In progress = amber, Done = green. Roles: Owner = ocean, Admin = turquoise, Member = neutral |
| `ErrorBox`, `SuccessBox`, `InfoBox` | Inline alerts with icon |
| `EmptyState`, `LoadingCard`, `Skeleton`, `Spinner` | Empty and loading states — icon only, never illustrations |
| `Dialog`, `ConfirmDialog` (`dialog.tsx`) | Portal-rendered, focus-trapped, Escape to close |
| Toasts (`toast.tsx`) | Bottom-right, titled, dismissible |
| `IngressMark`, `IngressLogo`, `Avatar`, `ContourLines` (`graphics.tsx`) | Brand assets and initials avatars |
| Icons (`icons.tsx`) | 24px grid, 1.75px stroke line icons |

## Accessibility

- Text meets WCAG AA contrast; primary actions use `brand-700`.
- Visible focus rings on every interactive element.
- Dialogs trap focus and restore it on close; the mobile navigation drawer closes on Escape.
- `prefers-reduced-motion` disables animation.
