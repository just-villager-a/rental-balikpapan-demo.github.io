# Sewa Balikpapan Prototype Checkpoint

Last updated: 2026-10-04  
Current state: Milestones 1–3 complete; Milestone 4 has not started.

## Permanent project boundary

- This project is a client-candidate demo/prototype, not a production system.
- Do not start Laravel, an API server, a database, authentication, deployment infrastructure, or production integrations while prototype pages are still being built.
- Payment, WhatsApp, and email interactions are simulations only.
- Do not collect KTP images, document numbers, or other sensitive document contents.
- Use explicit placeholders for product/page imagery until approved licensed assets exist.
- Use the existing Phosphor icon set for menus, controls, statuses, and other functional icon needs. Do not invent replacement brand marks.
- `docs/PRD.md` controls scope and behavior; `docs/DESIGN.md` controls visuals; approved Stitch references control Landing, Search, and Product Detail composition.

## Milestone 1 — Foundation and deterministic domain core

- Vue 3, TypeScript, Vite, Tailwind CSS, Vue Router, Pinia, Zod, date-fns, FullCalendar Vue, and Vitest configured.
- Versioned seed and namespaced localStorage repository implemented with schema validation, compatible hydration, atomic updates, recovery detection, and namespace-only reset.
- WITA scenario clock and explicit `+08:00` timestamps implemented.
- Pure pricing, duration, half-open availability, one-hour inspection buffer, physical-unit allocation, package expansion, hold expiry, and status-transition rules implemented.
- Product and physical inventory units remain separate; money is integer IDR.

Key files: `src/repositories/demoRepository.ts`, `src/data/seed.json`, `src/services/availability.ts`, `src/services/pricing.ts`, `src/services/transitions.ts`, `src/domain/models.ts`.

## Milestone 2 — Customer discovery and catalog

- Routes: `/`, `/search`, `/products/:slug`, `/packages/:slug`.
- Responsive Landing, Search Results, Product Detail, and Package Detail implemented for mobile, tablet, and desktop.
- Search period and filters persist in URL query state.
- Availability and quotes reuse domain services; components do not read seed data or localStorage directly.
- Loading, empty, error, unavailable, missing-image, and not-found states implemented.
- Brand category artwork is used verbatim; all product media remains an explicit placeholder.

Key files: `src/services/catalog.ts`, `src/utils/searchQuery.ts`, `src/pages/LandingPage.vue`, `src/pages/SearchPage.vue`, `src/components/RentalDetailPage.vue`.

## Milestone 3 — Customer booking happy path

- Routes: `/checkout`, `/bookings/:bookingId/payment`, `/bookings/:bookingId/confirmation`, `/my-bookings`, `/my-bookings/:bookingId`.
- Detail selection passes item, quantity, add-ons, and WITA period to checkout through validated URL state.
- Checkout validates name, Indonesian WhatsApp format, optional email, note length, and required demo-policy consent.
- Submission rechecks physical-unit availability before atomically creating a locally persisted booking.
- Created bookings use `waiting_payment`, `unpaid`, `required`, a 30-minute hold, deterministic allocations, pricing snapshot, and timeline event.
- Simulated pending or successful DP updates payment separately; successful DP also applies the documented provisional `waiting_payment → confirmed` transition.
- Customer-created bookings immediately appear in demo-customer history and the shared calendar-event projection.
- Confirmation and booking detail show separate booking/payment/guarantee statuses with neutral provisional pickup and document wording.

Key files: `src/services/booking.ts`, `src/utils/checkoutQuery.ts`, `src/pages/CheckoutPage.vue`, `src/pages/PaymentPage.vue`, `src/pages/ConfirmationPage.vue`, `src/pages/BookingHistoryPage.vue`, `src/pages/BookingDetailPage.vue`.

## Verification checkpoint

- Vitest suite must remain green.
- TypeScript must pass with `npm run typecheck`.
- Production build must pass with `npm run build`.
- Current targeted coverage includes repository recovery/reset, pricing boundaries, allocation and buffers, status transitions, catalog queries/states, quote updates, checkout query state, final unavailable rejection, booking persistence, payment confirmation, history visibility, and calendar projection visibility.

## Next approved work

Milestone 4 only: customer conflict and resilience states, including the dedicated conflict route, invalid query guidance, form error-summary focus, duplicate-submit protection, deterministic payment failure/retry/expiry, empty history, recoverable loading/error scenarios, and keyboard/mobile sticky-action checks.

Do not begin Admin Overview, admin booking screens, FullCalendar UI, availability-block UI, deployment, or Laravel during Milestone 4.
