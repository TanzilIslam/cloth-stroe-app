# Standup

## 2026-10-12

**Planning**
- App plan (`about.md`): 2 shops, 3 staff actions, 12 tables, decisions on variants, per-shop parties, cash count, single-item purchases.
- `schema.md` (enums, types, interfaces), `function.md` (high-level blueprint), `task-frontend.md` (task plan with no-rewrite rules).
- Dropped the wall board / kiosk screen; UI is English for now.

**Setup**
- Branches: `main` (docs), `development` (work).
- Next.js 16 + TypeScript + Tailwind v4 + shadcn/ui + Zod + ESLint + Prettier, pnpm.
- `pnpm validate`: typecheck → lint → format → build, run before every push.
- Backend (Neon, Drizzle, session) will be set up on the local PC.

**Frontend (mock data, all 47 tasks done)**
- Login: PIN pad, role-based nav (staff bottom nav, owner sidebar + shop switch).
- Sell: product tiles / search, variants, qty chips, cart, cash / bKash / due, partial pay, returns.
- Stock: products, variants, stock in (cost hidden from staff), low and dead stock alerts.
- Expense: category + amount in 2 taps.
- Hisab: dues with WhatsApp reminder, payments, cash count, monthly report.
- Dashboard: today's numbers, vs. last week, bestsellers, peak times, alerts, This shop / Both.
- Polish: responsive, 44px touch targets, focus outlines, loading / error states, PWA install.
- Every batch tested in a headless browser.

**Next**
- Backend on PC: Neon + Drizzle schema, Server Actions with the same names as `src/mocks/`, PIN session, role guard.
- Swap `@/mocks` imports for `@/actions`.
