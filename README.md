# Sewa Balikpapan Working Prototype

A frontend-only, deterministic rental-booking prototype for a prospective non-commercial client demonstration. It covers customer discovery and booking, simulated payment/history, admin operations, calendar scheduling, and physical-unit availability blocks.

This is not a production system. It has no backend, database, authentication, real payment, message delivery, KTP collection, or Laravel application.

## Status

Feature Milestones 1–6 are complete. Milestone 6 is the final feature milestone. The roadmap still reserves Milestone 7 for formal responsive, accessibility, cross-browser, visual-reference, and handoff QA.

## Run locally

Requirements: a current Node.js LTS release and npm.

```bash
npm install
npm run dev
```

Open the URL printed by Vite. Start deterministic demonstrations at `/demo`.

Verification commands:

```bash
npm test
npm run typecheck
npm run build
```

## Stack

- Vue 3, TypeScript, and Vite
- Tailwind CSS
- Vue Router and Pinia
- Zod and date-fns
- FullCalendar Vue
- Vitest and Vue Test Utils
- Versioned seeded JSON plus namespaced localStorage

## Main routes

Customer:

- `/`, `/search`
- `/products/:slug`, `/packages/:slug`
- `/checkout`, `/checkout/conflict`
- `/bookings/:bookingId/payment`, `/bookings/:bookingId/confirmation`
- `/my-bookings`, `/my-bookings/:bookingId`

Admin and presenter:

- `/admin`
- `/admin/calendar`
- `/admin/bookings`, `/admin/bookings/:bookingId`
- `/admin/availability-blocks/new`
- `/demo`

## Architecture

`src/repositories/demoRepository.ts` is the only persistence adapter. Components do not read seeded JSON or localStorage directly. Typed services project and mutate the shared state, while pricing, allocation, overlap, status transitions, WITA handling, and analytics remain pure domain logic where practical.

Products and physical inventory units are deliberately separate. Customer availability is derived from eligible units, active booking allocations, waiting-payment holds, the one-hour inspection buffer, and availability blocks. Package allocation expands required components and succeeds all-or-nothing in deterministic unit-ID order.

Persisted timestamps include an explicit `+08:00` offset. Scenario calculations use an injected WITA clock and do not depend on the viewer's device timezone. Money is stored as integer IDR.

## Demo data and reset

The repository validates a versioned seed at startup and hydrates compatible local state. Corrupt or incompatible data produces a recoverable reset state. Reset removes only this prototype's localStorage namespace and restores the seed.

Catalog images in `public/catalog` are generated, brand-neutral demo illustrations. They are not photographs of a client's physical inventory. Business-sensitive copy such as exact pickup address, operating hours, product claims, and accepted guarantee documents remains neutral/provisional.

## Testing the full workflow

See `docs/TESTING-GUIDE.md` for the customer-booking-to-admin-calendar walkthrough, maintenance-block verification, responsive checklist, and dashboard metric definitions.

## Project boundaries

- Payment outcomes are simulations only.
- WhatsApp/email actions do not send anything.
- Do not enter real customer or document information.
- Admin routes have no security boundary and are visibly labeled as demo-only.
- Analytics are calculated from the shared booking records, not a separate reporting store.
- No Laravel, API server, database, production deployment configuration, or integrations are included.
