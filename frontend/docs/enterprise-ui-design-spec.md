# Enterprise UI Design Spec

This project uses a **modern enterprise SaaS design language** optimized for trust, readability, and operational clarity.

## Design Direction

The interface is intentionally professional and structured: calm color contrast, strong typography hierarchy, and consistent card-based sections. The visual goal is to support workflow speed and confidence rather than decorative styling.

## Core Color System

- Primary corporate blue: `#2F4E85`
- Background off-white: `#F5F6F8`
- Surface white: `#FFFFFF`
- Accent action orange: `#F28C38`
- Heading text: `#1E2A3A`
- Body text muted: `#5E6B78`

Token mapping is implemented in:
- `frontend/src/app/globals.css`

## Visual Behavior

- Blue communicates structure (top bar, navigation identity, system framing).
- Light surfaces create breathing room for dense data sections.
- Orange is reserved for primary calls to action.
- Shadows are subtle and soft; no heavy gradients or glossy effects.

## Layout Principles

- Card-based content blocks with small radius and light elevation.
- Reusable row/action composition through shared UI components.
- Alternating section emphasis via surface and border contrast.
- Responsive behavior prioritizes readability and control accessibility on smaller screens.

## Typography

- Sans stack centered on `Inter` for clean enterprise readability.
- Strong heading hierarchy, muted metadata text, generous line-height.

## Components and Interaction

Shared components in `frontend/src/components/ui.tsx` and nav in `frontend/src/components/top-nav.tsx` implement:

- Focus-visible states for keyboard navigation
- Hover/active transitions with low motion intensity
- Reduced-motion fallback support
- Consistent button/input/card semantics across all pages

## Why this matters

This design system keeps the app consistent as features grow. New pages can be composed from shared tokens and UI primitives without style drift, and the product keeps a trustworthy enterprise identity aligned with the backend’s RBAC/security/observability posture.
